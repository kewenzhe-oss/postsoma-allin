# Frontend/Backend Contract: Online 1v1 Poker

## 1. HTTP Endpoints

### 1.1 Create Room
建立一個新的對局房間。
- **URL**: `POST /api/rooms`
- **Request Body**:
  ```json
  {
    "mode": "hvsh", // 僅支援 "hvsh"。Phase 6 才會支援 "hvai"
    "display_name": "Player 1" // 房主顯示名稱
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "room_id": "8-char-uuid",
    "player_id": "8-char-uuid",
    "player_token": "secret-token-for-ws"
  }
  ```

### 1.2 Join Room
加入一個已經存在的對局房間。
- **URL**: `POST /api/rooms/{room_id}/join`
- **Request Body**:
  ```json
  {
    "display_name": "Player 2"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "player_id": "8-char-uuid",
    "player_token": "secret-token-for-ws"
  }
  ```
- **Errors**: 
  - 404 Room not found
  - 400 Room is full

---

## 2. WebSocket Connection

- **URL**: `ws://<domain>/ws/rooms/{room_id}?token={player_token}`

連線建立後，伺服器會立即發送一次 `state_sync` 確保前端拿到最新狀態。

---

## 3. Server-to-Client Messages

Server 主動推播給 Client 的訊息格式。所有訊息最外層都有 `type` 屬性。

### 3.1 State Sync (`state_sync`)
用於完整同步當前玩家可見的遊戲狀態。
```json
{
  "type": "state_sync",
  "payload": {
    "state": {
      "public_state": {
        "seats": [
          {"player_id": "...", "display_name": "P1"},
          {"player_id": "...", "display_name": "P2"}
        ],
        "players": [
          {
            "player_id": "...",
            "display_name": "P1",
            "chips": 980,
            "bet_in_round": 20,
            "total_bet": 20,
            "folded": false,
            "all_in": false,
            "is_active": true
          }
        ],
        "community_cards": ["♥A", "♠K", "♦5"],
        "pot": 40,
        "current_bet": 20,
        "stage": "flop",
        "current_turn_player_id": "player-id-of-p2",
        "dealer_position": 0,
        "small_blind": 5,
        "big_blind": 10
      },
      "private_player_state": {
        "player_id": "your-player-id",
        "hole_cards": ["♣J", "♠10"]
      }
    },
    "available_actions": [
      {"action": "FOLD"},
      {"action": "CALL"},
      {"action": "RAISE", "min_amount": 40, "max_amount": 980},
      {"action": "ALL_IN"}
    ]
  }
}
```

### 3.2 Engine Event (`engine_event`)
用於廣播遊戲發生的特定事件（如：發牌、下注、結束）。
```json
{
  "type": "engine_event",
  "event": {
    "seq": 15,
    "type": "player_action_applied",
    "payload": {
      "player_id": "...",
      "action": "RAISE",
      "amount": 20
    }
  }
}
```
**常見 Event Type**:
- `hand_started`
- `blinds_posted`
- `private_hole_cards` (此事件會被 Server 過濾，只發給對應玩家)
- `community_cards_dealt`
- `player_action_applied`
- `hand_finished`

### 3.3 Error (`error`)
用於通知使用者的操作被拒絕。
```json
{
  "type": "error",
  "message": "Not your turn."
}
```

---

## 4. Client-to-Server Messages

Client 發送給 Server 的訊息。目前僅有一種：下注行為。

### 4.1 Player Action
前端必須**嚴格根據** Server 給的 `available_actions` 來構建此請求，不可自行發明 Action 或非法的 Amount。
```json
{
  "action": "RAISE",
  "amount": 40
}
```
如果沒有 `amount`（例如 FOLD 或 CHECK），則省略或設為 `null`：
```json
{
  "action": "FOLD"
}
```
