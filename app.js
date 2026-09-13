if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');   
const methodoverride = require('method-override');
const ejsMate = require('ejs-mate');
const ExpressError = require('./utils/ExpressError.js');
const session = require('express-session');
const MongoStore = require('connect-mongo');
// Fix for connect-mongo v6 CommonJS export changes
const MongoStoreClass = MongoStore.default || MongoStore;
const flash = require('connect-flash');
const passport = require('passport');
const localStarategy = require('passport-local');
const User = require('./models/user.js');
const wrapAsync = require('./utils/wrapAsyns.js');
const Listing = require('./models/listing.js');
const Review = require('./models/review.js');
const { listingSchema, reviewSchema } = require('./schema.js');

const listingRouter = require('./routes/listing.js');
const reviewRouter = require('./routes/reviews.js');
const userRouter = require('./routes/user.js');


const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

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
    await mongoose.connect(dbUrl);
}   

app.set("view engine", "ejs");
app.set("views", path.join(__dirname,"views"));
app.set("ejs", "engine");
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(methodoverride('_method'));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, 'public')));

const store = MongoStoreClass.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET
    },
    touchAfter: 24 * 3600
});

store.on("error", (err) => {
    console.log("ERROR in MONGO SESSION STORE", err);
});

const sessionOption ={
    store,
    secret:process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expire: Date.now() + 7 * 24 * 60 * 60 * 1000, 
        maxAge: 7 * 24 * 60 * 60 * 1000, 
        httpOnly: true,
    },
};


app.use(session(sessionOption));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStarategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) =>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    res.locals.q = req.query.q || '';
    next();
});


app.get(['/listing', '/listing/'], (req, res) => {
    res.redirect('/listings');
});

app.get(['/listing/:id', '/listing/:id/'], (req, res) => {
    res.redirect(`/listings/${req.params.id}`);
});

app.use('/listings', listingRouter);
app.use('/listings/:id/reviews', reviewRouter);
app.use('/', userRouter);



app.use((err, req, res, next) => {
    let { statusCode = 500, message = 'Something went wrong!' } = err;
    res.status(statusCode).render('err.ejs', { statusCode, message });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

app.get('/privacy', (req, res) => {
    res.render('privacy.ejs');
});

app.get('/terms', (req, res) => {
    res.render('terms.ejs');
});

app.use((req, res, next) => {
    next(new ExpressError(404, 'Page Not Found'));
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