# Bingo Challenge Requirements

## 1. 概述

`Bingo Challenge` 是 Pinu 的单词 Bingo 小游戏。系统在限定时间内依次叫出单词，用户在 5x5 单词卡上点击对应单词。正确点击得分，连成横线、竖线或斜线后点击 `Bingo` 获得额外加分。

第一版以单文件 HTML demo 验证玩法，不接入后端、不保存真实账户数据、不修改旧 `bingo-game-demo/`。

## 2. 页面流程

### 2.1 入口

- 页面打开后展示 Pinu 风格的移动端首页/任务入口。
- 底部导航提供任务页签，任务页只包含置顶 Bingo 挑战和每日任务两部分。
- 首页入口卡片显示：
  - `DAILY CHALLENGE`
  - `Word Bingo`
  - 历史最高分
  - `PLAY` 按钮
  - 关闭按钮
- 点击入口后进入游戏局内页并开始计时。

### 2.1.1 任务页

- 任务页顶部展示今日任务标题和连续完成状态。
- 任务页首屏置顶 `Word Bingo` 挑战卡片，可直接进入 Bingo 玩法。
- 任务页展示每日任务列表，每条任务包含任务名称、当前进度、进度条和奖励。
- 第一版只展示 Bingo 挑战和每日任务，不增加排行榜、商店、宝箱详情或复杂任务分类。

### 2.2 局内

- 顶部展示返回和标题，不提供局内重开按钮。
- 计分区展示：
  - 剩余时间
  - 当前分数
  - 已领取 Bingo 数量
- 叫词区展示：
  - 当前叫出的西语单词
  - 英文释义
  - 最近 4-5 个已叫单词
  - 当前叫词进度
- 棋盘区展示：
  - 5 列 B/I/N/G/O 标签
  - 5x5 圆形单词卡
  - 中心格 `PINU / free`
  - 默认隐藏单词释义，仅展示主单词
  - Bingo 进度弱化为 `Bingo` 按钮下方小点
  - Fever 状态栏常态展示当前倍率与充能进度；Fever 激活后展示倍率与剩余倒计时
  - `Bingo` 按钮
- Demo 可在手机屏幕外提供释义显示/隐藏开关，该开关只用于演示，不属于游戏主界面。

### 2.3 结算

倒计时结束或词库叫完后进入结算弹层，展示：

- 总分
- 正确点击数
- Bingo 次数
- 最大 Combo
- 是否触发过 Fever
- 单词点击得分
- Bingo 奖励得分
- Fever 额外得分
- `Play again`
- `Back to home`

## 3. 核心规则

- 系统生成 5x5 单词卡，中间格为 `PINU / free`，默认已选中。
- 系统按固定间隔依次叫词。
- 优先使用浏览器 `SpeechSynthesis` 播放西语叫词；不可用时保留视觉叫词。
- 用户点击已被叫出的未选中单词，视为正确点击并得分。
- 用户点击未叫出的单词、已选中单词、free 格，无得分且不扣分，只做轻微回弹反馈。
- 棋盘格点击/按压时应有即时下沉反馈，包括轻微位移、缩放、阴影降低和描边加深。
- 每次正确点击后检查是否形成新连线。
- 用户形成新横线、竖线或斜线后，点击 `Bingo` 可领取新连线奖励。
- 如果没有新连线，点击 `Bingo` 不改变分数，短暂显示 `Not yet`。
- 同一条线只能领取一次。
- 当某条未领取连线只差 1 格时，高亮该目标格，提示用户接近 Bingo。
- Bingo 成功后，已领取连线格变成金色/星标状态。
- 最后 10 秒进入冲刺状态，强化倒计时视觉，但不遮挡棋盘。

## 4. 计分模型

### 4.1 正确点击得分

```text
baseClickScore = 20
speedBonus = max(0, round(50 - clickElapsedSeconds * 8))
comboBonus = min(combo * 3, 30)
clickScore = baseClickScore + speedBonus + comboBonus
if feverActive:
  clickScore = round(clickScore * 1.5)
```

### 4.2 Bingo 得分

```text
baseBingoScore = 120
bingoSpeedBonus = max(0, round(80 - lineReadyElapsedSeconds * 10))
bingoCountBonus = currentBingoNumber * 30
bingoScore = baseBingoScore + bingoSpeedBonus + bingoCountBonus
if feverActive:
  bingoScore = round(bingoScore * 1.25)
```

