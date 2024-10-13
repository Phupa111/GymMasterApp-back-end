const mariadb = require("mariadb");
const dotenv = require("dotenv");
const express = require("express");
const auth = require("../middleware/auth.js");
dotenv.config();

const route = express.Router();

const pool = mariadb.createPool({
  host: process.env.GYMMASTER_HOST,
  user: process.env.GYMMASTER_USER,
  password: process.env.GYMMASTER_PASSWORD,
  database: process.env.GYMMASTER_DB,
  connectionLimit: 5,
});

route.post('/delete',auth ,async (req,res)=>{
  const {uid} = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    const sql = `DELETE FROM User WHERE User.uid = ?`;
    const result = await conn.query(sql,[uid]);

    res.status(200).json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error("Error delete user:", error);
    res.status(500).json({ error: "Failed to delete user => "+ error });
  }finally{
    if(conn) conn.release();
  }
});

module.exports = route;