const cassandra = require('cassandra-driver');

const db = new cassandra.Client({
  contactPoints: ['127.0.0.1'],
  localDataCenter: 'datacenter1',
  keyspace: 'assets_db',   
});

db.connect().then(() => {
    console.log('Connected to ScyllaDB');
  })
  .catch((error) => {
    console.error('Failed to connect to ScyllaDB:', error);
});

module.exports = db;