# Pinu Game

Pinu Game 是 Pinu 项目的小游戏开发目录，用于沉淀可独立迭代、验证和推送的游戏原型。

## 当前内容

- `index.html`：Bingo Challenge 本地 HTML 原型入口。
- `docs/`：Bingo Challenge 背景、需求、决策和协作沉淀。
- `GIT_PUSH_INFO.md`：Git 推送、commit 和 PR 信息模板。
- `AGENTS.md`：后续开发协作流程与工作习惯。

## 本地打开

```bash
open Pinu_game/index.html
```

## 词库配置工具

```bash
npm install
npm run vocab:admin
```

打开 `http://localhost:5177` 上传 Excel/CSV，预览后导入本地 SQLite 词库。也可以用命令行导入和导出：

```bash
npm run vocab:import -- s1-u1u2单词.csv en es
npm run vocab:export -- es-en s1u1,s1u2,s1u3,s1u4
npm run vocab:export -- en-es s1u1,s1u2,s1u3,s1u4
```

导出的游戏词库位于 `data/vocab/<language-pair>/<unit-range>.json`。Bingo 每局会重新随机棋盘位置和叫词顺序；如果当前语言对词库少于 24 条，会回退到内置 demo 词库。

## 项目描述

面向 Pinu 玩法探索的小游戏项目。当前重点是 Bingo Challenge：一个用于每日词汇挑战和轻复习的短局玩法原型，用于验证已学词听辨、Bingo 连线、Fever 激励、XP 结算和 Pinu 风格图文教学。

评审和接续工作优先阅读：

1. `docs/pinu-bingo-decisions-and-collaboration.md`
2. `docs/introduce.md`
3. `docs/bingo-challenge-requirements.md`
