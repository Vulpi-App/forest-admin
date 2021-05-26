// Imports Express, Express formidable and init router
const express = require("express");
const router = express.Router();
const formidable = require("express-formidable");
const cloudinary = require("cloudinary").v2;

// Use Express-Formidable
router.use(formidable());
const { users, lists, products } = require("../models");

// Function async basic
const funcAsync = (func1, cb) => {
  cb(func1());
};

// Import isAuthenticated
const isAuthenticated = require("./middleware/isAuthenticated");

// Cloundinary keys
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

/* =================================================== */
/* =================================================== */
/* ============     ROUTES MANON      ================ */
/* =================================================== */
/* =================================================== */

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

/* =================================================== */
/* =================================================== */
/* ============     ROUTES BRAHIM     ================ */
/* =================================================== */
/* =================================================== */

// 4. Route POST to add a product to a list
router.post("/lists/add-product/:id", isAuthenticated, async (req, res) => {
  try {
    const { nameProduct, quantity, brand, shop, price } = req.fields;

    const idList = req.params.id;
    const shoppingList = await lists.findById(idList);
    const user = req.user;

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
                // Product doesn't exist in products database
                // 1. Product creation in product database
                productToAdd = new products({ name: nameProduct });
                await productToAdd.save();

                // If picture is present, add to product in database and to Cloundinary
                if (req.files.picture) {
                  console.log(req.files.picture);
                  const pictureProduct = await cloudinary.uploader.upload(
                    req.files.picture.path,
                    { folder: `vulpi/products/${productToAdd.id}` }
                  );
                  productToAdd.picture = pictureProduct;
                  await productToAdd.save();
                }
              }

              // 2. Add product to shoppingList (array)
              shoppingList.products.push({
                reference: productToAdd,
                quantity: quantity && quantity,
                brand: brand && brand,
                shop: shop && shop,
                price: price && price,
                added: false,
              });
              await shoppingList.save();

              // 3. Add product to user's products database (array)
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
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* =================================================== */

// 5. Route PUT to update a product to a list
router.put("/lists/update-product/:id", isAuthenticated, async (req, res) => {
  try {
    const { quantity, brand, shop, price, added } = req.fields;
    const { idProduct } = req.query;
    const idList = req.params.id;
    const shoppingList = await lists.findById(idList);

    if (shoppingList) {
      const productsInShoppingList = shoppingList.products;

      // Add function because code asynchrone
      const checkProductInShoppingList = () => {
        // Check if the product is already present in shoppingList
        for (let i in productsInShoppingList) {
          if (productsInShoppingList[i].id === idProduct) {
            return i;
          }
        }
      };

      // Function Update Product
      const updateProduct = async (positionProduct) => {
        if (positionProduct) {
          productsInShoppingList[positionProduct].quantity = quantity
            ? quantity
            : "";
          productsInShoppingList[positionProduct].brand = brand ? brand : "";
          productsInShoppingList[positionProduct].shop = shop ? shop : "";
          productsInShoppingList[positionProduct].price = price ? price : "";
          added
            ? (productsInShoppingList[positionProduct].added = added)
            : null;
          await shoppingList.save();

          // If picture is present, add to product in database and to Cloundinary
          if (req.files.picture) {
            const productToUpdate = await products.findById(
              productsInShoppingList[positionProduct].reference
            );
            console.log(productsInShoppingList[positionProduct].reference);

            productToUpdate.picture = await cloudinary.uploader.upload(
              req.files.picture.path,
              { folder: `vulpi/products/${productToUpdate.id}` }
            );
            await productToUpdate.save();
          }

          res.status(200).json({
            message: "Product updated successfully",
            list: shoppingList,
          });
        } else {
          res.status(400).json({
            message: `The product you want to add doesn't exist in the list ${shoppingList.title}, add it !`,
          });
        }
      };

      // Call function async with callback
      funcAsync(checkProductInShoppingList, updateProduct);
    } else {
      res
        .status(400)
        .json({ message: "The list you want to modify doesn't exist" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
