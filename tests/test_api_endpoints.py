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


def test_two_websocket_players_complete_showdown_without_private_card_leak():
    with TestClient(app) as connected_client:
        first=connected_client.post('/api/rooms',json={'mode':'hvsh','display_name':'One'}).json()
        rid=first['room_id']
        second=connected_client.post(f'/api/rooms/{rid}/join',json={'display_name':'Two'}).json()
        session=room_manager.get_room(rid)
        try:
            with connected_client.websocket_connect(f"/ws/rooms/{rid}?token={first['player_token']}") as ws1:
                with connected_client.websocket_connect(f"/ws/rooms/{rid}?token={second['player_token']}") as ws2:
                    sockets={first['player_id']:ws1,second['player_id']:ws2}
                    def receive_until(ws,pid,predicate):
                        for _ in range(100):
                            message=ws.receive_json()
                            if message['type']=='engine_event' and message['event']['type']=='private_hole_cards':
                                assert message['event']['payload']['player_id']==pid
                            if predicate(message): return message
                        raise AssertionError('Expected websocket message was not delivered')
                    for pid,ws in sockets.items():
                        receive_until(ws,pid,lambda m:m['type']=='state_sync')
                    for _ in range(12):
                        actor=session.adapter.current_turn_player_id()
                        action=next(a for a in session.adapter.get_available_actions(actor) if a.action in ('CHECK','CALL'))
                        ws=sockets[actor]
                        ws.send_json({'action':action.action})
                        receive_until(ws,actor,lambda m:m['type']=='engine_event' and m['event']['type']=='player_action_applied' and m['event']['payload']['player_id']==actor)
                        if session.adapter.get_public_state().game_status=='showdown':
                            for pid,connection in sockets.items():
                                result=receive_until(connection,pid,lambda m:m['type']=='engine_event' and m['event']['type']=='hand_finished')['event']['payload']
                                assert len(result['community_cards'])==5
                                assert len(result['showdown_info']['winning_cards'])==5
                            break
                    else: raise AssertionError('Websocket hand did not finish')
        finally:
            if session.turn_timer_task: session.turn_timer_task.cancel()
            if session._delayed_start_task: session._delayed_start_task.cancel()
            room_manager.delete_room(rid)
