# 键盘星球 · KeyPlanet

[![CI and Release](https://github.com/topbat/keyplanet/actions/workflows/ci-release.yml/badge.svg)](https://github.com/topbat/keyplanet/actions/workflows/ci-release.yml)
[Apache License 2.0](LICENSE) · [下载发布版](https://github.com/topbat/keyplanet/releases/latest)

键盘星球是一款面向家庭和键盘初学者的中文网页打字游戏。你可以跟着故事练习打字，也可以在赛车、切水果和记忆游戏里熟悉键位。完成练习后，成长面板会帮你回看准确率、完成率和练习节奏。

KeyPlanet is a browser-based typing adventure for families and beginners. It combines keyboard drills, mini-games, Chinese input practice, and interactive progress charts.

![键盘星球首页和冒险入口](docs/screenshots/home.jpg)

## 功能

| 功能 | 体验 |
| --- | --- |
| 游戏冒险地图 | 20 个主题关卡，共用竞速、切水果、投靶、搭建和记忆五类玩法。支持字母、数字、符号与综合题库，也可选择难度、自由练习或限时考核。 |
| 键盘训练营 | 练习基础指位、字母和功能键，逐步熟悉实体键盘。 |
| 中文打字 | 跟着原创故事练习，或选择拼音、86 版五笔一级简码入门路线。拼音和故事中文输入使用系统已有的输入法。 |
| 场景与音效 | 答对推动场景进度，连击和阶段进度触发专属音效与特效。声音和动效可分别关闭。 |
| 成长记录 | 按路线看准确率曲线，点选数据查看单次成绩。键位挑战可对照完成率，柱状图展示近七天练习次数。 |
| 本地反馈 | 练习小伙伴根据当前浏览器的成绩和错键给出规则建议。数据保存在浏览器中，无需登录。 |

| 流星赛车的连击反馈 | 可点选的成长图表 |
| --- | --- |
| ![赛车游戏中显示连击徽章和赛道进度](docs/screenshots/racing.jpg) | ![成长面板的正确率、完成率和近七天练习柱状图](docs/screenshots/growth.jpg) |

## 环境搭建

推荐使用带实体键盘的电脑和现代浏览器。项目由原生 HTML、CSS 和 JavaScript 组成，`dist/` 是可直接运行和修改的前端源码。预览需要一个本地 HTTP 服务，下面以 Python 3 为例。

```bash
git clone https://github.com/topbat/keyplanet.git
cd keyplanet
python -m http.server 8080 --bind 127.0.0.1 --directory dist
```

打开 [http://127.0.0.1:8080](http://127.0.0.1:8080)。若系统将 Python 3 命令命名为 `python3`，用 `python3` 替换 `python`。页面通过 HTTP 加载 JavaScript 模块，建议通过上述地址预览。

### 运行测试

准备 Node.js 22 或更新版本。项目没有 npm 依赖，可直接在仓库根目录运行。

```bash
npm test
```

### 使用发布包

从 [GitHub Releases](https://github.com/topbat/keyplanet/releases/latest) 下载 `keyplanet-v<版本>-web.zip`。解压后在包的根目录运行同一条 HTTP 服务命令，也可以将 `dist/` 中的文件部署到任意静态站点。Release 同时提供对应的 `.sha256` 校验文件。

## 项目结构

| 路径 | 用途 |
| --- | --- |
| `dist/` | 页面、样式、游戏、评分逻辑和成长图表 |
| `tests/` | 使用 Node.js 内置测试框架的练习与评分测试 |
| `docs/` | [玩法调研](docs/game-research.md)、[练习反馈设计](docs/ai-workflow.md)及项目截图 |
| `.github/workflows/` | GitHub Actions 测试、打包和发布流程 |

## 持续集成与发布

向 `main` 推送或提交拉取请求时，GitHub Actions 会运行测试并检查前端脚本语法。发布时，将 `package.json` 的 `version` 更新为目标版本，提交后推送对应的 `v<版本>` 标签。测试通过后，工作流会创建 GitHub Release，并附上静态网页 ZIP 和 SHA-256 校验文件。

## 参与贡献

欢迎通过 GitHub Issues 报告问题或提出玩法建议。提交改动时，请说明复现或验证步骤，并运行 `npm test`。涉及界面的改动可以附上截图。

## 开源协议

本项目采用 [Apache License 2.0](LICENSE)。版权声明见 [NOTICE](NOTICE)。
