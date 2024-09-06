const mariadb = require("mariadb");
const dotenv = require("dotenv");
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
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

route.get("/getAllUsers", auth, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM User");
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

route.post("/login", async (req, res) => {
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

    if (!match) {
      // Passwords do not match
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate the JWT token

    const tokenJWT = jwt.sign({ user }, process.env.TOKEN_KEY);

    // Return the token to the client
    return res.status(200).json({ tokenJWT });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (conn) conn.release(); // Release the connection back to the pool
  }
});

route.post("/getDataUserById", async (req, res) => {
  const { uid } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    const sql = `SELECT User.uid, User.gender, User.Profile_pic, User.username, User.password, User.height, Progress.weight
                    FROM User 
                    JOIN Progress ON User.uid = Progress.uid
                    WHERE User.uid = ?
                    AND Progress.data_progress = (
                        SELECT MAX(data_progress)
                        FROM Progress
                        WHERE Progress.uid = User.uid
                    )`;
    const result = await conn.query(sql, [uid]);
    if (result.length > 0) {
      res.status(200).json([
        {
          uid: result[0].uid,
          gender: result[0].gender,
          Profile_pic: result[0].Profile_pic,
          username: result[0].username,
          password: result[0].password,
          height: result[0].height,
          weight: result[0].weight.toFixed(1),
        },
      ]);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" + error });
  } finally {
    if (conn) {
      conn.release();
    }
  }
});

route.post("/update/gender", async (req, res) => {
  const { uid, gender } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    const sql = `UPDATE User SET gender = ? WHERE uid = ?`;
    const result = await conn.query(sql, [gender, uid]);
    res.status(200).json(1); // Success with 200 status code
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error: " + error }); // 500 for internal server errors
  } finally {
    if (conn) conn.release(); // Ensure the connection is released
  }
});

route.post("/update/username", async (req, res) => {
  const { uid, username } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    const sql = `UPDATE User SET username = ? WHERE uid = ?`;
    const resutl = await conn.query(sql, [username, uid]);
    res.status(200).json(1);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error: " + error });
  } finally {
    if (conn) {
      conn.release();
    }
  }
});

route.post("/update/password", async (req, res) => {
  const { uid, password } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    const sql = `SELECT User.password 
                    From User 
                    WHERE User.uid = ?`;
    const fetchPassword = await conn.query(sql, [uid]);

    if (fetchPassword.length > 0) {
      const match = await bcrypt.compare(password, fetchPassword[0].password);
      if (match) {
        res.status(200).json(1);
      } else {
        const hashNewPassword = await bcrypt.hash(password, 10);
        const sqlUpdatePassword = `UPDATE User SET User.password = ? WHERE User.uid = ?`;
        await conn.query(sqlUpdatePassword, [hashNewPassword, uid]);
        res.status(200).json(0);
      }
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error: " + error });
  } finally {
    if (conn) {
      conn.release();
    }
  }
});

route.post("/update/height", async (req, res) => {
  const { uid, height } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    const sql = `UPDATE User SET User.height = ? WHERE User.uid = ?`;
    const result = await conn.query(sql, [height, uid]);

    if (result.affectedRows > 0) {
      res.status(200).json(1);
      console.log("Data updated successfully!");
    } else {
      res.status(404).json({ message: "No data updated" });
      console.log("No data updated.");
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error: " + error });
  } finally {
    if (conn) {
      conn.release();
    }
  }
});

route.post("/googleLogin", async (req, res) => {
  const { login } = req.body; // login can be either username or email
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

    // Generate the JWT token

    const tokenJWT = jwt.sign({ user }, process.env.TOKEN_KEY);

    // Return the token to the client
    return res.status(200).json({ tokenJWT });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (conn) conn.release(); // Release the connection back to the pool
  }
});
route.post("/register", async (req, res) => {
  const {
    username,
    email,
    password,
    height,
    birthday,
    gender,
    profile_pic,
    day_success_exerice,
    role,
    isDisbel,
  } = req.body;

  let conn;
  try {
    conn = await pool.getConnection();
    // Check if the user_name or email already exists
    const existingUser = await conn.query(
      "SELECT uid,role,isDisbel FROM User WHERE username = ? OR email = ?",
      [username, email]
    );

    if (existingUser.length > 0) {
      // User exists with either the same username or email
      return res
        .status(400)
        .json({ message: "Username or email already exists" });
    }

    // If no existing user, proceed with registration
    const hashedPassword = await bcrypt.hash(password, 10);
    const daySuccessExerciseValue =
      day_success_exerice !== null ? day_success_exerice : 0;
    const result = await conn.query(
      "INSERT INTO User (username, email, password, height, birthday, gender, profile_pic, day_suscess_exerice, role,isDisbel) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
      [
        username,
        email,
        hashedPassword,
        height,
        birthday,
        gender,
        profile_pic,
        daySuccessExerciseValue,
        role,
        isDisbel,
      ]
    );

    res.status(201).json({
      message: "User registered successfully",
      userId: result.insertId.toString(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (conn) conn.end();
  }
});

route.get("/getGuestToken", async (req, res) => {
  try {
    // Define the payload for the guest token
    const payload = {
      role: "geust",

      // You can add other guest-specific information if needed
    };

    // Generate the token with a secret key and an expiration time
    const tokenJWT = jwt.sign(payload, process.env.TOKEN_KEY, {
      expiresIn: "1h",
    });

    // Return the generated token
    res.status(200).json({ tokenJWT });
  } catch (error) {
    console.error("Error generating guest token:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

route.get("/getUser/:email", auth, async (req, res) => {
  const email = req.params.email; // Extract email from route parameter
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      "SELECT * FROM User WHERE username = ? OR email = ?",
      [email, email]
    );

    const user = rows[0]; // Assuming you want to send the first user if found
    res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (conn) {
      conn.release(); // Release the database connection back to the pool
    }
  }
});

module.exports = route;
