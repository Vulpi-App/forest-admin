// Import Express, Express formidable and init router
const express = require("express");
const formidable = require("express-formidable");
const router = express.Router();

// Use Express-Formidable
router.use(formidable());
const { users, lists, products } = require("../models");

// A RETIRER AVANT PUSH !!!!
console.log(users);
console.log(lists);
console.log(products);

// Function async basic
const funcAsync = (func1, cb) => {
  cb(func1);
};

// Pas de app.use("formidable") si cette syntaxe : router.get("/api/users", formidable(), async (req, res) => {

// All lists
router.get("/lists", async (req, res) => {
  try {
    const shoppingList = await lists.find();
    res.status(200).json(shoppingList);
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
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
