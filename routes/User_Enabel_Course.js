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

route.post("/EnabelCouser", auth, async (req, res) => {
  const { uid, tid, week, day } = req.body;
  let conn;

  try {
    conn = await pool.getConnection();
    const sql =
      "INSERT INTO User_Enabel_Course (uid, tid, week, day, is_success) VALUES (?, ?, ?, ?, 0)";
    await conn.query(sql, [uid, tid, week, day]);
    res.status(200).json({ message: "Course enabled successfully" });
  } catch (error) {
    console.error("Error enabling course:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (conn) conn.release(); // Release the database connection back to the pool
  }
});

route.post("/deleteUserCourse", async (req, res) => {
  const { uid, tid } = req.body;
  let conn;

  try {
    conn = await pool.getConnection();
    const sql = "DELETE FROM User_Enabel_Course WHERE uid = ? AND tid = ?";
    await conn.query(sql, [uid, tid]);
    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (conn) conn.release(); // Release the database connection back to the pool
  }
});

route.get("/getUserEnCouser", auth, async (req, res) => {
  let conn;
  try {
    // Extract uid and tid from query parameters
    const { uid, tid } = req.query;

    // Ensure uid and tid are provided
    if (!uid || !tid) {
      return res.status(400).json({ error: "uid and tid are required" });
    }

    // Establish a database connection
    conn = await pool.getConnection();

    // Prepare the SQL query
    const sql =
      "SELECT * FROM User_Enabel_Course WHERE uid = ? AND tid = ? AND week = 1 AND day =1";
    const rows = await conn.query(sql, [uid, tid]);

    // Send the retrieved data back to the client
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching user-enabled course:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    // Ensure the connection is closed
    if (conn) {
      conn.release();
    }
  }
});
route.get("/getIsNotSuccesUserEnCouserbyWeek", auth, async (req, res) => {
  let conn;
  try {
    // Extract uid and tid from query parameters
    const { uid, tid, week } = req.query;

    // Ensure uid and tid are provided
    if (!uid || !tid) {
      return res.status(400).json({ error: "uid and tid are required" });
    }

    // Establish a database connection
    conn = await pool.getConnection();

    // Prepare the SQL query
    const sql =
      "SELECT * FROM User_Enabel_Course WHERE uid = ? AND tid = ? AND week = ?  AND is_success != 1 ORDER BY utid     ";
    const rows = await conn.query(sql, [uid, tid, week]);

    // Send the retrieved data back to the client
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching user-enabled course:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    // Ensure the connection is closed
    if (conn) {
      conn.release();
    }
  }
});
route.get("/getNotSuccesUserEnCouser", auth, async (req, res) => {
  let conn;
  try {
    // Extract uid and tid from query parameters
    const { uid, tid } = req.query;

    // Ensure uid and tid are provided
    if (!uid || !tid) {
      return res.status(400).json({ error: "uid and tid are required" });
    }

    // Establish a database connection
    conn = await pool.getConnection();

    // Prepare the SQL query
    const sql =
      "SELECT * FROM User_Enabel_Course WHERE uid = ? AND tid = ?  AND is_success = 0 ORDER BY utid ";
    const rows = await conn.query(sql, [uid, tid]);

    // Send the retrieved data back to the client
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching user-enabled course:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    // Ensure the connection is closed
    if (conn) {
      conn.release();
    }
  }
});

route.get("/getFixUserEnCouser", async (req, res) => {
  let conn;
  try {
    // Extract uid and tid from query parameters
    const { uid, tid } = req.query;

    // Ensure uid and tid are provided
    if (!uid || !tid) {
      return res.status(400).json({ error: "uid and tid are required" });
    }

    // Establish a database connection
    conn = await pool.getConnection();

    // Prepare the SQL query
    const sql =
      "SELECT * FROM User_Enabel_Course WHERE uid = ? AND tid = ? AND  week_start_date IS NOT NULL   AND is_success = 0 ORDER BY utid  ";
    const rows = await conn.query(sql, [uid, tid]);

    // Send the retrieved data back to the client
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching user-enabled course:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    // Ensure the connection is closed
    if (conn) {
      conn.release();
    }
  }
});

route.get("/getSuccesUserEnCouser", auth, async (req, res) => {
  let conn;
  try {
    // Extract uid and tid from query parameters
    const { uid, tid } = req.query;

    // Ensure uid and tid are provided
    if (!uid || !tid) {
      return res.status(400).json({ error: "uid and tid are required" });
    }

    // Establish a database connection
    conn = await pool.getConnection();

    // Prepare the SQL query
    const sql =
      "SELECT * FROM User_Enabel_Course WHERE uid = ? AND tid = ?  AND is_success = 1 ORDER BY utid ";
    const rows = await conn.query(sql, [uid, tid]);

    // Send the retrieved data back to the client
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching user-enabled course:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    // Ensure the connection is closed
    if (conn) {
      conn.release();
    }
  }
});

route.post("/updateWeekStartDate", auth, async (req, res) => {
  let conn;
  const { uid, tid, week, day } = req.body;

  if (!uid || !tid || !week || !day) {
    return res.status(400).json({ error: "utid is required" });
  }

  try {
    conn = await pool.getConnection();
    const sql =
      "UPDATE User_Enabel_Course SET week_start_date = NOW() WHERE uid = ? AND tid = ? AND `week` = ? AND `day` =?";
    await conn.query(sql, [uid, tid, week, day]);
    res.status(200).json({ message: "Date updated successfully" });
  } catch (error) {
    console.error("Error updating week:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (conn) conn.release(); // Release the database connection back to the pool
  }
});

route.post("/updateIsSuccess", auth, async (req, res) => {
  let conn;
  const { uid, tid, week, day } = req.body;

  if (!uid || !tid || !week || !day) {
    return res.status(400).json({ error: "utid is required" });
  }

  try {
    conn = await pool.getConnection();
    const sql =
      "UPDATE User_Enabel_Course SET is_success = 1 WHERE uid = ? AND tid =? AND `week` = ? AND `day` =?";
    await conn.query(sql, [uid, tid, week, day]);
    res.status(200).json({ message: "is_success updated successfully" });
  } catch (error) {
    console.error("Error is_sucess:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (conn) conn.release(); // Release the database connection back to the pool
  }
});

route.get("/getWeek", auth, async (req, res) => {
  let conn;
  try {
    const { uid, tid, week, day } = req.query;
    if (!uid || !tid || !week || !day) {
      return res.status(400).json({ error: "uid and tid are required" });
    }

    conn = await pool.getConnection();
    const sql = `
          SELECT DATEDIFF(NOW(), week_start_date) DIV 7 AS weeks_diff
          FROM User_Enabel_Course
          WHERE uid = ?
            AND tid = ?
            AND week = ?
            AND day = ?
      `;
    const rows = await conn.query(sql, [uid, tid, week, day]);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching week difference:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (conn) conn.release();
  }
});

route.get("/countSuccessUserEnCourse", auth, async (req, res) => {
  let conn;
  try {
    // Extract uid and tid from query parameters
    const { uid, tid } = req.query;

    // Ensure uid and tid are provided
    if (!uid || !tid) {
      return res.status(400).json({ error: "uid and tid are required" });
    }

    // Establish a database connection
    conn = await pool.getConnection();

    // Prepare the SQL query
    const sql =
      "SELECT COUNT(*) as count FROM User_Enabel_Course WHERE uid = ? AND tid = ? AND is_success = 1";
    const [rows] = await conn.query(sql, [uid, tid]);

    // Send the retrieved data back to the client
    res
      .status(200)
      .json({ ...rows[0], message: "is_success updated successfully" });
  } catch (error) {
    console.error("Error fetching user-enabled course:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    // Ensure the connection is closed
    if (conn) {
      conn.release();
    }
  }
});

module.exports = route;
