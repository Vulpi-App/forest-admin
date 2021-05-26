// Import Express, Express formidable and init router
const express = require("express");
const router = express.Router();
const formidable = require("express-formidable");


// Use Express-Formidable
router.use(formidable());
const { users, lists, products } = require("../models");

// Function async basic
const funcAsync = (func1, cb) => {
  cb(func1);
};


/* =================================================== */


// All lists
router.get("/lists", async (req, res) => {

  try {
    const shoppingLists = await lists.find();

    res.status(200).json(shoppingLists);
  } catch (error) {
    console.log(error);
  }
});


// Route POST to add a product to a list
// AJOUTER isAuthenticated
// AJOUTER les photos avec cloudinary
router.post("/lists/add-product/:id", async (req, res) => {
  try {
    const { nameProduct, quantity, brand, shop, price } = req.fields;

    const idList = req.params.id;
    const shoppingList = await lists.findById(idList);
    // const user = req.user;
    // Modification temporaire du user pour simuler un isAuthenticated
    const user = await users.findById("60abcb97ac82f76c79939767");

    // Add function because code asynchrone
    const checkProductInDBUser = () => {
      // Check if the product is already present in User's products database
      for (let i of user.products) {
        if (i.name === nameProduct) {
          return true;
        }
      }
    };

    // Function Add Product
    const addProduct = async (productAlreadyInDB) => {
      if (shoppingList) {
        if (nameProduct) {
          if (nameProduct.length <= 30) {
            if (productAlreadyInDB) {
              // Product exist in user's products database
              const productToAddList = await products.findOne({
                name: nameProduct,
              });

              // Add product to shoppingList (array)
              shoppingList.products.push({
                reference: productToAddList,
                quantity: quantity && quantity,
                brand: brand && brand,
                shop: shop && shop,
                price: price && price,
                added: false,
              });
              await shoppingList.save();
              res
                .status(200)
                .json({ message: "Product added to your shopping list" }); // A compléter avec les éléments dont le front aura besoin
            } else {
              // Check if the product is already present in products database
              let productToAdd = await products.findOne({
                name: nameProduct,
              });

              if (!productToAdd) {
                // Product creation in product database
                productToAdd = new products({ name: nameProduct });
                await productToAdd.save();
              }

              // Add product to shoppingList (array)
              shoppingList.products.push({
                reference: productToAdd,
                quantity: quantity && quantity,
                brand: brand && brand,
                shop: shop && shop,
                price: price && price,
                added: false,
              });
              await shoppingList.save();

              // Add product to user's products database (array)
              user.products.push(productToAdd);
              await user.save();

              res.status(200).json({
                message:
                  "Product added to your shopping list and your products history",
              }); // A compléter avec les éléments dont le front aura besoin
            }
          } else {
            res.status(400).json({
              message: "The product name must not exceed 30 characters",
            });
          }
        } else {
          res.status(400).json({ message: "Please, enter the product name" });
        }
      } else {
        res
          .status(400)
          .json({ message: "The list you want to modify doesn't exist" });
      }
    };

    // Call function async with callback
    funcAsync(checkProductInDBUser, addProduct);
  } catch (error) {}
});

// Route PUT to update a product to a list
// AJOUTER isAuthenticated
// AJOUTER les photos avec cloudinary
// VOIR si nécessaire d'ajouter un nombre de characters max
router.put("/lists/update-product/:id", async (req, res) => {
  try {
    const { quantity, brand, shop, price, added } = req.fields;
    const { idProduct } = req.query;
    const idList = req.params.id;
    const shoppingList = await lists.findById(idList);

    for (let i of shoppingList.products) {
      if (i.id === idProduct) {
        i.quantity = quantity ? quantity : "";
        i.brand = brand ? brand : "";
        i.shop = shop ? shop : "";
        i.price = price ? price : "";
        added ? (i.added = added) : null;
        await shoppingList.save();
        res
          .status(200)
          .json({ message: "Product updated successfully", product: i });
      }
    }

/* =================================================== */

// 1. CREATE a shopping list
// !! Waiting for middleware isAuthenticated to link user's ref
router.post("/lists/create", async (req, res) => {
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
router.put("/lists/update/:id", async (req, res) => {
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
