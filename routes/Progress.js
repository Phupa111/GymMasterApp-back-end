const mariadb = require('mariadb')
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

route.get('/GetProgressUser/:uid',auth ,async (req, res)=>{
  let conn;
  const uid = req.params.uid;
  try {
    conn = await pool.getConnection();
    const sql =`SELECT Progress.pid, Progress.uid, Progress.weight, Progress.picture, Progress.data_progress
                FROM Progress
                WHERE Progress.uid = ?
                AND Progress.picture IS NOT NULL`;
    const result = await conn.query(sql,[uid]);
    if (result.length > 0) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ error: "No matching record found" });
    }
  } catch (error) {
    console.log("Error to request: ",error);
    res.status(500).json({error:"Failed to Request "+error})
  }finally {
    if (conn) conn.release();
  }
});

route.post('/deleteImageProgress',auth ,async(req, res)=>{
  const {uid,pid} = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    const deleteImageSql = `DELETE FROM Progress 
                          WHERE Progress.pid = ?
                          AND Progress.uid = ?`;
    const result =await conn.query(deleteImageSql,[pid,uid]);


      console.log("Image deleted successfully");
      console.log(result);
      res.status(200).json(1);
    
  } catch (error) {
    res.status(500).json({ error: "Failed to delete" });
  } finally {
    if (conn) conn.release();
  }
});

route.post('/setBefore' ,async (req, res)=>{
  const {uid,pid} = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    
    const checkBefore = `SELECT Progress.pid, Progress.uid, Progress.isBefore
                         FROM Progress
                         WHERE uid = ?
                         AND Progress.isBefore IS NOT NULL`;
    const record = await conn.query(checkBefore, [uid]);

    // กรณีที่มีเรคอร์ดที่ `isBefore` อยู่แล้ว
    if (record.length > 0) {
      // รีเซ็ตค่า `isBefore` ของเรคอร์ดนั้นให้เป็น NULL
      const resetBeforeQuery = `UPDATE Progress
                                SET isBefore = NULL
                                WHERE uid = ?
                                AND isBefore = 1`;
      await conn.query(resetBeforeQuery, [uid]);

      // ตั้งค่า `isBefore` เป็น 1 ในเรคอร์ดใหม่
      const setBeforeQuery = `UPDATE Progress 
                              SET isBefore = 1 
                              WHERE uid = ?
                              AND pid = ?`;
      await conn.query(setBeforeQuery, [uid, pid]);

      res.status(200).json({ message: 'isBefore has been reset and set successfully.' });
    } else {
      // กรณีที่ไม่มีเรคอร์ด `isBefore` อยู่แล้ว
      const setBeforeQuery = `UPDATE Progress 
                              SET isBefore = 1 
                              WHERE uid = ?
                              AND pid = ?`;
      await conn.query(setBeforeQuery, [uid, pid]);

      res.status(200).json({ message: 'isBefore has been set successfully.' });
    }
  } catch (error) {
    console.log("Error to request: ",error);
    res.status(500).json({error:"Failed to set image to Beofre => ",error});
  }
  finally{
    if(conn) conn.release();
  }
});

route.get('/getLatestProgress/:uid', async (req,res)=>{
  let conn;
  const uid = req.params.uid;

  try {
    conn = await pool.getConnection();
    const sql = `SELECT Progress.pid, Progress.uid, Progress.picture, Progress.data_progress
                FROM Progress
                Where uid = ?
								AND Progress.data_progress = (
                        SELECT MAX(data_progress)
                        FROM Progress
                        WHERE Progress.uid = ?
                    )
                AND Progress.picture IS NOT NULL`;

    const result = await conn.query(sql,[uid,uid]);

    if (result.length > 0) {
      console.log("send complete1");
      res.status(200).json(result);
    } else {
      res.status(400).json();
    }
  } catch (error) {
    console.log("Error to request: ",error);
    res.status(500).json({error:"Failed to get latest image => ",error});
  } finally {
    if(conn) conn.release();
  }
});

route.get('/getBeforeProgress/:uid',async(req,res)=>{
  let conn;
  const uid = req.params.uid;
  try {
    conn = await pool.getConnection();
    const sql = `SELECT Progress.pid, Progress.uid, Progress.isBefore, Progress.picture, Progress.data_progress
                  FROM Progress
                  WHERE uid = ?
                  AND Progress.isBefore = 1`;

    const result = await conn.query(sql,[uid]);
    if (result.length > 0) {
      console.log("send complete2");
      res.status(200).json(result);
    } else {
      res.status(400).json();
    }
  } catch (error) {
    
  } finally {
    if(conn) conn.release();
  }
});


module.exports = route;
