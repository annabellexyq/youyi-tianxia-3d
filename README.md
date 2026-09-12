# 游医天下 · 3D 版（visvise × GNPC）

白描水墨风格的 3D 叙事游戏：上帝视角地图九境，每境是 Three.js 3D 场景，
人物是 **GNPC**（gnpc.qq.com 的 AI NPC），3D 美术由 **visvise**（Maya 插件）生成后导入。

## 在线地址

| 平台 | 地址 |
| --- | --- |
| GitHub Pages | `https://annabellexyq.github.io/youyi-tianxia-3d/` |
| 腾讯云 CloudBase（主，本项目专属域名） | `https://youyitianxia-ai-native-d7gjgsyyefdea561d.webapps.tcloudbase.com/` |
| 腾讯云 CloudBase（同源直链） | `https://ai-native-d7gjgsyyefdea561d-1302042144.tcloudbaseapp.com/youyi/` |

- 仓库：`https://github.com/annabellexyq/youyi-tianxia-3d`（`main` 分支；Pages 从该分支根目录构建，推送后 1～3 分钟生效）
- 同一个 CloudBase 环境（`ai-native-d7gjgsyyefdea561d`）下还托管着「窗外信使」「囊泡漂流」，**三者共用同一个静态托管根目录**：
  - 根目录 `/` 归「窗外信使」；「囊泡漂流」在 `/exo-pinch/`；**本项目实体在 `/youyi/`**
  - 本项目专属域名 `youyitianxia-*.webapps.tcloudbase.com` 是个 CloudApp（`serviceName=youyitianxia`），
    `appPath` 设为 **`/youyi`**，网关把它重写成 `/youyi/*`，所以该域名根路径直接就是本项目 —— 两个地址内容完全一致
  - `/youyi/` 是**自包含目录**（`index.html` + `styles.css` + `game.js` + `data.js` + `art3d.js` + `bencao-wheel.js` + `vendor/` + `assets/bgs` + `assets/chars` 全在里面），
    入口页用原始相对路径、**不带** `<base>`，所以在上面两个地址下都能正常解析资源
  - 页面内二维码 `qrcode_play.png` 指向主域名

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
- 环境 ID：`ai-native-d7gjgsyyefdea561d`（地域 ap-shanghai）。该环境**只有一个静态托管 Bucket**，
  三个网关域名共用这一份内容（静态托管不能按域名拆分目录，只能靠路径/前缀区分）：
  - `https://ai-native-d7gjgsyyefdea561d-1302042144.tcloudbaseapp.com/`（通用域名）
  - `https://youyitianxia-ai-native-d7gjgsyyefdea561d.webapps.tcloudbase.com/`（本项目 CloudApp 专属域名）
  - `https://ai-native-d7gjgsyyefdea561d-1302042144.ap-shanghai.app.tcloudbase.com/`
- ⚠️ **全环境只有一个根 `index.html`**，谁最后部署谁生效。当前路径归属：
  - 「窗外信使」占用**根 `/`**（另有历史入口 `/exo-story/`，两者都在）
  - **游医天下（本项目）实体在 `/youyi/`**
  - 囊泡漂流 EXO-PINCH → `/exo-pinch/`；后台 → `/cloud-admin/`
- **两个地址是怎么同时指向本项目的**：
  - `tcloudbaseapp.com/youyi/` —— 就是托管目录里的 `/youyi/`，自包含
  - `youyitianxia-*.webapps.tcloudbase.com/` —— CloudApp（`serviceName=youyitianxia`）的 `appPath=/youyi`，
    网关路由 `PathRewrite.Prefix=/youyi`，把该域名的 `/` 映射到托管的 `/youyi`
  - 因为 `/youyi/` 是自包含的，入口页用**原始相对路径、不带 `<base>`**，两个地址都能正常加载资源
- 日常更新（只覆盖 `/youyi/`，不动别的项目）：
  ```bash
  # 单文件（改入口/脚本/CSS 时最快）
  tcb hosting deploy ./index.html youyi/index.html -e ai-native-d7gjgsyyefdea561d
  # 整站（含 assets 素材，注意排除 promo_assets / 密钥 / 文档）
  npx -p @cloudbase/cli tcb hosting deploy . youyi -e ai-native-d7gjgsyyefdea561d
  ```
- ⚠️ 改 `appPath` 必须走 `manageApps deployApp`（没有仅改配置的接口），**务必显式传 `deployCmd`**
  指向 `youyi` 子目录，否则流水线里的 `tcb hosting deploy` 会覆盖托管根目录，把「窗外信使」的首页顶掉。
  参考命令：`manageApps(action=deployApp, serviceName=youyitianxia, appPath=/youyi,
  framework=static, installCmd="", buildCmd="", deployCmd="tcb hosting deploy . youyi")`
- 注意：CDN 有缓存，发布后用无痕模式或带随机 query 验证（`?v=$RANDOM`）。
- 页面内二维码 `qrcode_play.png` 指向主域名 `https://youyitianxia-ai-native-d7gjgsyyefdea561d.webapps.tcloudbase.com/`。
