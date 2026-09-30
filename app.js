/* EasyTrip: local-first travel planner. Public map services are proxied by server.py. */
const SERVICES = Object.freeze({ tiles: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', search: '/api/search', reverse: '/api/reverse', route: '/api/route' });
const STORAGE_KEY = 'easytrip-projects-v3';
const LEGACY_KEY = 'manyou-kyoto-trip-v2';
const ICONS = Object.freeze({
  landmark: { label: '地标', path: '<path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-7h6v7M9 9h.01M15 9h.01"/>' },
  food: { label: '餐饮', path: '<path d="M4 3v7a3 3 0 0 0 6 0V3M7 3v18M17 3v18M17 3c2 2 3 4 3 7h-3"/>' },
  coffee: { label: '咖啡', path: '<path d="M4 8h13v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8ZM17 10h2a2 2 0 1 1 0 4h-2M7 3v2M11 3v2M15 3v2"/>' },
  bed: { label: '住宿', path: '<path d="M3 19V5M3 15h18v4M3 11h18v4M7 11V8a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3"/>' },
  museum: { label: '博物馆', path: '<path d="M3 10h18M4 10l8-6 8 6M5 20h14M7 10v10M12 10v10M17 10v10"/>' },
  mountain: { label: '山野', path: '<path d="m2 20 7-12 4 6 3-4 6 10H2Z"/>' },
  camera: { label: '拍照', path: '<path d="M3 7h4l2-3h6l2 3h4v13H3V7ZM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/>' },
  shopping: { label: '购物', path: '<path d="M4 8h16l-1 13H5L4 8ZM8 9V6a4 4 0 0 1 8 0v3"/>' },
  train: { label: '交通', path: '<path d="M5 17V5c0-2 2-3 7-3s7 1 7 3v12H5ZM5 12h14M8 21l2-4M16 17l2 4M8 7h8"/>' },
  park: { label: '公园', path: '<path d="M12 3c-4 0-6 3-6 6-2 1-3 3-3 5a5 5 0 0 0 6 5h6a5 5 0 0 0 6-5c0-2-1-4-3-5 0-3-2-6-6-6ZM12 14v8M8 17l4 2 4-2"/>' },
  beach: { label: '海滩', path: '<path d="M2 20c3-2 5-2 8 0s5 2 8 0 4-2 4-2M3 15a9 9 0 0 1 18 0M12 6V3M4 6 2 4M20 6l2-2"/>' },
  star: { label: '收藏', path: '<path d="m12 2 3 6 7 .9-5 5 .9 7.1-5.9-3.2L6.1 21 7 13.9l-5-5L9 8l3-6Z"/>' }
});
const BASE_TAGS = Object.freeze([
  { id: 'spot', label: '景点', color: '#bf7b4e', icon: 'landmark' },
  { id: 'food', label: '餐厅', color: '#d46c5d', icon: 'food' },
  { id: 'coffee', label: '咖啡', color: '#a88554', icon: 'coffee' },
  { id: 'hotel', label: '住宿', color: '#8778b2', icon: 'bed' }
]);
const COLORS = ['#4f80bf', '#4f9c84', '#bf7b4e', '#d46c5d', '#8778b2', '#aa739a', '#a88554', '#4b8b9a', '#697b4c', '#444f86'];
const MODES = { pedestrian: '步行', bicycle: '骑行', auto: '驾车' };
const DAY_COLORS = ['#1769cf', '#d46c5d', '#4f9c84', '#a88554', '#8778b2', '#4b8b9a', '#aa739a', '#697b4c'];
const MODE_COLORS = { pedestrian: '#1769cf', bicycle: '#30856f', auto: '#7c69b1' };
const MODE_PATHS = {
  pedestrian: '<circle cx="13" cy="3.5" r="1.5"/><path d="m10 7 3 2-2 4 3 2 1 5M10 7 7 12l3 2-2 6M13 9l4 2 2-1"/>',
  bicycle: '<circle cx="5" cy="17" r="3"/><circle cx="19" cy="17" r="3"/><path d="M5 17 9 9l4 8H5m8 0 5-9h-3m-6 1h4m4 3 2 5"/>',
  auto: '<path d="M4 16 5.5 9h13L20 16M3 16h18v4H3v-4ZM6 20v2m12-2v2M8 9l1-3h6l1 3M7 16h.01M17 16h.01"/>'
};
const DEMO_DAYS = [
  { date: '11月12日', stops: [
    { id: 'sample-1', time: '09:00', name: '清水寺', address: '京都市东山区清水', type: 'spot', lat: 34.994303, lon: 135.7844389 },
    { id: 'sample-2', time: '11:30', name: '八坂塔', address: '法观寺五重塔 · 东山区', type: 'spot', lat: 34.99815, lon: 135.78075 },
    { id: 'sample-3', time: '13:00', name: '锦市场', address: '京都市中京区锦小路通', type: 'food', lat: 35.0049, lon: 135.7646 },
    { id: 'sample-4', time: '16:00', name: '八坂神社', address: '京都市东山区祇园町', type: 'spot', lat: 35.00364, lon: 135.77851 }
  ] },
  { date: '11月13日', stops: [
    { id: 'sample-5', time: '09:30', name: '伏见稻荷大社', address: '京都市伏见区深草薮之内町', type: 'spot', lat: 34.9671, lon: 135.7727 },
    { id: 'sample-6', time: '13:30', name: '东福寺', address: '京都市东山区本町', type: 'spot', lat: 34.9771, lon: 135.7744 }
  ] },
  { date: '11月14日', stops: [
    { id: 'sample-7', time: '09:30', name: '岚山竹林小径', address: '京都市右京区嵯峨小仓山', type: 'spot', lat: 35.0168, lon: 135.6713 },
    { id: 'sample-8', time: '12:30', name: '天龙寺', address: '京都市右京区嵯峨天龙寺芒之马场町', type: 'spot', lat: 35.015, lon: 135.6738 },
    { id: 'sample-9', time: '15:00', name: '渡月桥', address: '京都市右京区嵯峨中之岛町', type: 'spot', lat: 35.0128, lon: 135.6776 }
  ] },
  { date: '11月15日', stops: [
    { id: 'sample-10', time: '10:00', name: '京都御苑', address: '京都市上京区京都御苑', type: 'spot', lat: 35.0205, lon: 135.7627 },
    { id: 'sample-11', time: '13:00', name: '锦市场', address: '京都市中京区锦小路通', type: 'food', lat: 35.0049, lon: 135.7646 }
  ] }
];
const $ = id => document.getElementById(id);
const uid = () => globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const svg = iconId => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[iconId]?.path || ICONS.star.path}</svg>`;
const modeSvg = mode => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${MODE_PATHS[mode] || MODE_PATHS.pedestrian}</svg>`;
const copyTags = () => structuredClone(BASE_TAGS);
const makeDemo = () => ({ id: 'kyoto-demo', name: '京都慢游 · 秋日散步', destination: '京都，日本', days: structuredClone(DEMO_DAYS), tags: copyTags(), mode: 'pedestrian' });
const validStop = stop => stop && typeof stop.name === 'string' && typeof stop.type === 'string' && Number.isFinite(stop.lat) && Number.isFinite(stop.lon) && Math.abs(stop.lat) <= 90 && Math.abs(stop.lon) <= 180;
function loadWorkspace() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved?.projects)) {
      if (!saved.projects.length) return { projects: [], projectId: null };
      const projects = saved.projects.filter(project => project && typeof project.id === 'string' && Array.isArray(project.days) && project.days.length && project.days.every(day => Array.isArray(day.stops) && day.stops.every(validStop)) && Array.isArray(project.tags));
      if (projects.length) return { projects, projectId: projects.some(p => p.id === saved.projectId) ? saved.projectId : projects[0].id };
    }
  } catch { /* Recover from an invalid browser draft. */ }
  const demo = makeDemo();
  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY));
    if (Array.isArray(legacy) && legacy.length && legacy.every(day => Array.isArray(day.stops) && day.stops.every(validStop))) demo.days = legacy;
  } catch { /* No previous draft. */ }
  return { projects: [demo], projectId: demo.id };
}
const workspace = loadWorkspace();
const state = {
  ...workspace, day: 0, visible: new Set(), map: null, markers: [], routeLayer: null, routeAbort: null,
  searchAbort: null, searchTimer: null, searchMatches: [], chosen: null, editingId: null,
  requestId: 0, routeCache: new Map(), searchCache: new Map(), legInfo: [], reverseId: 0,
  selectedIcon: 'star', selectedColor: COLORS[0], editingTagId: null, editingProjectId: null,
  islandPinned: false, islandHover: false
};
const project = () => state.projects.find(p => p.id === state.projectId) || state.projects[0];
const day = () => project().days[state.day];
const tag = type => project().tags.find(item => item.id === type) || BASE_TAGS.find(item => item.id === type) || BASE_TAGS[0];
const legKey = (from, to) => `${from.id}:${to.id}`;
function getLegMode(entry, index) {
  const from = entry.stops[index], to = entry.stops[index + 1];
  if (!from || !to) return 'pedestrian';
  return entry.legModes?.[legKey(from, to)] || 'pedestrian';
}
function pruneLegModes(entry) {
  const keys = new Set(entry.stops.slice(0, -1).map((stop, index) => legKey(stop, entry.stops[index + 1])));
  entry.legModes = Object.fromEntries(Object.entries(entry.legModes || {}).filter(([key]) => keys.has(key)));
}
state.projects.forEach(item => {
  item.days.forEach(entry => {
    entry.legModes ||= {};
    entry.stops.slice(0, -1).forEach((stop, index) => {
      const key = legKey(stop, entry.stops[index + 1]);
      if (!MODES[entry.legModes[key]]) entry.legModes[key] = MODES[item.mode] ? item.mode : 'pedestrian';
    });
  });
});
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ projects: state.projects, projectId: state.projectId })); }
  catch { showToast('浏览器未允许保存，本次修改仍可在当前页面使用'); }
}
function showToast(message) {
  const node = $('toast'); node.textContent = message; node.classList.add('show');
  clearTimeout(showToast.timer); showToast.timer = setTimeout(() => node.classList.remove('show'), 3200);
}
function setMapNotice(message) { $('mapNotice').textContent = message; $('mapNotice').hidden = !message; }
function setRouteStatus(title, detail, error = false) {
  $('routeSummary').classList.toggle('error', error);
  $('routeSummary').querySelector('strong').textContent = title;
  $('routeSummary').querySelector('small').textContent = detail;
}
function openDialog(id) { $(id).hidden = false; $(id).querySelector('input,button')?.focus(); }
function closeDialog(id) {
  $(id).hidden = true;
  if (id === 'placeDialog') { state.chosen = null; state.editingId = null; }
  if (id === 'tagDialog') state.editingTagId = null;
  if (id === 'projectDialog') state.editingProjectId = null;
}
function dateLabel(start, offset) {
  if (!start) return `第 ${offset + 1} 天`;
  const date = new Date(`${start}T12:00:00`);
  if (Number.isNaN(date.getTime())) return `第 ${offset + 1} 天`;
  date.setDate(date.getDate() + offset);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}
