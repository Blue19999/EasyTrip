// Cloudflare equivalent of the narrow API adapters in server.py.
const PHOTON_SEARCH = 'https://photon.komoot.io/api/';
const PHOTON_REVERSE = 'https://photon.komoot.io/reverse';
const VALHALLA_ROUTE = 'https://valhalla1.openstreetmap.de/route';
const MAX_REQUEST_BYTES = 8_000;
const MAX_RESPONSE_BYTES = 2_000_000;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

class BadRequest extends Error {}

function coordinate(value, min, max) {
  if (value === null || value === undefined || String(value).trim() === '') throw new BadRequest('坐标无效');
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) throw new BadRequest('坐标无效');
  return Number(number.toFixed(6));
}

async function limitedBytes(stream, maximum) {
  if (!stream) return new Uint8Array();
  const reader = stream.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maximum) {
        await reader.cancel();
        throw new BadRequest('数据超过大小限制');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

async function proxyJson(url, unavailableMessage) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const upstream = await fetch(url, {
      headers: { accept: 'application/json', 'x-client-id': 'easytrip-cloudflare-demo' },
      signal: controller.signal,
      cf: { cacheEverything: true, cacheTtlByStatus: { '200-299': 3600, '400-599': 0 } },
    });
    if (!upstream.ok) throw new Error(`Upstream status ${upstream.status}`);
    const declaredSize = Number(upstream.headers.get('content-length'));
    if (declaredSize > MAX_RESPONSE_BYTES) throw new Error('Upstream response too large');
    const bytes = await limitedBytes(upstream.body, MAX_RESPONSE_BYTES);
    JSON.parse(new TextDecoder().decode(bytes));
    return new Response(bytes, {
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    });
  } catch (error) {
    console.warn(JSON.stringify({ event: 'upstream_failure', service: unavailableMessage, detail: String(error) }));
    return json({ error: unavailableMessage }, 502);
  } finally {
    clearTimeout(timeout);
  }
}

function searchUrl(requestUrl) {
  const query = requestUrl.searchParams.get('q')?.trim() || '';
  if (query.length < 2 || query.length > 100) throw new BadRequest('地点名称应为 2–100 个字符');
  const upstream = new URL(PHOTON_SEARCH);
  upstream.searchParams.set('q', query);
  upstream.searchParams.set('limit', '6');
  if (requestUrl.searchParams.has('lat') || requestUrl.searchParams.has('lon')) {
    upstream.searchParams.set('lat', String(coordinate(requestUrl.searchParams.get('lat'), -90, 90)));
    upstream.searchParams.set('lon', String(coordinate(requestUrl.searchParams.get('lon'), -180, 180)));
  }
  return upstream;
}

function reverseUrl(requestUrl) {
  const upstream = new URL(PHOTON_REVERSE);
  upstream.searchParams.set('lat', String(coordinate(requestUrl.searchParams.get('lat'), -90, 90)));
  upstream.searchParams.set('lon', String(coordinate(requestUrl.searchParams.get('lon'), -180, 180)));
  upstream.searchParams.set('radius', '0.5');
  upstream.searchParams.set('limit', '5');
  return upstream;
}

async function routeUrl(request) {
  const declaredSize = Number(request.headers.get('content-length'));
  if (declaredSize > MAX_REQUEST_BYTES) throw new BadRequest('路线请求大小无效');
  const bytes = await limitedBytes(request.body, MAX_REQUEST_BYTES);
  if (!bytes.byteLength) throw new BadRequest('路线请求大小无效');
  let submitted;
  try { submitted = JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new BadRequest('路线参数无效'); }
  const costing = submitted?.mode || 'pedestrian';
  if (!['pedestrian', 'bicycle', 'auto'].includes(costing)) throw new BadRequest('出行方式无效');
  if (!Array.isArray(submitted.locations) || submitted.locations.length < 2 || submitted.locations.length > 20) {
    throw new BadRequest('请选择 2–20 个地点');
  }
  const locations = submitted.locations.map(point => {
    if (!point || typeof point !== 'object') throw new BadRequest('地点坐标无效');
    return { lat: coordinate(point.lat, -90, 90), lon: coordinate(point.lon, -180, 180) };
  });
  const payload = {
    locations,
    costing,
    shape_format: 'polyline6',
    directions_options: { units: 'kilometers', directions_type: 'none' },
  };
  const upstream = new URL(VALHALLA_ROUTE);
  upstream.searchParams.set('json', JSON.stringify(payload));
  return upstream;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    if (!['/api/search', '/api/reverse', '/api/route'].includes(url.pathname)) return json({ error: '未找到接口' }, 404);
    if ((url.pathname === '/api/route' && request.method !== 'POST') ||
        (url.pathname !== '/api/route' && request.method !== 'GET')) return json({ error: '请求方式不支持' }, 405);
    const { success } = await env.API_LIMITER.limit({ key: url.pathname });
    if (!success) return json({ error: '请求过于频繁，请稍后再试' }, 429);
    try {
      if (url.pathname === '/api/search') return proxyJson(searchUrl(url), '地点服务暂时不可用');
      if (url.pathname === '/api/reverse') return proxyJson(reverseUrl(url), '地点服务暂时不可用');
      return proxyJson(await routeUrl(request), '路线服务暂时不可用');
    } catch (error) {
      if (error instanceof BadRequest) return json({ error: error.message }, 400);
      console.error(JSON.stringify({ event: 'api_failure', path: url.pathname, detail: String(error) }));
      return json({ error: '请求处理失败' }, 500);
    }
  },
};
