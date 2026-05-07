import os
import asyncio
import httpx
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

prompt = """You are an aggressive heads-up poker AI. Bet and raise with good hands.

Hand #2 [FLOP]
  Cards: ♥A ♠K | Board: ♣10 ♦J ♥Q
  Pot: 40  To-call: 20  Stacks: me=960 opp=980
  Opponent: style unknown
  History: ME:RAISE(20) | OPP:CALL
  Prev: RAISE 40 / Won at showdown

Legal: FOLD | CHECK | CALL | RAISE | ALL_IN
  RAISE amount: 40 to 960

Rules:
  - Top pair or better OR flush/straight draw → RAISE
  - Opponent checks repeatedly → RAISE to steal pot
  - Weak hand vs bet → FOLD
  - CHECK only if hand is weak and no bet to face

Reply with ONE token only (no punctuation, no explanation):
FOLD   CHECK   CALL   RAISE <amount>   ALL_IN

>"""

async def run():
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "maxOutputTokens": 10,
            "temperature": 0.8,
        },
        "safetySettings": [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ]
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(url, json=payload)
        print(resp.status_code)
        print(resp.json())

asyncio.run(run())
