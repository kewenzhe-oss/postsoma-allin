import uuid
from typing import Dict, Optional, Tuple
from online.game_session import GameSession

class RoomManager:
    def __init__(self):
        self.rooms: Dict[str, GameSession] = {}

    def create_room(self, mode: str, ai_config: Optional[Dict] = None) -> Tuple[str, GameSession]:
        room_id = str(uuid.uuid4())[:8]
        session = GameSession(room_id=room_id, mode=mode, ai_config=ai_config)
        self.rooms[room_id] = session
        return room_id, session

    def get_room(self, room_id: str) -> Optional[GameSession]:
        return self.rooms.get(room_id)

    def delete_room(self, room_id: str):
        if room_id in self.rooms:
            session = self.rooms[room_id]
            if session.turn_timer_task:
                session.turn_timer_task.cancel()
            del self.rooms[room_id]

# Global singleton
room_manager = RoomManager()
