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

route.post('/getUserTabel', async (req, res) => {
    const { uid } = req.body;
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query("SELECT * FROM Training_Couser WHERE uid = ?", [uid]);
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





module.exports = route;
