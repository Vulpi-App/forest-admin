const express = require("express");
const formidable = require("express-formidable");
const router = express.Router();
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

router.use(formidable());

const { users, products, lists } = require("../models");
// console.log(users);

// Pas de app.use("formidable") si cette syntaxe : router.get("/api/users", formidable(), async (req, res) => {

// Route Sign Up with email
router.post("/api/user/signup", async (req, res) => {
  try {
    // Destructuring of req.fields
    const { email, firstName, password } = req.fields;
    console.log(req.fields);
    // Check if all body params sent
    if (email && firstName) {
      // Check if an account with this email already exists in DB
      const userWithEmail = await users.findOne({ email: email });

      if (!userWithEmail) {
        // Generate a Token
        const token = uid2(64);
        // Generate hash and salt
        const salt = uid2(16);
        const hash = SHA256(salt + password).toString(encBase64);

        // Create a new default list "Ma liste de course"
        // Create a new user in BD
        const newUser = new users({
          email: email,
          account: {
            firstName: firstName,
          },
          hash: hash,
          salt: salt,
          token: token,
          newsletter: false,
          emailConfirm: false,
          firstConnection: true,
        });

        //Save new user
        await newUser.save();

        // Respond to client
        res.status(201).json({
          _id: newUser._id,
          token: newUser.token,
          account: {
            firstName: users.account.firstName,
          },
        });
      } else {
        res
          .status(400)
          .json({ error: "An account already exists with this email " });
      }
    } else {
      res.status(400).json({ error: "Missing parameter" });
    }
    res.status(200).json({ error: "Ca marche" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/api/users", async (req, res) => {
  try {
    const usersList = await users.find();
    res.status(200).json(usersList);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
