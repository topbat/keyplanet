// Local, deterministic coaching pipeline. No network, model, or persistent storage.
const ROUTES = Object.freeze({keyboard:'键盘基础',pinyin:'拼音输入',wubi:'五笔入门'});
const METRICS = Object.freeze({'key-press':'按键正确率','final-text':'最终文本准确率'});
const mean = values => Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

function observe(records) {
  return (Array.isArray(records) ? records : [])
    .filter(item => item && Object.hasOwn(ROUTES, item.route) && (item.metric == null || Object.hasOwn(METRICS, item.metric)) && typeof item.accuracy === 'number' && Number.isFinite(item.accuracy) && item.accuracy >= 0 && item.accuracy <= 100)
    .slice(0, 200)
    .map(item => ({route:item.route, metric:item.metric ?? 'final-text', accuracy:item.accuracy, mistakes:item.mistakes,
      completion:typeof item.completion === 'number' && Number.isFinite(item.completion) && item.completion >= 0 && item.completion <= 100 ? item.completion : null,
      timedOut:Number.isSafeInteger(item.timedOut) && item.timedOut >= 0 ? item.timedOut : null}));
}

function collectKeys(records) {
  const counts = Object.create(null);
  for (const record of records.slice(0, 5)) {
    if (!record.mistakes || typeof record.mistakes !== 'object' || Array.isArray(record.mistakes)) continue;
    for (const [key, count] of Object.entries(record.mistakes)) {
      if (!/^[a-z]$/i.test(key) || typeof count !== 'number' || !Number.isFinite(count) || count <= 0) continue;
      const letter = key.toUpperCase();
      counts[letter] = (counts[letter] || 0) + Math.min(Math.floor(count), 100);
    }
  }
  return Object.entries(counts).sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || null;
}

export function getCoachFeedback(input) {
  const records = observe(input);
  const mode = '本地规则反馈（未接入 AI 模型）';
  if (!records.length) return {
    mode, dataPoints:0,
    observation:'还没有可分析的练习记录。',
    memory:'完成练习后，我会根据保存在本机的成绩观察变化。',
    feedback:'先从认识键盘开始吧，慢慢来就好！',
    recommendation:{route:'keyboard',text:'从键盘基础开始练习'}
  };

  // Compare only the latest route and metric, never unlike routes or measures.
  const route = records[0].route;
  const metric = records[0].metric;
  const all = records.filter(item => item.route === route && item.metric === metric);
  const focus = {route, all, recent:all.slice(0,3), average:mean(all.slice(0,3).map(item => item.accuracy))};
  const metricLabel = METRICS[metric];
  let observation = `最近 ${focus.recent.length} 次${ROUTES[focus.route]}练习的平均${metricLabel}为 ${focus.average}%。`;
  const latest = records[0];
  if (metric === 'key-press' && latest.completion !== null) {
    observation += `最近一次目标键完成率为 ${latest.completion}%${latest.timedOut !== null ? `，超时 ${latest.timedOut} 题` : ''}。`;
  }
  let memory = `本机共有 ${records.length} 次可分析的练习；继续积累后可以观察变化。`;
  if (focus.all.length >= 4) {
    const recent = mean(focus.all.slice(0,2).map(item => item.accuracy));
    const older = mean(focus.all.slice(2,4).map(item => item.accuracy));
    const delta = recent - older;
    memory = delta > 0 ? `与之前两次${ROUTES[focus.route]}练习相比，最近两次平均${metricLabel}提高了 ${delta} 个百分点。` :
      delta < 0 ? `与之前两次${ROUTES[focus.route]}练习相比，最近两次平均${metricLabel}下降了 ${Math.abs(delta)} 个百分点，休息后再试试。` :
      `与之前两次${ROUTES[focus.route]}练习相比，最近两次平均${metricLabel}保持稳定。`;
  }
  const key = focus.route === 'keyboard' ? collectKeys(records.filter(item => item.route === 'keyboard')) : null;
  const lowCompletion = metric === 'key-press' && latest.completion !== null && latest.completion < 80;
  const feedback = lowCompletion ? `这次完成率还不高${latest.timedOut ? '，有些题目超时了' : ''}。可以先用无计时练习熟悉键位，再试一次。` :
    key ? `观察到 ${key} 键近期出错较多，可以放慢节奏，再找一找这个键的位置。` :
    focus.average < 80 ? '先放慢节奏，留意每次输入是否正确；不用急着追求速度。' :
    focus.average < 95 ? '做得不错！继续保持节奏，留意容易出错的地方。' : '你已经很认真了！保持准确，也可以尝试另一条练习路线。';
  return {mode, observation, memory, feedback, dataPoints:records.length,
    recommendation:{route:focus.route,text:`再练一练${ROUTES[focus.route]}`}};
}
