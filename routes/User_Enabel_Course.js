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

route.post('/EnabelCouser', async (req, res) => {
    const { uid, tid, week, day } = req.body;
    let conn;
  
    try {
      conn = await pool.getConnection();
      const sql = 'INSERT INTO User_Enabel_Course (uid, tid, week, day) VALUES (?, ?, ?, ?)';
      await conn.query(sql, [uid, tid, week, day]);
      res.status(200).json({ message: 'Course enabled successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      if (conn) conn.release(); // Release the database connection back to the pool
    }
  });
  

  route.post('/deleteUserCourse', async (req, res) => {
    const { uid, tid } = req.body;
    let conn;
  
    try {
      conn = await pool.getConnection();
      const sql = 'DELETE FROM User_Enabel_Course WHERE uid = ? AND tid = ?';
      await conn.query(sql, [uid, tid]);
      res.status(200).json({ message: 'Course deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      if (conn) conn.release(); // Release the database connection back to the pool
    }
  });


  route.get('/getUserEnCouser', async (req, res) => {
    let conn;
    try {
      // Extract uid and tid from query parameters
      const { uid, tid } = req.query;
  
      // Ensure uid and tid are provided
      if (!uid || !tid) {
        return res.status(400).json({ error: 'uid and tid are required' });
      }
  
      // Establish a database connection
      conn = await pool.getConnection();
  
      // Prepare the SQL query
      const sql = "SELECT * FROM User_Enabel_Course WHERE uid = ? AND tid = ?";
      const rows = await conn.query(sql, [uid, tid]);
  
      // Send the retrieved data back to the client
      res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching user-enabled course:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      // Ensure the connection is closed
      if (conn) {
        conn.release();
      }
    }
  });
  route.post('/updateDay', async (req, res) => {
    let conn;
    const { utid } = req.body;

    if (!utid) {
        return res.status(400).json({ error: 'utid is required' });
    }

    try {
        conn = await pool.getConnection();
        const sql = 'UPDATE User_Enabel_Course SET day = day + 1 WHERE utid = ?';
        await conn.query(sql, [utid]);
        res.status(200).json({ message: 'Day updated successfully' });
    } catch (error) {
        console.error('Error updating day:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release(); // Release the database connection back to the pool
    }
});

route.post('/updateWeek', async (req, res) => {
  let conn;
  const { utid } = req.body;

  if (!utid) {
      return res.status(400).json({ error: 'utid is required' });
  }

  try {
      conn = await pool.getConnection();
      const sql = 'UPDATE User_Enabel_Course SET week = week + 1, day = 1 WHERE utid = ?';
      await conn.query(sql, [utid]);
      res.status(200).json({ message: 'Week updated successfully' });
  } catch (error) {
      console.error('Error updating week:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  } finally {
      if (conn) conn.release(); // Release the database connection back to the pool
  }
});



module.exports = route;