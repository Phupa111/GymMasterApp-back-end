const mariadb = require('mariadb')
const dotenv = require('dotenv')
const express = require('express')
const multer = require('multer');
const fire = require('firebase/storage')
const sharp = require('sharp')
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

route.post('/uploadImage',upload.single('file'),async(req, res)=>{
  const {uid} = req.body;
  let conn;
    try {
      //Resize data Image
      const resizedImageBuffer = await sharp(req.file.buffer).jpeg({quality: 65}).toBuffer();
      const imageURL  = await firebaseUploadImage({...req.file,buffer:resizedImageBuffer});
      
      conn = await pool.getConnection();
      const sql = `UPDATE User SET User.profile_pic = ? WHERE User.uid = ?`;
      const result = conn.query(sql,[imageURL,uid]);

      
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

// const file = req.file;
  // if (!file) {
  //   return res.status(400).send('No file uploaded.');
  // }
  // File has been uploaded successfully, you can process it further as needed
  // console.log('File uploaded:', file);
  // res.send('File uploaded successfully.');
})

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

route.get('/test',(req, res)=>{
    res.status(200).send({message:"hello photo"})
})

module.exports = route;