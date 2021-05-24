const express = require("express");
// const formidable = require("express-formidable");
const router = express.Router();

const { products } = require("../models");
console.log(products);

// Pas de app.use("formidable") si cette syntaxe : router.get("/api/users", formidable(), async (req, res) => {

router.get("/api/products", async (req, res) => {
  try {
    const productsList = await products.find();
    res.status(200).json(productsList);
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
