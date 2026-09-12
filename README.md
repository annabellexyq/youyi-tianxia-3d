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

## 部署（腾讯云开发 CloudBase）
- 环境 ID：`ai-native-d7gjgsyyefdea561d`（地域 ap-shanghai），该环境**只有一个静态托管 Bucket、一个 CloudApp**，
  下面两个域名是**同一份内容**的两个入口（已验证逐字节一致），不要当成两个站点：
  - CloudApp 独立子域名（主，推荐对外使用）：
    `https://youyitianxia-ai-native-d7gjgsyyefdea561d.webapps.tcloudbase.com/`
  - 静态托管共享域名（同源备份）：
    `https://ai-native-d7gjgsyyefdea561d-1302042144.tcloudbaseapp.com/`
- ⚠️ **根目录 `index.html` 是多个项目唯一会撞车的文件**：谁最后部署谁生效。
  本站曾因「窗外信使」后部署覆盖根 `index.html`，导致两个域名都显示窗外信使。
  因此约定：**本站固定占用根 `index.html`**，其它项目一律放各自子目录：
  - 窗外信使 → `/exo-story/`，对外地址用 `https://ai-native-d7gjgsyyefdea561d-1302042144.tcloudbaseapp.com/exo-story/`
    （不要用本项目名注册的 `youyitianxia-*.webapps.tcloudbase.com` 域名，避免两个项目混淆）
  - 囊泡漂流 EXO-PINCH → `/exo-pinch/`
  - 后台 → `/cloud-admin/`
  本项目其余文件（`styles.css` / `game.js` / `data.js` / `art3d.js` / `bencao-wheel.js` / `vendor/` / `assets/bgs` / `assets/chars`）
  都在根目录且与其它项目不冲突，恢复入口只需重传一个 `index.html`。
- 部署方式：资源为纯静态（index.html / styles.css / data.js / art3d.js / game.js / bencao-wheel.js / vendor / assets / qrcode_play.png），
  首次用 `manageApps`（serviceName: youyitianxia，framework=static，跳过 install/build）发布到独立子域名；
  后续小改动用 CLI 单文件发布更快：
  ```bash
  tcb login
  tcb hosting deploy ./index.html index.html -e ai-native-d7gjgsyyefdea561d
  ```
- 注意：CDN 有缓存，发布后用无痕模式或带随机 query 访问验证（`?v=$RANDOM`）。
- 页面内二维码 `qrcode_play.png` 指向上面的 CloudApp 地址。
- 若发现线上又变成别的项目，执行下面这一条即可恢复本站入口（只覆盖根 `index.html`，不影响其它子目录）：
  ```bash
  tcb hosting deploy ./index.html index.html -e ai-native-d7gjgsyyefdea561d
  ```
  整站恢复（含资源）用 `manageHosting action=upload`，`cloudPath = /`，忽略 `**/*.md`、`**/*.py`、`**/.DS_Store`。
