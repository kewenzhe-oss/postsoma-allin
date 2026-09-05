import uuid
import httpx
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from online.ws_schemas import (
    CreateRoomRequest, CreateRoomResponse, JoinRoomRequest, JoinRoomResponse, 
    WSPlayerAction, TestConnectionRequest, TestConnectionResponse
)
from online.room_manager import room_manager
from online.connection_manager import connection_manager
from online.ai_providers import PROVIDER_ALLOWLIST

router = APIRouter()


def _resolve_endpoint(provider_info: dict, req_model: str, custom_base_url: str | None) -> tuple[str, str]:
    """
    Returns (endpoint_url, protocol).
    custom_base_url takes precedence over the allowlist default.
    For Gemini, the model name is interpolated into the URL.
    """
    protocol = provider_info.get("protocol", "openai")

    if custom_base_url:
        # Third-party compatible endpoint provided by user
        endpoint = custom_base_url.rstrip("/")
        if protocol == "openai" and not endpoint.endswith("/chat/completions"):
            if endpoint.endswith("/v1"):
                endpoint += "/chat/completions"
            else:
                endpoint += "/v1/chat/completions"
        elif protocol == "gemini" and ":generateContent" not in endpoint:
            if endpoint.endswith("/v1beta"):
                endpoint += f"/models/{req_model}:generateContent"
            else:
                endpoint += f"/v1beta/models/{req_model}:generateContent"
        
        if "{model}" in endpoint:
            endpoint = endpoint.format(model=req_model)
    else:
        raw = provider_info["base_url"]
        if raw is None:
            raise ValueError("No base_url configured for this provider and no custom base_url provided.")
        endpoint = raw.format(model=req_model)

    return endpoint, protocol


async def _call_openai_compat(endpoint: str, api_key: str, model: str) -> tuple[bool, str, str | None]:
    """Test-call an OpenAI-compatible /chat/completions endpoint."""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": "Reply with OK only."}],
        "max_tokens": 5
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(endpoint, headers=headers, json=payload)
        if response.status_code == 200:
            return True, "Connection verified", None
        err_msg = response.text[:100].strip() if response.text else "No details"
        return False, f"Provider returned {response.status_code}: {err_msg}", f"HTTP_{response.status_code}"
    except httpx.TimeoutException:
        return False, "Connection timed out after 10 seconds", "TIMEOUT"
    except Exception:
        return False, "Connection failed due to network error", "NETWORK_ERROR"


async def _call_gemini(endpoint: str, api_key: str) -> tuple[bool, str, str | None]:
    """Test-call the Gemini generateContent REST endpoint."""
    url = f"{endpoint}?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": "Reply with OK only."}]}],
        "generationConfig": {"maxOutputTokens": 5}
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=payload)
        if response.status_code == 200:
            return True, "Connection verified", None
        err_msg = response.text[:100].strip() if response.text else "No details"
        return False, f"Provider returned {response.status_code}: {err_msg}", f"HTTP_{response.status_code}"
    except httpx.TimeoutException:
        return False, "Connection timed out after 10 seconds", "TIMEOUT"
    except Exception:
        return False, "Connection failed due to network error", "NETWORK_ERROR"


@router.post("/api/ai/test-connection", response_model=TestConnectionResponse)
async def test_ai_connection(req: TestConnectionRequest):
    provider_key = req.provider_name.lower()
    provider_info = PROVIDER_ALLOWLIST.get(provider_key)

    if not provider_info:
        return TestConnectionResponse(
            ok=False,
            message=f"Provider '{req.provider_name}' is not supported.",
            error_code="UNSUPPORTED_PROVIDER"
        )

    # "custom" provider REQUIRES a base_url
    if provider_key == "custom" and not req.base_url:
        return TestConnectionResponse(
            ok=False,
            message="Custom provider requires a base_url.",
            error_code="MISSING_BASE_URL"
        )

    try:
        endpoint, protocol = _resolve_endpoint(provider_info, req.model, req.base_url)
    except ValueError as e:
        return TestConnectionResponse(ok=False, message=str(e), error_code="CONFIG_ERROR")

    if protocol == "gemini":
        ok, message, error_code = await _call_gemini(endpoint, req.api_key)
    else:
        ok, message, error_code = await _call_openai_compat(endpoint, req.api_key, req.model)

    return TestConnectionResponse(ok=ok, model=req.model if ok else None, message=message, error_code=error_code)


@router.post("/api/rooms", response_model=CreateRoomResponse)
async def create_room(req: CreateRoomRequest):
    ai_config_dict = req.ai_config.model_dump() if req.ai_config else None
    room_id, session = room_manager.create_room(mode=req.mode, ai_config=ai_config_dict)
    player_id = str(uuid.uuid4())[:8]
    player_token = str(uuid.uuid4())
    session.add_player(player_id, req.display_name, player_token)
    
    if req.mode == "human_vs_ai":
        ai_name = req.ai_config.provider_name.capitalize() + " AI" if req.ai_config else "AI Player"
        session.add_player("ai_seat", ai_name, "")
        # Trigger start
        session.check_start()
        
    return CreateRoomResponse(room_id=room_id, player_id=player_id, player_token=player_token)

@router.post("/api/rooms/{room_id}/join", response_model=JoinRoomResponse)
async def join_room(room_id: str, req: JoinRoomRequest):
    session = room_manager.get_room(room_id)
    if not session:
        raise HTTPException(status_code=404, detail="Room not found")
        
    if len(session.adapter.seats) >= 2:
        raise HTTPException(status_code=400, detail="Room is full")
        
    player_id = str(uuid.uuid4())[:8]
    player_token = str(uuid.uuid4())
    session.add_player(player_id, req.display_name, player_token)
    
    # Try to start hand if room is full
    session.check_start()
    
    return JoinRoomResponse(player_id=player_id, player_token=player_token)

@router.websocket("/ws/rooms/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, token: str):
    session = room_manager.get_room(room_id)
    if not session:
        await websocket.close(code=4004, reason="Room not found")
        return
        
    player_id = session.tokens.get(token)
    if not player_id:
        await websocket.close(code=4003, reason="Invalid token")
        return

    await connection_manager.connect(websocket, room_id, player_id)
    session.players_connected[player_id] = True
    
    # Replay past events to newly connected client to hydrate hand history & thoughts
    await connection_manager.replay_events_for_player(websocket, room_id, player_id)

    # Send initial state
    await connection_manager.broadcast_state(room_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            # Expecting WSPlayerAction shape: {"action": "CALL", "amount": 10}
            action_req = WSPlayerAction(**data)
            
            success = session.submit_action(player_id, action_req.action, action_req.amount)
            if not success:
                await websocket.send_json({"type": "error", "message": "Action rejected"})
                
    except WebSocketDisconnect:
        connection_manager.disconnect(room_id, player_id)
        if session:
            session.players_connected[player_id] = False
