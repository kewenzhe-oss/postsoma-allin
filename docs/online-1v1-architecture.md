# Online 1v1 & BYOK AI Poker Architecture

## 1. 現有 Module 分析

經過對 `poker_LLM` 原始碼的審計，現有模組主要是為了**本地同步、多 AI 對戰**設計，缺乏異步、網路連線及狀態持久化的能力。

*   **`poker_engine.py`**:
    *   **現狀**：負責核心的撲克邏輯（發牌、下注、牌型判定、分池）。目前高度耦合了日誌記錄 (`self.game_log.append`) 和本地同步狀態機 (`self.process_action` 內直接改狀態)。
    *   **分析**：核心規則 (如 `evaluate_hand`, `check_flush` 等) 可復用，但 Table 狀態管理和 Action 處理需要解耦，以支援異步操作和 Server 權威驗證。
*   **`game_controller.py`**:
    *   **現狀**：一個同步的迴圈 (`while not self.table.is_round_complete()`)，依次阻塞等待每個 AI 玩家呼叫 API 取得決策。
    *   **分析**：完全不適用於 Online 架構。Online 架構需要事件驅動 (Event-Driven) 和狀態機 (State Machine)，而不是 `while` 迴圈。
*   **`ai_player.py` / `prompts.py`**:
    *   **現狀**：包含 `AIPlayer` 介面及 `LLMPlayer` (含 OpenAI/Anthropic 實作)。目前是同步發送 Request 並等待 Response。Prompt 中包含了所有的 `players_info`。
    *   **分析**：BYOK 模式下，大模型的請求應該放入背景任務 (Background Task/Celery/Asyncio)，避免阻塞 WebSocket Server。Prompt 生成邏輯可復用。
*   **`game_logger.py`**:
    *   **現狀**：將完整對局狀態寫入本地 JSON 檔案。
    *   **分析**：對於 Online MVP 來說過於笨重，需要改為將 Event Stream 即時透過 WebSocket 廣播，並可選地持久化到 DB。
*   **`frontend/poker_llm_web`**:
    *   **現狀**：基於 Vue 3 的**純回放系統**。讀取 JSON 檔案並透過定時器 `setInterval` 播放。無任何網路通訊 (WebSocket/HTTP) 或使用者互動下注介面。
    *   **分析**：UI 元件 (牌桌、撲克牌渲染) 可復用，但需要徹底重寫狀態管理，從「讀取檔案播放」改為「接收 WebSocket 廣播並更新狀態」，並增加 Human 玩家的下注控制面板。

## 2. Reuse / Refactor / Replace Matrix

| Module | Classification | Action Plan |
| :--- | :--- | :--- |
| `engine_info.py` / `game_info.py` (Data Classes) | **Reuse** | 基本定義 (Card, Suit, Action, GameStage) 可直接保留。 |
| 牌型演算法 (`poker_engine.py` - evaluate) | **Reuse** | `evaluate_hand` 及各類 `check_*` 方法保留。 |
| `prompts.py` (LLM Prompt Templates) | **Reuse** | 決策 prompt 基本可沿用，但需注意資訊隔離。 |
| `poker_engine.py` (Table State/Action) | **Refactor** | 移除內建的 `self.game_log` 耦合；將 `process_action` 改為純函數式或丟出異常以供上層 API 捕獲驗證。 |
| `ai_player.py` (LLM Integration) | **Refactor** | 改為 Async 呼叫；將 API Key 和 Base URL 改為從 `Session/Room` 級別的 BYOK 設定讀取，而非全域環境變數。 |
| Vue UI Components (Table, Cards) | **Refactor** | 抽離現有 `Replay.vue` 中的渲染元件，接入即時狀態。 |
| `game_controller.py` | **Replace** | 廢棄同步迴圈，改寫為基於 WebSocket 的非同步 Room Manager / GameStateMachine。 |
| `game_logger.py` | **Replace** | 替換為 WebSocket Event Broadcaster 及 Redis/DB 持久化。 |
| Vue State Management (`stores/game.js`) | **Replace** | 廢棄時間軸播放邏輯，替換為 WebSocket Store。 |

## 3. Online 架構設計

第一版將採用 **FastAPI + WebSocket** 建立即時通訊，並以 Memory (或 Redis) 維護 Room State。

*   **FastAPI API (HTTP)**:
    *   `POST /api/rooms`: 建立房間 (選擇 Human v Human 或 Human v AI)。
    *   `GET /api/rooms/{room_id}`: 取得房間連線 Token/WebSocket URL。
*   **WebSocket Room Channel**:
    *   `ws://server/ws/rooms/{room_id}?token={player_token}`
    *   雙向通訊：Client 發送 `PlayerAction` (Call, Fold, Raise)，Server 推送 `GameStateSync` 或 `GameEvent`。
