const express = require("express");
const formidable = require("express-formidable");
const router = express.Router();
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const { users, products, lists } = require("../models");
const isAuthenticated = require("./middleware/isAuthenticated");

// Pas de app.use("formidable") si cette syntaxe : router.get("/api/users", formidable(), async (req, res) => {

/* =================================================== */
// Route Sign Up with email
/* =================================================== */
router.post("/user/signup", formidable(), async (req, res) => {
  try {
    // Destructuring of req.fields
    const { email, firstName, password } = req.fields;

    // Check if all aprameters are sent in Form Data
    if (email && firstName && password) {
      // Check if email already in DB
      const userWithEmail = await users.findOne({ email: email });

      if (!userWithEmail) {
        // Generate a Token
        const token = uid2(64);
        // Generate hash and salt
        const salt = uid2(16);
        const hash = SHA256(salt + password).toString(encBase64);

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

        // Create a new default list "Ma liste de courses"
        const newList = new lists({
          title: "Courses maison",
          emoji: "🥑",
          owner: newUser,
        });

        // Add a reference to the list to the new user
        newUser.lists = newList;

        //Save new user and list
        await newUser.save();
        await newList.save();

        // Respond to client
        res.status(201).json({
          _id: newUser._id,
          token: newUser.token,
          email: newUser.email,
          account: {
            firstName: newUser.account.firstName,
          },
        });
      } else {
        res
          .status(400)
          .json({ error: "An account already exists with this email" });
      }
    } else {
      res.status(400).json({ error: "Missing parameter" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* =================================================== */
// Route Log In with email
/* =================================================== */
router.post("/user/login", formidable(), async (req, res) => {
  try {
    //  Destructuring of req.fields
    const { email, password } = req.fields;
    // Check if email and password are sent in body
    if (email && password) {
      // Check if a user exists with this email
      const userWithEmail = await users.findOne({ email: email });
      if (userWithEmail) {
        // Create a new hash
        const newHash = SHA256(userWithEmail.salt + password).toString(
          encBase64
        );
        // Compare hash in DB with new hash
        if (newHash === userWithEmail.hash) {
          res.status(200).json({
            _id: userWithEmail._id,
            token: userWithEmail.token,
            account: {
              firstName: userWithEmail.account.firstName,
            },
          });
        } else {
          res.status(401).json({ error: "Unauthorized" });
        }
      } else {
        res.status(401).json({ error: "Unauthorized" });
      }
    } else {
      res.status(400).json({ error: "Missing Parameter" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* =================================================== */
// Route to delete a user
/* =================================================== */
router.delete(
  "/user/delete/:id",
  formidable(),
  isAuthenticated,
  async (req, res) => {
    try {
      // Check if ID in params corresponds to a user
      const userToDelete = await users.findById(req.params.id);

      if (userToDelete) {
        // Check if the token of userToDelete is the same as the one sent in the headers
        const tokenInHeaders = req.headers.authorization.replace("Bearer ", "");
        if (userToDelete.token === tokenInHeaders) {
          // Check if the user has an avatar
          if (userToDelete.account.avatar.public_id) {
            // Delete avatar from Cloudinary
            await cloudinary.api.delete_resources(
              userToDelete.account.avatar.public_id
            );

            // Delete folder from Cloudinary
            await cloudinary.api.delete_folder(`/vulpi/users/${req.params.id}`);
          }

          // Delete lists the user is an owner of
          for (let i = 0; i < userToDelete.lists.length; i++) {
            const idListToDelete = userToDelete.lists[i];
            await lists.findByIdAndDelete(idListToDelete);
          }

          // Delete user from DB
          await users.findByIdAndDelete(req.params.id);

          // Respond to the client
          res.status(200).json({ message: "User successfully deleted" });
        } else {
          res.status(401).json({ error: "Unauthorized" });
        }
      } else {
        res.status(400).json({ error: "This user doesn't exist" });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

/* =================================================== */
// Route to modify a user
/* =================================================== */
router.put(
  "/user/update/:id",
  formidable(),
  isAuthenticated,
  async (req, res) => {
    try {
      const {
        email,
        firstName,
        lastName,
        gender,
        birthDate,
        newsletter,
        password,
        firstConnection,
      } = req.fields;

      if (
        email ||
        firstName ||
        lastName ||
        gender ||
        birthDate ||
        req.files.avatar ||
        newsletter ||
        password ||
        firstConnection
      ) {
        // Check if ID in params corresponds to a user
        const userToUpdate = await users.findById(req.params.id);

        if (userToUpdate) {
          // Check if the token of userToUpdate is the same as the one sent in the headers
          const tokenInHeaders = req.headers.authorization.replace(
            "Bearer ",
            ""
          );

          if (userToUpdate.token === tokenInHeaders) {
            if (email) {
              // Check if the user has provided a different email than the one in DB
              if (email !== userToUpdate.email) {
                // Check if email already in DB
                const userWithEmail = await users.findOne({ email: email });
                if (!userWithEmail) {
                  userToUpdate.email = email;
                } else {
                  return res.status(400).json({
                    error: "An account already exists with this email",
                  });
                }
              }
            }

            if (firstName) {
              userToUpdate.account.firstName = firstName;
            }

            if (lastName) {
              userToUpdate.account.lastName = lastName;
            }

            if (gender) {
              if (
                gender === "female" ||
                gender === "male" ||
                gender === "other" ||
                gender === "not answered"
              ) {
                userToUpdate.account.gender = gender;
              } else {
                return res
                  .status(400)
                  .json({ error: "Wrong value for this parameter" });
              }
            }

            if (birthDate) {
              userToUpdate.account.birthDate = birthDate;
            }

            if (newsletter === "true") {
              userToUpdate.newsletter = true;
            } else if (newsletter === "false") {
              userToUpdate.newsletter = false;
            }

            if (password) {
              // Create a new hash
              const newHash = SHA256(userToUpdate.salt + password).toString(
                encBase64
              );

              // Modify hash in DB
              userToUpdate.hash = newHash;
            }

            if (firstConnection === "true") {
              userToUpdate.firstConnection = true;
            } else if (firstConnection === "false") {
              userToUpdate.firstConnection = false;
            }

            if (req.files.avatar) {
              // Check if the user already has an avatar
              if (userToUpdate.account.avatar.public_id) {
                // Delete previous avatar from Cloudinary
                await cloudinary.api.delete_resources(
                  userToUpdate.account.avatar.public_id
                );
              }

              // Add new picture to Cloudinary
              const result = await cloudinary.uploader.upload(
                req.files.avatar.path,
                { folder: `/vulpi/users/${req.params.id}` }
              );

              // Modify info about the avatar of user
              userToUpdate.account.avatar = result;
            }
            // Save updates in DB
            await userToUpdate.save();

            // Respond to client
            res
              .status(200)
              .json({ message: "User account successfully modified" });
          } else {
            res.status(401).json({ error: "Unauthorized" });
          }
        } else {
          res.status(400).json({ error: "This user doesn't exist" });
        }
      } else {
        res.status(400).json({ error: "No parameters to modify" });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

/* =================================================== */
// Route to Authenticate with Apple
/* =================================================== */
router.post("/user/appleauth", formidable(), async (req, res) => {
  try {
    const { appleId, firstName, lastName, email } = req.fields;
    if (appleId) {
      // Check if Apple Id already in DB, if yes --> log in // if no --> sign up
      const userWithAppleId = await users.findOne({
        idThirdPartyAuth: appleId,
      });
      if (userWithAppleId) {
        return res.status(200).json({
          _id: userWithAppleId._id,
          token: userWithAppleId.token,
          account: {
            firstName: userWithAppleId.account.firstName,
          },
        });
      } else {
        let emailToSignUp;
        if (email) {
          // Check if email already in DB
          const userWithEmail = await users.findOne({ email: email });

          if (!userWithEmail) {
            emailToSignUp = email;
          } else {
            return res
              .status(400)
              .json({ error: "An account already exists with this email" });
          }
        } else {
          // If no email given with the authentification, a default message will ask the user to give their email adress until it is modified
          emailToSignUp = "Renseigne ton adresse email ici !";
        }

        let firstNameToSignUp;
        if (firstName) {
          firstNameToSignUp = firstName;
        } else {
          // If no first name given with the authentitfication, a default first name will be given until the user modifies it
          firstNameToSignUp = "Vulpi Anonyme";
        }

        // Generate a token
        const token = uid2(64);
        // Create a new user
        const newUser = new users({
          email: emailToSignUp,
          newsletter: false,
          token: token,
          emailConfirm: false,
          firstConnection: true,
          idThirdPartyAuth: appleId,
          account: {
            firstName: firstNameToSignUp,
          },
        });

        if (lastName) {
          newUser.account.lastName = lastName;
        }

        // Create a new default list "Ma liste de courses"
        const newList = new lists({
          title: "Ma liste de courses",
          emoji: "🥑",
          owner: newUser,
        });

        // Add a reference to the list to the new user
        newUser.lists = newList;

        //Save new user and list
        await newUser.save();
        await newList.save();

        // Respond to client
        return res.status(201).json({
          _id: newUser._id,
          token: newUser.token,
          email: newUser.email,
          account: {
            firstName: newUser.account.firstName,
          },
        });
      }

      // Respond to the client
    } else {
      res.status(400).json({ error: "Missing Apple Id" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* =================================================== */
// Route to get info about a user
/* =================================================== */
router.get("/user/:userId", isAuthenticated, async (req, res) => {
  try {
    if (req.params.userId) {
      // Check if the user exists in DB
      const userWithId = await users.findById(req.params.userId);

      if (userWithId) {
        // Check if the token sent is the same as the one of userWithId
        const token = req.headers.authorization.replace("Bearer ", "");
        if (token === userWithId.token) {
          res.status(200).json({
            _id: userWithId._id,
            email: userWithId.email,
            lists: userWithId.lists,
            account: {
              firstName: userWithId.account.firstName,
              lastName: userWithId.account.lastName,
              gender: userWithId.account.gender,
              birthDate: userWithId.account.birthDate,
              avatar: userWithId.account.avatar,
            },
          });
        } else {
          res.status(401).json({ error: "Unauthorized" });
        }
      } else {
        res.status(400).json({ error: "This user doesn't exist" });
      }
    } else {
      res.status(400).json({ error: "Missing user ID" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* =================================================== */
// Route to get all users
/* =================================================== */

router.get("/users", formidable(), async (req, res) => {
  try {
    const usersList = await users.find();
    res.status(200).json(usersList);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
