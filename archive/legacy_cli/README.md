# Legacy CLI Poker Simulator (Archived)

本目录归档了早期阶段的纯控制台/终端单机德州扑克 LLM 模拟对战系统。

## 包含文件
- `main.py`: CLI 启动入口
- `game_controller.py`: 单机对局同步控制器
- `ai_player.py`: CLI 版本的 LLM 玩家代理
- `game_logger.py`: 本地 JSON 对局日志记录器
- `analyze_logs.py`: 日志统计分析脚本
- `replay_game.py`: 控制台重放脚本
- `prompts.py`: 早期提示词函数
- `prompt/`: 提示词模版文本文件

## 说明
当前主工程已全面迁移至基于 FastAPI + WebSocket + Vue 3 的实时对战架构（见 `online/` 与 `frontend/poker_llm_web/`）。本目录代码仅作历史演进与算法对比参考，不影响 Web 线上生产服务。
