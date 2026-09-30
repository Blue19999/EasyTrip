/* Downloadable itinerary outline and self-contained vector route map. */
window.EasyTripExports = (() => {
  const MODE_NAMES = { pedestrian: '步行', bicycle: '骑行', auto: '驾车' };
  const MODE_COLORS = { pedestrian: '#1769cf', bicycle: '#30856f', auto: '#7c69b1' };
  const DAY_COLORS = ['#1769cf', '#d46c5d', '#4f9c84', '#a88554', '#8778b2', '#4b8b9a', '#aa739a', '#697b4c'];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const safeName = value => String(value).replace(/[\\/:*?"<>|]/g, '-').slice(0, 70) || 'EasyTrip';
  const legMode = (day, index) => day.legModes?.[`${day.stops[index]?.id}:${day.stops[index + 1]?.id}`] || 'pedestrian';
  const iconSvg = path => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path || ''}</svg>`;
  const minutesText = value => value >= 60 ? `${Math.floor(value / 60)} 小时 ${value % 60} 分钟` : `${value} 分钟`;
  function download(content, mime, filename) {
    const url = URL.createObjectURL(new Blob([content], { type: mime }));
    const link = document.createElement('a'); link.href = url; link.download = filename;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  function outline(project, routes, icons, modePaths) {
    const totalStops = project.days.reduce((sum, day) => sum + day.stops.length, 0);
    const sections = project.days.map((day, dayIndex) => {
      const route = routes[dayIndex];
      const stops = day.stops.map((stop, index) => {
        const tag = project.tags.find(item => item.id === stop.type) || { label: '地点', color: '#1769cf', icon: 'star' };
        const next = day.stops[index + 1], leg = route?.legs?.[index], mode = legMode(day, index);
        const distance = leg && Number.isFinite(Number(leg.distance)) ? `${Number(leg.distance).toFixed(1)} 公里` : '道路距离暂不可用';
        const duration = leg && Number.isFinite(Number(leg.minutes)) ? ` · 约 ${minutesText(Math.round(Number(leg.minutes)))}` : '';
        const transfer = next ? `<div class="transfer" style="--mode-color:${MODE_COLORS[mode] || MODE_COLORS.pedestrian}"><span class="transfer-icon">${iconSvg(modePaths[mode])}</span><span><strong>${escape(MODE_NAMES[mode] || '步行')}前往「${escape(next.name)}」</strong><small>${distance}${duration}</small></span></div>` : '';
        return `<li class="stop"><div class="time">${escape(stop.time || '时间待定')}</div><div class="content"><h3>${escape(stop.name)}</h3><div class="meta"><span class="tag" style="border-color:${tag.color};color:${tag.color}">${iconSvg(icons[tag.icon]?.path || icons.star?.path)}${escape(tag.label)}</span>${stop.address ? `<span>${escape(stop.address)}</span>` : ''}</div>${stop.note ? `<p class="note">${escape(stop.note).replace(/\n/g, '<br>')}</p>` : ''}${transfer}</div></li>`;
      }).join('');
      const complete = route && route.legs.length === Math.max(0, day.stops.length - 1);
      const summary = day.stops.length > 1 ? (complete ? ` · 约 ${Number(route.distance).toFixed(1)} 公里 / ${minutesText(route.minutes)}` : ' · 部分道路距离暂不可用') : '';
      return `<section class="day"><div class="day-heading"><span>DAY ${dayIndex + 1}</span><h2>${escape(day.date)}</h2><small>${day.stops.length} 个地点${summary}</small></div>${day.stops.length ? `<ol>${stops}</ol>` : '<p class="empty">这一天尚未安排地点。</p>'}</section>`;
    }).join('');
    const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(project.name)} · EasyTrip 行程大纲</title><style>
    :root{font-family:Arial,"Songti SC","STSong","SimSun",serif;color:#1d1d1f}*{box-sizing:border-box}body{margin:0;background:#f5f5f7}.page{max-width:850px;margin:40px auto;background:white;padding:54px 64px;box-shadow:0 12px 40px #00000012}.brand{font:700 14px Arial,sans-serif;letter-spacing:.06em;color:#1769cf}.hero{padding:14px 0 30px;border-bottom:1px solid #dedee3}h1{font-size:34px;line-height:1.3;margin:8px 0 10px}h2{font-size:21px;margin:4px 0}.subtitle{color:#74747d;font-size:14px}.overview{display:flex;gap:24px;margin:22px 0;color:#4e4e58;font-size:13px}.day{padding:24px 0;border-bottom:1px solid #e7e7eb;break-inside:avoid}.day-heading>span{font:700 11px Arial,sans-serif;color:#1769cf;letter-spacing:.1em}.day-heading small{display:block;color:#7b7b85;font-size:12px;margin-top:5px}.day ol{list-style:none;margin:18px 0 0;padding:0}.stop{display:flex;gap:20px;margin:0 0 19px;break-inside:avoid}.time{width:55px;flex:none;color:#777781;font-size:13px;padding-top:4px}.content{border-left:2px solid #d9e6f7;padding:0 0 0 17px;flex:1}.content h3{font-size:17px;margin:0 0 8px}.meta{display:flex;gap:9px;flex-wrap:wrap;align-items:center;color:#777781;font-size:12px}.tag{display:inline-flex;align-items:center;gap:5px;border:1px solid;border-radius:20px;padding:3px 9px;font-size:12px}.tag svg{width:14px;height:14px}.note{white-space:normal;background:#f7f7f9;padding:11px 13px;border-radius:9px;font-size:13px;line-height:1.65;margin:11px 0}.transfer{display:flex;align-items:center;gap:10px;color:var(--mode-color);font-size:12px;margin-top:12px;padding:9px 11px;border-radius:10px;background:color-mix(in srgb,var(--mode-color) 8%,white)}.transfer-icon{display:grid;place-items:center;flex:none;width:26px;height:26px}.transfer-icon svg{width:21px;height:21px}.transfer strong,.transfer small{display:block}.transfer strong{font-size:13px}.transfer small{font-size:12px;margin-top:2px;color:#616876}.empty{color:#96969e;font-size:13px}.footer{color:#9a9aa2;font-size:11px;margin-top:30px;line-height:1.6}@media(max-width:700px){.page{margin:0;padding:28px 21px;box-shadow:none}h1{font-size:27px}.overview{flex-wrap:wrap}}@media print{body{background:white}.page{max-width:none;margin:0;padding:0;box-shadow:none}.day{break-inside:auto}@page{margin:18mm}}</style></head><body><main class="page"><div class="brand">✳ EasyTrip · TRAVEL OUTLINE</div><header class="hero"><h1>${escape(project.name)}</h1><div class="subtitle">${escape(project.destination)}${project.start ? ` · 出发日期 ${escape(project.start)}` : ''}</div></header><div class="overview"><span>${project.days.length} 天行程</span><span>${totalStops} 个地点</span><span>按每日访问顺序排列</span></div>${sections}<footer class="footer">由 EasyTrip 导出。距离与预计时间来自道路路线服务；不可用的路段会明确标注。地点备注由行程创建者填写。</footer></main></body></html>`;
    download(html, 'text/html;charset=utf-8', `${safeName(project.name)}-行程大纲.html`);
  }
  function mercator(lon, lat) {
    const bounded = Math.max(-85.0511, Math.min(85.0511, lat));
    const sine = Math.sin(bounded * Math.PI / 180);
    return [(lon + 180) / 360, .5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)];
  }
  function mapSvg(project, routes) {
    const W = 1440, H = 1010 + Math.ceil(project.days.length / 5) * 32;
    const frame = { x: 54, y: 133, w: 1332, h: 730 };
    const allStops = project.days.flatMap(day => day.stops);
    if (!allStops.length) throw new Error('没有可导出的地点');
    const coords = allStops.map(stop => mercator(stop.lon, stop.lat));
    routes.forEach(route => route?.legs?.forEach(leg => leg.points.forEach(([lat, lon]) => coords.push(mercator(lon, lat)))));
    const bounds = coords.reduce((box, [x, y]) => ({ minX: Math.min(box.minX, x), maxX: Math.max(box.maxX, x), minY: Math.min(box.minY, y), maxY: Math.max(box.maxY, y) }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
    const { minX, maxX, minY, maxY } = bounds;
    const spanX = Math.max(maxX - minX, .00005), spanY = Math.max(maxY - minY, .00005);
    const scale = Math.min(frame.w / (spanX * 1.17), frame.h / (spanY * 1.2));
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    const place = (lon, lat) => { const [x, y] = mercator(lon, lat); return [frame.x + frame.w / 2 + (x - cx) * scale, frame.y + frame.h / 2 + (y - cy) * scale]; };
    const grid = Array.from({ length: 7 }, (_, i) => `<line x1="${frame.x + i * frame.w / 6}" y1="${frame.y}" x2="${frame.x + i * frame.w / 6}" y2="${frame.y + frame.h}"/><line x1="${frame.x}" y1="${frame.y + i * frame.h / 6}" x2="${frame.x + frame.w}" y2="${frame.y + i * frame.h / 6}"/>`).join('');
    const paths = project.days.map((day, dayIndex) => {
      const route = routes[dayIndex];
      return day.stops.slice(0, -1).map((stop, index) => {
        const next = day.stops[index + 1], leg = route?.legs?.[index];
        const color = MODE_COLORS[leg?.mode || legMode(day, index)] || MODE_COLORS.pedestrian;
        if (!leg) { const [x1, y1] = place(stop.lon, stop.lat), [x2, y2] = place(next.lon, next.lat); return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="3" stroke-dasharray="8 7" opacity=".55"/>`; }
        const step = Math.max(1, Math.floor(leg.points.length / 800));
        const points = leg.points.filter((_, i) => i % step === 0 || i === leg.points.length - 1).map(([lat, lon]) => place(lon, lat).map(v => v.toFixed(1)).join(',')).join(' ');
        return `<polyline points="${points}" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><polyline points="${points}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
      }).join('');
    }).join('');
    const markers = project.days.map((day, dayIndex) => day.stops.map((stop, index) => {
      const [x, y] = place(stop.lon, stop.lat), color = DAY_COLORS[dayIndex % DAY_COLORS.length];
      const text = stop.name.length > 17 ? `${stop.name.slice(0, 17)}…` : stop.name;
      const labelWidth = Math.min(235, Math.max(80, text.length * 14 + 22));
      const labelX = Math.min(frame.x + frame.w - labelWidth - 6, Math.max(frame.x + 6, x + 15));
      const labelY = Math.max(frame.y + 6, Math.min(frame.y + frame.h - 28, y - 16));
      return `<g><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="16" fill="${color}" stroke="white" stroke-width="3"/><text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" fill="white" font-size="11" font-weight="700">${index + 1}</text><rect x="${labelX.toFixed(1)}" y="${labelY.toFixed(1)}" width="${labelWidth}" height="26" rx="8" fill="#ffffff" stroke="#d9dfe7"/><text x="${(labelX + 10).toFixed(1)}" y="${(labelY + 17).toFixed(1)}" fill="#1d1d1f" font-size="13">${escape(text)}</text></g>`;
    }).join('')).join('');
    const legend = project.days.map((day, index) => `<g transform="translate(${60 + (index % 5) * 265},${901 + Math.floor(index / 5) * 32})"><circle cx="8" cy="8" r="7" fill="${DAY_COLORS[index % DAY_COLORS.length]}"/><text x="23" y="13" font-size="13" fill="#535c68">第 ${index + 1} 天 · ${escape(day.date)} (${day.stops.length})</text></g>`).join('');
    const modeLegend = Object.entries(MODE_NAMES).map(([mode, label], index) => `<g transform="translate(${60 + index * 100},${921 + Math.ceil(project.days.length / 5) * 32})"><line x1="0" y1="8" x2="22" y2="8" stroke="${MODE_COLORS[mode]}" stroke-width="4" stroke-linecap="round"/><text x="31" y="13" font-size="13" fill="#535c68">${label}</text></g>`).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><style>text{font-family:Arial,"Songti SC","STSong","SimSun",serif}</style><rect width="100%" height="100%" fill="#f6f8fb"/><text x="54" y="54" font-family="Arial" font-size="18" font-weight="700" fill="#1769cf">✳ EasyTrip · TRIP MAP</text><text x="54" y="99" font-size="31" font-weight="700" fill="#1d1d1f">${escape(project.name)}</text><text x="1386" y="99" text-anchor="end" font-size="15" fill="#707985">${escape(project.destination)} · ${project.days.length} 天 · ${allStops.length} 个地点</text><defs><clipPath id="map-frame"><rect x="${frame.x}" y="${frame.y}" width="${frame.w}" height="${frame.h}" rx="20"/></clipPath></defs><rect x="${frame.x}" y="${frame.y}" width="${frame.w}" height="${frame.h}" rx="20" fill="#eaf1f5" stroke="#dae4eb"/><g clip-path="url(#map-frame)"><g stroke="#d6e2e9" stroke-width="1">${grid}</g>${paths}${markers}</g><g transform="translate(1337,163)"><path d="M0 25 13 0 26 25 13 19Z" fill="#284d6b"/><text x="13" y="42" text-anchor="middle" font-size="12" fill="#284d6b">N</text></g>${legend}${modeLegend}<text x="54" y="${H - 24}" font-size="12" fill="#8a939d">路线来自 Valhalla / © OpenStreetMap contributors · 虚线表示道路数据暂不可用，仅连接地点作为范围参考。</text></svg>`;
  }
  function map(project, routes) {
    download(mapSvg(project, routes), 'image/svg+xml;charset=utf-8', `${safeName(project.name)}-行程地图.svg`);
  }
  return { outline, map };
})();
