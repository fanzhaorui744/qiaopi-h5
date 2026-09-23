# 侨批 H5 - 阿里云函数计算(FC)代理部署说明

## 为什么
原方案把代理部署在 Cloudflare `workers.dev`，该域名在中国大陆被阻断，前端连不上。
`vulcanapi.com` 直连会被浏览器 CORS 拦截（OPTIONS 返回 403）。
因此需要把代理放到**大陆可直连**的国内云函数上。本目录即阿里云 FC 版代理。

## 免费额度
- 每月 100 万次函数调用 + 40 万 CU·秒 算力（所有用户）
- 公网出流量：CDT 200GB/月共享额度
- 首次开通另有试用 CU 包（本账号已领取，见控制台"试用资源"）

## 已部署信息
- 地域：华东1（杭州）
- 函数名：`qiaopi-proxy`（事件函数，Node.js 20，入口 `index.handler`）
- HTTP 触发器（无需认证）访问 URL：
  `https://qiaopi-proxy-glfhwtdxma.cn-hangzhou.fcapp.run/`
- 前端 `index.html` 的 `SCAN_API` 已指向该 URL

## 踩坑记录（重要，改代码时注意）
FC 3.0 内置运行时 + 事件函数 + HTTP 触发器的三个坑：
1. **代码按 ES Module（.mjs）加载**：必须 `export async function handler(...)`，
   不能用 `exports.handler`（否则报 `exports is not defined in ES module scope`）。
2. **event 参数是 Buffer**：必须 `Buffer.isBuffer(event)` 后 `toString('utf8')`
   再 `JSON.parse`，否则读不到 requestContext/headers/body。
3. **请求方法位置**：FC 3.0 在 `event.requestContext.http.method`（FC 2.0 才是顶层
   `httpMethod`）；读不到时本项目兜底按 POST 处理（前端只发 POST + OPTIONS 预检）。
4. **Header 键会被规范化首字母大写**：取 Authorization 要大小写不敏感遍历。

## 本目录文件
- `index.js` —— 最终可部署代码（已通过完整链路实测）
- 部署：控制台「代码」页签整体粘贴 → 部署代码

## 验证结果（2026-09-23）
- 纯文本请求（hi）：HTTP 200，GLM 正常回复
- 带图片请求（OCR+翻译+文白结合）：HTTP 200，三段式输出正确
- CORS 预检：204，浏览器可直接调用
