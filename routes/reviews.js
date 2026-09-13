const express = require('express');
const router = express.Router({ mergeParams: true });
const wrapAsync = require('../utils/wrapAsyns.js');
const { validateReview, isLoggedIn, isAuthor } = require('../middlewares.js');
const reviewController = require('../controllers/reviews.js');


router.post('/', validateReview, isLoggedIn, wrapAsync(reviewController.createReview));

// Delete route for removing a review
router.delete('/:reviewId', isLoggedIn, isAuthor, wrapAsync(reviewController.destroyReview));

module.exports = router;

