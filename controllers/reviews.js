const express = require('express');
const router = express.Router({ mergeParams: true });
const Listing = require('../models/listing.js');
const Review = require('../models/review.js');
const ExpressError = require('../utils/ExpressError.js');
const wrapAsync = require('../utils/wrapAsyns.js');
const { validateReview, isLoggedIn,isAuthor } = require('../middleware.js');
const reviewcontroller = require('../controllers/reviews.js')

module.exports.createReview = async (req, res, next) => {
    let listing = await Listing.findById(req.params.id);

    if (!listing) {
        throw new ExpressError(404, 'Listing not found');
    }

    let newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    await newReview.save();

    if (!Array.isArray(listing.reviews)) {
        listing.reviews = [];
    }
    listing.reviews.push(newReview._id);
    await listing.save();
    req.flash("success", "New Review Created!");
    res.redirect(`/listings/${listing._id}`);
};

module.exports.destroyReview = async (req, res, next) => {
    let { id, reviewId } = req.params;    
    await Review.findByIdAndDelete(reviewId);
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    res.redirect(`/listings/${id}`);

};
