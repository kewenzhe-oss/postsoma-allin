from fastapi.testclient import TestClient
from online.app import app
from online.room_manager import room_manager

client = TestClient(app)

def test_create_and_join_room():
    # Create
    resp1 = client.post("/api/rooms", json={"mode": "hvsh", "display_name": "P1"})
    assert resp1.status_code == 200
    data1 = resp1.json()
    assert "room_id" in data1
    assert "player_id" in data1
    room_id = data1["room_id"]

    # Join
    resp2 = client.post(f"/api/rooms/{room_id}/join", json={"display_name": "P2"})
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert "player_id" in data2

    # Try to join full room
    resp3 = client.post(f"/api/rooms/{room_id}/join", json={"display_name": "P3"})
    assert resp3.status_code == 400
    
    # Cleanup
    room_manager.delete_room(room_id)
