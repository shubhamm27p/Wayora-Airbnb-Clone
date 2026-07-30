const express = require('express');
const router = express.Router();    



// Index route users
router.get('/users', (req, res) => {
    res.send('Hi, I am users');
});

// show -user route 
router.get('/users/:id', (req, res) => {
    res.send(`Hi, I am user ${req.params.id}`);
});

// POST - users
router.post('/users', (req, res) => {
    res.send('Creating new user');
}); 

//Delete - user route
router.delete('/users/:id', (req, res) => {
    res.send(`Deleting user ${req.params.id}`);
}); 

module.exports = router;