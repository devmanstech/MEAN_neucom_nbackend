'use strict'

var express = require('express');
var CommentController = require('../controllers/comment');
var md_auth = require('../middlewares/authenticated');
var api = express.Router();

//agregar comentario
api.post('/comment', md_auth.ensureAuth,CommentController.addComment);
api.put('/comment', md_auth.ensureAuth,CommentController.updateComment);
api.delete('/comment/:id', md_auth.ensureAuth,CommentController.deleteComment);
// obtener todos los comentarios
api.post('/get-comments', md_auth.ensureAuth, CommentController.getComments);


module.exports = api;
