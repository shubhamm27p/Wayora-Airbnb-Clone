const express = require('express');
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsyns.js");
const passport = require('passport');

const { saveRedirectUrl } = require("../middlewares.js");
const  userController = require("../controllers/user.js");
const user = require('../models/user.js');

// GET and POST for signup 
router
  .route("/signup")
  .get(userController.renderSignupForm)    //Get signup 
  .post( wrapAsync(userController.signupUser));       //POST signup 

// GET and POST for login   
router
  .route("/login")
  .get(userController.renderLoginForm)           //Get login
  .post( 
    saveRedirectUrl,
    passport.authenticate("local", 
    {failureRedirect: "/login",
     failureFlash: true
    }), 
   userController.loginUser);               // login



//logout 
router.get("/logout",userController.logoutUser); 


module.exports = router;