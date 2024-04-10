const mariadb = require('mariadb')
const dotenv = require('dotenv')
const express = require('express')
const bcrypt = require('bcrypt');
dotenv.config();

const route = express.Router();

const pool = mariadb.createPool({
    host : process.env.GYMMASTER_HOST,
    user : process.env.GYMMASTER_USER,
    password : process.env.GYMMASTER_PASSWORD,
    database : process.env.GYMMASTER_DB,
    connectionLimit : 5
})

route.get('/getAllUsers',async (req, res)=>{
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM User");
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

route.post('/login', async (req, res) => {
    const { login, password } = req.body; // login can be either username or email
    let conn;
    try {
        conn = await pool.getConnection();
        // Query to find the user by username or email
        const query = `SELECT * FROM User WHERE username=? OR email=?`;
        const users = await conn.query(query, [login, login]);
        
        if (users.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Assuming the first matching user is the one we want
        const user = users[0];
        
        // Compare the provided password with the hashed password in the database
        const match = await bcrypt.compare(password, user.password);
        
        if (match) {
            // Passwords match
            // Here you would typically assign a token or something similar for session management
            return res.status(200).json({ user });
        } else {
            // Passwords do not match
            res.status(401).json({ message: "Invalid credentials" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release(); // Release the connection back to the pool
    }
});

route.post('/register', async (req, res) => {
    const { username, email, password, height, birthday, gender, profile_pic, day_success_exerice, role,isDisbel } = req.body;

    let conn;
    try {
        conn = await pool.getConnection();
        // Check if the user_name or email already exists
        const existingUser = await conn.query(
            "SELECT * FROM User WHERE username = ? OR email = ?",
            [username, email]
        );

        if (existingUser.length > 0) {
            // User exists with either the same username or email
            return res.status(400).json({ message: "Username or email already exists" });
        }

        // If no existing user, proceed with registration
        const hashedPassword = await bcrypt.hash(password, 10);
        const daySuccessExerciseValue = day_success_exerice !== null ? day_success_exerice : 0;
        const result = await conn.query(
            "INSERT INTO User (username, email, password, height, birthday, gender, profile_pic, day_suscess_exerice, role,isDisbel) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
            [username, email, hashedPassword, height, birthday, gender, profile_pic, daySuccessExerciseValue, role,isDisbel]
        );

        res.status(201).json({ message: "User registered successfully", userId: result.insertId.toString() });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.end();
    }
});

route.get('/selectFromEmail/:email', async (req, res) => {
    const email = req.params.email; // Extract email from route parameter
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM User WHERE email = ?", [email]);
        if (rows.length > 0) {
            const user = rows[0]; // Assuming you want to send the first user if found
            res.status(200).json({ user });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) {
            conn.release(); // Release the database connection back to the pool
        }
    }
});



module.exports = route;