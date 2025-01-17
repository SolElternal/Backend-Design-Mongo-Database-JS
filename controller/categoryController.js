const express = require("express");
const bcrypt = require("bcrypt");
const passport = require("passport");
const mongoDbInstant = require("../db/mongoDb");
const { ObjectId } = require("mongodb");

const router2 = express();
const client = mongoDbInstant.getMongoClient();
const collectionName = "categories";

const checkUser = passport.authenticate("jwt-verify", { session: false });

const middleware = require("../middlewares/userRole")
const validator = require("../validator/validateALL")
const { validationResult } = require("express-validator");

const multer = require("multer");
const bodyParser = require("body-parser");
const upload = multer();

router2.use(bodyParser.json());
router2.use(bodyParser.urlencoded({ extended: true }));
router2.use(upload.array());

// อ่านข้อมูลทั้งหมด (ตรวจสอบ JWT)
router2.get("/", checkUser, middleware.isUserOrAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ message: "Validation error", errors: errors.array() });
    }
    await client.connect();
    const db = client.db(mongoDbInstant.getDbName());
    const collection = db.collection(collectionName);
  
    const categories = await collection.find({}).toArray();
    res.send({
      message: "Categories Found",
      data: categories,
    });

  }catch (error) {
    res.status(500).send({ message: "Error creating user", error: error.message });
  } finally {
    await client.close();
  }
});

// เพิ่มข้อมูลใหม่ (ตรวจสอบ JWT)
router2.post("/addcategory", checkUser, middleware.isAdmin, validator.createCategory, async (req, res) => {
  const { name } = req.body;

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ message: "Validation error", errors: errors.array() });
    }
    await client.connect();
    const db = client.db(mongoDbInstant.getDbName());
    const collection = db.collection(collectionName);
  
    const result = await collection.insertOne({ name });
    res.send({
      message: "Category added successfully",
      data: result,
    });

  }catch (error) {
    res.status(500).send({ message: "Error creating user", error: error.message });
  } finally {
    await client.close();
  }
});

// แก้ไขข้อมูล (ตรวจสอบ JWT)
router2.put("/changecategory/:id", checkUser, middleware.isAdmin, validator.updateUser, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ message: "Validation error", errors: errors.array() });
    }
    await client.connect();
    const db = client.db(mongoDbInstant.getDbName());
    const collection = db.collection(collectionName);
  
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { name } }
    );
    res.send({
      message: "Category updated successfully",
      data: result,
    });

  }catch (error) {
    res.status(500).send({ message: "Error creating user", error: error.message });
  } finally {
    await client.close();
  }
});

// ลบข้อมูล (ตรวจสอบ JWT)
router2.delete("/deletecategory/:id", checkUser, middleware.isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ message: "Validation error", errors: errors.array() });
    }
    await client.connect();
    const db = client.db(mongoDbInstant.getDbName());
    const collection = db.collection(collectionName);
  
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    res.send({
      message: "Category deleted successfully",
      data: result,
    });

  }catch (error) {
    res.status(500).send({ message: "Error creating user", error: error.message });
  } finally {
    await client.close();
  }
});

module.exports = router2;
