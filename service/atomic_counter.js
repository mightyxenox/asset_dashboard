const db = require('../scylla_db/db_connect');

const getAtomicCounter = async (key)=>{
    let applied =false;
    try{ await db.execute(
        `INSERT INTO COUNTER (partition_key, value) VALUES (?, ?)`,
        [key,0],
        { prepare: true }
     )
    }
    catch(err){
        console.log('table already exists:', err.message);
    }
    while(!applied){
        try{
            const result = await db.execute(
                'SELECT value FROM COUNTER WHERE partition_key = ?',
                [key],
                { prepare: true }
            );
            if(result.rowLength === 0){
                throw new Error('Counter not found');
            }
            const counter = result.first().value;
            const new_counter = counter + 1;
            const res = await db.execute(
                'UPDATE COUNTER SET VALUE= ? WHERE PARTITION_KEY=? IF value = ?',
                [new_counter,key,counter],
                { prepare: true }
            )
            if(res && res.rows && res.rows[0] && res.rows[0]['[applied]']){
                applied = true;
                console.log('counter updated successfully');
                return new_counter;
            }
        }
        catch(err){
            console.log('fetching atomic counter failed, error:',err);
        }
    }
}
module.exports = getAtomicCounter;