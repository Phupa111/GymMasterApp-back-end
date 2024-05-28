const mariadb = require('mariadb')
const dotenv = require('dotenv')
const express = require('express')

dotenv.config();

const route = express.Router();

const pool = mariadb.createPool({
    host : process.env.GYMMASTER_HOST,
    user : process.env.GYMMASTER_USER,
    password : process.env.GYMMASTER_PASSWORD,
    database : process.env.GYMMASTER_DB,
    connectionLimit : 5
})

route.get('/getAdminTabel',async (req, res)=>{
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM Training_Couser Where isCreateByAdmin = 1");
        console.log(rows);
        res.status(200).send(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) {
            conn.release(); // Release the database connection back to the pool
        }
    }
})


route.post('/CreatTabel', async (req, res) => {
    const { uid, couserName, times, gender, level, description, isCreateByAdmin, dayPerWeek } = req.body;
    let conn;

    try {
        conn = await pool.getConnection();

        const sql = `INSERT INTO Training_Couser (uid, couserName, times, gender, level, description, isCreateByAdmin, dayPerWeek) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        const result = await conn.query(sql, [uid, couserName, times, gender, level, description, isCreateByAdmin, dayPerWeek]);

        // Log the result to inspect its structure
        console.log(result);

        // Convert BigInt values in the result to strings if needed
        const resultStringified = JSON.parse(JSON.stringify(result, (key, value) => 
            typeof value === 'bigint' ? value.toString() : value
        ));

        res.status(200).json({ success: true, message: 'Data inserted successfully', result: resultStringified });
    } catch (err) {
        console.error(err); // Log the error for debugging
        res.status(500).json({ success: false, message: 'Error inserting data', error: err.message });
    } finally {
        if (conn) conn.release(); // Always release the connection back to the pool
    }
});


module.exports = route;
