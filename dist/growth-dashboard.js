const routes = {
  'key-press': '键位挑战',
  keyboard: '键盘打字',
  pinyin: '拼音输入',
  wubi: '五笔入门',
  story: '故事冒险'
};
const dateLabel = new Intl.DateTimeFormat('zh-CN', {month: 'numeric', day: 'numeric'});
const timeLabel = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
});
const trendLimit = 10;

function create(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

const isPercent = value => Number.isFinite(value) && value >= 0 && value <= 100;
const routeFor = record => record.metric === 'key-press' ? 'key-press' : record.route;

function renderActivity(container, entries) {
  const totals = new Map();
  for (const {date} of entries) {
    const day = date.toDateString();
    totals.set(day, (totals.get(day) || 0) + 1);
  }
  const today = new Date();
  const week = Array.from({length: 7}, (_, index) => {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6 + index);
    return {day, count: totals.get(day.toDateString()) || 0};
  });
  const max = Math.max(1, ...week.map(({count}) => count));
  container.querySelector('.growth-week-total').textContent = week.reduce((sum, {count}) => sum + count, 0);
  container.querySelector('.growth-active-days').textContent = `${week.filter(({count}) => count > 0).length} 天有练习`;
  const bars = container.querySelector('.growth-bars');
  for (const {day, count} of week) {
    const column = create('div', 'growth-day');
    const track = create('div', 'growth-bar-track');
    const fill = create('div', 'growth-bar-fill');
    fill.style.setProperty('--growth-bar-height', `${100 * count / max}%`);
    track.append(fill);
    column.append(create('strong', '', String(count)), track, create('span', '', dateLabel.format(day)));
    bars.append(column);
  }
}

function plotLine(svg, points, className) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  let drawing = false;
  const commands = points.map(({x, y}) => {
    if (y === null) { drawing = false; return ''; }
    const command = `${drawing ? 'L' : 'M'} ${x} ${y}`;
    drawing = true;
    return command;
  });
  path.setAttribute('d', commands.join(' '));
  path.setAttribute('class', className);
  path.setAttribute('vector-effect', 'non-scaling-stroke');
  svg.append(path);
}

function renderTrend(container, entries, selectedRoute, mostRecent) {
  const metric = selectedRoute === 'key-press' ? '按键正确率' : '文字准确率';
  container.replaceChildren();
  if (!entries.length) {
    const empty = create('div', 'growth-empty');
    const button = create('button', 'outline', '去练习地图');
    button.type = 'button';
    button.dataset.go = 'courses';
    empty.append(create('span', 'growth-empty-star', '✧'), create('strong', '', '这条路线还没有成绩'),
      create('p', '', '完成一次练习，第一颗星就会出现在这里。'), button);
    container.append(empty);
    return;
  }

  const latest = entries.at(-1).record;
  const header = create('div', 'growth-trend-header');
  const score = create('div', 'growth-latest');
  score.append(create('strong', '', `${latest.accuracy}%`), create('span', '', `${mostRecent ? '最近一次' : '区间最后一次'}${metric}`));
  header.append(score);
  const previous = entries.at(-2)?.record;
  if (previous) {
    const delta = latest.accuracy - previous.accuracy;
    const difference = delta === 0 ? '与上次持平' : `较上次 ${delta > 0 ? '+' : '−'}${Math.abs(delta).toFixed(0)} 个百分点`;
    header.append(create('span', `growth-delta ${delta > 0 ? 'growth-delta-up' : ''}`, difference));
  } else {
    header.append(create('span', 'growth-delta', '第一站'));
  }
  container.append(header);

  const chart = create('div', 'growth-chart');
  const axis = create('div', 'growth-axis');
  axis.setAttribute('aria-hidden', 'true');
  for (const value of [100, 75, 50, 25, 0]) axis.append(create('span', '', `${value}%`));
  const plot = create('div', 'growth-plot');
  plot.setAttribute('role', 'group');
  plot.setAttribute('aria-label', `${metric}趋势，选择一个数据点查看成绩`);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  const points = entries.map(({record}, index) => ({
    x: entries.length === 1 ? 50 : 4 + (92 * index / (entries.length - 1)),
    y: 100 - record.accuracy
  }));
  plotLine(svg, points, 'growth-accuracy-line');
  const completionPoints = entries.map(({record}, index) => ({
    x: points[index].x,
    y: selectedRoute === 'key-press' && isPercent(record.completion) ? 100 - record.completion : null
  }));
  const hasCompletionLine = completionPoints.some((point, index) => point.y !== null && index > 0 && completionPoints[index - 1].y !== null);
  if (hasCompletionLine) plotLine(svg, completionPoints, 'growth-completion-line');
  plot.append(svg);
  chart.append(axis, plot);
  container.append(chart);

  const dates = create('div', 'growth-chart-dates');
  const firstDate = dateLabel.format(entries[0].date);
  const lastDate = dateLabel.format(entries.at(-1).date);
  dates.append(create('span', '', firstDate), create('span', '', `${entries.length} 次练习`));
  if (firstDate !== lastDate) dates.append(create('span', '', lastDate));
  const legend = create('div', 'growth-legend');
  legend.append(create('span', 'growth-legend-accuracy', metric));
  if (hasCompletionLine) legend.append(create('span', 'growth-legend-completion', '目标键完成率'));
  const detail = create('div', 'growth-detail');
  detail.setAttribute('aria-live', 'polite');
  const buttons = points.map(({x, y}, index) => {
    const {record, date} = entries[index];
    const button = create('button', 'growth-point');
    button.type = 'button';
    button.setAttribute('aria-label', `第 ${index + 1} 个数据点，${dateLabel.format(date)}，${metric} ${record.accuracy}%`);
    button.style.left = `${x}%`;
    button.style.top = `${y}%`;
    button.addEventListener('click', () => selectPoint(index));
    button.addEventListener('focus', () => selectPoint(index));
    plot.append(button);
    return button;
  });
  function selectPoint(index) {
    buttons.forEach((button, position) => button.setAttribute('aria-pressed', String(index === position)));
    const {record, date} = entries[index];
    const measures = [`${metric} ${record.accuracy}%`];
    if (selectedRoute === 'key-press') {
      if (isPercent(record.completion)) measures.push(`完成率 ${record.completion}%`);
      if (Number.isInteger(record.timedOut) && record.timedOut >= 0) measures.push(`超时 ${record.timedOut} 题`);
    } else if (Number.isFinite(record.speed) && record.speed >= 0) {
      measures.push(`${record.speed} 字符/分钟`);
    }
    detail.replaceChildren(create('strong', '', typeof record.title === 'string' && record.title ? record.title : '练习成绩'),
      create('time', '', timeLabel.format(date)), create('span', '', measures.join(' · ')));
  }
  selectPoint(entries.length - 1);
  container.append(dates, legend, detail);
}

