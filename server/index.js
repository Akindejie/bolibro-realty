// Fallback server in case TypeScript compilation fails
const express = require('express');
const app = express();
const port = process.env.PORT || 3001;

app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message:
      'This is a fallback server. TypeScript compilation may have failed.',
    environment: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Fallback server is running',
    timestamp: new Date().toISOString(),
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Fallback server running on port ${port}`);
});
