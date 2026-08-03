"""
Nepal Dev Terminal — WebRTC Signaling Server

Pure Python using `websockets`. No AI, no ML, no paid APIs.
Relays WebRTC signaling between a visitor and the developer's agent page.

Usage:
  pip install websockets
  python server/call_server.py
"""

import asyncio
import json
import logging
from websockets.asyncio.server import serve

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("call-server")

connections: dict[str, object] = {}


async def handler(websocket):
    role = None
    try:
        async for raw in websocket:
            data = json.loads(raw)
            msg_type = data.get("type")

            if msg_type == "register":
                role = data.get("role")
                connections[role] = websocket
                logger.info(f"{role} registered (agent={'agent' in connections}, visitor={'visitor' in connections})")
                if role == "visitor" and "agent" in connections:
                    await connections["agent"].send(json.dumps({"type": "visitor_ready"}))

            elif msg_type == "offer":
                target = "agent" if role == "visitor" else "visitor"
                if target in connections:
                    await connections[target].send(json.dumps({"type": "offer", "sdp": data["sdp"]}))

            elif msg_type == "answer":
                target = "agent" if role == "visitor" else "visitor"
                if target in connections:
                    await connections[target].send(json.dumps({"type": "answer", "sdp": data["sdp"]}))

            elif msg_type == "candidate":
                target = "agent" if role == "visitor" else "visitor"
                if target in connections:
                    await connections[target].send(json.dumps({"type": "candidate", "candidate": data["candidate"]}))

            elif msg_type == "end_call":
                target = "agent" if role == "visitor" else "visitor"
                if target in connections:
                    await connections[target].send(json.dumps({"type": "end_call"}))
                for r in list(connections.keys()):
                    if connections.get(r) == websocket:
                        del connections[r]

    except Exception as e:
        logger.warning(f"Error ({role}): {e}")
    finally:
        if role and connections.get(role) == websocket:
            del connections[role]
        other = "visitor" if role == "agent" else "agent"
        if other in connections:
            try:
                await connections[other].send(json.dumps({"type": "peer_disconnected"}))
            except:
                pass
        logger.info(f"{role} disconnected")


async def main():
    port = 8001
    logger.info(f"Signaling server on ws://localhost:{port}")
    async with serve(handler, "0.0.0.0", port):
        await asyncio.get_running_loop().create_future()


if __name__ == "__main__":
    asyncio.run(main())
