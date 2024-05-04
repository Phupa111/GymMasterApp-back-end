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
module.exports = route;