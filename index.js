const express = require('express');
const app = express();
require('dotenv').config(); 
const Schema = require('./scylla_db/schema');
Schema();

app.use(express.json());

app.use('/api', require('./routes/list_routes'));

app.use('/api', require('./routes/assets_routes'));

app.use('/api', require('./routes/coin_routes'));

app.use('/api', require('./routes/auth_routes'));

app.use('/api', require('./routes/dashboard_routes'));

app.listen(8000, () => {
    console.log("Server is running on port 8000");
});