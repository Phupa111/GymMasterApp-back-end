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


route.get('/getAdminTabel', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const query = `
          SELECT 
            tc.tid,
            tc.uid,
            tc.couserName,
            tc.times,
            tc.gender,
            tc.level,
            tc.description,
            tc.isCreateByAdmin,
            tc.dayPerWeek
          FROM 
            Training_Couser tc
          LEFT JOIN 
            User_Enabel_Course uec ON tc.tid = uec.tid
          WHERE 
            tc.isCreateByAdmin = 1
          AND 
            uec.tid IS NULL;
        `;
        const rows = await conn.query(query);
        console.log(rows);
        res.status(200).send(rows);
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) {
            conn.release(); // Release the database connection back to the pool
        }
    }
});


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

route.post('/getUnUesUserTabel', async (req, res) => {
    const { uid } = req.body;
    let conn;
    try {
      conn = await pool.getConnection();
      const query = `
        SELECT 
          tc.*
        FROM 
          Training_Couser tc
        LEFT JOIN 
          User_Enabel_Course uec ON tc.tid = uec.tid
        WHERE 
          tc.uid = ?
        AND 
          uec.tid IS NULL;
      `;
      const rows = await conn.query(query, [uid]);
      console.log(rows);
      res.status(200).send(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      if (conn) conn.release(); // Release the database connection back to the pool
    }
  });

  


  route.post('/getExercisesInTabel', async (req, res) => {
    const { tid, dayNum } = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query(
            "SELECT exercise_posture.eid, gif_image, exercise_posture.name, Coures_ex_post.set,Coures_ex_post.rep " +
            "FROM exercise_posture, Coures_ex_post " +
            "WHERE Coures_ex_post.eid = exercise_posture.eid " +
            "AND Coures_ex_post.tid = ? " +
            "AND Coures_ex_post.Day_Num = ?",
            [tid, dayNum]
        );
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

route.post('/addExPosttoTabel', async (req, res) => {
    const { tid, eid, dayNum, set, rep } = req.body;
    let conn;

    try {
        conn = await pool.getConnection();

        const query = "INSERT INTO Coures_ex_post (tid, eid, Day_Num, `set`, rep) VALUES (?, ?, ?, ?, ?)";
        const result = await conn.query(query, [tid, eid, dayNum, set, rep]);

        // Check if result is valid and extract insertId correctly
        if (result && result.affectedRows === 1) {
            res.json({
                success: true,
                message: 'Exercise post added to table successfully',
                result: {
                    insertId: Number(result.insertId)
                }
            });
        } else {
            throw new Error('Insert operation did not return expected result.');
        }
    } catch (error) {
        console.error('Error adding exercise post to table:', error.message);
        res.status(500).json({
            success: false,
            message: 'An error occurred while adding exercise post to table',
            error: error.message
        });
    } finally {
        if (conn) conn.release();
    }
});

route.post('/getEnnabelUserTabel', async (req, res) => {
  const { uid } = req.body;
  let conn;
  try {
      conn = await pool.getConnection();
      const query = `
          SELECT 
              tc.*, 
              COALESCE(uc.count, 0) AS count
          FROM 
              Training_Couser tc
          LEFT JOIN 
              (
                  SELECT 
                      uec.tid, 
                      COUNT(*) AS count
                  FROM 
                      User_Enabel_Course uec
                  WHERE 
                      uec.is_success = 1
                  GROUP BY 
                      uec.tid
              ) uc ON tc.tid = uc.tid
          WHERE 
              tc.uid = ?
              AND EXISTS (
                  SELECT 1
                  FROM User_Enabel_Course uec
                  WHERE 
                      uec.uid = ?
                      AND uec.tid = tc.tid
                      AND uec.week = 1
                      AND uec.day = 1
              );
      `;
      const rows = await conn.query(query, [uid, uid]);

      // Convert BigInt to Number
      const sanitizedRows = rows.map(row => {
          const newRow = { ...row };
          for (const key in newRow) {
              if (typeof newRow[key] === 'bigint') {
                  newRow[key] = Number(newRow[key]);
              }
          }
          return newRow;
      });

      console.log(sanitizedRows);
      res.status(200).json(sanitizedRows);
  } catch (error) {
      console.error('Error fetching enabled user table:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  } finally {
      if (conn) conn.release(); // Release the database connection back to the pool
  }
});


route.post('/getEnnabelAdminTabel', async (req, res) => {
    const { uid } = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
        const query = `
            SELECT 
                tc.*, 
                COALESCE(uc.count, 0) AS count
            FROM 
                Training_Couser tc
            LEFT JOIN 
                (
                    SELECT 
                        uec.tid, 
                        COUNT(*) AS count
                    FROM 
                        User_Enabel_Course uec
                    WHERE 
                        uec.is_success = 1
                    GROUP BY 
                        uec.tid
                ) uc ON tc.tid = uc.tid
            WHERE 
                tc.isCreateByAdmin = 1
                AND EXISTS (
                    SELECT 1
                    FROM User_Enabel_Course uec
                    WHERE 
                        uec.uid = ?
                        AND uec.tid = tc.tid
                        AND uec.week = 1
                        AND uec.day = 1
                );
        `;
        
        const rows = await conn.query(query, [uid, uid]);

      // Convert BigInt to Number
      const sanitizedRows = rows.map(row => {
          const newRow = { ...row };
          for (const key in newRow) {
              if (typeof newRow[key] === 'bigint') {
                  newRow[key] = Number(newRow[key]);
              }
          }
          return newRow;
      });

      console.log(sanitizedRows);
      res.status(200).json(sanitizedRows);
  } catch (error) {
      console.error('Error fetching enabled user table:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  } finally {
      if (conn) conn.release(); // Release the database connection back to the pool
  }
});

           







module.exports = route;
