require("dotenv").config();
require("./middlewares/auth");

const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");

const upload = multer();
const app = express();

app.use(bodyParser.json()); // for parsing routerlication/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing routerlication/x-www-form-urlencoded
app.use(upload.array());

const productController = require('./controller/productController')
const categoryController = require('./controller/categoryController')
const userController = require('./controller/userController')
const authController = require("./controller/authController")

const port = 3000;

app.use("/products", productController)
app.use("/categories", categoryController)
app.use("/users", userController)
app.use("/auth", authController)

app.get("/p", (req, res) => {
    res.send({
        massage: "Server is runing Connected Success products",
        version: "1.0.2",
        env: {
            mongodb_url: process.env.mongodb_url,
            mongodb_db_name: process.env.mongodb_db_name
        }
    });
});

app.listen(port, () => {
    console.log(`Server running at localhost:${port}`)
});