export function renderGrowthDashboard(container, records) {
  const entries = records.flatMap(record => {
    if (!record || typeof record.date !== 'string') return [];
    const date = new Date(record.date);
    return Number.isFinite(date.getTime()) ? [{record, date}] : [];
  }).sort((a, b) => a.date - b.date);
  const selected = container.querySelector('#growth-route')?.value;
  const latestRoute = routeFor(entries.at(-1)?.record || {});
  container.innerHTML = `
    <div class="growth-grid">
      <section class="growth-card growth-trend" aria-labelledby="growth-trend-title">
        <div class="growth-card-heading">
          <div><h2 id="growth-trend-title">练习趋势</h2><p>选一个点，看看那次练习。</p></div>
          <div class="growth-filters">
            <label>练习路线<select id="growth-route"></select></label>
            <label hidden>成绩区间<select id="growth-range"></select></label>
          </div>
        </div>
        <div class="growth-trend-content"></div>
      </section>
      <section class="growth-card growth-activity" aria-labelledby="growth-activity-title">
        <h2 id="growth-activity-title">近 7 天练习</h2>
        <p>每天完成的练习次数</p>
        <div class="growth-week"><div><strong class="growth-week-total"></strong> 次</div><span class="growth-active-days"></span></div>
        <div class="growth-bars"></div>
        <p class="growth-saved">本机已保存 <strong>${entries.length}</strong> 次练习</p>
      </section>
    </div>`;
  const select = container.querySelector('#growth-route');
  for (const [value, label] of Object.entries(routes)) {
    const option = create('option', '', label);
    option.value = value;
    select.append(option);
  }
  select.value = selected || (Object.hasOwn(routes, latestRoute) ? latestRoute : 'key-press');
  const range = container.querySelector('#growth-range');
  const trend = container.querySelector('.growth-trend-content');
  let routeEntries;
  function updateTrend() {
    const offset = Number(range.value) * trendLimit;
    const end = routeEntries.length - offset;
    renderTrend(trend, routeEntries.slice(Math.max(0, end - trendLimit), end), select.value, offset === 0);
  }
  function updateRoute() {
    routeEntries = entries.filter(entry => routeFor(entry.record) === select.value && isPercent(entry.record.accuracy));
    range.replaceChildren();
    for (let offset = 0; offset < routeEntries.length; offset += trendLimit) {
      const oldest = routeEntries[Math.max(0, routeEntries.length - offset - trendLimit)].date;
      const newest = routeEntries[routeEntries.length - offset - 1].date;
      const label = offset === 0 ? '最近 10 次' : `${dateLabel.format(oldest)}–${dateLabel.format(newest)} · 往前 ${offset} 次`;
      const option = create('option', '', label);
      option.value = String(offset / trendLimit);
      range.append(option);
    }
    range.closest('label').hidden = routeEntries.length <= trendLimit;
    updateTrend();
  }
  select.addEventListener('change', updateRoute);
  range.addEventListener('change', updateTrend);
  updateRoute();
  renderActivity(container, entries);
}
