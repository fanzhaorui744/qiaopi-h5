'use strict';

// ============================================================
// 侨批 H5 - API 代理（阿里云函数计算 FC 3.0 · Node.js 20 · ES Module）
// 前端 -> FC(本函数) -> vulcanapi.com
// 关键：FC 3.0 Node.js 运行时 event 参数是 Buffer（JSON 字节），
//       必须 toString('utf8') 后再 JSON.parse。
// ============================================================

const UPSTREAM = 'https://vulcanapi.com/v1/chat/completions';

export async function handler(event, context) {
  try {
    // event 可能是 Buffer / JSON 字符串 / 已解析对象，统一转成对象
    let raw = event;
    if (Buffer.isBuffer(raw)) raw = raw.toString('utf8');

    let req;
    if (typeof raw === 'string') {
      req = JSON.parse(raw);
    } else if (raw && typeof raw === 'object') {
      req = raw;
    } else {
      req = {};
    }

    // FC 3.0: requestContext.http.method；FC 2.0: httpMethod；读不到默认 POST
    const httpInfo = (req.requestContext && req.requestContext.http) || {};
    let method = String(httpInfo.method || req.httpMethod || '').toUpperCase();
    if (!method) method = 'POST';

    // CORS 预检
    if (method === 'OPTIONS') {
      return corsResponse(200, '');
    }

    // 只允许 POST
    if (method !== 'POST') {
      return corsResponse(405, JSON.stringify({ error: 'Method Not Allowed' }));
    }

    // 大小写不敏感地取出 Authorization（FC 3.0 会把 Header 键首字母大写）
    const hdrs = req.headers || {};
    let auth = '';
    for (const k of Object.keys(hdrs)) {
      if (String(k).toLowerCase() === 'authorization') {
        auth = hdrs[k];
        break;
      }
    }

    const upstreamResp = await fetch(UPSTREAM, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': auth
      },
      body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {})
    });

    const text = await upstreamResp.text();
    return {
      statusCode: upstreamResp.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: text,
      isBase64Encoded: false
    };
  } catch (err) {
    return corsResponse(502, JSON.stringify({ error: String(err && err.message ? err.message : err) }));
  }
}

function corsResponse(status, body) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
    body: body,
    isBase64Encoded: false
  };
}
