const Listing = require('./models/listing');
const ExpressError = require('./utils/ExpressError');
const { listingSchema } = require('./schema');
const { reviewSchema } = require('./schema');
const Review = require('./models/review');

module.exports.isLoggedIn = (req, res, next) => {
      if(!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "You must be signed in to perform this action!");
        return res.redirect('/login');
    }   
    next();
}
module.exports.saveRedirectUrl = (req, res, next) => {  
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
        delete req.session.redirectUrl;
    }   
    next();
};

module.exports.isOwner = async (req, res, next) => {
    try {
        let { id } = req.params;
        let listing = await Listing.findById(id);

        if (!listing) {
            req.flash("error", "Listing you requested for does not exist!");
            return res.redirect('/listings');
        }

        const currentUserId = (req.user?._id || res.locals.currUser?._id)?.toString();
        const ownerId = listing.owner?.toString();

        if (!currentUserId || ownerId !== currentUserId) {
            req.flash("error", "You don't have permission to perform this action!");
            return res.redirect(`/listings/${id}`);
        }

        next();
    } catch (err) {
        next(err);
    }
};

module.exports.validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
  
    if (error) {
        let errMsg = error.details.map(el => el.message).join(',');
        throw new ExpressError(400, errMsg);
    }else {
        next();
    }
};

module.exports.validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);

    if (error) {
        let errMsg = error.details.map(el => el.message).join(',');
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

module.exports.isAuthor = async (req, res, next) => {
    
        let { id, reviewId } = req.params;
        let review = await Review.findById(reviewId);   
    
    if (!review.author.equals(res.locals.currUser._id)) {
            req.flash("error", "You are not the author of this review!");
            return res.redirect(`/listings/${id}`);
        }
        next();
};