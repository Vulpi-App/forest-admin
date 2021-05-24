const express = require("express");
// const formidable = require("express-formidable");
const router = express.Router();

const { lists } = require("../models");
console.log(lists);

// Pas de app.use("formidable") si cette syntaxe : router.get("/api/users", formidable(), async (req, res) => {

router.get("/api/lists", async (req, res) => {
  try {
    const shoppingList = await lists.find();
    res.status(200).json(shoppingList);
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
