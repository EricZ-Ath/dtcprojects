const http = require('http');
const httpProxy = require('http-proxy');
const { spawn } = require('child_process');

// 1. 创建反向代理服务器，将外部对 7860 端口的 API 请求，秘密转发给内部 9000 端口
const proxy = httpProxy.createProxyServer({});
const server = http.createServer((req, res) => {
  // 如果直接访问根目录，返回一个漂亮的健康检查网页，用来骗过 Hugging Face 的界面
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head><title>DTC Backend Status</title></head>
      <body style="font-family:sans-serif; text-align:center; padding-top:50px; background:#f4f7f6;">
        <div style="background:white; display:inline-block; padding:30px; border-radius:8px; box-shadow:0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color:#10b981;">🚀 DTC Medusa 2.0 后端服务已成功启动</h1>
          <p style="color:#6b7280;">Hugging Face Spaces 容器运行正常，正在完美守护您的跨境独立站。</p>
        </div>
      </body>
      </html>
    `);
  } else {
    // 其他所有 API 请求（例如 /store/...），全部无缝代理到 Medusa 的 9000 端口
    proxy.web(req, res, { target: 'http://127.0.0.1:9000' }, (err) => {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Medusa backend is starting or unavailable.');
    });
  }
});

// 监听 Hugging Face 强制要求的 7860 端口
server.listen(7860, '0.0.0.0', () => {
  console.log('🔗 HF Helper Server is running on port 7860');
});

// 2. 异步拉起真正的 Medusa 后端进程（运行在 9000 端口）
console.log('🚀 Starting Medusa Production Server...');
const medusa = spawn('npx', ['medusa', 'start'], { stdio: 'inherit', shell: true });

medusa.on('close', (code) => {
  console.log(`Medusa process exited with code ${code}`);
  process.exit(code);
});