function initMap() {
  if (location.protocol === 'file:') return setMapNotice('请运行 python3 server.py，再通过 http://127.0.0.1:8000 打开网页。');
  if (!window.L) return setMapNotice('地图组件未加载，请检查网络后刷新。');
  state.map = L.map('map', { zoomControl: false, preferCanvas: true }).setView([35.004, 135.776], 13);
  L.tileLayer(SERVICES.tiles, { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>' }).addTo(state.map);
  L.control.zoom({ position: 'topright' }).addTo(state.map);
  state.map.on('click', event => chooseMapPoint(event.latlng));
}
function renderHeader() {
  const current = project();
  if (!current) { $('tripTitle').textContent = '规划下一段旅程'; $('tripMeta').textContent = '从创建行程开始，自由安排每一天。'; return; }
  $('tripTitle').textContent = current.name;
  $('tripMeta').textContent = `${current.destination} · ${current.days.length} 天 · 每一段路线都可单独安排出行方式`;
  $('mapSubtitle').textContent = `${current.destination} · 第 ${state.day + 1} 天`;
  $('resetTrip').hidden = current.id !== 'kyoto-demo';
}
function renderProjects() {
  const strip = $('projectStrip'); strip.replaceChildren();
  state.projects.forEach(item => {
    const button = document.createElement('button'); button.type = 'button';
    button.className = `project-chip${item.id === state.projectId ? ' active' : ''}`;
    button.innerHTML = `<span class="project-chip-icon">${svg('star')}</span><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.destination)} · ${item.days.length} 天</small></span>`;
    button.addEventListener('click', () => selectProject(item.id)); strip.appendChild(button);
  });
  const add = document.createElement('button'); add.type = 'button'; add.className = 'project-add'; add.textContent = '＋ 新建行程'; add.addEventListener('click', () => openProjectEditor()); strip.appendChild(add);
}
function renderProjectList() {
  const list = $('projectList'); list.replaceChildren();
  if (!state.projects.length) { list.innerHTML = '<p class="manager-empty">还没有行程，点击下方按钮创建。</p>'; return; }
  state.projects.forEach(item => {
    const row = document.createElement('div'); row.className = 'manager-row';
    row.innerHTML = `<span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.destination)} · ${item.days.length} 天${item.start ? ` · ${escapeHtml(item.start)} 出发` : ''}</small></span><div><button type="button" data-action="select">打开</button><button type="button" data-action="edit">编辑信息</button><button type="button" data-action="delete">删除</button></div>`;
    row.querySelector('[data-action="select"]').addEventListener('click', () => { selectProject(item.id); closeDialog('projectsDialog'); });
    row.querySelector('[data-action="edit"]').addEventListener('click', () => { closeDialog('projectsDialog'); openProjectEditor(item); });
    row.querySelector('[data-action="delete"]').addEventListener('click', () => {
      const stops = item.days.reduce((sum, entry) => sum + entry.stops.length, 0);
      if (!confirm(`删除“${item.name}”？这会移除 ${item.days.length} 天行程及 ${stops} 个地点，且无法在网站内恢复。`)) return;
      const wasCurrent = state.projectId === item.id;
      state.projects = state.projects.filter(p => p.id !== item.id);
      if (wasCurrent) { state.projectId = state.projects[0]?.id || null; state.day = 0; state.visible = new Set(project()?.tags.map(t => t.id) || []); }
      save(); render(); if (wasCurrent) refreshRoute(); renderProjectList();
      if (!state.projects.length) closeDialog('projectsDialog');
      showToast(`已删除“${item.name}”`);
    });
    list.appendChild(row);
  });
}
function renderTagList() {
  const list = $('tagList'); list.replaceChildren();
  project().tags.forEach(item => {
    const used = project().days.reduce((sum, entry) => sum + entry.stops.filter(stop => stop.type === item.id).length, 0);
    const row = document.createElement('div'); row.className = 'manager-row tag-manager-row';
    row.innerHTML = `<span class="tag-manager-name" style="--tag-color:${item.color}"><span class="tag-manager-icon">${svg(item.icon)}</span><span><strong>${escapeHtml(item.label)}</strong><small>${used} 个地点使用</small></span></span><div><button type="button" data-action="edit">修改</button><button type="button" data-action="delete" ${project().tags.length === 1 ? 'disabled' : ''}>删除</button></div>`;
    row.querySelector('[data-action="edit"]').addEventListener('click', () => openTagEditor(item));
    row.querySelector('[data-action="delete"]').addEventListener('click', () => {
      const replacement = project().tags.find(other => other.id !== item.id);
      if (!replacement) return;
      const message = used ? `删除“${item.label}”？使用它的 ${used} 个地点会改为“${replacement.label}”。` : `删除“${item.label}”？`;
      if (!confirm(message)) return;
      project().days.forEach(entry => entry.stops.forEach(stop => { if (stop.type === item.id) stop.type = replacement.id; }));
      project().tags = project().tags.filter(other => other.id !== item.id);
      state.visible.delete(item.id); state.visible.add(replacement.id);
      save(); render(); renderTagList(); showToast('标签已删除');
    });
    list.appendChild(row);
  });
}
function renderDayList() {
  const list = $('dayList'); list.replaceChildren();
  project().days.forEach((entry, index) => {
    const row = document.createElement('div'); row.className = 'manager-row day-manager-row';
    row.innerHTML = `<label><span>第 ${index + 1} 天</span><input type="text" value="${escapeHtml(entry.date)}" maxlength="40" aria-label="第 ${index + 1} 天日期名称"></label><div><button type="button" data-action="open">打开</button><button type="button" data-action="up" ${index === 0 ? 'disabled' : ''} aria-label="上移第 ${index + 1} 天">↑</button><button type="button" data-action="down" ${index === project().days.length - 1 ? 'disabled' : ''} aria-label="下移第 ${index + 1} 天">↓</button><button type="button" data-action="delete" ${project().days.length === 1 ? 'disabled' : ''}>删除</button></div>`;
    const input = row.querySelector('input');
    input.addEventListener('input', () => { const next = input.value.trim(); if (next) { entry.date = next; save(); renderDays(); } });
    input.addEventListener('blur', () => { if (!input.value.trim()) input.value = entry.date; });
    row.querySelector('[data-action="open"]').addEventListener('click', () => { state.day = project().days.indexOf(entry); closeDialog('daysDialog'); render(); refreshRoute(); });
    for (const [action, delta] of [['up', -1], ['down', 1]]) row.querySelector(`[data-action="${action}"]`).addEventListener('click', () => {
      const selected = day(), source = project().days.indexOf(entry), target = source + delta;
      if (target < 0 || target >= project().days.length) return;
      [project().days[source], project().days[target]] = [project().days[target], project().days[source]];
      state.day = project().days.indexOf(selected); save(); render(); renderDayList(); refreshRoute();
    });
    row.querySelector('[data-action="delete"]').addEventListener('click', () => {
      const count = entry.stops.length;
      if (!confirm(`删除第 ${index + 1} 天“${entry.date}”？${count ? `这一天的 ${count} 个地点也会从当前行程移除。` : ''}`)) return;
      const selected = day(); project().days.splice(project().days.indexOf(entry), 1);
      state.day = selected === entry ? Math.min(index, project().days.length - 1) : project().days.indexOf(selected);
      state.legInfo = []; save(); render(); renderDayList(); refreshRoute();
    });
    list.appendChild(row);
  });
}
function addDay() {
  if (project().days.length >= 30) return showToast('一个行程最多支持 30 天');
  const index = project().days.length;
  project().days.push({ date: dateLabel(project().start, index), stops: [], legModes: {} });
  state.day = index; state.legInfo = []; save(); render(); renderDayList(); refreshRoute();
}
function renderDays() {
  const container = $('days'); container.replaceChildren();
  project().days.forEach((entry, index) => {
    const button = document.createElement('button'); button.type = 'button';
    button.className = `day${index === state.day ? ' active' : ''}`;
    button.setAttribute('role', 'tab'); button.setAttribute('aria-selected', String(index === state.day));
    button.innerHTML = `<strong>DAY ${index + 1}</strong><small>${escapeHtml(entry.date)}</small>`;
    button.addEventListener('click', () => { if (state.day !== index) { state.day = index; closeSearchResults(); render(); refreshRoute(); } });
    container.appendChild(button);
  });
}
function renderFilters() {
  const container = $('filters'); container.replaceChildren();
  project().tags.forEach(item => {
    const button = document.createElement('button'); button.type = 'button';
    button.className = `filter${state.visible.has(item.id) ? ' active' : ''}`;
    button.style.setProperty('--tag-color', item.color);
    button.setAttribute('aria-pressed', String(state.visible.has(item.id)));
    button.innerHTML = `<span class="filter-icon">${svg(item.icon)}</span>${escapeHtml(item.label)}`;
    button.addEventListener('click', () => { state.visible.has(item.id) ? state.visible.delete(item.id) : state.visible.add(item.id); renderFilters(); renderTimeline(); renderMarkers(false); });
    container.appendChild(button);
  });
  const compact = project().tags.length > 3;
  const mapTagIcon = item => `<span class="legend-item" style="--tag-color:${item.color}" role="img" aria-label="${escapeHtml(item.label)}" title="${escapeHtml(item.label)}">${svg(item.icon)}</span>`;
  $('mapLegend').innerHTML = project().tags.slice(0, compact ? 2 : undefined).map(mapTagIcon).join('');
  $('mapLegendExtra').innerHTML = compact ? project().tags.slice(2).map(mapTagIcon).join('') : '';
  $('mapTagTrigger').hidden = !compact;
  $('mapTagLabel').textContent = `+${Math.max(0, project().tags.length - 2)}`;
  $('mapTagTrigger').setAttribute('aria-label', `展开剩余 ${Math.max(0, project().tags.length - 2)} 个标签`);
  $('mapTagIsland').classList.toggle('compact', compact);
  if (!compact) { state.islandPinned = false; state.islandHover = false; }
  syncTagIsland();
}
function syncTagIsland() {
  if (!project()) return;
  const expanded = project().tags.length > 3 && (state.islandPinned || state.islandHover);
  $('mapTagIsland').classList.toggle('expanded', expanded);
  $('mapTagIsland').classList.toggle('pinned', state.islandPinned);
  $('mapTagTrigger').setAttribute('aria-expanded', String(expanded));
  $('mapTagTrigger').setAttribute('aria-pressed', String(state.islandPinned));
  $('mapTagTrigger').setAttribute('aria-label', `${state.islandPinned ? '取消固定' : '固定展开'}剩余 ${Math.max(0, project().tags.length - 2)} 个标签`);
  $('mapLegendExtra').setAttribute('aria-hidden', String(!expanded));
}
function renderTimeline() {
  const currentDay = day(), container = $('timeline'); container.replaceChildren();
  $('dayCount').textContent = `今日 ${currentDay.stops.length} 个地点`;
  const shown = currentDay.stops.map((stop, index) => ({ stop, index })).filter(({ stop }) => state.visible.has(stop.type));
  if (!shown.length) {
    const empty = document.createElement('div'); empty.className = 'empty-day';
    empty.textContent = currentDay.stops.length ? '当前筛选条件下没有地点' : '这一天还没有地点，搜索或点击地图开始添加';
    container.appendChild(empty); return;
  }
  shown.forEach(({ stop, index }) => {
    const category = tag(stop.type), row = document.createElement('div'); row.className = 'stop'; row.style.setProperty('--tag-color', category.color);
    row.innerHTML = `<div class="stop-time">${escapeHtml(stop.time || '--:--')}</div><div class="stop-rail"><i></i></div><div class="stop-card"><div class="stop-thumb">${svg(category.icon)}</div><div class="stop-copy"><div class="stop-name">${escapeHtml(stop.name)}</div><div class="stop-address">${escapeHtml(stop.address || '地图选点')}</div><span class="stop-tag">${svg(category.icon)}${escapeHtml(category.label)}</span>${stop.note ? `<p class="stop-note">${escapeHtml(stop.note)}</p>` : ''}</div><div class="stop-actions"><button type="button" data-action="edit" aria-label="编辑 ${escapeHtml(stop.name)}">✎</button><button type="button" data-action="up" aria-label="上移 ${escapeHtml(stop.name)}" ${index === 0 ? 'disabled' : ''}>↑</button><button type="button" data-action="down" aria-label="下移 ${escapeHtml(stop.name)}" ${index === currentDay.stops.length - 1 ? 'disabled' : ''}>↓</button><button type="button" data-action="remove" aria-label="移除 ${escapeHtml(stop.name)}">×</button></div></div>`;
    row.querySelector('.stop-card').addEventListener('click', event => { if (!event.target.closest('button')) focusStop(stop.id); });
    row.querySelector('[data-action="edit"]').addEventListener('click', () => editStop(stop.id));
    row.querySelector('[data-action="up"]').addEventListener('click', () => moveStop(index, -1));
    row.querySelector('[data-action="down"]').addEventListener('click', () => moveStop(index, 1));
    row.querySelector('[data-action="remove"]').addEventListener('click', () => removeStop(index));
    container.appendChild(row);
    if (index < currentDay.stops.length - 1 && state.visible.has(currentDay.stops[index + 1].type)) {
      const leg = state.legInfo[index], mode = getLegMode(currentDay, index);
      const meta = document.createElement('div'); meta.className = 'leg-inline';
      meta.innerHTML = `<div class="leg-description"><span aria-hidden="true">↳</span><strong>${leg ? `${Number(leg.distance).toFixed(1)} 公里 · ${formatMinutes(leg.minutes)}` : '距离待计算'}</strong></div><div class="leg-capsule"><button type="button" class="leg-capsule-current" aria-expanded="false" aria-label="${escapeHtml(stop.name)} 至 ${escapeHtml(currentDay.stops[index + 1].name)}：${MODES[mode]}，点击修改"><span class="capsule-stage"><span class="capsule-current-text">${MODES[mode]}</span><span class="capsule-transition-icon" aria-hidden="true"></span></span><span class="capsule-chevron" aria-hidden="true">⌄</span></button><div class="capsule-options" role="group" aria-label="${escapeHtml(stop.name)} 至 ${escapeHtml(currentDay.stops[index + 1].name)} 的出行方式">${Object.entries(MODES).map(([key, label]) => `<button type="button" data-mode="${key}" class="${key === mode ? 'active' : ''}" aria-pressed="${key === mode}">${modeSvg(key)}<span>${label}</span></button>`).join('')}</div></div>`;
      const capsule = meta.querySelector('.leg-capsule'), current = meta.querySelector('.leg-capsule-current');
      current.addEventListener('click', () => {
        if (capsule.classList.contains('animating')) return;
        document.querySelectorAll('.leg-capsule.open').forEach(other => { if (other !== capsule) { other.classList.remove('open'); other.querySelector('.leg-capsule-current')?.setAttribute('aria-expanded', 'false'); } });
        capsule.classList.toggle('open'); current.setAttribute('aria-expanded', String(capsule.classList.contains('open')));
      });
      meta.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => animateLegChoice(currentDay, index, button.dataset.mode, capsule)));
      container.appendChild(meta);
    }
  });
}
function renderMarkers(fit = true) {
  if (!state.map) return;
  state.markers.forEach(entry => state.map.removeLayer(entry.marker)); state.markers = [];
  day().stops.forEach((stop, index) => {
    if (!state.visible.has(stop.type)) return;
    const category = tag(stop.type);
    const html = `<div class="place-marker" style="--tag-color:${category.color}"><div class="marker-head">${svg(category.icon)}</div><div class="marker-label"><span class="marker-order">${index + 1}.</span>${escapeHtml(stop.name)}</div></div>`;
    const marker = L.marker([stop.lat, stop.lon], { bubblingMouseEvents: false, icon: L.divIcon({ html, className: '', iconSize: [130, 56], iconAnchor: [65, 32] }) }).addTo(state.map);
    marker.bindPopup(`<div class="popup-title">${index + 1}. ${escapeHtml(stop.name)}</div><div class="popup-detail">${escapeHtml(category.label)} · ${escapeHtml(stop.address || '')}</div>${stop.note ? `<div class="popup-note">${escapeHtml(stop.note)}</div>` : ''}`);
    state.markers.push({ id: stop.id, marker });
  });
  if (fit) fitCurrentDay();
}
function fitCurrentDay() {
  if (!state.map || !project()) return;
  const stops = day().stops;
  if (stops.length) state.map.fitBounds(L.latLngBounds(stops.map(stop => [stop.lat, stop.lon])).pad(.25), { maxZoom: 15, animate: false });
  else if (project().center) state.map.setView([project().center.lat, project().center.lon], 12, { animate: false });
  else state.map.setView([20, 0], 2, { animate: false });
}
async function locateProject(target) {
  if (target.center || target.days.some(entry => entry.stops.length)) return;
  try {
    const response = await fetch(`${SERVICES.search}?${new URLSearchParams({ q: target.destination })}`);
    if (!response.ok) return;
    const feature = (await response.json()).features?.find(item => item.geometry?.type === 'Point');
    if (!feature) return;
    const [lon, lat] = feature.geometry.coordinates;
    if (!state.projects.includes(target)) return;
    target.center = { lat, lon }; save();
    if (project()?.id === target.id && !day().stops.length) fitCurrentDay();
  } catch (error) { console.warn('Destination lookup failed:', error); }
}
function focusStop(id) {
  const stop = day().stops.find(item => item.id === id);
  if (!stop || !state.map) return;
  state.map.setView([stop.lat, stop.lon], Math.max(state.map.getZoom(), 15), { animate: true });
  state.markers.find(item => item.id === id)?.marker.openPopup();
}
function render() {
  const hasProject = Boolean(project());
  $('emptyProject').hidden = hasProject;
  document.querySelector('.workspace').hidden = !hasProject;
  $('projectStrip').hidden = !hasProject;
  document.querySelector('.source-note').hidden = !hasProject;
  $('editProject').disabled = !hasProject;
  $('exportProject').disabled = !hasProject;
  renderHeader(); renderProjects();
  if (!hasProject) {
    state.markers.forEach(entry => state.map?.removeLayer(entry.marker)); state.markers = [];
    if (state.routeLayer && state.map) state.map.removeLayer(state.routeLayer);
    state.routeLayer = null;
    setMapNotice('');
    return;
  }
  renderDays(); renderFilters(); renderTimeline(); renderMarkers();
  requestAnimationFrame(() => { state.map?.invalidateSize(); fitCurrentDay(); });
}
function selectProject(id) {
  if (id === state.projectId) return;
  state.projectId = id; state.day = 0; state.visible = new Set(project().tags.map(item => item.id)); state.legInfo = [];
  save(); render(); refreshRoute(); locateProject(project());
}
function moveStop(index, delta) {
  const stops = day().stops, target = index + delta;
  if (target < 0 || target >= stops.length) return;
  [stops[index], stops[target]] = [stops[target], stops[index]];
  pruneLegModes(day());
  state.legInfo = []; save(); render(); refreshRoute();
}
function removeStop(index) {
  const [removed] = day().stops.splice(index, 1);
  pruneLegModes(day());
  state.legInfo = []; save(); render(); refreshRoute(); showToast(`已移除 ${removed.name}`);
}
async function animateLegChoice(entry, index, mode, capsule) {
  if (!MODES[mode] || index >= entry.stops.length - 1 || capsule.classList.contains('animating')) return;
  const current = capsule.querySelector('.leg-capsule-current');
  if (getLegMode(entry, index) === mode) { capsule.classList.remove('open'); current.setAttribute('aria-expanded', 'false'); return; }
  entry.legModes ||= {};
  entry.legModes[legKey(entry.stops[index], entry.stops[index + 1])] = mode;
  save(); state.routeAbort?.abort(); state.requestId += 1;
  capsule.classList.add('animating');
  const textNode = capsule.querySelector('.capsule-current-text');
  const iconNode = capsule.querySelector('.capsule-transition-icon');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion) {
    textNode.classList.add('slide-out');
    await new Promise(resolve => setTimeout(resolve, 190));
    textNode.textContent = '';
    iconNode.innerHTML = modeSvg(mode); iconNode.classList.add('travel');
    await new Promise(resolve => setTimeout(resolve, 450));
    iconNode.classList.remove('travel'); iconNode.replaceChildren();
    textNode.textContent = MODES[mode]; textNode.classList.remove('slide-out'); textNode.classList.add('slide-in');
    await new Promise(resolve => setTimeout(resolve, 310));
  } else textNode.textContent = MODES[mode];
  capsule.classList.remove('open', 'animating');
  current.setAttribute('aria-expanded', 'false');
  textNode.classList.remove('slide-in');
  current.setAttribute('aria-label', `已选择${MODES[mode]}，点击修改`);
  if (day() === entry) { state.legInfo = []; renderTimeline(); refreshRoute(); }
}
function decodePolyline6(encoded) {
  const points = []; let index = 0, lat = 0, lon = 0;
  while (index < encoded.length) {
    const values = [];
    for (let part = 0; part < 2; part++) {
      let shift = 0, result = 0, byte;
      do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 31) << shift; shift += 5; }
      while (byte >= 32 && index <= encoded.length);
      values.push((result & 1) ? ~(result >> 1) : (result >> 1));
    }
    lat += values[0]; lon += values[1]; points.push([lat / 1e6, lon / 1e6]);
  }
  return points;
}
function formatMinutes(minutes) { return minutes >= 60 ? `${Math.floor(minutes / 60)} 小时 ${minutes % 60} 分` : `${minutes} 分`; }
function routeMidpoint(points) {
  if (points.length < 2) return points[0];
  const lengths = []; let total = 0;
  for (let i = 1; i < points.length; i++) { total += L.latLng(points[i - 1]).distanceTo(L.latLng(points[i])); lengths.push(total); }
  const at = lengths.findIndex(distance => distance >= total / 2);
  return points[Math.max(0, at + 1)];
}
function drawRoute(result) {
  if (!state.map) return;
  const group = L.layerGroup();
  result.legs.forEach((leg, index) => {
    if (leg.points.length < 2) return;
    L.polyline(leg.points, { color: MODE_COLORS[leg.mode], weight: 5, opacity: .9, lineJoin: 'round', lineCap: 'round' }).addTo(group);
    const midpoint = routeMidpoint(leg.points);
    L.marker(midpoint, { interactive: false, icon: L.divIcon({ className: 'leg-badge-wrap', html: `<span class="leg-badge" style="--mode-color:${MODE_COLORS[leg.mode]}" aria-label="${MODES[leg.mode]} ${Number(leg.distance).toFixed(1)} 公里">${modeSvg(leg.mode)}<span>${Number(leg.distance).toFixed(1)} km</span></span>`, iconSize: [93, 28], iconAnchor: [46, 14] }) }).addTo(group);
  });
  state.routeLayer = group.addTo(state.map);
}
async function getDayRoute(entry, signal, onProgress) {
  const stops = entry.stops;
  if (stops.length < 2) return { legs: [], distance: 0, minutes: 0 };
  if (stops.length > 20) throw new Error('一个日期最多计算 20 个地点的路线');
  const legs = [];
  for (let start = 0; start < stops.length - 1;) {
    const mode = getLegMode(entry, start);
    let end = start;
    while (end + 1 < stops.length - 1 && getLegMode(entry, end + 1) === mode) end++;
    const locations = stops.slice(start, end + 2).map(stop => ({ lat: stop.lat, lon: stop.lon }));
    const key = `${mode}|${locations.map(item => `${item.lat.toFixed(6)},${item.lon.toFixed(6)}`).join('|')}`;
    let segment = state.routeCache.get(key);
    if (!segment) {
      onProgress?.(mode, start, end);
      const response = await fetch(SERVICES.route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode, locations }), signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if ((data.status != null && data.status !== 0) || data.trip?.legs?.length !== end - start + 1) throw new Error(data.status_message || '无可用路线');
      segment = data.trip.legs.map(leg => ({ mode, points: decodePolyline6(leg.shape), distance: Number(leg.summary?.length || 0), minutes: Math.round(Number(leg.summary?.time || 0) / 60) }));
      if (segment.some(leg => leg.points.length < 2)) throw new Error('返回的路线为空');
      state.routeCache.set(key, segment);
    }
    legs.push(...segment);
    start = end + 1;
  }
  return { legs, distance: legs.reduce((sum, leg) => sum + leg.distance, 0), minutes: legs.reduce((sum, leg) => sum + leg.minutes, 0) };
}
async function refreshRoute() {
  state.routeAbort?.abort(); state.requestId += 1; const requestId = state.requestId;
  if (state.routeLayer && state.map) state.map.removeLayer(state.routeLayer);
  state.routeLayer = null; state.legInfo = [];
  if (!project()) return;
  renderTimeline();
  if (location.protocol === 'file:') return setRouteStatus('请启动本地预览服务', '运行 python3 server.py 后打开 http://127.0.0.1:8000');
  const stops = day().stops;
  if (stops.length < 2) return setRouteStatus(stops.length ? '还需一个地点才能规划路线' : '添加地点后显示路线', '路线按当天全部地点的顺序计算');
  if (stops.length > 20) return setRouteStatus('路线最多支持 20 个地点', '地点仍会保存在行程中', true);
  const controller = new AbortController(); state.routeAbort = controller;
  setRouteStatus('正在计算逐段路线…', `${stops.length} 个地点 · 各段按所选方式计算`);
  let result;
  try {
    result = await getDayRoute(day(), controller.signal, mode => setRouteStatus(`正在计算${MODES[mode]}路段…`, '根据真实道路与当前路段的出行方式计算'));
  } catch (error) {
    if (error.name === 'AbortError' || requestId !== state.requestId) return;
    console.warn('Route request failed:', error);
    setRouteStatus('暂时无法获取完整路线', '地点与所选方式已保留；可稍后切换日期重试', true);
    setMapNotice('部分路段可能不可达，地图上仍会显示地点。');
    return;
  }
  if (requestId !== state.requestId) return;
  state.legInfo = result.legs; drawRoute(result); renderTimeline();
  setRouteStatus(`全程约 ${result.distance.toFixed(1)} 公里 · ${formatMinutes(result.minutes)}`, `${result.legs.length} 段路线 · 点击每段下方可切换出行方式`);
  setMapNotice('');
}
function classify(feature) {
  const { osm_key: key, osm_value: value } = feature.properties || {};
  if (['hotel', 'hostel', 'guest_house', 'motel', 'apartment'].includes(value)) return 'hotel';
  if (['cafe', 'coffee_shop'].includes(value)) return 'coffee';
  if (['restaurant', 'fast_food', 'food_court', 'marketplace', 'bar', 'pub'].includes(value)) return 'food';
  if (key === 'tourism' && ['hotel', 'hostel', 'guest_house'].includes(value)) return 'hotel';
  return 'spot';
}
function formatAddress(properties = {}) { return [properties.street, properties.district || properties.locality, properties.city, properties.country].filter(Boolean).join(' · '); }
function closeSearchResults() { $('searchResults').hidden = true; $('placeSearch').setAttribute('aria-expanded', 'false'); }
function renderSearchResults(features, message = '') {
  const container = $('searchResults'); container.replaceChildren(); state.searchMatches = features;
  if (message) { const empty = document.createElement('div'); empty.className = 'search-empty'; empty.textContent = message; container.appendChild(empty); }
  features.forEach((feature, index) => {
    const properties = feature.properties || {}, name = properties.name || properties.street || '未命名地点';
    const button = document.createElement('button'); button.type = 'button'; button.className = 'search-result'; button.setAttribute('role', 'option');
    button.innerHTML = `<span class="result-dot">${svg(tag(classify(feature)).icon)}</span><span class="result-copy"><strong>${escapeHtml(name)}</strong><small>${escapeHtml(formatAddress(properties))}</small></span>`;
    button.addEventListener('click', () => chooseSearchResult(index)); container.appendChild(button);
  });
  container.hidden = false; $('placeSearch').setAttribute('aria-expanded', 'true');
}
async function searchPlaces(query) {
  state.searchAbort?.abort(); const normalized = query.trim();
  if (normalized.length < 2) return closeSearchResults();
  if (location.protocol === 'file:') return renderSearchResults([], '请通过本地预览服务搜索地点。');
  const center = state.map?.getCenter() || { lat: 35.004, lng: 135.776 };
  const cacheKey = `${normalized.toLocaleLowerCase()}|${center.lat.toFixed(1)},${center.lng.toFixed(1)}`;
  if (state.searchCache.has(cacheKey)) { const cached = state.searchCache.get(cacheKey); return renderSearchResults(cached, cached.length ? '' : '没有找到地点，可以试试当地名称或英文名。'); }
  renderSearchResults([], '正在搜索地点…');
  const controller = new AbortController(); state.searchAbort = controller;
  const params = new URLSearchParams({ q: normalized, lat: String(center.lat), lon: String(center.lng) });
  try {
    const response = await fetch(`${SERVICES.search}?${params}`, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (controller.signal.aborted || $('placeSearch').value.trim() !== normalized) return;
    const features = (data.features || []).filter(feature => feature.geometry?.type === 'Point' && Number.isFinite(feature.geometry.coordinates?.[0]) && Number.isFinite(feature.geometry.coordinates?.[1]));
    state.searchCache.set(cacheKey, features); renderSearchResults(features, features.length ? '' : '没有找到地点，可以试试当地名称或英文名。');
  } catch (error) {
    if (error.name !== 'AbortError') { console.warn('Place search failed:', error); renderSearchResults([], '搜索服务暂时不可用，请稍后重试。'); }
  }
}
function populateTagSelect() { $('chosenType').innerHTML = project().tags.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`).join(''); }
function suggestedTime() {
  const last = day().stops.at(-1);
  return last?.time && last.time < '21:00' ? `${String(Math.min(23, Number(last.time.slice(0, 2)) + 2)).padStart(2, '0')}:00` : '14:00';
}
function chooseSearchResult(index) {
  const feature = state.searchMatches[index]; if (!feature) return;
  const [lon, lat] = feature.geometry.coordinates;
  openPlace({ lat, lon, name: feature.properties?.name || feature.properties?.street || '', address: formatAddress(feature.properties), type: classify(feature), osmType: feature.properties?.osm_type, osmId: feature.properties?.osm_id });
  closeSearchResults();
}
async function chooseMapPoint(latlng) {
  const id = ++state.reverseId;
  const candidate = { lat: latlng.lat, lon: latlng.lng, name: '地图选点', address: `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`, type: 'spot' };
  setMapNotice('正在查询地图附近的地点…');
  try {
    const params = new URLSearchParams({ lat: String(latlng.lat), lon: String(latlng.lng) });
    const response = await fetch(`${SERVICES.reverse}?${params}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (id !== state.reverseId) return;
    const feature = (data.features || []).find(item => item.properties?.name && item.geometry?.type === 'Point');
    if (feature) {
      candidate.name = feature.properties.name;
      candidate.address = formatAddress(feature.properties) || candidate.address;
      candidate.type = classify(feature);
      // Preserve the exact point that the user clicked on the map.
    }
  } catch (error) { console.warn('Reverse place lookup failed:', error); }
  if (id !== state.reverseId) return;
  setMapNotice(''); openPlace(candidate);
}
function openPlace(candidate, editingId = null) {
  state.chosen = candidate; state.editingId = editingId;
  populateTagSelect();
  $('placeDialogTitle').textContent = editingId ? '编辑地点' : '加入当天行程';
  $('placeSubmit').textContent = editingId ? '保存修改' : '加入行程';
  $('chosenName').value = candidate.name || '';
  $('chosenType').value = project().tags.some(item => item.id === candidate.type) ? candidate.type : 'spot';
  $('chosenAddress').textContent = candidate.address || '地图选点';
  $('chosenTime').value = candidate.time || suggestedTime();
  $('chosenNote').value = candidate.note || '';
  openDialog('placeDialog'); $('chosenName').focus();
}
function editStop(id) { const stop = day().stops.find(item => item.id === id); if (stop) openPlace(stop, id); }
function savePlace(event) {
  event.preventDefault(); const chosen = state.chosen; if (!chosen) return;
  const name = $('chosenName').value.trim(); if (!name) return;
  const changes = { name, type: $('chosenType').value, time: $('chosenTime').value, note: $('chosenNote').value.trim() };
  if (state.editingId) {
    const stop = day().stops.find(item => item.id === state.editingId); if (!stop) return;
    Object.assign(stop, changes); save(); closeDialog('placeDialog'); render(); focusStop(stop.id); showToast('地点已更新');
  } else {
    const stop = { id: uid(), ...chosen, ...changes };
    if (!validStop(stop)) return;
    day().stops.push(stop); save(); closeDialog('placeDialog'); $('placeSearch').value = '';
    render(); refreshRoute(); focusStop(stop.id); showToast(`已将 ${stop.name} 加入第 ${state.day + 1} 天`);
  }
}
function openProjectEditor(item = null) {
  state.editingProjectId = item?.id || null;
  $('projectDialogTitle').textContent = item ? '编辑行程信息' : '开启一段新旅程';
  $('projectDialogHint').textContent = item ? '修改名称、目的地、天数和出发日期。' : '每次出游单独管理，随时切换。';
  $('projectSubmit').textContent = item ? '保存修改' : '创建行程';
  $('projectDaysHelp').hidden = !item;
  $('projectName').value = item?.name || '';
  $('projectDestination').value = item?.destination || '';
  $('projectDays').value = String(item?.days.length || 3);
  $('projectStart').value = item?.start || '';
  openDialog('projectDialog'); $('projectName').focus();
}
function saveProject(event) {
  event.preventDefault();
  const name = $('projectName').value.trim(), destination = $('projectDestination').value.trim();
  const count = Number($('projectDays').value), start = $('projectStart').value;
  if (!name || !destination || !Number.isInteger(count) || count < 1 || count > 30) return;
  const existing = state.projects.find(item => item.id === state.editingProjectId);
  if (existing) {
    const oldStart = existing.start || '', oldDestination = existing.destination;
    if (count < existing.days.length) {
      const removed = existing.days.slice(count), removedStops = removed.reduce((sum, entry) => sum + entry.stops.length, 0);
      if (!confirm(`将“${existing.name}”缩短为 ${count} 天？末尾 ${removed.length} 天及其中 ${removedStops} 个地点会被删除。`)) return;
    }
    existing.days.forEach((entry, index) => { if (entry.date === dateLabel(oldStart, index)) entry.date = dateLabel(start, index); });
    existing.days.length = Math.min(existing.days.length, count);
    while (existing.days.length < count) existing.days.push({ date: dateLabel(start, existing.days.length), stops: [], legModes: {} });
    Object.assign(existing, { name, destination, start });
    if (destination !== oldDestination) { delete existing.center; locateProject(existing); }
    if (state.projectId === existing.id) state.day = Math.min(state.day, count - 1);
    save(); closeDialog('projectDialog'); render(); if (state.projectId === existing.id) refreshRoute(); showToast('行程信息已更新');
    return;
  }
  const created = { id: uid(), name, destination, start, days: Array.from({ length: count }, (_, index) => ({ date: dateLabel(start, index), stops: [], legModes: {} })), tags: copyTags() };
  state.projects.push(created); state.projectId = created.id; state.day = 0; state.visible = new Set(created.tags.map(item => item.id)); state.legInfo = [];
  save(); closeDialog('projectDialog'); $('projectForm').reset(); render(); refreshRoute(); showToast('新行程已创建');
  locateProject(created);
}
function renderIconChoices() {
  $('iconGrid').innerHTML = Object.entries(ICONS).map(([id, item]) => `<button type="button" class="icon-choice${id === state.selectedIcon ? ' selected' : ''}" data-icon="${id}" role="radio" aria-checked="${id === state.selectedIcon}" title="${item.label}" aria-label="${item.label}">${svg(id)}</button>`).join('');
  $('colorGrid').innerHTML = COLORS.map(color => `<button type="button" class="color-choice${color === state.selectedColor ? ' selected' : ''}" data-color="${color}" role="radio" aria-checked="${color === state.selectedColor}" aria-label="${color}" style="--swatch:${color}"></button>`).join('');
  $('iconGrid').querySelectorAll('button').forEach(button => button.addEventListener('click', () => { state.selectedIcon = button.dataset.icon; renderIconChoices(); }));
  $('colorGrid').querySelectorAll('button').forEach(button => button.addEventListener('click', () => { state.selectedColor = button.dataset.color; renderIconChoices(); }));
}
function openTagEditor(item = null) {
  closeDialog('tagsDialog');
  state.editingTagId = item?.id || null;
  state.selectedIcon = ICONS[item?.icon] ? item.icon : 'star';
  state.selectedColor = COLORS.includes(item?.color) ? item.color : COLORS[0];
  $('tagDialogTitle').textContent = item ? '修改地点标签' : '创建你的标签';
  $('tagSubmit').textContent = item ? '保存标签' : '创建标签';
  $('tagName').value = item?.label || '';
  renderIconChoices(); openDialog('tagDialog'); $('tagName').focus();
}
function createTag(event) {
  event.preventDefault(); const label = $('tagName').value.trim();
  if (!label) return;
  if (project().tags.some(item => item.id !== state.editingTagId && item.label.toLocaleLowerCase() === label.toLocaleLowerCase())) return showToast('这个标签名称已存在');
  const existing = project().tags.find(item => item.id === state.editingTagId);
  if (existing) Object.assign(existing, { label, color: state.selectedColor, icon: state.selectedIcon });
  else { const newTag = { id: uid(), label, color: state.selectedColor, icon: state.selectedIcon }; project().tags.push(newTag); state.visible.add(newTag.id); }
  save(); closeDialog('tagDialog'); $('tagForm').reset(); render(); renderTagList(); openDialog('tagsDialog'); showToast(existing ? '标签已更新' : `已创建标签“${label}”`);
}
async function exportCurrentProject() {
  const target = project();
  const kind = document.querySelector('input[name="exportKind"]:checked')?.value || 'outline';
  const button = $('downloadExport'); button.disabled = true;
  try {
    if (!target?.days.some(entry => entry.stops.length)) return showToast('请先为行程添加至少一个地点');
    const routes = [];
    for (let index = 0; index < target.days.length; index++) {
      button.textContent = `计算路线 ${index + 1}/${target.days.length}…`;
      try { routes.push(await getDayRoute(target.days[index])); }
      catch (error) { console.warn(`Export: day ${index + 1} route unavailable`, error); routes.push(null); }
    }
    if (kind === 'outline') window.EasyTripExports.outline(target, routes, ICONS, MODE_PATHS);
    else window.EasyTripExports.map(target, routes);
    closeDialog('exportDialog'); showToast('行程已导出到下载目录');
  } catch (error) { console.error('Export failed:', error); showToast('导出失败，请稍后重试'); }
  finally { button.disabled = false; button.textContent = '生成并下载'; }
}
function bindEvents() {
  window.addEventListener('resize', () => { clearTimeout(bindEvents.resizeTimer); bindEvents.resizeTimer = setTimeout(() => { state.map?.invalidateSize(); fitCurrentDay(); }, 150); });
  $('placeSearch').addEventListener('input', event => { clearTimeout(state.searchTimer); state.searchTimer = setTimeout(() => searchPlaces(event.target.value), 500); });
  $('placeSearch').addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); if (state.searchMatches.length && !$('searchResults').hidden) chooseSearchResult(0); else searchPlaces(event.target.value); }
    if (event.key === 'Escape') closeSearchResults();
  });
  $('placeForm').addEventListener('submit', savePlace);
  $('projectForm').addEventListener('submit', saveProject);
  $('tagForm').addEventListener('submit', createTag);
  $('newProject').addEventListener('click', () => openProjectEditor());
  $('emptyNewProject').addEventListener('click', () => openProjectEditor());
  $('editProject').addEventListener('click', () => openProjectEditor(project()));
  $('exportProject').addEventListener('click', () => openDialog('exportDialog'));
  $('downloadExport').addEventListener('click', exportCurrentProject);
  $('manageProjects').addEventListener('click', () => { renderProjectList(); openDialog('projectsDialog'); });
  $('projectNewFromList').addEventListener('click', () => { closeDialog('projectsDialog'); openProjectEditor(); });
  $('manageTags').addEventListener('click', () => { renderTagList(); openDialog('tagsDialog'); });
  $('tagNewFromList').addEventListener('click', () => openTagEditor());
  $('manageDays').addEventListener('click', () => { renderDayList(); openDialog('daysDialog'); });
  $('dayNewFromList').addEventListener('click', addDay);
  $('mapTagIsland').addEventListener('pointerenter', () => { state.islandHover = true; syncTagIsland(); });
  $('mapTagIsland').addEventListener('pointerleave', () => { state.islandHover = false; syncTagIsland(); });
  $('mapTagTrigger').addEventListener('click', () => { state.islandPinned = !state.islandPinned; syncTagIsland(); });
  $('mapTagIsland').addEventListener('focusin', () => { state.islandHover = true; syncTagIsland(); });
  $('mapTagIsland').addEventListener('focusout', event => { if (!event.currentTarget.contains(event.relatedTarget)) { state.islandHover = false; syncTagIsland(); } });
  $('resetTrip').addEventListener('click', () => {
    if (project().id !== 'kyoto-demo') return showToast('只有京都示例可恢复');
    if (!confirm('恢复京都示例行程？当前京都行程的修改会被覆盖。')) return;
    const restored = makeDemo(); Object.assign(project(), restored); state.day = 0; state.visible = new Set(project().tags.map(item => item.id));
    save(); render(); refreshRoute(); showToast('已恢复京都示例');
  });
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => closeDialog(button.dataset.close)));
  document.querySelectorAll('.dialog-backdrop').forEach(backdrop => backdrop.addEventListener('click', event => { if (event.target === backdrop) closeDialog(backdrop.id); }));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { document.querySelectorAll('.dialog-backdrop:not([hidden])').forEach(node => closeDialog(node.id)); closeSearchResults(); } });
  document.addEventListener('click', event => {
    if (!event.target.closest('#searchWrap')) closeSearchResults();
    if (!event.target.closest('.leg-capsule')) document.querySelectorAll('.leg-capsule.open').forEach(capsule => { capsule.classList.remove('open'); capsule.querySelector('.leg-capsule-current')?.setAttribute('aria-expanded', 'false'); });
  });
}
state.visible = new Set(project()?.tags.map(item => item.id) || []);
initMap(); bindEvents(); render(); if (project()) { syncTagIsland(); refreshRoute(); locateProject(project()); }
