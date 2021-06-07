// Imports Express, Express formidable and init router
const express = require("express");
const router = express.Router();
const formidable = require("express-formidable");

// Import Middleware
const isAuthenticated = require("./middleware/isAuthenticated");

// Import models
const { users, lists, products, feedbacks } = require("../models");

/* =================================================== */

/* =================================================== */

// Route to create a new feedback in DB
router.post(
  "/feedback/create/:userId",
  formidable(),
  isAuthenticated,
  async (req, res) => {
    try {
      const { subject, description } = req.fields;
      const userId = req.params.userId;

      if (subject && description) {
        if (subject.length <= 30) {
          // Create a new document
          const newFeedback = new feedbacks({
            subject: subject,
            description: description,
            owner: userId,
            processed: false,
          });

          // Save document
          await newFeedback.save();

          // Respond to client
          res.status(201).json({ message: "Feedback successfully created." });
        } else {
          res.status(400).json({
            error: "The subject must have a maximum of 30 characters.",
          });
        }
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

module.exports = router;
