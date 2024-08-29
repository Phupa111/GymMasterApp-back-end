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

route.post("/getDayOfExercise", auth, async (req, res) => {
  const { uid } = req.body;
  let conn;
  let bmr = 0;
  let tdee = 0;

  let bulk = 0;
  let main = 0;
  let cut = 0;

  let bulk_protein_gram = 0;
  let bulk_carbohydrate_gram = 0;
  let bulk_fat_gram = 0;
  let main_protein_gram = 0;
  let main_carbohydrate_gram = 0;
  let main_fat_gram = 0;
  let cut_protein_gram = 0;
  let cut_carbohydrate_gram = 0;
  let cut_fat_gram = 0;
  try {
    conn = await pool.getConnection();

    const days = await conn.query(
      "SELECT User.uid, User.gender, User.birthday, User.height, LatestProgress.weight, " +
        "MAX(Training_Couser.dayPerWeek) AS day_per_week " +
        "FROM User " +
        "JOIN (" +
        "SELECT Progress.uid, Progress.weight " +
        "FROM Progress " +
        "INNER JOIN (" +
        "SELECT uid, MAX(data_progress) AS max_date " +
        "FROM Progress GROUP BY uid) " +
        "AS MaxProgress ON Progress.uid = MaxProgress.uid AND Progress.data_progress = MaxProgress.max_date) " +
        "AS LatestProgress ON User.uid = LatestProgress.uid " +
        "JOIN User_Enabel_Course ON User.uid = User_Enabel_Course.uid " +
        "JOIN Training_Couser ON User_Enabel_Course.uid = Training_Couser.uid " +
        "WHERE User.uid = ? " +
        "GROUP BY User.uid, User.gender, User.birthday, User.height, LatestProgress.weight;",
      [uid]
    );

    //get dat month year
    if (days.length > 0) {
      const toDay = new Date();
      const birthday = new Date(days[0].birthday);
      let age = toDay.getFullYear() - birthday.getFullYear();

      //calculate BMR
      if (days[0].gender == 1) {
        // console.log("a boy");
        bmr = 66 + 13.7 * days[0].weight + 5 * days[0].height - 6.8 * age;
        // console.log(bmr);
      } else {
        // console.log("a girl");
        bmr = 665 + 9.6 * days[0].weight + 1.8 * days[0].height - 4.7 * age;
        // console.log(bmr);
      }

      //calculate TDEE
      if (days[0].day_per_week <= 0) {
        tdee = bmr * 1.2;
      } else if (days[0].day_per_week <= 2) {
        tdee = bmr * 1.375;
      } else if (days[0].day_per_week <= 5) {
        tdee = bmr * 1.55;
      } else {
        tdee = bmr * 1.725;
      }
      bulk = tdee + 200;
      main = tdee;
      cut = tdee - 200;

      //protein carb and fat
      bulk_carbohydrate_gram = (bulk * 0.45) / 4;
      bulk_protein_gram = (bulk * 0.35) / 4;
      bulk_fat_gram = (bulk * 0.2) / 9;

      main_carbohydrate_gram = (main * 0.3) / 4;
      main_protein_gram = (main * 0.4) / 4;
      main_fat_gram = (main * 0.3) / 9;

      cut_carbohydrate_gram = (cut * 0.3) / 4;
      cut_protein_gram = (cut * 0.55) / 4;
      cut_fat_gram = (cut * 0.15) / 9;

      return res.status(200).send([
        {
          bulking: Math.floor(bulk),
          maintenance: Math.floor(main),
          cutting: Math.floor(cut),
          bulk_carb_gram: Math.floor(bulk_carbohydrate_gram),
          bulk_protein_gram: Math.floor(bulk_protein_gram),
          bulk_fat_gram: Math.floor(bulk_fat_gram),
          main_carb_gram: Math.floor(main_carbohydrate_gram),
          main_protein_gram: Math.floor(main_protein_gram),
          main_fat_gram: Math.floor(main_fat_gram),
          cut_carb_gram: Math.floor(cut_carbohydrate_gram),
          cut_protein_gram: Math.floor(cut_protein_gram),
          cut_fat_gram: Math.floor(cut_fat_gram),
        },
      ]);
    } else {
      const user_data = await conn.query(
        "SELECT User.uid, User.gender, User.birthday, User.height, LatestProgress.weight " +
          "FROM User " +
          "JOIN ( " +
          "SELECT Progress.uid, Progress.weight " +
          "FROM Progress " +
          "INNER JOIN ( " +
          "SELECT uid, MAX(data_progress) AS max_date " +
          "FROM Progress " +
          "GROUP BY uid " +
          ") AS MaxProgress ON Progress.uid = MaxProgress.uid AND Progress.data_progress = MaxProgress.max_date " +
          ") AS LatestProgress ON User.uid = LatestProgress.uid " +
          "WHERE User.uid = ?",
        [uid]
      );

      const toDay = new Date();
      const birthday = new Date(user_data[0].birthday);
      let age = toDay.getFullYear() - birthday.getFullYear();

      //calculate BMR
      if (user_data[0].gender == 1) {
        // console.log("a boy");
        bmr =
          66 + 13.7 * user_data[0].weight + 5 * user_data[0].height - 6.8 * age;
        // console.log(bmr);
      } else {
        // console.log("a girl");
        bmr =
          665 +
          9.6 * user_data[0].weight +
          1.8 * user_data[0].height -
          4.7 * age;
        // console.log(bmr);
      }
      tdee = bmr * 1.2;
      bulk = tdee + 200;
      main = tdee;
      cut = tdee - 200;

      //protein carb and fat
      bulk_carbohydrate_gram = (bulk * 0.45) / 4;
      bulk_protein_gram = (bulk * 0.35) / 4;
      bulk_fat_gram = (bulk * 0.2) / 9;

      main_carbohydrate_gram = (main * 0.3) / 4;
      main_protein_gram = (main * 0.4) / 4;
      main_fat_gram = (main * 0.3) / 9;

      cut_carbohydrate_gram = (cut * 0.3) / 4;
      cut_protein_gram = (cut * 0.55) / 4;
      cut_fat_gram = (cut * 0.15) / 9;
      return res.status(200).send([
        {
          bulking: Math.floor(bulk),
          maintenance: Math.floor(main),
          cutting: Math.floor(cut),
          bulk_carb_gram: Math.floor(bulk_carbohydrate_gram),
          bulk_protein_gram: Math.floor(bulk_protein_gram),
          bulk_fat_gram: Math.floor(bulk_fat_gram),
          main_carb_gram: Math.floor(main_carbohydrate_gram),
          main_protein_gram: Math.floor(main_protein_gram),
          main_fat_gram: Math.floor(main_fat_gram),
          cut_carb_gram: Math.floor(cut_carbohydrate_gram),
          cut_protein_gram: Math.floor(cut_protein_gram),
          cut_fat_gram: Math.floor(cut_fat_gram),
        },
      ]);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error });
  } finally {
    if (conn) {
      conn.release(); // Release the database connection back to the pool
    }
  }
});

