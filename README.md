# 游医天下 · 3D 版（visvise × GNPC）

白描水墨风格的 3D 叙事游戏：上帝视角地图九境，每境是 Three.js 3D 场景，
人物是 **GNPC**（gnpc.qq.com 的 AI NPC），3D 美术由 **visvise**（Maya 插件）生成后导入。

## 目录
```
youyi-tianxia-3d/
├── index.html        入口（含 three.js importmap）
├── data.js           九境 / 五脏五色 / 世界模型 / GNPC 绑定
├── art3d.js          Three.js 世界构建（程序化占位 + glTF 加载）
├── gnpc.js           前端对话客户端（调 /gnpc/chat）
├── game.js           主逻辑：地图 / 3D 场景 / 组方 / GNPC 对话
├── styles.css        白描样式
├── gnpc_proxy.py     本地代理 + 静态服务器（保管密钥、转发 GNPC）
├── gnpc_config.json  NPC 密钥配置（需填写）
├── models/           visvise 导出的 glTF（可选，命名见下）
├── ASSET_BRIEF.md    visvise 每境 3D 人物/场景生成提示词
├── GNPC_NPCS.md      每境 GNPC 人设 Prompt 与知识库
└── README.md
```

## 运行
```bash
cd youyi-tianxia-3d
python3 gnpc_proxy.py            # 默认 http://localhost:8124/
# 或指定端口： python3 gnpc_proxy.py 9000
```
浏览器打开 `http://localhost:8124/`。

> 必须用本代理启动（而不能直接双击 index.html）：three.js 走 ES module，且对话需同源代理。

## 接入 GNPC（让每境之人会说话）
1. 在 https://gnpc.qq.com 为每个地点创建 NPC（Agent 模式），人设与知识库见 `GNPC_NPCS.md`。
2. 复制 `gnpc_config.example.json` 为 `gnpc_config.json`，把每个地点创建的 **NPC ID** 与 **签名密钥** 填入对应 key
   （`gnpc_config.json` 已被 `.gitignore` 忽略，不会提交到仓库；请勿把真实密钥提交）
   （shijing / bianjing / fuyao / biyu / dangzhou / cunliu / keju / huangchao / zhangtianyi）。
3. 进入游戏，点 3D 角色或「对话」即可与 GNPC 交谈；玩家此前拟的「五脏五色」组方会作为上下文注入。

## 接入 visvise（替换为真 3D 美术）
1. 在 Maya 装 visvise-weaver 插件，连上后按 `ASSET_BRIEF.md` 提示词生成人物与场景。
2. 导出 glTF/GLB，放入 `models/`：
   - `models/<境>_scene.glb`（场景） 例：`models/shijing_scene.glb`
   - `models/<境>_char.glb`（角色） 例：`models/shijing_char.glb`
3. 未导出时游戏用程序化白描占位体，不影响流程。

## 玩法
- 地图点击解锁的境 → 进入 3D 场景。
- 「拟方 · 调色盘」调五脏五色（肝青/心赤/脾黄/肺白/肾黑）剂量；实时晕染场景雾色、灯光与角色腰带色（世界模型）。
- 提交后按与经方的契合度判定 上工/中工/下工，影响剧情与对话。
- 点角色或「对话」与 GNPC 交谈，NPC 会就你开的方子做出反应。

> 内容为虚构，如有雷同纯属巧合。
