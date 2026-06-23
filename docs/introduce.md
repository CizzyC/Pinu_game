# Bingo Challenge Introduce

## 游戏定位

`Bingo Challenge` 是 Pinu 内的轻量单词听辨小游戏。它把传统 Bingo 的“听到目标、在卡片上标记、连成线后喊 Bingo”改造成语言学习玩法，用来强化用户对 Section 1 / Unit 1 基础西语词汇的听辨和快速反应。

## 为什么适合 Pinu

Pinu 当前核心体验围绕真实生活句子、口语练习、即时反馈和游戏化学习路径。Bingo Challenge 适合作为主线学习之外的每日挑战，因为它：

- 使用用户已经见过或即将学习的基础词汇，降低理解门槛。
- 通过系统叫词和点击反馈训练听辨，而不是纯背单词。
- 用连线、Combo、Fever 和结算总分提供短局刺激。
- 可以承接 Daily Challenge、任务、XP、Coins、排行榜或活动入口。

## 第一版目标

- 做一个可直接打开的 HTML demo，用于验证玩法和界面方向。
- 模拟 Pinu 首页/任务入口进入 Bingo Challenge。
- 完成完整一局：开始、叫词、点词、Bingo、倒计时、结算。
- 视觉语言贴近 Pinu：浅蓝背景、圆润卡片、厚重按钮阴影、清晰移动端布局。

## 记忆点

- 游戏正式名：`Bingo Challenge`。
- 中心格固定为 `PINU / free`，默认已选中。
- 正确点击只响应已被系统叫出的单词。
- 错误点击、重复点击、无新连线点击 Bingo 都不扣分，也不弹错误提示。
- 得分来自正确点击时间、Bingo 反应时间、Bingo 次数、Combo 和 Fever。
- 旧目录 `bingo-game-demo/` 只作为历史参考，不作为规范来源。

## 后续可扩展方向

- 接入真实课程词库，让不同 Unit 生成不同单词卡。
- 将结算奖励接入 XP、Coins、Daily Quest 或排行榜。
- 增加真实语音资源，替代浏览器 SpeechSynthesis。
- 增加新手教学弹层，解释横线、竖线、斜线和中心 free 格。
- 增加活动主题皮肤，但不能偏离 Pinu 的清爽学习风格。
