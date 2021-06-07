const express = require("express");
// const formidable = require("express-formidable");
const router = express.Router();

// Import Middleware
const isAuthenticated = require("./middleware/isAuthenticated");

const { products } = require("../models");

/* =================================================== */

/* =================================================== */

// Route to get all products in DB
router.get("/products", isAuthenticated, async (req, res) => {
  try {
    const productsList = await products.find();
    res.status(200).json(productsList);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* =================================================== */

// Route to get info about a product
router.get("/products/:id", isAuthenticated, async (req, res) => {
  try {
    const productToFind = await products.findById(req.params.id);

    if (productToFind) {
      res.status(200).json({ productToFind });
    } else {
      res.status(400).json({ message: "This product does not exist 😬" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
