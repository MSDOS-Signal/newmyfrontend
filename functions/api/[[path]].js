export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // 转发到你的后端服务器
  const backendUrl = "http://47.98.181.100:8080" + url.pathname + url.search;

  return fetch(backendUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: "follow"
  });
}
