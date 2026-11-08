/** Two collections of thematic challenges. Every game is available to everyone.
 * These twenty themes share five underlying interaction modes, not twenty engines.
 */
export const gameCollections = [
  {id:'explore', name:'冒险运动', subtitle:'追逐、探索与挑战', description:'从星际赛道到水果岛，让手指在探险中练习。'},
  {id:'create', name:'创意生活', subtitle:'创造、照料与发现', description:'到花园、森林和音乐舞台，用键盘完成温暖任务。'}
];

export const arcadeGames = [
  {id:'comet-race',collection:'explore',name:'流星赛车',icon:'🏎️',scene:'race',description:'让赛车沿着星光赛道冲向终点。',action:'正确输入，赛车向前；错了可以继续。',backdrop:'sunset'},
  {id:'watermelon-slice',collection:'explore',name:'西瓜切切乐',icon:'🍉',scene:'slice',description:'认出水果上的字符，一起完成果盘。',action:'输入目标字符，切开一个水果。',backdrop:'fruit'},
  {id:'star-target',collection:'explore',name:'星光射击',icon:'🎯',scene:'target',description:'瞄准温柔的星光靶，收集天空能量。',action:'输入对应字符，点亮目标。',backdrop:'space'},
  {id:'cloud-run',collection:'explore',name:'云端冲刺',icon:'☁️',scene:'race',description:'跟着云朵穿过天空跑道。',action:'每次正确输入，向前走一步。',backdrop:'sky'},
  {id:'orange-slice',collection:'explore',name:'橘子果园',icon:'🍊',scene:'slice',description:'在果园里认识字符，收集新鲜水果。',action:'输入目标字符，切开水果。',backdrop:'fruit'},
  {id:'balloon-pop',collection:'explore',name:'彩虹气球',icon:'🎈',scene:'target',description:'找到气球上的字母、数字或符号。',action:'输入对应字符，点亮目标。',backdrop:'sky'},
  {id:'moon-tower',collection:'explore',name:'月球基地',icon:'🚀',scene:'build',description:'送出建筑材料，搭建月球小基地。',action:'每次正确输入，放上一块材料。',backdrop:'space'},
  {id:'treasure-memory',collection:'explore',name:'宝藏密码',icon:'🗝️',scene:'memory',description:'记住短暂出现的字符，打开宝箱。',action:'字符显示 2.5 秒后隐藏，再输入它。',previewMs:2500,backdrop:'forest'},
  {id:'ocean-race',collection:'explore',name:'海洋快艇',icon:'⛵',scene:'race',description:'沿着蓝色航道，驾驶快艇前行。',action:'每次正确输入，快艇向前。',backdrop:'ocean'},
  {id:'island-memory',collection:'explore',name:'小岛寻迹',icon:'🧭',scene:'memory',description:'记住路标上的字符，找到小岛的路。',action:'字符显示 2.5 秒后隐藏，再输入它。',previewMs:2500,backdrop:'forest'},
  {id:'forest-friends',collection:'create',name:'森林朋友',icon:'🦊',scene:'target',description:'找到对应的字符，为森林朋友点亮路标。',action:'输入对应字符，点亮目标。',backdrop:'forest'},
  {id:'spring-garden',collection:'create',name:'春日花园',icon:'🌷',scene:'build',description:'用正确的输入，为花园搭起温暖的小屋。',action:'每次正确输入，添加一份建筑材料。',backdrop:'garden'},
  {id:'music-stage',collection:'create',name:'音乐舞台',icon:'🎵',scene:'target',description:'找到音符上的字符，点亮音乐舞台。',action:'输入对应字符，点亮目标。',backdrop:'sky'},
  {id:'berry-kitchen',collection:'create',name:'莓果厨房',icon:'🍓',scene:'slice',description:'练习字符，为甜点准备水果。',action:'输入目标字符，切开水果。',backdrop:'fruit'},
  {id:'dream-house',collection:'create',name:'梦想小屋',icon:'🏡',scene:'build',description:'收集材料，慢慢搭建自己的小屋。',action:'每次正确输入，放上一块材料。',backdrop:'garden'},
  {id:'pet-delivery',collection:'create',name:'宠物邮局',icon:'🐶',scene:'race',description:'帮助邮差沿着小路送出礼物。',action:'每次正确输入，邮差前进一步。',backdrop:'forest'},
  {id:'rainbow-puzzle',collection:'create',name:'彩虹拼图',icon:'🧩',scene:'memory',description:'先记住字符，再完成彩虹拼图。',action:'字符显示 2.5 秒后隐藏，再输入它。',previewMs:2500,backdrop:'sky'},
  {id:'shell-collection',collection:'create',name:'海贝收藏',icon:'🐚',scene:'memory',description:'记住海贝上的字符，再把它找回来。',action:'字符显示 2.5 秒后隐藏，再输入它。',previewMs:2500,backdrop:'ocean'},
  {id:'lantern-workshop',collection:'create',name:'灯笼工坊',icon:'🏮',scene:'build',description:'把材料组合起来，点亮节日灯笼。',action:'每次正确输入，添加一份材料。',backdrop:'sunset'},
  {id:'picnic-basket',collection:'create',name:'野餐果篮',icon:'🍇',scene:'slice',description:'认识果篮上的字符，准备一场野餐。',action:'输入目标字符，切开水果。',backdrop:'garden'}
];
export function getArcadeGame(id){return arcadeGames.find(game=>game.id===id)}