route.post("/getDataUserAndBodyFat", auth, async (req, res) => {
  const { uid } = req.body;
  let conn;
  let bmi = 0;
  let bmr = 0;
  let bodyFat = 0;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      "SELECT User.uid, User.username, User.email, User.profile_pic, User.gender, User.birthday, User.height, LatestProgress.weight " +
        "FROM User " +
        "JOIN ( " +
        "SELECT Progress.uid, Progress.weight " +
        "FROM Progress " +
        "INNER JOIN ( " +
        "SELECT uid, MAX(data_progress) AS max_date " +
        "FROM Progress " +
        "GROUP BY uid " +
        ") AS MaxProgress ON Progress.uid = MaxProgress.uid AND Progress.data_progress = MaxProgress.max_date " +
        ") AS LatestProgress ON User.uid = LatestProgress.uid " +
        "WHERE User.uid = ?",
      [uid]
    );

    if (result.length > 0) {
      console.log(result);
      const today = new Date();
      const birthday = new Date(result[0].birthday);
      let age = today.getFullYear() - birthday.getFullYear();
      console.log(age);
      //calculate BMI
      bmi =
        result[0].weight /
        ((result[0].height / 100) * (result[0].height / 100));
      if (result[0] == 1) {
        bodyFat = 1.2 * bmi + 0.23 * age - 16.2;
        bmr = 66 + 13.7 * result[0].weight + 5 * result[0].height - 6.8 * age;
      } else {
        bodyFat = 1.2 * bmi + 0.23 * age - 5.4;
        bmr = 665 + 9.6 * result[0].weight + 1.8 * result[0].height - 4.7 * age;
      }

      res.status(200).json([
        {
          detail: result,
          bmi: bmi.toFixed(1),
          bmr: Math.floor(bmr).toString(),
          bodyFat: bodyFat.toFixed(1),
        },
      ]);
    } else {
      res.status(200).send({ message: "No Data!!" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error });
  } finally {
    conn.release();
  }
});
module.exports = route;
