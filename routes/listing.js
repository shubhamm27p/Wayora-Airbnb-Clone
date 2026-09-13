const express = require('express');
const methodOverride = require('method-override');
const routes = express.Router();
const wrapAsync = require('../utils/wrapAsyns.js');
const { isLoggedIn, isOwner, validateListing } = require('../middlewares.js');
const listingController = require('../controllers/listings.js');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

routes.use(methodOverride('_method'));

// Middleware to handle multer file upload errors gracefully
const handleUpload = (req, res, next) => {
    upload.single('listing[image]')(req, res, (err) => {
        if (err) {
            console.error('Image upload error:', err);
        }
        next();
    });
};

routes
   .route('/')
   .get(wrapAsync(listingController.index))
   .post(
      isLoggedIn,
      upload.single("listing[image]"),
      validateListing,
      wrapAsync(listingController.createListing)
   );
  

// New Route
routes.get('/new', isLoggedIn, wrapAsync(listingController.newListing));


// GET Edit route - render edit form (no validateListing needed for GET requests)
routes.get('/:id/edit', isLoggedIn, isOwner, wrapAsync(listingController.editListing));

// Edit, Update and Delete route by using router.route
routes
   .route('/:id')
   .get(wrapAsync(listingController.showListing))
   .put(isLoggedIn, isOwner, handleUpload, validateListing, wrapAsync(listingController.updateListing))
   .delete(isLoggedIn, isOwner, wrapAsync(listingController.deleteListing));

module.exports = routes;