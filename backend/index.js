const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config(); 

// Trust proxy so we get real IPs
app.set('trust proxy', 1);

app.use(cors({
  origin: 'https://asset-dashboard-lime.vercel.app',
  credentials: true,
}));

// Disable rate limiting headers for Render
app.use((req, res, next) => {
  res.set('X-RateLimit-Bypass', 'true');
  res.set('Retry-After', '');
  next();
});

const connectDB = require('./scylla_db/db_connect');
connectDB();

app.use(express.json());

// Log all OPTIONS requests and requests to debug 429
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    console.log(`[OPTIONS] ${req.path} - Preflight request`);
  }
  
  const originalSend = res.send;
  res.send = function(data) {
    if (res.statusCode >= 400) {
      console.log(`[${req.method}] ${req.path} - Status ${res.statusCode}`, typeof data === 'string' ? data.substring(0, 100) : data);
    }
    return originalSend.call(this, data);
  };
  
  next();
});

// STEP 1 - Disable ETag globally (MANDATORY)
app.set("etag", false);

// STEP 2 - Disable caching headers globally (MANDATORY)
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

app.use('/api', require('./routes/qty_routes'));

app.use('/api', require('./routes/asset_list_routes'));

app.use('/api', require('./routes/list_routes'));

app.use('/api', require('./routes/assets_routes'));

app.use('/api', require('./routes/coin_routes'));

app.use('/api', require('./routes/auth_routes'));

app.use('/api', require('./routes/dashboard_routes'));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
});