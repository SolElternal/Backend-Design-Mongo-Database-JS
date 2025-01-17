const express = require("express");
const bcrypt = require("bcrypt");
const passport = require("passport");
const mongoDbInstant = require("../db/mongoDb");
const { ObjectId } = require("mongodb");

const router = express();
const client = mongoDbInstant.getMongoClient();
const collectionName = "products";

const checkUser = passport.authenticate("jwt-verify", { session: false });

const middleware = require("../middlewares/userRole")
const validator = require("../validator/validateALL")
const { validationResult } = require("express-validator");

const multer = require("multer");
const bodyParser = require("body-parser");
const upload = multer();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
router.use(upload.array());

// อ่านข้อมูลสินค้า (ตรวจสอบ JWT)
router.get("/", checkUser, middleware.isUserOrAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ message: "Validation error", errors: errors.array() });
    }
    await client.connect();
    const db = client.db(mongoDbInstant.getDbName());
    const collection = db.collection(collectionName);
  
    const products = await collection.find({}).toArray();
  
    res.send({
      message: "Products Found",
      data: products,
    });

  }catch (error) {
    res.status(500).send({ message: "Error creating user", error: error.message });
  } finally {
    await client.close();
  }
});

// อ่านสินค้าตามหมวดหมู่ (ตรวจสอบ JWT)
router.get("/category/:categoryId", checkUser, middleware.isUserOrAdmin, async (req, res) => {
  const { categoryId } = req.params;

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ message: "Validation error", errors: errors.array() });
    }
    await client.connect();
    const db = client.db(mongoDbInstant.getDbName());
    const productsCollection = db.collection(collectionName);
    const categoriesCollection = db.collection("categories");

    const products = await productsCollection.find({ category: new ObjectId(categoryId) }).toArray();

    if (products.length === 0) {
      return res.status(404).send({
        message: "No products found for the given category ID",
      });
    }

    const category = await categoriesCollection.findOne({ _id: new ObjectId(categoryId) });

    if (!category) {
      return res.status(404).send({
        message: "Category not found for the given ID",
      });
    }

    const productsWithCategoryName = products.map((product) => ({
      ...product,
      categoryName: category.name,
    }));

    res.send({
      message: "Products under the category found",
      data: productsWithCategoryName,
    });

  }catch (error) {
    res.status(500).send({ message: "Error creating user", error: error.message });
  } finally {
    await client.close();
  }
});

// เพิ่มสินค้าใหม่ (ตรวจสอบ JWT)
router.post("/items", checkUser, middleware.isAdmin, validator.createProduct, async (req, res) => {
  const { name, price, category } = req.body;

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ message: "Validation error", errors: errors.array() });
    }
    await client.connect();
    const db = client.db(mongoDbInstant.getDbName());
    const categoriesCollection = db.collection("categories");
    const productsCollection = db.collection(collectionName);

    const categoryDoc = await categoriesCollection.findOne({ _id: new ObjectId(category) });

    if (!categoryDoc) {
      return res.status(400).send({
        message: "Category not found. Please provide a valid category ID.",
      });
    }

    const result = await productsCollection.insertOne({
      name,
      price,
      category: new ObjectId(category),
    });

    res.send({
      message: "Product added successfully",
      data: result,
    });

  }catch (error) {
    res.status(500).send({ message: "Error creating user", error: error.message });
  } finally {
    await client.close();
  }
});

// แก้ไขสินค้า (ตรวจสอบ JWT)
router.put("/changeitems/:id", checkUser, middleware.isAdmin, validator.updateProduct, async (req, res) => {
  const { id } = req.params;
  const { name, price, category } = req.body;

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ message: "Validation error", errors: errors.array() });
    }
    await client.connect();
    const db = client.db(mongoDbInstant.getDbName());
    const collection = db.collection(collectionName);

    const updatedData = {};
    if (name) updatedData.name = name;
    if (price) updatedData.price = price;
    if (category) updatedData.category = new ObjectId(category);

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({
        message: "Product not found",
      });
    }

    res.send({
      message: "Product updated successfully",
      data: result,
    });

  }catch (error) {
    res.status(500).send({ message: "Error creating user", error: error.message });
  } finally {
    await client.close();
  }
});

// ลบสินค้า (ตรวจสอบ JWT)
router.delete("/deleteitems/:id", checkUser, middleware.isAdmin, async (req, res) => {
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
      message: "Product deleted successfully",
      data: result,
  });

  }catch (error) {
    res.status(500).send({ message: "Error creating user", error: error.message });
  } finally {
    await client.close();
  }
});

module.exports = router;
