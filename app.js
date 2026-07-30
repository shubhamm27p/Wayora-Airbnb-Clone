const express = require('express');
const app = express();
const mongoose = require('mongoose');
const MONGO_URL ="mongodb://127.0.0.1:27017/wanderlust";
const path = require('path');   
const methodoverride = require('method-override');
const ejsMate = require('ejs-mate');
const ExpressError = require('./utils/ExpressError.js');
const wrapAsync = require('./utils/wrapAsyns.js');
const Listing = require('./models/listing.js');
const Review = require('./models/review.js');
const { listingSchema, reviewSchema } = require('./schema.js');
const session = require('express-session');
const flash = require('connect-flash');


const listingRoutes = require('./routes/listing.js');
const reviewRoutes = require('./routes/reviews.js');

const validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);

    if (error) {
        let errMsg = error.details.map(el => el.message).join(',');
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

main()
     .then(() => {
        console.log("connected to DB");
     })
     .catch((err) => {
        console.log(err);
     });    
async function main() {
    await mongoose.connect(MONGO_URL);
}   

app.set("view engine", "ejs");
app.set("views", path.join(__dirname,"views"));
app.set("ejs", "engine");
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(methodoverride('_method'));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, 'public')));


const sessionOption ={
    secret: "mysupersecretcode",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expire: Date.now() + 7 * 24 * 60 * 60 * 1000, 
        maxAge: 7 * 24 * 60 * 60 * 1000, 
        httpOnly: true,
    },
};

app.get('/', (req, res) => {
    res.send('Hi, I am root');

});

app.use(session(sessionOption));
app.use(flash());
app.use("/", require("./routes/index"));

app.use((req, res, next) =>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error")
    next();
})
app.get('/privacy', (req, res) => {
    res.render('privacy.ejs');
});

app.get('/terms', (req, res) => {
    res.render('terms.ejs');
});

app.use("/listings", listingRoutes);
app.use('/listings/:id/reviews', require('./routes/reviews.js'));

//Create Route
app.post('/listings',
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
        res.redirect('/listings');
    } catch (err) {
        next(err);
    }
}));

// GET Edit route - just render the form
app.get('/listings/:id/edit', wrapAsync(async (req, res, next) => {
    try {
        let { id } = req.params;
        const listing = await Listing.findById(id);
        res.render('listings/edit.ejs', { listing });
    } catch (err) {
        next(err);
    }
}));

// update route
app.put('/listings/:id', validateListing, wrapAsync(async (req, res, next) => {
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
        res.redirect(`/listings/${id}`);
    } catch (err) {
        next(err);
    }
}));




app.use((req, res, next) => {
    next(new ExpressError(404, 'Page Not Found'));
});

app.use((err, req, res, next) => {
    console.error(err);
    let { statusCode = 500, message = 'Something went wrong!' } = err;
    res.status(statusCode).render('err.ejs', { statusCode, message });
});
app.listen(8080, () => {
    console.log('Server is running on port 8080');
});
// app.get("/testListing", async (req, res) => {
//   let sampleListing = new Listing({
//     title: "My New Villa",
//     description: "By the beach",
//     price: 1200,
//     location: "Calangute, Goa",
//     country: "India",
//   });
    

//     await sampleListing.save();
//     console.log("Sample was Saved");
//     res.send("successful testing");
// });  