"""Local preview server with narrow, cached map API adapters.

Run with: python3 server.py
This is a development server, not a public deployment target.
"""

from __future__ import annotations

import json
import os
import ssl
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlencode, urlsplit
from urllib.request import Request, urlopen

HOST = "127.0.0.1"
PORT = int(os.environ.get("EASYTRIP_PORT", "8000"))
PHOTON_URL = "https://photon.komoot.io/api/"
PHOTON_REVERSE_URL = "https://photon.komoot.io/reverse"
VALHALLA_URL = "https://valhalla1.openstreetmap.de/route"
CACHE_TTL_SECONDS = 3600
MAX_CACHE_ITEMS = 128

cache: dict[str, tuple[float, bytes]] = {}
cache_lock = threading.Lock()
upstream_lock = threading.Lock()
last_request = {"search": 0.0, "reverse": 0.0, "route": 0.0}
system_ca = Path("/etc/ssl/cert.pem")
ssl_context = ssl.create_default_context(cafile=str(system_ca) if system_ca.exists() else None)


def cached_request(key: str, service: str, request: Request) -> bytes:
    now = time.monotonic()
    with cache_lock:
        stored = cache.get(key)
        if stored and now - stored[0] < CACHE_TTL_SECONDS:
            return stored[1]

    # Shared lock keeps this local prototype courteous to public demo services.
    with upstream_lock:
        pause = 1.0 if service in ("search", "reverse") else 0.5
        remaining = pause - (time.monotonic() - last_request[service])
        if remaining > 0:
            time.sleep(remaining)
        last_request[service] = time.monotonic()
        with urlopen(request, timeout=15, context=ssl_context) as response:
            if response.status != 200:
                raise ValueError("上游服务返回异常状态")
            body = response.read(2_000_001)
            if len(body) > 2_000_000:
                raise ValueError("上游数据超过大小限制")
            json.loads(body)

    with cache_lock:
        if len(cache) >= MAX_CACHE_ITEMS:
            oldest = min(cache, key=lambda item: cache[item][0])
            del cache[oldest]
        cache[key] = (time.monotonic(), body)
    return body


class Handler(SimpleHTTPRequestHandler):
    def json_response(self, status: int, data: dict | bytes) -> None:
        body = data if isinstance(data, bytes) else json.dumps(data, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        parsed = urlsplit(self.path)
        if parsed.path not in ("/api/search", "/api/reverse"):
            return super().do_GET()
        try:
            args = parse_qs(parsed.query)
            if parsed.path == "/api/reverse":
                lat, lon = float(args["lat"][0]), float(args["lon"][0])
                if not (-90 <= lat <= 90 and -180 <= lon <= 180):
                    return self.json_response(400, {"error": "坐标无效"})
                params = {"lat": str(round(lat, 6)), "lon": str(round(lon, 6)), "radius": "0.5", "limit": "5"}
                url = f"{PHOTON_REVERSE_URL}?{urlencode(params)}"
                request = Request(url, headers={"User-Agent": "EasyTripLocalPrototype/0.2"})
                return self.json_response(200, cached_request(url, "reverse", request))
            query = args.get("q", [""])[0].strip()
            if not 2 <= len(query) <= 100:
                return self.json_response(400, {"error": "地点名称应为 2–100 个字符"})
            params = {"q": query, "limit": "6"}
            if "lat" in args and "lon" in args:
                lat, lon = float(args["lat"][0]), float(args["lon"][0])
                if not (-90 <= lat <= 90 and -180 <= lon <= 180):
                    return self.json_response(400, {"error": "坐标无效"})
                params.update(lat=str(lat), lon=str(lon))
            url = f"{PHOTON_URL}?{urlencode(params)}"
            request = Request(url, headers={"User-Agent": "EasyTripLocalPrototype/0.2"})
            body = cached_request(url, "search", request)
            self.json_response(200, body)
        except (ValueError, TypeError, IndexError):
            self.json_response(400, {"error": "搜索参数无效"})
        except (HTTPError, URLError, TimeoutError, OSError) as error:
            self.log_error("Photon request failed: %s", error)
            self.json_response(502, {"error": "地点服务暂时不可用"})

    def do_POST(self) -> None:
        if urlsplit(self.path).path != "/api/route":
            return self.json_response(404, {"error": "未找到接口"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 1 <= length <= 8000:
                return self.json_response(400, {"error": "路线请求大小无效"})
            submitted = json.loads(self.rfile.read(length))
            costing = submitted.get("mode", "pedestrian")
            if costing not in ("pedestrian", "bicycle", "auto"):
                return self.json_response(400, {"error": "出行方式无效"})
            locations = submitted.get("locations")
            if not isinstance(locations, list) or not 2 <= len(locations) <= 20:
                return self.json_response(400, {"error": "请选择 2–20 个地点"})
            validated = []
            for location in locations:
                lat, lon = float(location["lat"]), float(location["lon"])
                if not (-90 <= lat <= 90 and -180 <= lon <= 180):
                    return self.json_response(400, {"error": "地点坐标无效"})
                validated.append({"lat": round(lat, 6), "lon": round(lon, 6)})
            payload = {
                "locations": validated,
                "costing": costing,
                "shape_format": "polyline6",
                "directions_options": {"units": "kilometers", "directions_type": "none"},
            }
            url = f"{VALHALLA_URL}?{urlencode({'json': json.dumps(payload, separators=(',', ':'))})}"
            request = Request(url, headers={"User-Agent": "EasyTripLocalPrototype/0.2", "X-Client-Id": "easytrip-local-prototype"})
            body = cached_request(url, "route", request)
            self.json_response(200, body)
        except (KeyError, TypeError, ValueError, IndexError, json.JSONDecodeError):
            self.json_response(400, {"error": "路线参数无效"})
        except (HTTPError, URLError, TimeoutError, OSError) as error:
            self.log_error("Valhalla request failed: %s", error)
            self.json_response(502, {"error": "路线服务暂时不可用"})


if __name__ == "__main__":
    print(f"EasyTrip 预览：http://{HOST}:{PORT}", flush=True)
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
