const mariadb = require("mariadb");
const dotenv = require("dotenv");
const express = require("express");
const multer = require('multer');
const fire = require('firebase/storage')
const sharp = require('sharp')
const auth = require("../middleware/auth.js");
dotenv.config();

const route = express.Router();

const {app,storage} = require("../config/firebase.config.js")
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

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

route.get('/getAllExPost',auth ,async(req, res)=>{
  let conn;
  try {
    conn = await pool.getConnection();
    sql = `SELECT exercise_posture.eid, exercise_posture.gif_image, exercise_posture.name, 
                  exercise_posture.description, exercise_posture.muscle, exercise_posture.eqid ,Equiment.Name AS equipment
          FROM exercise_posture
          INNER JOIN Equiment ON exercise_posture.eqid = Equiment.eqid`;
    const result = await conn.query(sql);
    if (result.length > 0) {
      res.status(200).json(result);
    }else{
      res.status(404).json({message : "No data exercise"});
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error to fetch exercise Posture => " + error });
  }finally {
    if (conn) {
      conn.release(); // Release the database connection back to the pool
    }
  }
});

route.post('/delete',auth ,async(req, res)=>{
  const {eid} = req.body;
  let conn;

  try {
      conn = await pool.getConnection();
      sql = `DELETE FROM exercise_posture WHERE exercise_posture.eid = ?`;

      const result = await conn.query(sql,[eid])
      if (result.affectedRows > 0) {
        console.log("affected : " + result.affectedRows);
        res.status(200).json({message : "Delete row Successfully => " + result.affectedRows});
      }
      console.log("length : " +result.length);

      
  } catch (error) {
      console.log("error to delete equipment : "+ error);
      res.status(500).json({error : error});
  }finally{
      if(conn) conn.release();
  }
});

route.post('/uploadPosture',upload.single('file') ,auth ,async(req, res)=>{
  const {name,des,equipId,muscle} = req.body;
  let conn; 
  try {
    if (!req.file) {
      console.log(req.file.buffer)
      return res.status(400).json({ error: 'No file uploaded' });
    } 

    const GifUrl = await firebaseUploadGifPosture(req.file);
    console.log("gif : " + GifUrl);

    conn = await pool.getConnection();
    sql = `INSERT INTO exercise_posture (gif_image,name,description,eqid,muscle) VALUES (?,?,?,?,?)`;
    const result = await conn.query(sql,[GifUrl,name,des,equipId,muscle]);

    if (result.affectedRows > 0) {
      console.log('affect Rows : ' + result.affectedRows);
      res.status(200).json({message : "insert posture successfully"})
    } else {
      res.status(400).json({error : "failed to insert"})
    }
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (conn) {
      conn.release(); // Release the database connection back to the pool
    }
  }
});

route.post('/edit',upload.single('file') ,auth ,async(req, res)=>{
  const {name,des,equipId,muscle} = req.body;
  let conn; 
  let GifUrl;
  try {
    if (req.file) {
      GifUrl = await firebaseUploadGifPosture(req.file);
      console.log("gif : " + GifUrl);
    } 

    let fieldsToUpdate = [];
    let updateValues = [];

    if (name) {
      fieldsToUpdate.push("name = ?");
      updateValues.push(name);
    }

    if (des) {
      fieldsToUpdate.push("description = ?");
      updateValues.push(des);
    }

    if (equipId) {
      fieldsToUpdate.push("eqid = ?");
      updateValues.push(equipId);
    }

    if (muscle) {
      fieldsToUpdate.push("muscle = ?");
      updateValues.push(muscle);
    }

    if (GifUrl) {
      fieldsToUpdate.push("gif_image = ?");
      updateValues.push(GifUrl);
    }

    // If no fields to update, return an error
    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ error: 'No data provided for update' });
    }

    conn = await pool.getConnection();
    sql = `UPDATE exercise_posture SET ${fieldsToUpdate.join(', ')} WHERE eid = ?`;
    updateValues.push(req.body.eid);

    const result = await conn.query(sql,updateValues);
    if (result.affectedRows > 0) {
      console.log('affect Rows : ' + result.affectedRows);
      res.status(200).json({ message: 'Exercise posture updated successfully' });
    } else {
      res.status(400).json({error : "failed to insert"})
    }
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (conn) {
      conn.release(); // Release the database connection back to the pool
    }
  }
});

async function firebaseUploadGifPosture(img){
  try {
    const filename = Date.now()+"-"+img.originalname;
    const storageRef = fire.ref(storage,"posture/"+filename);

    const metadata = { 
      contentType:img.mimetype
    }

    const snapshot = await fire.uploadBytesResumable(storageRef,img.buffer,metadata);

    const downloadURL = await fire.getDownloadURL(snapshot.ref)
    console.log('File Gif successfully uploaded.');
        return downloadURL;
        
  } catch (error) {
    // หากเกิดข้อผิดพลาดในขณะอัปโหลด
    console.error("Error uploading GIF:", error);
    throw error; // ส่งข้อผิดพลาดไปยัง caller ของฟังก์ชัน
  }
};

module.exports = route;
