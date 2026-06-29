# Bingo Challenge Docs

本目录保存 Pinu 小游戏 `Bingo Challenge` 的背景、需求和后续开发入口。

## 文档索引

| 文件 | 内容 |
|---|---|
| `introduce.md` | 游戏背景、定位、目标、Pinu 适配逻辑和后续记忆点 |
| `bingo-challenge-requirements.md` | 玩法规则、流程、状态、计分模型、边界行为和验收标准 |
| `pinu-bingo-decisions-and-collaboration.md` | Bingo 当前决策、MVP 边界、词库规则、教学引导、评审风险和协作方式沉淀 |

## 推荐阅读顺序

1. 评审或接续工作前，先读 `pinu-bingo-decisions-and-collaboration.md`，确认定位、边界和待决策问题。
2. 需要理解玩法背景时，读 `introduce.md`。
3. 需要补 PRD 或研发实现时，读 `bingo-challenge-requirements.md`。

## 设计参考

| 类型 | 路径 | 用法 |
|---|---|---|
| Pinu 首页 | `../../项目截图/Pinu_首页.PNG` | 首页入口、浅蓝地图、圆润按钮、厚重阴影 |
| Pinu 个人档案 | `../../项目截图/Pinu_个人档案.PNG` | 白色面板、圆角卡片、底部导航样式 |
| Duolingo 任务页 | `../../项目截图/多邻国_任务界面.JPG` | 任务入口与挑战卡片的信息层级 |
| Bingo 介绍 | `../../项目截图/bingo_游戏介绍.PNG` | Bingo 连线教学 |
| Bingo 局内 | `../../项目截图/bingo_游戏界面.PNG` | 5x5 棋盘、叫号区、Bingo 按钮 |
| Bingo 结算 | `../../项目截图/bingo_结算界面.JPG` | 结算信息拆分与总分反馈 |

## 当前流程图和教学资产

| 文件 | 用法 |
|---|---|
| `../../Bingo流程图_1_入口与模式分流.drawio` | 插入在线文档的入口与模式分流图 |
| `../../Bingo流程图_2_单局游戏状态流转.drawio` | 插入在线文档的单局状态流转图 |
| `../../Bingo流程图_3_目标分与XP结算.drawio` | 插入在线文档的目标分与 XP 结算图 |
| `../../Bingo流程图_4_棋盘选择与词量判断_修正版.drawio` | 插入在线文档的棋盘选择与词量判断图 |
| `../../Bingo流程图_5_局内教学引导_重绘版.drawio` | 插入在线文档的局内教学引导流程图 |
| `../../bingo_tutorial_card_pinu_en.png` | Pinu 风格英文 How to Play 图文教学稿 |

## 当前实现入口

```bash
open Pinu_game/index.html
```

当前 demo 是单文件 HTML 原型，包含 Pinu 风格入口、Bingo Challenge 局内玩法和结算弹层。
