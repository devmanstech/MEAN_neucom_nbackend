'use strict'

var express = require('express');
var CommentController = require('../controllers/comment');
var api = express.Router();
var md_auth = require('../middlewares/authenticated');

var api = express.Router();

api.post('/comment', md_auth.ensureAuth,CommentController.sendComment);
api.get('/my-comments', md_auth.ensureAuth, CommentController.receivedComment);

module.exports = api;