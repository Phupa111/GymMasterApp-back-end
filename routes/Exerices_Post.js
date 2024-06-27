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
route.get('/getExPost', async (req, res) => {
    let conn;
    const { tid, dayNum } = req.query; // Extract tid and dayNum from query parameters
  
    // Validate query parameters
    if (!tid || !dayNum) {
      return res.status(400).json({ error: 'tid and dayNum are required' });
    }
  
    try {
      conn = await pool.getConnection();
      const query = `
        SELECT ep.*
        FROM exercise_posture ep
        LEFT JOIN Coures_ex_post cep ON ep.eid = cep.eid AND cep.tid = ? AND cep.Day_Num = ?
        WHERE cep.eid IS NULL;
      `;
      const rows = await conn.query(query, [tid, dayNum]); // Pass tid and dayNum as parameters to the query
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
  });
  

module.exports = route;