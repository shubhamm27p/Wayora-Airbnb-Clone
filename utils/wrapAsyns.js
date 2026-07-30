module.exports = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((err) => {
            if (typeof next === 'function') {
                return next(err);
            }
            console.error(err);
            res.status(500).send(err.message || 'Internal Server Error');
        });
    };
};