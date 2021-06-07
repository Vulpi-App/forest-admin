const { users, products, lists } = require("../../models");

/* =================================================== */

/* =================================================== */

// Middleware to authenticate the user
const isAuthenticated = async (req, res, next) => {
  try {
    // Check if token sent
    if (req.headers.authorization) {
      // Check if a user exists in DB with this token
      const token = req.headers.authorization.replace("Bearer ", "");
      const userWithToken = await users
        .findOne({ token: token })
        .select("_id email account lists friends")
        .populate("products");

      if (userWithToken) {
        // Create a new key in req with the infos of the user
        req.user = userWithToken;

        return next();
      } else {
        return res.status(401).json({ error: "Unauthorized" });
      }
    } else {
      return res.status(401).json({ error: "Unauthorized" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = isAuthenticated;
