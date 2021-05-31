const express = require("express");
// const formidable = require("express-formidable");
const router = express.Router();

// Import Middleware
const isAuthenticated = require("./middleware/isAuthenticated");

const { products } = require("../models");
// console.log(products);

router.get("/products", isAuthenticated, async (req, res) => {
  try {
    const productsList = await products.find();
    res.status(200).json(productsList);
  } catch (error) {
    console.log(error);
  }
});

router.get("/products/:id", isAuthenticated, async (req, res) => {
  try {
    console.log(req.params.id);

    const productToFind = await products.findById(req.params.id);

    if (productToFind) {
      res.status(200).json({ productToFind });
    } else {
      res.status(400).json({ message: "This product does not exist 😬" });
    }
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
