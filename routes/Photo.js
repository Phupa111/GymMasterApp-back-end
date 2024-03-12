const mariadb = require('mariadb')
const dotenv = require('dotenv')
const express = require('express')
const multer = require('multer');
const fire = require('firebase/storage')
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
    try {
      const imageURL  = await firebaseUploadImage(req.file);
      res.status(200).json(imageURL);
    } catch (error) {
      console.error("Error uploading file:", error);
        res.status(500).json({ error: "Failed to upload file" });
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
        return {
            message: 'file uploaded to firebase storage',
            name: filename,
            type: img.mimetype,
            downloadURL: downloadURL
        }
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