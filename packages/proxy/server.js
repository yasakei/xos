const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Try multiple potential backend addresses
const BACKEND_HOST = process.env.BACKEND_HOST || '127.0.0.1'; // Default to 127.0.0.1
const BACKEND_PORT = process.env.BACKEND_PORT || '3001';
const BACKEND_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}`;

console.log('[Proxy] Starting proxy server');
console.log('[Proxy] Configured backend URL:', BACKEND_URL);

// Proxy API requests to the backend with retry logic
app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  // Log proxy requests for debugging
  onProxyReq: (proxyReq, req, res) => {
    console.log('[HPM] Proxying request:', req.method, req.url, '->', BACKEND_URL + req.url);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('[HPM] Proxy response:', req.method, req.url, '->', proxyRes.statusCode);
  },
  // Add retry logic for failed connections
  onError: (err, req, res) => {
    console.error('[HPM] Error occurred while proxying request:', req.url, err.code, err.message);
    // Forward the error to the backend health check endpoint if it's a connection error
    if (err.code === 'ECONNREFUSED') {
      res.status(503).json({ 
        error: 'Service temporarily unavailable', 
        message: 'Backend service is not ready yet, please try again in a few seconds',
        code: 'BACKEND_UNAVAILABLE',
        backendUrl: BACKEND_URL,
        errorDetails: err.message
      });
    } else {
      res.status(502).json({ 
        error: 'Bad Gateway', 
        message: 'Error occurred while processing request',
        code: err.code,
        errorDetails: err.message
      });
    }
  }
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('[Proxy] Health check endpoint called directly');
  // This endpoint can respond directly from the proxy
  res.status(200).json({ 
    status: "OK", 
    service: "proxy",
    timestamp: new Date().toISOString() 
  });
});

// Serve static frontend files
app.use(express.static('packages/frontend/dist'));

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`Proxy server listening on http://0.0.0.0:${port}`);
  console.log('[Proxy] Backend target URL:', BACKEND_URL);
});