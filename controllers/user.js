const User = require("../models/user.js");

// render Signup form 
module.exports.renderSignupForm = (req, res) => {
    if (!req.session.redirectUrl && req.headers.referer) {
        try {
            const refererUrl = new URL(req.headers.referer);
            if (refererUrl.pathname && !['/login', '/signup'].includes(refererUrl.pathname)) {
                req.session.redirectUrl = refererUrl.pathname + refererUrl.search;
            }
        } catch (e) {}
    }
    res.render("users/signup.ejs");
};

// signup user 
module.exports.signupUser = async (req, res, next) => {
    try {
        let { username, email, password } = req.body;
        const redirectUrl = req.session.redirectUrl || "/listings";
        delete req.session.redirectUrl;
        const newUser = new User({ email, username });
        const registerdUser = await User.register(newUser, password);
        req.login(registerdUser, (err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", "Welcome to Wayora!");
            res.redirect(redirectUrl);
        });       
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
};

// render login form 
module.exports.renderLoginForm = (req, res) => {
    if (!req.session.redirectUrl && req.headers.referer) {
        try {
            const refererUrl = new URL(req.headers.referer);
            if (refererUrl.pathname && !['/login', '/signup'].includes(refererUrl.pathname)) {
                req.session.redirectUrl = refererUrl.pathname + refererUrl.search;
            }
        } catch (e) {}
    }
    res.render("users/login.ejs");
};

// login user 
module.exports.loginUser = async (req, res) => {
    req.flash("success", "Welcome back! You are logged in.");
    let redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
};

// logout user 
module.exports.logoutUser = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "you have logged out successfully!");
        res.redirect("/listings");
    });
};