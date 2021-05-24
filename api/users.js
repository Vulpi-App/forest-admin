const express = require("express");
// const formidable = require("express-formidable");
const router = express.Router();

const { users } = require("../models");
console.log(users);

// Pas de app.use("formidable") si cette syntaxe : router.get("/api/users", formidable(), async (req, res) => {

router.get("/api/users", async (req, res) => {
  try {
    const usersList = await users.find();
    res.status(200).json(usersList);
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
