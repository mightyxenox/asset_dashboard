const express = require('express');
const app = express();
const cors = require('cors');
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
    console.log(`Server is running on port ${PORT}`);
});