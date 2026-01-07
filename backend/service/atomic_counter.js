const db = require('../scylla_db/db_connect');

const getAtomicCounter = async (key) => {
  try {
    await db.execute(
      'INSERT INTO COUNTER (partition_key, value) VALUES (?, ?) IF NOT EXISTS',
      [key, 0],
      { prepare: true }
    );
  } catch (err) {
    console.log(`Counter key "${key}" may already exist:`, err.message);
  }

  let applied = false;
  let retries = 0;

  while (!applied && retries < 10) {
    retries++;
    try {
      const result = await db.execute(
        'SELECT value FROM COUNTER WHERE partition_key = ?',
        [key],
        { prepare: true }
      );

      if (result.rowLength === 0) {
        throw new Error('Counter not found');
      }

      const counter = result.first().value;
      const new_counter = counter + 1;

      const res = await db.execute(
        'UPDATE COUNTER SET value = ? WHERE partition_key = ? IF value = ?',
        [new_counter, key, counter],
        { prepare: true }
      );

      if (res?.rows?.[0]?.['[applied]']) {
        applied = true;
        return new_counter;
      }
    } catch (err) {
      console.log('Atomic counter retry failed:', err.message);
    }

    await new Promise(resolve => setTimeout(resolve, 50)); // Add delay
  }

  throw new Error('Atomic counter update failed after 10 retries');
};

module.exports = getAtomicCounter;