#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
游医天下 · GNPC 本地代理 + 静态服务器
------------------------------------------------------------
功能：
  1) 在本目录起一个 HTTP 服务，托管 index.html 等静态资源；
  2) 提供同源接口 POST /gnpc/chat，由服务端用 secret 计算签名后
     转发到 GNPC OpenAPI（SSE），避免密钥暴露在前端、规避浏览器 CORS。

运行：
  cd youyi-tianxia-3d
  python3 gnpc_proxy.py            # 默认 0.0.0.0:8124
  python3 gnpc_proxy.py 9000       # 指定端口

配置：
  编辑同目录 gnpc_config.json，填入在 gnpc.qq.com 创建 NPC 后得到的
  npcId 与 secret（签名密钥）。格式见 gnpc_config.json。
"""
import os, sys, json, uuid, hashlib, random, string, http.server, urllib.request, urllib.error

HERE = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(HERE, "gnpc_config.json")
GNPC_URL = "https://api.gnpc.qq.com/openapi/npc/agent/chat-messages"


def load_config():
    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        return {"npcs": {}, "_error": str(e)}


def call_gnpc(npc_id, secret, query, conversation_id, user):
    ts = str(int(__import__("time").time()))
    rand = "".join(random.choices(string.ascii_letters + string.digits, k=12))
    sign = hashlib.md5(f"{npc_id}_{secret}_{ts}_{rand}".encode("utf-8")).hexdigest()
    payload = json.dumps({"user": user, "query": query, "conversationId": conversation_id}).encode("utf-8")
    req = urllib.request.Request(GNPC_URL, data=payload, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("X-GNPC-NPCID", npc_id)
    req.add_header("X-GNPC-TIMESTAMP", ts)
    req.add_header("X-GNPC-RANDOM", rand)
    req.add_header("X-GNPC-SIGN", sign)
    try:
        resp = urllib.request.urlopen(req, timeout=60)
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "ignore")[:300]
        raise RuntimeError(f"GNPC 返回 {e.code}：{detail}")
    except Exception as e:
        raise RuntimeError(f"无法连接 GNPC：{e}")
    reply = []
    for raw in resp:
        line = raw.decode("utf-8", "ignore").strip()
        if not line.startswith("data:"):
            continue
        data = line[5:].strip()
        if data == "[DONE]":
            break
        try:
            obj = json.loads(data)
        except Exception:
            continue
        evt = obj.get("event")
        if evt == "message":
            reply.append(obj.get("answer") or obj.get("content", ""))
        elif evt == "error":
            raise RuntimeError(obj.get("message", "GNPC 错误"))
        elif evt == "message_end":
            break
    return "".join(reply)


class Handler(http.server.SimpleHTTPRequestHandler):
    def _send_json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path.split("?")[0] != "/gnpc/chat":
            self.send_error(405)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            inp = json.loads(self.rfile.read(length) or b"{}")
        except Exception:
            self._send_json({"error": "请求体不是合法 JSON"}, 400)
            return
        key = inp.get("key", "")
        query = inp.get("query", "")
        conv = inp.get("conversationId", "") or str(uuid.uuid4())
        user = inp.get("user", "youyi-player")
        cfg = load_config()
        npc = (cfg.get("npcs") or {}).get(key)
        npc_id = str((npc or {}).get("npcId", ""))
        secret = str((npc or {}).get("secret", ""))
        # 未配置判定：npcId 须以 npc_ 开头且 secret 非占位文本
        if not npc or not npc_id.startswith("npc_") or not secret or secret.startswith("在"):
            self._send_json({
                "error": f"未配置 NPC「{key}」。请在 gnpc_config.json 填入真实的 npcId（以 npc_ 开头）与 secret，"
                         f"并先在 gnpc.qq.com 创建该 NPC。配置错误：{cfg.get('_error','')}"
            }, 400)
            return
        try:
            reply = call_gnpc(npc["npcId"], npc["secret"], query, conv, user)
            self._send_json({"reply": reply, "conversationId": conv})
        except Exception as e:
            self._send_json({"error": str(e)}, 502)

    def log_message(self, fmt, *args):
        sys.stderr.write("[" + self.address_string() + "] " + (fmt % args) + "\n")


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8124
    os.chdir(HERE)
    srv = http.server.ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print(f"游医天下 3D 已启动： http://localhost:{port}/")
    print(f"GNPC 代理： POST /gnpc/chat  →  {GNPC_URL}")
    print("按 Ctrl+C 停止。")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\n已停止。")


if __name__ == "__main__":
    main()
