module.exports = {
    get: function(req, res, next) { // jshint ignore:line
        res.send('GET index ' + req.foo);
    }
};
