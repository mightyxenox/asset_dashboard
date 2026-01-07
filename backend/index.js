const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config(); 
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

const connectDB = require('./scylla_db/db_connect');
connectDB();

app.use(express.json());

app.use('/api', require('./routes/qty_routes'));

app.use('/api', require('./routes/asset_list_routes'));

app.use('/api', require('./routes/list_routes'));

app.use('/api', require('./routes/assets_routes'));

app.use('/api', require('./routes/coin_routes'));

app.use('/api', require('./routes/auth_routes'));

app.use('/api', require('./routes/dashboard_routes'));

app.listen(8000, () => {
    console.log("Server is running on port 8000");
});