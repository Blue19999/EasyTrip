# EasyTrip｜技术方案

## 原型架构

| 能力 | 现有实现 |
| --- | --- |
| 页面 | 原生 HTML、CSS、JavaScript，无构建步骤。 |
| 地图 | [Leaflet 1.9.4](https://leafletjs.com/examples/quick-start/) 与 [OpenStreetMap 标准瓦片](https://operations.osmfoundation.org/policies/tiles/)。 |
| 地点搜索与地图反查 | 本地 Python 服务代理 [Photon API](https://github.com/komoot/photon/blob/master/docs/api-v1.md) 的 `/api/` 和 `/reverse`。 |
| 路线 | 本地服务代理 [Valhalla Route API](https://valhalla.github.io/valhalla/api/turn-by-turn/overview/)；`pedestrian`、`bicycle`、`auto` 三种成本模型。 |
| 数据保存 | 浏览器 `localStorage`，键为 `easytrip-projects-v3`；从 `manyou-kyoto-trip-v2` 单行程草稿迁移。 |
| 导出 | 浏览器生成可打印 HTML 大纲与自包含 SVG 路线图；入口在 `export.js`。 |

Cloudflare 部署使用 `scripts/build.mjs` 将五个公开资源复制到 `dist/`，由 Workers Static Assets 提供页面。`worker/index.js` 承接 `/api/search`、`/api/reverse` 和 `/api/route`，保留本地 Python 代理的参数限制，并通过 Cloudflare `fetch` 缓存选项缓存上游成功响应一小时。`wrangler.jsonc` 为 API 配置限流和采样日志，日志隐藏查询字符串。浏览器数据仍保存在当前站点来源的 `localStorage`，没有云端同步。

本地服务默认监听 `127.0.0.1:8000`，可用 `EASYTRIP_PORT` 环境变量改端口。它固定转发到 Photon 和 Valhalla，限制参数、地点数量、请求体大小和请求频率，并缓存相同请求一小时。前端路线缓存按“出行方式 + 地点坐标序列”区分。连续使用同一方式的路段合并成一次请求，返回后再按相邻地点拆成 `legs`；前端分别解码 polyline6，绘制每段真实路径，读取各段摘要的公里数与时间，并在地图路线上放置方式图标与距离标签。切换日期、行程或出行方式时会取消过时请求，避免旧结果覆盖当前页面。

## 数据模型

```text
Workspace { projectId, projects[] }
Project   { id, name, destination, start?, center?, tags[], days[] }
Tag       { id, label, color, icon }
Day       { date, stops[], legModes? }
Stop      { id, name, address, lat, lon, type, time, note?, osmType?, osmId? }
```

每个项目独立拥有日期、地点和标签。`legModes` 是以相邻地点 ID 组成的键映射到 `pedestrian`、`bicycle` 或 `auto`，重排或删除地点后会清理不再相邻的键；旧版项目的全局 `mode` 会迁移到逐段选择。内置标签是初始值，自定义标签用图标库 ID 与预设色值存储，渲染时只使用受控 SVG 路径。用户输入的名称、备注、地点地址进入 HTML 和 SVG 时会转义。地图点选优先用 Photon 反查得到名称与地址，但坐标保留为用户点击的位置。

导出大纲为可打印 HTML。生成前按天调用同一套路线计算逻辑，将每段道路距离、预计时间及静态标签和交通 SVG 图标写入文档；路线失败时显示“道路距离暂不可用”，不把直线距离冒充道路距离。导出地图以全旅程地点与已取得的路线坐标计算 Mercator 范围，绘制每一天的标记和逐段路线；线路颜色对应出行方式，日期颜色对应地点标记。路线不可用时以虚线连接相邻地点，并在图注中说明。输出 SVG 不含瓦片，避免将在线瓦片预取或批量打包到离线文件。

行程项目允许保存空数组；删除最后一份行程时页面进入空状态。项目编辑沿用新建表单，更新名称、目的地、出发日期和天数；缩短天数需要确认，且只更新仍使用自动日期名称的天数，保留用户自定义日期名称。

## 演示服务边界与上线工作

Photon 的[项目说明](https://github.com/komoot/photon/blob/master/README.md)没有可用性保证，过量请求会被限流。Valhalla 的[项目说明](https://valhalla.github.io/valhalla/)把公开实例定位为演示服务。OpenStreetMap [瓦片政策](https://operations.osmfoundation.org/policies/tiles/)要求可见署名、合理缓存并禁止批量预取。因此当前方案适合本地评审；正式对外开放前，应选择有服务承诺的地图、地理编码与路线提供方，接入正式后端和账号数据存储，并根据目标地区、预期用量核算费用。

路线服务在部分地区或出行方式下可能找不到可达道路；页面会明确显示失败。预计时间只描述路线服务给出的路途耗时，尚未建模停留、营业时间、排队、交通限制或实时路况。
