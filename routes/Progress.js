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

// route.get("/getAllProgress", async (req, res) => {
//   let conn;
//   try {
//     conn = await pool.getConnection();
//     const rows = await conn.query("SELECT * FROM Progress");
//     console.log(rows);
//     res.status(200).send(rows);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal Server Error" });
//   } finally {
//     if (conn) {
//       conn.release(); // Release the database connection back to the pool
//     }
//   }
// });

route.post("/weightInsert", auth, async (req, res) => {
  const { uid, weight } = req.body;

  let conn;
  try {
    conn = await pool.getConnection();
    // Insert weight data into the database
    const result = await conn.query(
      "INSERT INTO Progress (uid, weight, data_progress) VALUES (?, ?, NOW())",
      [uid, weight]
    );
    res.status(200).json({
      message: "Weight inserted successfully",
      weightId: result.insertId.toString(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (conn) conn.end();
  }
});

route.get("/getWeightProgress", auth, async (req, res) => {
  let conn;
  try {
    const { uid } = req.query; // Retrieve the uid from query parameters

    if (!uid) {
      return res.status(400).json({ error: "Bad Request: Missing uid" });
    }

    conn = await pool.getConnection();
    const rows = await conn.query(
      `SELECT weight, 
              CONVERT_TZ(data_progress, '+00:00', '+07:00') AS data_progress_thai
       FROM Progress
       WHERE uid = ?
         AND weight IS NOT NULL
       ORDER BY data_progress_thai`,
      [uid]
    );
    console.log(rows);
    res.status(200).json(rows); // Changed from send to json for consistency
  } catch (error) {
    console.error("Database Query Error: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (conn) {
      conn.release(); // Release the database connection back to the pool
    }
  }
});

route.post("/updateWeigth", auth, async (req, res) => {
  const { newWeight, uid, dataProgress } = req.body;

  if (!uid || !dataProgress || !newWeight) {
    return res
      .status(400)
      .json({ error: "Bad Request: Missing required parameters" });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // Update weight data in the database
    const result = await conn.query(
      "UPDATE Progress SET weight = ? WHERE uid = ? AND data_progress LIKE ?",
      [newWeight, uid, `%${dataProgress}%`]
    );

    if (result.affectedRows > 0) {
      res.status(200).json({ message: "Weight updated successfully" });
    } else {
      res.status(404).json({ error: "No matching record found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (conn) conn.release(); // Release the database connection back to the pool
  }
});

module.exports = route;
