import asyncio
from dataclasses import asdict
from typing import Dict, List
from fastapi import WebSocket
from online.schemas import EngineEvent
from online.room_manager import room_manager

class ConnectionManager:
    def __init__(self):
        # room_id -> {player_id -> WebSocket}
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str, player_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = {}
        self.active_connections[room_id][player_id] = websocket

        # Attach event listener to session if not attached
        session = room_manager.get_room(room_id)
        if session and not session.on_event_generated:
            session.on_event_generated = lambda ev: self._broadcast_event(room_id, ev)

    def disconnect(self, room_id: str, player_id: str):
        if room_id in self.active_connections:
            if player_id in self.active_connections[room_id]:
                del self.active_connections[room_id][player_id]

    async def replay_events_for_player(self, websocket: WebSocket, room_id: str, player_id: str):
        """Replay room event history to newly connected or reconnected client."""
        session = room_manager.get_room(room_id)
        if not session:
            return
        events = session.adapter.event_log()
        for ev in events:
            if ev.type == "private_hole_cards":
                target_id = ev.payload.get("player_id")
                if target_id != player_id:
                    continue
            try:
                await websocket.send_json({"type": "engine_event", "event": asdict(ev)})
            except Exception as e:
                print(f"Error replaying event to {player_id}: {e}")

    async def broadcast_state(self, room_id: str):
        session = room_manager.get_room(room_id)
        if not session:
            return
        
        for player_id, ws in self.active_connections.get(room_id, {}).items():
            try:
                private_state = session.adapter.get_private_state(player_id)
                available_actions = session.adapter.get_available_actions(player_id)
                payload = {
                    "type": "state_sync",
                    "payload": {
                        "state": asdict(private_state),
                        "available_actions": [asdict(a) for a in available_actions]
                    }
                }
                await ws.send_json(payload)
            except Exception as e:
                print(f"Error sending state to {player_id}: {e}")

    def _broadcast_event(self, room_id: str, event: EngineEvent):
        # Dispatch using an asyncio task since it might be called synchronously
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self._async_broadcast_event(room_id, event))
        except RuntimeError:
            pass

    async def _async_broadcast_event(self, room_id: str, event: EngineEvent):
        for player_id, ws in self.active_connections.get(room_id, {}).items():
            # Private hole cards should only be sent to the owner
            if event.type == "private_hole_cards":
                target_player_id = event.payload.get("player_id")
                if target_player_id != player_id:
                    continue
                    
            try:
                await ws.send_json({"type": "engine_event", "event": asdict(event)})
            except Exception as e:
                print(f"Error broadcasting event to {player_id}: {e}")
        
        # Broadcast full state after relevant events to keep clients synced
        if event.type in ["hand_started", "player_action_applied", "hand_finished", "community_cards_dealt"]:
            await self.broadcast_state(room_id)

connection_manager = ConnectionManager()