### 4.3 Combo / Fever

- 每次正确点击后 Combo +1。
- 最大 Combo 记录在结算页。
- 每次正确点击增加 Fever 能量。
- Fever 能量达到 100% 后进入 Fever 状态，持续约 9 秒。
- Fever 期间正确点击得分乘以 1.5，Bingo 得分乘以 1.25。
- Fever 状态栏在普通状态显示 `FEVER x1.0` 与充能百分比，在激活状态显示 `FEVER x1.5` 与剩余秒数。
- Fever 是第一版唯一额外得分机制，不做道具、万能点格或选择弹层。
- Fever 结束后回到普通状态。

## 5. UI 与反馈规范

- 棋盘格使用圆形按钮，不再使用方形卡片；长词最多两行，避免撑开布局。
- 棋盘词卡区域整体保持 1:1 正方形，页面结构保持上方信息区、中下部词卡区、底部 Fever 和 Bingo 操作区的紧凑分层。
- 棋盘格默认隐藏英文释义；释义显示仅作为演示状态，可由手机屏幕外的演示开关控制。
- 全局动态文本优先通过缩小字号适配容器，避免因单词长短换行或撑高模块；叫词卡主词、释义、recent chips、词卡主词和反馈器文本都应遵循该规则。
- 棋盘格按压反馈以轻量位移、缩放和阴影变化为主，避免 background/border 等高频绘制导致回弹显慢或卡顿。
- 正确点击和 Combo 反馈统一出现在屏幕中心。
- 正确点击、Combo 和 Bingo 反馈使用固定粒子池，避免每次反馈时创建大量 DOM 造成卡顿。
- 反馈器外部使用 3 层黄色光圈，由浅到深并贴合中心反馈器向外扩散；不要使用容易渲染成条状遮罩的彩色 conic 星芒。
- 正确点击和 Bingo 成功需要音效反馈；Bingo 成功时需要轻微屏幕震感。
- 结算面板底部按钮放在面板内，使用左右并排结构。

## 6. 单词内容

第一版使用 Section 1 / Unit 1 风格的基础西语词汇：

```text
hola, adios, gracias, por favor, buenos dias, buenas noches,
si, no, perdon, agua, cafe, pan, amigo, familia, casa,
escuela, calle, tienda, mesa, libro, rapido, lento, hoy, manana
```

## 7. 验收标准

- 打开 `Pinu_game/index.html` 可直接运行。
- 从入口点击 `PLAY` 后开始倒计时并叫词。
- 点击正确单词加分，点击错误或未叫词单词无响应。
- 系统叫词后，最近叫词队列正确更新。
- 棋盘格为圆形按钮，按压时有下沉反馈。
- 棋盘词卡区域为 1:1 正方形，且上方信息区、词卡区、底部操作区层次清楚。
- 棋盘格默认不显示释义，手机屏幕外的演示开关可切换释义显示/隐藏。
- 叫词卡不会因长单词换行而改变模块高度，动态文本优先缩小字号适配。
- 差一格 Bingo 时目标格高亮。
- 达成横线、竖线或斜线后点击 `Bingo` 加分。
- 达成新线后点击 `Bingo`，连线格变金色/星标。
- 无新连线点击 `Bingo` 不改变分数，只显示 `Not yet`。
- Fever 达成后进入限时状态，正确点击和 Bingo 得分加成。
- Fever 状态栏常态展示倍率和充能百分比，激活后展示倍率和剩余秒数。
- 正确点击、Combo 和 Bingo 中心反馈具有 3 层黄色光圈、粒子效果，且不出现明显卡顿。
- 正确点击和 Bingo 成功有音效；Bingo 成功有轻微屏幕震感。
- 时间结束或词库结束后展示结算弹层。
- 结算页展示总分、正确词数、Bingo 次数、最大 Combo、Fever、单词得分、Bingo 得分和 Fever 额外得分。
- 414x900 手机视口下无文字溢出、核心按钮遮挡或布局重叠。
- UI 保持 Pinu 的浅蓝、圆润、厚重阴影风格，避免完全照搬紫色 Bingo 竞品。
