/// <reference path="typings/main.d.ts" />;
/// <reference path="typings/express-domain-middleware.d.ts" />

import express = require('express');
import path = require('path');
//import favicon = require('serve-favicon');
import logger = require('morgan');
import cookieParser = require('cookie-parser');
import bodyParser = require('body-parser');
import domain = require('express-domain-middleware');

import url = require('url');

var app = express();

app.set('public', path.join(__dirname, 'public'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ect');
var ECT = require('ect');
var ectRenderer = ECT({ watch: true, root: app.get('views'), ext: '.ect' });
app.engine('ect', ectRenderer.render);

app.use(domain);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json({limit:'1mb'}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

var router = express.Router();
router.get('/', function(req: express.Request, res: express.Response, next: express.NextFunction) {
    res.redirect('/php2ts');
});
app.use('/', router);
app.use('/php2ts', require('./routes/php2ts'));

app.use(express.static(app.get('public')));

// exception handlers
app.use(function(err: Error, req: express.Request, res: express.Response, next: express.NextFunction) {
    console.error(err);
    res.status(500);
    next(err);
});

// catch 404 and forward to error handler
app.use(function(req: express.Request, res: express.Response, next: express.NextFunction) {
    let err = new Error('Not Found');
    res.status(404);
    next(err);
});

// error handlers

if (app.get('env') === 'development') {
    // development error handler
    // will print stacktrace
    app.use(function(err: Error, req: express.Request, res: express.Response, next: express.NextFunction) {
        res.render('error', {
            message: err.message,
            status: res.statusCode,
            stack: err.stack
        });
    });
} else {
    // production error handler
    // no stacktraces leaked to user
    app.use(function(err: Error, req: express.Request, res: express.Response, next: express.NextFunction) {
        res.render('error', {
            message: err.message,
            status: '',
            stack: ''
        });
    });
}
    
module.exports = app;
