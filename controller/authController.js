const passport = require("passport");
const express = require("express");
const jwt = require("jsonwebtoken"); // นำเข้า jsonwebtoken

const multer = require("multer");

const mongoDbInstant = require("../db/mongoDb");
const router = express();
const client = mongoDbInstant.getMongoClient();

const bodyParser = require("body-parser");
const upload = multer();

router.use(bodyParser.json()); // for parsing routerlication/json
router.use(bodyParser.urlencoded({ extended: true })); // for parsing routerlication/x-www-form-urlencoded
router.use(upload.array());

const reqLogin = passport.authenticate("user-local", { session: false });

router.post("/login", reqLogin, async (req, res) => {
  try {
    // ตรวจสอบ req.user จาก passport
    if (!req.user) {
      return res.status(401).send({ message: "Invalid credentials" });
    }

    // สร้าง payload สำหรับ JWT
    const payload = {
      id: req.user._id,
      username: req.user.username,
      role: req.user.role,
    };

    // สร้าง token
    const token = jwt.sign(payload, process.env.jwt_secret, { expiresIn: "1h" });

    // ส่ง token กลับไปยัง client
    res.status(200).send({
      message: "Login successfully",
      token,
    });
  } catch (error) {
    res.status(500).send({
      message: "Error during login",
      error: error.message,
    });
  }
});

module.exports = router;
