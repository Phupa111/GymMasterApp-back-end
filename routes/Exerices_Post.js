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
route.get("/getExPosts", auth, async (req, res) => {
  let conn;
  const { tid, dayNum, nameFilter, equipmentFilter, muscleFilter } = req.query; // Extract tid and dayNum from query parameters

  // Validate query parameters
  if (!tid || !dayNum) {
    return res.status(400).json({ error: "tid and dayNum are required" });
  }

  try {
    conn = await pool.getConnection();
    const query = `
   SELECT ep.*, eqp.Name AS equipment
FROM exercise_posture ep
LEFT JOIN Equiment  eqp ON ep.eqid = eqp.eqid
LEFT JOIN Coures_ex_post cep 
    ON ep.eid = cep.eid 
    AND cep.tid = ?
    AND cep.Day_Num = ?
WHERE cep.eid IS NULL
  AND ep.name LIKE ?
      AND eqp.eqid LIKE ?
      AND ep.muscle LIKE ?

 
    `;
    const rows = await conn.query(query, [
      tid,
      dayNum,
      `%${nameFilter || ""}%`,
      `%${equipmentFilter || ""}%`,
      `%${muscleFilter || ""}%`,
    ]); // Pass tid and dayNum as parameters to the query
    console.log(rows);
    res.status(200).send(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (conn) {
      conn.release(); // Release the database connection back to the pool
    }
  }
});

route.get("/getEqiumentList", auth, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = "SELECT * FROM Equiment";
    const rows = await conn.query(query);
    console.log(rows);
    res.status(200).send(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (conn) {
      conn.release(); // Release the database connection back to the pool
    }
  }
});

module.exports = route;
