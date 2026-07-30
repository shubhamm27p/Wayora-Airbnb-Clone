const express = require('express');
const path = require('path');
const app = express();
const usersRoutes = require('./routes/user.js');
const postsRoutes = require('./routes/posts.js');
const session = require('express-session');
const flash = require('connect-flash');

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use((req, res, next) =>{
    res.locals.success = req.flash("success")
    res.locals.error = req.flash("success")
    next();
});
const sessionOption =
    {secret: 'mysupersecretstring',
        resave: false, 
        saveUninitialized: true
    };

app.use(session(sessionOption));
app.use(flash());

app.get("/register",(req,res) =>{
    let { name = "anonymous" } = req.query || {};
    req.session.name = name;
    if(name === "anonymous"){
        req.flash("error", "user not register")
    }else {
        req.flash("success", "user register successfully");
    }
    
    res.redirect("/hello");
})
app.get("/hello", (req,res) =>{
    
    res.render("page.ejs", { name: req.session.name   });
});

// app.get ("/reqcount", (req, res) => {
//     if(req.session.count){
//         req.session.count++;
//     }else{
//         req.session.count = 1 ;
//     }
   
//     res.send(`You send a request ${req.session.count} times to the server`);
// });


app.listen(3030, () => {    
    console.log("Listening on port 3030");
});

