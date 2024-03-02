const mariadb = require('mariadb')
const dotenv = require('dotenv')
const express = require('express')
// const router = express.Router();
dotenv.config();

const pool = mariadb.createPool({
    host : process.env.GYMMASTER_HOST,
    user : process.env.GYMMASTER_USER,
    password : process.env.GYMMASTER_PASSWORD,
    database : process.env.GYMMASTER_DB,
    connectionLimit : 5
})

export async function getUsers(){
    let conn;
    try{
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM Users");
        // console.log(rows);
        return rows;
        
    } catch (err) {
        throw err;
    }
}

export async function getUser(id){
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query(
            `SElECT *
            FROM Users
            WHERE UID = ?`,[id]);

        return rows[0];
    } catch (error) {
        
    }
}