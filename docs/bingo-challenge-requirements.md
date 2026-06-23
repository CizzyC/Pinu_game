# Bingo Challenge Requirements

## 1. 概述

`Bingo Challenge` 是 Pinu 的单词 Bingo 小游戏。系统在限定时间内依次叫出单词，用户在 5x5 单词卡上点击对应单词。正确点击得分，连成横线、竖线或斜线后点击 `Bingo` 获得额外加分。

第一版以单文件 HTML demo 验证玩法，不接入后端、不保存真实账户数据、不修改旧 `bingo-game-demo/`。

## 2. 页面流程

### 2.1 入口

- 页面打开后展示 Pinu 风格的移动端首页/任务入口。
- 首页入口卡片显示：
  - `DAILY CHALLENGE`
  - `Bingo Challenge`
  - 当前最佳分数或奖励提示
  - `PLAY` 按钮
- 点击入口后进入游戏局内页并开始计时。

### 2.2 局内

- 顶部展示返回、标题、重开按钮。
- 计分区展示：
  - 剩余时间
  - 当前分数
  - 已领取 Bingo 数量
- 叫词区展示：
  - 当前叫出的西语单词
  - 英文释义
  - 最近 4-5 个已叫单词
  - 当前叫词进度
  - Combo 与 Fever 状态
- 棋盘区展示：
  - 5 列 B/I/N/G/O 标签
  - 5x5 单词卡
  - 中心格 `PINU / free`
  - Bingo 进度提示
  - `Bingo` 按钮

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
- Fever 是第一版唯一额外得分机制，不做道具、万能点格或选择弹层。
- Fever 结束后回到普通状态。

## 5. 单词内容

第一版使用 Section 1 / Unit 1 风格的基础西语词汇：

```text
hola, adios, gracias, por favor, buenos dias, buenas noches,
si, no, perdon, agua, cafe, pan, amigo, familia, casa,
escuela, calle, tienda, mesa, libro, rapido, lento, hoy, manana
```

## 6. 验收标准

- 打开 `Pinu_game/index.html` 可直接运行。
- 从入口点击 `PLAY` 后开始倒计时并叫词。
- 点击正确单词加分，点击错误或未叫词单词无响应。
- 系统叫词后，最近叫词队列正确更新。
- 差一格 Bingo 时目标格高亮。
- 达成横线、竖线或斜线后点击 `Bingo` 加分。
- 达成新线后点击 `Bingo`，连线格变金色/星标。
- 无新连线点击 `Bingo` 不改变分数，只显示 `Not yet`。
- Fever 达成后进入限时状态，正确点击和 Bingo 得分加成。
- 时间结束或词库结束后展示结算弹层。
- 结算页展示总分、正确词数、Bingo 次数、最大 Combo、Fever、单词得分、Bingo 得分和 Fever 额外得分。
- 414x900 手机视口下无文字溢出、核心按钮遮挡或布局重叠。
- UI 保持 Pinu 的浅蓝、圆润、厚重阴影风格，避免完全照搬紫色 Bingo 竞品。
