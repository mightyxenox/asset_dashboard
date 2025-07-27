const db = require('./db_connect');

async function Schema() {
  await db.execute('USE assets_db;');

  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      username   TEXT PRIMARY KEY,
      user_id    INT,
      email      TEXT,
      password   TEXT,
      full_name  TEXT
    );
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS wallet_assets (
      user_id        INT,
      wallet_name    TEXT,
      coin_name    TEXT,
      qty            DOUBLE,
      avg_price      DOUBLE,
      total_invested DOUBLE,
      realised_pnl   DOUBLE,
      PRIMARY KEY ((user_id), wallet_name, coin_name)
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS coin_assets (
      user_id        INT,
      coin_name    TEXT,
      wallet_name    TEXT,
      qty            DOUBLE,
      avg_price      DOUBLE,
      total_invested DOUBLE,
      realised_pnl   DOUBLE,
      PRIMARY KEY ((user_id), coin_name, wallet_name)
    );
  `);  
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_summary (
      user_id      INT PRIMARY KEY,
      realised_pnl DOUBLE
    );
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS asset_transactions (
      user_id      INT,
      wallet_name  TEXT,
      coin_name    TEXT,
      qty          DOUBLE,
      price        DOUBLE,
      action       TEXT,
      timestamp    TIMESTAMP,
      PRIMARY KEY ((user_id), timestamp, coin_name)
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS COUNTER (
      partition_key TEXT PRIMARY KEY,
      value         INT
    );
  `);

  console.log(' All tables created successfully.');
}

module.exports = Schema;