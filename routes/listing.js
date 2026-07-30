const express = require('express');
const routes = express.Router();
const wrapAsync = require('../utils/wrapAsyns.js');
const ExpressError = require('../utils/ExpressError.js');
const { listingSchema } = require('../schema.js');
const Listing = require('../models/listing.js');

const validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
  
    if (error) {
        let errMsg = error.details.map(el => el.message).join(',');
        throw new ExpressError(400, errMsg);
    }else {
        next();
    }
};

//Index Route
routes.get('/', wrapAsync(async (req, res) => {
     const allListings = await Listing.find({});
     res.render('listings/index.ejs', { allListings });
}));

//New Route
routes.get('/new', wrapAsync(async (req, res) => {
    res.render('listings/new.ejs');
}));

//show Route
routes.get('/:id', wrapAsync(async (req, res, next) => {
    try{
        let { id } = req.params;
        const listing = await Listing.findById(id).populate('reviews');
        if(!listing){
            req.flash("error", "Listing you requested for does not exist!")
            res.redirect("/listings");
        }
        res.render('listings/show.ejs', { listing });
    
        
} catch (err) {
    next.err;
}}
)) ;

//Create Route
routes.post('/',
     validateListing,
    wrapAsync(async (req, res, next) => {
  
    try {
        if (!req.body.listing) {
            throw new ExpressError(400, 'Invalid Listing Data');
        }

        const { title, description, location, country, price, image } = req.body.listing;

        if (!title?.trim() || !description?.trim() || !location?.trim() || !country?.trim()) {
            throw new ExpressError(400, 'Title, description, country, and location are required');
        }

        const listing = new Listing({
            title: title.trim(),
            description: description.trim(),
            location: location.trim(),
            country: country.trim(),
            price,
            image: image?.trim() || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'
        });

        await listing.save();
        req.flash("success","New Listing Created!");
        res.redirect('/listings');
    } catch (err) {
        next(err);
    }
}));

// GET Edit route - just render the form
routes.get('/:id/edit', wrapAsync(async (req, res, next) => {
    try {
        let { id } = req.params;
        const listing = await Listing.findById(id);
          if(!listing){
            req.flash("error", "Listing you requested for does not exist!")
            res.redirect("/listings");
        }
        res.render('listings/edit.ejs', { listing });
    } catch (err) {
        next(err);
    }
}));

// update route
routes.put('/:id', validateListing, wrapAsync(async (req, res, next) => {
    try {
        if (!req.body.listing) {
            throw new ExpressError(400, 'Invalid Listing Data');
        }

        let { id } = req.params;
        let updateData = {
            ...req.body.listing,
            image: req.body.listing.image?.trim() || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'
        };

        await Listing.findByIdAndUpdate(id, updateData);
        req.flash("success", "Listing Updated!")
        res.redirect(`/listings/${id}`);
    } catch (err) {
        next(err);
    }
}));

//Delete route
routes.delete('/listings/:id', wrapAsync(async (req, res, next) => {
    try {
        let { id } = req.params;
        const deletedListing = await Listing.findByIdAndDelete(id);
        console.log('deleted listing:', deletedListing);
        req.flash("Success", "Listing Deleted!")
        res.redirect('/listings');
    } catch (err) {
        next(err);
    }
}));

module.exports = routes;