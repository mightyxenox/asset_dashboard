const express = require('express');
const app = express();
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config(); 
app.use(cors({
  origin: 'https://asset-dashboard-lime.vercel.app',
  credentials: true,
}));

const connectDB = require('./scylla_db/db_connect');
connectDB();

app.use(express.json());

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

// STEP 4 - Add per-user rate limiting (OPTIONAL but good)
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per user
  keyGenerator: (req, res) => {
    // Use user ID from token if available, otherwise use IP
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        return payload.user_id || payload.userId || req.ip;
      }
    } catch (err) {
      // Fallback to IP if token parsing fails
    }
    return req.ip;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

app.use('/api', limiter);

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
});