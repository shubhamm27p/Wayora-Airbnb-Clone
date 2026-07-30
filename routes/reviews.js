const express = require('express');
const router = express.Router({ mergeParams: true });
const Listing = require('../models/listing.js');
const Review = require('../models/review.js');
const { reviewSchema } = require('../schema.js');
const ExpressError = require('../utils/ExpressError.js');
const wrapAsync = require('../utils/wrapAsyns.js');

const validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);

    if (error) {
        let errMsg = error.details.map(el => el.message).join(',');
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};


router.post('/', validateReview, wrapAsync(async (req, res, next) => {
    let listing = await Listing.findById(req.params.id);

    if (!listing) {
        throw new ExpressError(404, 'Listing not found');
    }

    let newReview = new Review(req.body.review);
    await newReview.save();

    if (!Array.isArray(listing.reviews)) {
        listing.reviews = [];
    }

    listing.reviews.push(newReview._id);
    await listing.save();
    req.flash("success", "New Review Created!")
    res.redirect(`/listings/${listing._id}`);
}));

// Delete route for removing a review
router.delete('/:reviewId', wrapAsync(async (req, res, next) => {
    let { id, reviewId } = req.params;    
    await Review.findByIdAndDelete(reviewId);
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    res.redirect(`/listings/${id}`);

}));

module.exports = router;

