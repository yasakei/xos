const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Proxy API requests to the backend
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
}));

// Serve static frontend files
app.use(express.static('dist'));

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`Proxy server listening on http://0.0.0.0:${port}`);
});