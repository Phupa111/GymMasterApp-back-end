const mariadb = require('mariadb')
const dotenv = require('dotenv')
const express = require('express')
const multer = require('multer');
const fire = require('firebase/storage')
const sharp = require('sharp')
const auth = require("../middleware/auth.js");
dotenv.config();

const {app,storage} = require("../config/firebase.config.js")

const route = express.Router();

const upload = multer();
const pool = mariadb.createPool({
    host : process.env.GYMMASTER_HOST,
    user : process.env.GYMMASTER_USER,
    password : process.env.GYMMASTER_PASSWORD,
    database : process.env.GYMMASTER_DB,
    connectionLimit : 5
})

route.post('/uploadImage',upload.single('file'),auth,async(req, res)=>{
  const {uid} = req.body;
  let conn;
    try {
      //Resize data Image
      const resizedImageBuffer = await sharp(req.file.buffer).jpeg({quality: 65}).toBuffer();
      const imageURL  = await firebaseUploadImage({...req.file,buffer:resizedImageBuffer});
      
      conn = await pool.getConnection();
      const sql = `UPDATE User SET User.profile_pic = ? WHERE User.uid = ?`;
      const result = await conn.query(sql,[imageURL,uid]);

      
        res.status(200).json(imageURL);
        console.log('Data updated successfully!');
    } catch (error) {
      console.error("Error uploading file:", error);
        res.status(500).json({ error: "Failed to upload file" });
    }finally{
      if(conn){
        conn.release();
      }
    }
})

route.post('/insertProgress',upload.single('file'), auth, async(req, res)=>{
  const {uid,weight} = req.body;
  let conn;
  let sql;
  let fillInsert;
    try {

      if (!req.file) {
        console.log(req.file.buffer)
        return res.status(400).json({ error: 'No file uploaded' });
      } 
      
      //Resize data Image
      const resizedImageBuffer = await sharp(req.file.buffer).jpeg({quality: 65}).toBuffer();
      const imageURL  = await firebaseUploadImageProgress({...req.file,buffer:resizedImageBuffer});

      console.log(weight);
      if (weight == 0.0) {
        sql = `INSERT INTO Progress (uid, picture, data_progress) VALUES (?, ?, NOW())`;
        fillInsert = [uid,imageURL];
      } else {
        sql = `INSERT INTO Progress (uid, weight, picture, data_progress) VALUES (?, ?, ?, NOW())`;
        fillInsert = [uid,weight,imageURL];
      }
     
      conn = await pool.getConnection();
      
      const result = await conn.query(sql,fillInsert);

      
        res.status(200).json(imageURL);
        console.log('Data updated successfully!');
    } catch (error) {
      console.error("Error uploading file:", error);
        res.status(500).json({ error: "Failed to upload file" });
    }finally{
      if(conn){
        conn.release();
      }
    }
});

async function firebaseUploadImage(img){
  try {
    const filename = Date.now()+"-"+img.originalname;
    const storageRef = fire.ref(storage,"image/"+filename);

    const metadata = { 
      contentType:img.mimetype
    }

    const snapshot = await fire.uploadBytesResumable(storageRef,img.buffer,metadata);

    const downloadURL = await fire.getDownloadURL(snapshot.ref)
    console.log('File successfully uploaded.');
        return downloadURL;
        
  } catch (error) {
    // หากเกิดข้อผิดพลาดในขณะอัปโหลด
    console.error("Error uploading image:", error);
    throw error; // ส่งข้อผิดพลาดไปยัง caller ของฟังก์ชัน
  }
}

async function firebaseUploadImageProgress(img){
  try {
    const filename = Date.now()+"-"+img.originalname;
    const storageRef = fire.ref(storage,"progress_image/"+filename);

    const metadata = { 
      contentType:img.mimetype
    }

    const snapshot = await fire.uploadBytesResumable(storageRef,img.buffer,metadata);

    const downloadURL = await fire.getDownloadURL(snapshot.ref)
    console.log('File successfully uploaded.');
        return downloadURL;
        
  } catch (error) {
    // หากเกิดข้อผิดพลาดในขณะอัปโหลด
    console.error("Error uploading image:", error);
    throw error; // ส่งข้อผิดพลาดไปยัง caller ของฟังก์ชัน
  }
};
route.get('/test',(req, res)=>{
    res.status(200).send({message:"hello photo"})
})

module.exports = route;