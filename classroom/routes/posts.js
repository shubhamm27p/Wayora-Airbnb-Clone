const express = require('express');
const router = express.Router();

// Index route posts
router.get('/', (req, res) => {
    res.send('Hi, I am posts');
});

// show -post route 
router.get('/:id', (req, res) => {
    res.send(`Hi, I am post ${req.params.id}`);
});

// POST - posts
router.post('/', (req, res) => {
    res.send('Creating new post');
}); 

//Delete - post route
router.delete('/:id', (req, res) => {
    res.send(`Deleting post ${req.params.id}`);
}); 

module.exports = router;

