/* 游医天下 · GNPC 聊天后端（CloudBase Node HTTP 云函数 / WebServer 模型）
 * 替代本地 gnpc_proxy.py，密钥走服务端环境变量，前端不暴露、规避 CORS。
 * 以标准 Node HTTP Server 监听 PORT(默认9000)，由 SCF 转发请求。
 */
const http = require('http');
const crypto = require('crypto');

const GNPC_URL = 'https://api.gnpc.qq.com/openapi/npc/agent/chat-messages';
const KEY = 'waixiti';
const NPC_ID = process.env.GNPC_NPC_WAIXITI_ID || '';
const SECRET = process.env.GNPC_NPC_WAIXITI_SECRET || '';
const PORT = process.env.PORT || 9000;

function sign(npcId, secret) {
  const ts = String(Math.floor(Date.now() / 1000));
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const rand = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const s = crypto.createHash('md5').update(`${npcId}_${secret}_${ts}_${rand}`).digest('hex');
  return { ts, rand, s };
}

async function callGnpc(query, conversationId, user) {
  const { ts, rand, s } = sign(NPC_ID, SECRET);
  const resp = await fetch(GNPC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-GNPC-NPCID': NPC_ID,
      'X-GNPC-TIMESTAMP': ts,
      'X-GNPC-RANDOM': rand,
      'X-GNPC-SIGN': s,
    },
    body: JSON.stringify({ user, query, conversationId }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`GNPC ${resp.status}：${t.slice(0, 300)}`);
  }
  const text = await resp.text();
  const reply = [];
  let conv = conversationId;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line.startsWith('data:')) continue;
    const data = line.slice(5).trim();
    if (data === '[DONE]') break;
    let obj;
    try { obj = JSON.parse(data); } catch { continue; }
    const evt = obj.event;
    if (evt === 'message') reply.push(obj.answer || obj.content || '');
    else if (evt === 'message_end') break;
    else if (evt === 'error') throw new Error(obj.message || 'GNPC 错误');
  }
  return { reply: reply.join(''), conversationId: conv };
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'POST') {
    res.statusCode = 405; res.end(JSON.stringify({ error: 'method not allowed' })); return;
  }
  let buf = '';
  req.on('data', (c) => (buf += c));
  req.on('end', async () => {
    try {
      const body = buf ? JSON.parse(buf) : {};
      const key = body.key || KEY;
      if (key !== KEY || !NPC_ID.startsWith('npc_') || !SECRET) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: `未配置 NPC「${key}」。请在云函数环境变量填入真实的 npcId（以 npc_ 开头）与 secret。` }));
        return;
      }
      const query = String(body.query || '');
      const conversationId = body.conversationId || crypto.randomUUID();
      const user = body.user || 'youyi-player';
      const { reply, conversationId: conv } = await callGnpc(query, conversationId, user);
      res.end(JSON.stringify({ reply, conversationId: conv }));
    } catch (e) {
      res.statusCode = 502; res.end(JSON.stringify({ error: e.message }));
    }
  });
});

server.listen(PORT, () => console.log(`gnpcChat listening on ${PORT}`));