*   **GameSession / Room State Machine**:
    *   維護 `PokerTable` 實例。
    *   處理 Timeout 邏輯 (如果玩家斷線或過久未行動，自動 Fold)。
    *   維護連線池 (Connection Pool)，管理發給 Player1, Player2 (或 AI) 的不同視圖。
*   **Event Stream Schema (JSON)**:
    *   `{"type": "state_update", "payload": {...}}`: 完整狀態同步 (重連用)。
    *   `{"type": "action_request", "payload": {"available_actions": [...]}}`: 輪到玩家行動。
    *   `{"type": "player_action", "payload": {"player": "A", "action": "RAISE", "amount": 10}}`: 廣播玩家行為。
    *   `{"type": "deal_cards", "payload": {"community": [...], "hole": [...]}}`: 發牌 (注意 private_data 隔離)。
*   **BYOK Model Config / Secret Handling**:
    *   建立房間時，若對手是 AI，Creator 需透過 HTTP POST 提交 `api_key`, `base_url`, `model_name`。
    *   這些敏感資訊只存在於 Server 的 Memory `GameSession` 中 (不存入持久化 DB，不寫入 Log)。
    *   當輪到 AI 行動時，Server 的 Background Task 使用 Session 中的 BYOK config 呼叫 LLM，獲取結果後轉化為 `PlayerAction` 注入 State Machine。

## 4. MVP 邊界

**包含 (In Scope) - 第一版目標**
*   **v0.1**: Human vs Human (1v1 私密房間，產生 URL 分享給朋友對戰)。
*   **v0.2**: Human vs AI (BYOK，玩家填寫 API Key 開房與 LLM 對戰)。

**明確排除 (Out of Scope)**
*   ❌ 多人大型平台架構 (Microservices)。
*   ❌ Matchmaking (自動配對系統)，僅透過房間 ID 或連結邀請。
*   ❌ 全域排行榜、用戶等級。
*   ❌ 真錢交易、籌碼購買。
*   ❌ 完整帳號系統 (JWT/OAuth 等)，MVP 僅需暱稱+Session Token 即可。

## 5. 安全要求

*   **Server Authoritative Game State**:
    *   所有狀態 (底池、籌碼、目前是誰的回合) 必須由 Server 的 State Machine 計算。
    *   Client 送來的 Action (如 `amount=9999`) 必須在 Server `process_action` 進行驗證，不合法直接 reject。
*   **Private Hole Cards**:
    *   WebSocket 廣播狀態時，必須進行 payload 過濾。
    *   Player A 收到的 JSON 中，Player B 的手牌必須是 `["??", "??"]`。只有到了 Showdown 階段才可廣播真實手牌。
*   **BYOK API Key 安全**:
    *   API Key 絕對不落盤 (No DB save)，只在 FastAPI 記憶體中的 Room Object 存活。房間銷毀即釋放。
    *   絕對不寫入任何 Application Log (`logger.info` 禁止印出 api_key)。
    *   絕對不可透過 WebSocket Broadcast 到前端 (即使是擁有該 key 的房主)。
*   **Base URL Validation**:
    *   對 BYOK 傳入的 `base_url` 進行簡單驗證，防止 SSRF 攻擊 (如禁止請求內網 IP `127.0.0.1`, `10.x.x.x`)。

## 6. 實作階段

*   **Phase 1: Engine Adapter**
    *   重構 `poker_engine.py`，移除 `game_log.append` 耦合，增加對外暴露的 Event Hook 或返回 Action Result。
    *   定義 WebSocket 所需的 State/Event Pydantic Models。
*   **Phase 2: FastAPI Backend Core**
    *   搭建 FastAPI 專案結構。
    *   實作 Room Manager (記憶體 CRUD)。
    *   實作 WebSocket Endpoint 與 ConnectionManager。
*   **Phase 3: Room/Session State Machine**
    *   實作 `GameSession` 類別，封裝 `PokerTable`。
    *   實作 Client Payload 隔離邏輯 (Private View Generator)。
    *   實作 Turn Timer 與 Timeout 自動 Fold 邏輯。
*   **Phase 4: Online Table Frontend**
    *   重構 Vue 專案，新增 Lobby 頁面 (建立房間/輸入 API Key)。
    *   重構 `Table.vue`，接入 WebSocket Event Listener 取代定時器播放。
    *   實作 Human 下注控制面板 (Fold/Check/Call/Raise Slider)。
*   **Phase 5: Human vs Human Integration**
    *   聯調前後端，完成雙人 1v1 完整對局 (含分享連結、加入房間、正常完賽)。
*   **Phase 6: BYOK AI Integration**
    *   實作非同步 AI Worker。
    *   當 State Machine 輪到 AI 時，觸發非同步 LLM 請求。
    *   將 AI Response 解析並推入 State Machine 繼續遊戲。
