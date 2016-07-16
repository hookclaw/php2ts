"use strict";
var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var domain = require('express-domain-middleware');
var app = express();
app.set('public', path.join(__dirname, 'public'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ect');
var ECT = require('ect');
var ectRenderer = ECT({ watch: true, root: app.get('views'), ext: '.ect' });
app.engine('ect', ectRenderer.render);
app.use(domain);
app.use(logger('dev'));
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
var router = express.Router();
router.get('/', function (req, res, next) {
    res.redirect('/php2ts');
});
app.use('/', router);
app.use('/php2ts', require('./routes/php2ts'));
app.use(express.static(app.get('public')));
app.use(function (err, req, res, next) {
    console.error(err);
    res.status(500);
    next(err);
});
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    res.status(404);
    next(err);
});
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.render('error', {
            message: err.message,
            status: res.statusCode,
            stack: err.stack
        });
    });
}
else {
    app.use(function (err, req, res, next) {
        res.render('error', {
            message: err.message,
            status: '',
            stack: ''
        });
    });
}
module.exports = app;
//# sourceMappingURL=app.js.map