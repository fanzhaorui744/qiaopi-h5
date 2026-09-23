// 侨批 H5 - API 代理 Worker
// 部署到 Cloudflare Workers，然后把前端 SCAN_API 改成你的 Worker 地址
// 免费额度：每天 10 万次请求

export default {
  async fetch(request) {
    // 处理 CORS 预检
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    // 只允许 POST
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // 转发到 vulcanapi
    const targetUrl = 'https://vulcanapi.com/v1/chat/completions';
    const newRequest = new Request(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: request.body,
    });

    try {
      const response = await fetch(newRequest);
      const text = await response.text();
      return new Response(text, {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
  }
}
