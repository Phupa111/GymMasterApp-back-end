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

route.get('/getAllEquipment',auth ,async(req, res) =>{
    let conn;
    try {
        conn = await pool.getConnection();
        sql =   `SELECT Equiment.eqid, Equiment.Name
                FROM Equiment`;
        const result = await conn.query(sql);

        if (result.length > 0) {
            console.log(result);
            res.status(200).json(result);
        } else {
            res.status(404).json({error : "Not found equipment"});
        }
        
    } catch (error) {
        console.log("error to fecth equipment : "+ error);
        res.status(500).json({error : error});
    }finally{
        if(conn) conn.release();
    }
});

route.post('/addEquipment',auth ,async(req, res)=>{
    const {name} = req.body;
    let conn;

    try {
        conn = await pool.getConnection();
        sql =`INSERT INTO Equiment (Name) VALUES (?)`;
        const result = await conn.query(sql,[name]);
        if (result.affectedRows > 0) {
            console.log('affect Rows : ' + result.affectedRows);
            res.status(200).json({message : "insert equipment successfully"})
          } else {
            res.status(400).json({error : "failed to insert"})
          }
    } catch (error) {
        console.log("error to add equipment : "+ error);
        res.status(500).json({error : error});
    }finally{
        if(conn) conn.release();
    }
});

route.post('/delete',auth, async(req, res)=>{
    const {eqid} = req.body;
    let conn;

    try {
        conn = await pool.getConnection();
        sql = `DELETE FROM Equiment WHERE Equiment.eqid = ?`;
        const result = await conn.query(sql,[eqid]);
        if (result.affectedRows > 0) {
            console.log('affect Rows : ' + result.affectedRows);
            res.status(200).json({message : "delete equipment successfully"})
          } else {
            res.status(400).json({error : "failed to delete"})
          }
        
    } catch (error) {
        console.log("error to delete equipment : "+ error);
        res.status(500).json({error : error});
    }finally{
        if(conn) conn.release();
    }
});

route.post('/update',auth , async(req, res)=>{
    const {eqid,name} = req.body;
    let conn;

    try {
        conn = await pool.getConnection();
        sql = `UPDATE Equiment SET Equiment.Name = ? WHERE Equiment.eqid = ?`;
        const result = await conn.query(sql,[name,eqid]);
        if (result.affectedRows > 0) {
            console.log('affect Rows : ' + result.affectedRows);
            res.status(200).json({message : "update equipment successfully"})
          } else {
            res.status(400).json({error : "failed to update"})
          }
        
    } catch (error) {
        console.log("error to update equipment : "+ error);
        res.status(500).json({error : error});
    }finally{
        if(conn) conn.release();
    }
});

module.exports = route;