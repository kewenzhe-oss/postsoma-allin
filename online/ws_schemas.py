from typing import Dict, Any, List, Optional
from pydantic import BaseModel

class BYOKProviderConfig(BaseModel):
    provider_name: str
    model: str
    api_key: str
    # Optional: override the provider's default endpoint (for third-party / self-hosted APIs)
    base_url: Optional[str] = None

class TestConnectionRequest(BaseModel):
    provider_name: str
    model: str
    api_key: str
    # Optional: custom base URL for third-party / self-hosted compatible APIs
    base_url: Optional[str] = None

class TestConnectionResponse(BaseModel):
    ok: bool
    model: Optional[str] = None
    message: str
    error_code: Optional[str] = None

# HTTP Requests / Responses
class CreateRoomRequest(BaseModel):
    mode: str = "hvsh"  # or "human_vs_ai"
    ai_config: Optional[BYOKProviderConfig] = None
    display_name: str = "Player 1"

class CreateRoomResponse(BaseModel):
    room_id: str
    player_id: str
    player_token: str

class JoinRoomRequest(BaseModel):
    display_name: str

class JoinRoomResponse(BaseModel):
    player_id: str
    player_token: str

# WebSocket Incoming Actions
class WSPlayerAction(BaseModel):
    action: str
    amount: Optional[int] = None
