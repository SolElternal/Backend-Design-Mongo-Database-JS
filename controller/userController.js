const express = require("express");
const bcrypt = require("bcrypt");
const passport = require("passport");
const mongoDbInstant = require("../db/mongoDb");
const { ObjectId } = require("mongodb");

const router = express.Router();
const client = mongoDbInstant.getMongoClient();
const collectionName = "users";

const saltRounds = 10;
const checkUser = passport.authenticate("jwt-verify", { session: false });

const middleware = require("../middlewares/userRole")
const validator = require("../validator/validateALL")
const { validationResult } = require("express-validator");

// Read all users - accessible to admin and user roles
router.get("/", checkUser, middleware.isUserOrAdmin, async (req, res) => {
  try {
    await client.connect();
    const db = client.db(mongoDbInstant.getDbName());
    const users = await db.collection(collectionName).find().toArray();

    res.status(200).send(users);
  } catch (error) {
    res.status(500).send({ message: "Error fetching users", error: error.message });
  } finally {
    await client.close();
  }
});

// Create a new user - admin only
router.post("/", checkUser, middleware.isAdmin, validator.createUser, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ message: "Validation error", errors: errors.array() });
    }

    const { username, password, full_name, role } = req.body;

    await client.connect();
    const db = client.db(mongoDbInstant.getDbName());
    const collection = db.collection(collectionName);

    const userExists = await collection.countDocuments({ username });
    if (userExists > 0) {
      return res.status(400).send({ message: "User already exists" });
    }

    const passwordHash = bcrypt.hashSync(password, saltRounds);
    const newUser = { username, password_hash: passwordHash, full_name, role };

    await collection.insertOne(newUser);
    res.status(201).send({ message: "User created successfully" });
  } catch (error) {
    res.status(500).send({ message: "Error creating user", error: error.message });
  } finally {
    await client.close();
  }
});

// Update user - admin only
router.put("/:id", checkUser, middleware.isAdmin, validator.updateUser, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).send({ message: "Forbidden: Admin access only." });
    }

    const { id } = req.params;
    const { username, full_name, role } = req.body;

    await client.connect();
    const db = client.db(mongoDbInstant.getDbName());
    const collection = db.collection(collectionName);

    const updateResult = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { username, full_name, role } }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).send({ message: "User not found" });
    }

    res.status(200).send({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).send({ message: "Error updating user", error: error.message });
  } finally {
    await client.close();
  }
});

// ลบผู้ใช้
router.delete("/:id", checkUser, middleware.isAdmin, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).send({ message: "Forbidden: Admin access only." });
    }

    const { id } = req.params;

    await client.connect();
    const db = client.db(mongoDbInstant.getDbName());
    const collection = db.collection(collectionName);

    const deleteResult = await collection.deleteOne({ _id: new ObjectId(id) });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).send({ message: "User not found" });
    }

    res.status(200).send({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).send({ message: "Error deleting user", error: error.message });
  } finally {
    await client.close();
  }
});

module.exports = router;
