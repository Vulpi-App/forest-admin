// Imports Express, Express formidable and init router
const express = require("express");
const router = express.Router();
const formidable = require("express-formidable");
const cloudinary = require("cloudinary").v2;

const { users, lists, products } = require("../models");

// Import Middleware
const isAuthenticated = require("./middleware/isAuthenticated");

// Function async basic
const funcAsync = (func1, cb) => {
  cb(func1());
};

// Cloundinary keys
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* =================================================== */

/* =================================================== */
/* =================================================== */
/* ============     ROUTES MANON 🌺   ================ */
/* =================================================== */
/* =================================================== */

/* =================================================== */

// 1. CREATE a shopping list ✅
// EmojisTab to be complete (animals, nature...) ⛔️
router.post(
  "/lists/create",
  formidable(),
  isAuthenticated,
  async (req, res) => {
    const emojisTab = [
      "🍏",
      "🍎",
      "🍐",
      "🍊",
      "🍋",
      "🍌",
      "🍉",
      "🍇",
      "🍓",
      "🫐",
      "🍈",
      "🍒",
      "🍑",
      "🥭",
      "🍍",
      "🥥",
      "🥝",
      "🍅",
      "🍆",
      "🥑",
      "🥦",
      "🥬",
      "🥒",
      "🌶",
      "🫑",
      "🌽",
      "🥕",
      "🫒",
      "🧄",
      "🧅",
      "🥔",
      "🍠",
      "🥐",
      "🥯",
      "🍞",
      "🥖",
      "🥨",
      "🧀",
      "🥚",
      "🍳",
      "🧈",
      "🥞",
      "🧇",
      "🥓",
      "🥩",
      "🍗",
      "🍖",
      "🦴",
      "🌭",
      "🍔",
      "🍟",
      "🍕",
      "🫓",
      "🥪",
      "🥙",
      "🧆",
      "🌮",
      "🌯",
      "🫔",
      "🥗",
      "🥘",
      "🥘",
      "🫕",
      "🥫",
      "🍝",
      "🍜",
      "🍲",
      "🍛",
      "🍣",
      "🍱",
      "🥟",
      "🦪",
      "🍤",
      "🍙",
      "🍚",
      "🍘",
      "🍥",
      "🥠",
      "🥮",
      "🍢",
      "🍡",
      "🍧",
      "🍨",
      "🍦",
      "🥧",
      "🧁",
      "🍰",
      "🎂",
      "🍮",
      "🍭",
      "🍬",
      "🍫",
      "🍿",
      "🍩",
      "🍪",
      "🌰",
      "🥜",
      "🍯",
      "🥛",
      "🍼",
      "🫖",
      "☕️",
      "🍵",
      "🧃",
      "🥤",
      "🧋",
      "🍶",
      "🍺",
      "🍻",
      "🥂",
      "🍷",
      "🥃",
      "🍸",
      "🍹",
      "🧉",
      "🍾",
      "🧊",
      "🥄",
      "🍴",
      "🍽",
      "🥣",
      "🥡",
      "🥢",
      "🧂",
      "🧸",
      "🎁",
      "🎈",
      "🎀",
      "🎉",
      "🛍",
      "🛒",
      "🎊",
      "♥️",
      "🧡",
      "💛",
      "💚",
      "💙",
      "💜",
      "🖤",
      "🤍",
      "🤎",
      "💕",
      "💞",
      "💓",
      "💗",
      "💖",
      "💘",
      "💝",
      "🌺",
      "🌸",
      "🌼",
      "🌞",
      "⭐️",
      "☀️",
      "🌈",
      "🔥",
      "💐",
      "🦐",
      "🦞",
      "🦀",
      "🐠",
      "🐙",
      "🦄",
      "🤩",
      "🥳",
      "😎",
      "😇",
      "😍",
      "🥰",
      "😘",
      "🤪",
      "😋",
      "😛",
      "🙃",
      "🎃",
    ];
    // console.log(emojisTab.length);
    console.log(req.user);
    console.log(req.user._id);

    try {
      const { title, emoji } = req.fields;

      // title & emoji already filled in create list step (so mandatory)
      if (title && emoji) {
        if (title.length <= 30) {
          if (emojisTab.indexOf(emoji) !== -1) {
            const newList = new lists({
              title: title,
              emoji: emoji,
              owner: req.user,
            });

            // Link the new list created to the user who created it
            const user = await users.findById(req.user._id);
            user.lists.push(newList);

            // Save new list in BDD & list to user
            await user.save();
            await newList.save();

            // Send response to client
            res.status(200).json({ message: "List created successfully 🦄" });
          } else {
            res.status(400).json({ message: "Emoji unauthorised 🤭" });
          }
        } else {
          res.status(400).json({ message: "Title is too long 😬" });
        }
      } else {
        res.status(400).json({ message: "Title and emoji are required 🐣" });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

/* =================================================== */

// 2. UPDATE shopping list: title & emoji ✅
router.put(
  "/lists/update/:id",
  formidable(),
  isAuthenticated,
  async (req, res) => {
    try {
      const { title, emoji } = req.fields;

      // Looking for a list with corresponding ID in BDD
      const listToUpdate = await lists.findById(req.params.id);

      // If there is a corresponding list
      if (listToUpdate) {
        if (title && title.length <= 30) {
          listToUpdate.title = title;
        }
        if (emoji) {
          listToUpdate.emoji = emoji;
        }
      } else {
        res.status(400).json({ message: "This list does not exist 🥴" });
      }

      // Save update list in BDD
      await listToUpdate.save();

      // Send response to client
      res.status(200).json({ message: "List update successfully 🥳" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

/* =================================================== */

// 3. DELETE a shopping list ✅
router.delete("/lists/delete/:id", isAuthenticated, async (req, res) => {
  try {
    // Looking for a list with corresponding ID in BDD
    const listToDelete = await lists.findById(req.params.id);

    if (listToDelete) {
      // Delete list
      await listToDelete.delete();

      // Send response to client
      res.status(200).json({ message: "List deleted successfully 👌🏻" });
    } else {
      res.status(400).json({ message: "This list does not exist 🥴" });
    }
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
router.post(
  "/lists/add-product/:id",
  formidable(),
  isAuthenticated,
  async (req, res) => {
    try {
      const { nameProduct, quantity, brand, shop, price } = req.fields;

      const idList = req.params.id;
      const shoppingList = await lists.findById(idList).populate("products");
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
  }
);

/* =================================================== */

// 5. Route PUT to update a product to a list
router.put(
  "/lists/update-product/:id",
  formidable(),
  isAuthenticated,
  async (req, res) => {
    try {
      const { quantity, brand, shop, price, added } = req.fields;
      const { idProduct } = req.query;
      const idList = req.params.id;
      const shoppingList = await lists.findById(idList);

      if (shoppingList) {
        const productsInShoppingList = shoppingList.products;

        // Add function because code asynchrone
        const checkProductInShoppingList = () => {
          // Check if the product is  present in shoppingList
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
  }
);

/* =================================================== */

// 5. Route DELETE to delete a product to a list
router.delete(
  "/lists/delete-product/:id",
  isAuthenticated,
  async (req, res) => {
    try {
      const idList = req.params.id;
      const shoppingList = await lists.findById(idList);
      const { idProduct } = req.query;

      if (shoppingList) {
        const productsInShoppingList = shoppingList.products;

        // Add function because code asynchrone
        const checkProductInShoppingList = () => {
          // Check if the product is  present in shoppingList
          for (let i in productsInShoppingList) {
            if (productsInShoppingList[i].id === idProduct) {
              return i;
            }
          }
        };

        // Function delete product
        const deleteProduct = async (positionProduct) => {
          if (positionProduct) {
            productsInShoppingList.splice(positionProduct, 1);
            await shoppingList.save();
            res.status(200).json({
              message: "Product delete successfully",
              list: shoppingList,
            });
          } else {
            res.status(400).json({
              message: `The product you want to delete doesn't exist in the list ${shoppingList.title}`,
            });
          }
        };

        // Call function async with callback
        funcAsync(checkProductInShoppingList, deleteProduct);
      } else {
        res
          .status(400)
          .json({ message: "The list you want to modify doesn't exist" });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

/* =================================================== */
/* =================================================== */
/* ============     ROUTES PAULINE     ================ */
/* =================================================== */
/* =================================================== */

/* =================================================== */
// Route to get All lists of a user
/* =================================================== */
router.get("/lists/:userId", isAuthenticated, async (req, res) => {
  try {
    if (req.params.userId) {
      // Check if ID in params corresponds to a user
      const user = await users.findById(req.params.userId).populate("lists");

      if (user) {
        // Check if the token of userToUpdate is the same as the one sent in the headers
        const tokenInHeaders = req.headers.authorization.replace("Bearer ", "");

        if (user.token === tokenInHeaders) {
          // Respond to client with the lists of the user
          res.status(200).json({ lists: user.lists });
        } else {
          res.status(401).json({ error: "Unauthorized" });
        }
      } else {
        res.status(400).json({ error: "This user doesn't exist" });
      }
    } else {
      res.status(400).json({ error: "Missing user Id" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* =================================================== */
// Route to get products in a given list
/* =================================================== */
router.get("/listcontent/:listId", isAuthenticated, async (req, res) => {
  try {
    console.log(req.params.listId);
    if (req.params.listId) {
      const listWithId = await lists
        .findById(req.params.listId)
        .populate("products.reference");

      if (listWithId) {
        res.status(200).json({
          title: listWithId.title,
          emoji: listWithId.emoji,
          products: listWithId.products,
        });
      } else {
        res.status(400).json({ error: "This list doesn't exist" });
      }
    } else {
      res.status(400).json({ error: "Missing list Id" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* =================================================== */
// Route to get All lists in DB
/* =================================================== */
router.get("/lists", async (req, res) => {
  try {
    const shoppingLists = await lists.find();

    res.status(200).json(shoppingLists);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
