const express = require("express");
const router = express.Router();
const formidable = require("express-formidable");

const { lists, products } = require("../models");

/* =================================================== */

// Route test - all shopping lists
router.get("/api/lists", async (req, res) => {
  try {
    const shoppingLists = await lists.find();

    res.status(200).json(shoppingLists);
  } catch (error) {
    console.log(error);
  }
});

/* =================================================== */

// 1. CREATE a shopping list
// !! Waiting for middleware isAuthenticated to link user's ref
router.post("/lists/create", formidable(), async (req, res) => {
  try {
    const { title, emoji } = req.fields;
    console.log("Bearer token ", req.headers.authorization);

    // title & emoji already filled in create list step (so mandatory)
    if (title && emoji) {
      if (title.length < 20) {
        const newList = new lists({
          title: title,
          emoji: emoji,
          products: [
            {
              reference: null,
              quantity: null,
              brand: null,
              shop: null,
              price: null,
              added: false,
            },
          ],
          // owner: req.user, (waiting for middleware isAuthenticated)
        });

        // Save new list in BDD
        await newList.save();
        // Send response to client
        res.status(200).json({ message: "List created successfully" });
      } else {
        res.status(400).json({ message: "Title is too long 😬" });
      }
    } else {
      res.status(400).json({ message: "Title and emoji are required 🐣" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* =================================================== */

// 2. UPDATE shopping list: title & emoji
// !! Waiting for middleware isAuthenticated
router.put("/lists/update/:id", formidable(), async (req, res) => {
  try {
    // console.log(req.params); // List's id
    // console.log(req.fields); // list's items to update

    const { title, emoji } = req.fields;

    // Looking for a list with corresponding ID in BDD
    const listToUpdate = await lists.findById(req.params.id);

    // If there is a corresponding list
    if (listToUpdate) {
      if (title) {
        listToUpdate.title = title;
      }
      if (emoji) {
        listToUpdate.emoji = emoji;
      }
    } else {
      res.status(200).json({ message: "No changes made 🙃" });
    }

    // Save update list in BDD
    await listToUpdate.save();
    // Send response to client
    res.status(200).json({ message: "List update successfully 🥳" });
    // res.status(200).json(listToUpdate);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* =================================================== */

// 2 bis. UPDATE shopping list : details about a product
// !! Waiting for middleware isAuthenticated
router.put("/lists/update/details/:id", formidable(), async (req, res) => {
  try {
    // console.log(req.params); // list's id
    // console.log(req.query); // id of the product to update
    // console.log(req.fields); // détails of the product to update

    const { quantity, brand, shop, price, added } = req.fields;

    // Looking for a list with corresponding ID in BDD
    const listToUpdate = await lists.findById(req.params.id);

    // Looking for a product with a corresponding id in BDD
    const productToUpdate = await products.findById(req.query.id);
    // console.log(productToUpdate);

    // ---- products details update
    const productDetails = listToUpdate.products;

    for (let i = 0; i < productDetails.length; i++) {
      if (req.query.id) {
        productDetails[i].reference = req.query.id;
      }

      if (quantity || quantity === "") {
        productDetails[i].quantity = quantity;
      }

      if (brand || brand === "") {
        productDetails[i].brand = brand;
      }

      if (shop || shop === "") {
        productDetails[i].shop = shop;
      }

      if (price || price === "") {
        productDetails[i].price = price;
      }

      if (added) {
        productDetails[i].added = added;
      }
    }

    // Notify update(s) on "products" array to Mongoose
    listToUpdate.markModified("products");

    // Save update list in BDD
    await listToUpdate.save();

    res.status(200).json("Product's details succesfully updated 👍🏻");
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* =================================================== */

// 3. DELETE a shopping list
router.delete("/lists/delete/:id", async (req, res) => {
  try {
    // Looking for a list with corresponding ID in BDD
    const listToDelete = await lists.findById(req.params.id);
    // Delete list
    await listToDelete.delete();
    // Send response to client
    res.status(200).json({ message: "List deleted successfully 👌🏻" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
