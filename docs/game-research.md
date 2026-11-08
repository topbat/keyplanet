# 儿童游戏机制调研与原型说明

日期：2026-11-08

## 调研边界

以下资料用于理解可参考的玩法和主题。它们不是中国儿童的代表性调查，不支持断言“某个性别一定喜欢某种玩法”，也不足以排出中国 6–15 岁儿童最喜欢的 20 款游戏。本项目的 20 个条目是两组原创主题入口，全部可自由选择，底层共用五类互动机制；不宣称已实现 20 个相互独立的游戏引擎。

## 研究观察

1. 英国 Ofcom 在 2025 年报告中，调查的 3–12 岁游戏玩家常玩创意建造（46%）、拼图或问答（36%）、动作冒险（32%）。报告展示的男女数据存在重叠，两组都有较多人玩创意建造。地区、年龄和调查时间均不同于本项目用户，不能直接推导中国儿童的偏好。来源：[Ofcom 2025 儿童媒体素养报告](https://www.ofcom.org.uk/siteassets/resources/documents/research-and-data/media-literacy-research/children/childrens-media-use-and-attitudes-report-2025/childrens-media-literacy-report-2025.pdf?v=396621)，第 30 页。
2. Ofcom 2025–26 年报告指出，所调查儿童中创意建造、益智问答较常见；不同性别群体的玩法分布有所不同，但这种总体差异不能决定某个孩子的兴趣。来源：[Ofcom 2025–26 儿童与家长媒体使用报告](https://www.ofcom.org.uk/siteassets/resources/documents/research-and-data/media-literacy-research/children/2026-children-and-parents-report/children-and-parents-media-use-and-attitudes-report-2025-6.pdf?v=418231)，第 18 页。
3. PBS KIDS 的儿童教育游戏示例包括动物照料、动物救援、植物种植、四季观察以及探索和搭建；其中一组明确面向 6–8 岁。来源：[PBS KIDS：科学与工程游戏](https://www.pbs.org/parents/thrive/pbs-kids-games-for-learning-science-and-engineering)。这证明此类主题被用于儿童教育，并不证明它们在目标人群中排名靠前。
4. 任天堂对《集合啦！动物森友会》的介绍包含按自己的节奏种植、收集和装饰；Minecraft 官方介绍创造模式可以自由搭建。作为生活模拟与建造类玩法参考，不复制游戏角色、美术或关卡。来源：[任天堂岛屿介绍](https://animalcrossing.nintendo.com/new-horizons/explore/)、[Minecraft 游戏模式说明](https://help.minecraft.net/hc/en-us/articles/360058743992-Minecraft-Differences-Between-Creative-Survival)。
5. PBS KIDS 列有乐器探索和节奏类儿童互动游戏，说明音乐是可考虑的互动主题。当前原型的“音乐舞台”为字符目标互动，不等于节拍游戏。来源：[PBS KIDS 音乐活动](https://www.pbs.org/parents/music)。

## 原型设计原则

- 使用“冒险运动”和“创意生活”两组主题，每组十项，所有孩子均可选择；兴趣不应由性别预设。
- 用赛车推进、切水果、非暴力目标、搭建、短时记忆五类机制搭配不同场景。各主题只在已有交互能力内描述，避免将换场景宣传为全新玩法。
- 记忆场景：目标字符显示 2.5 秒后隐藏，再等待玩家输入；建议为较年幼者后续增加显示时间和重看设置。
- 字母、数字、符号和 Shift 组合等技能可在游戏中按学习进度提供，练习需提示使用英文输入法及常见键盘布局。
- 考核应分别说明准确率、完成率、超时与用时；允许练习模式降低压力。视觉动态和声音应可关闭，任务结束后有清楚、适龄的鼓励。
- 题目和奖励应避免诱导无限时长和以消费换优势；涉及未成年人的社交和 AI 服务须在后续设计中单独评估。
