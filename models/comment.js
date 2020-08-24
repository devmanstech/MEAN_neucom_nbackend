'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CommentSchema = Schema({
    comment: String,
    created_at: String,
    emitter: { type: Schema.ObjectId, ref:'User'},
    publication:{ type: Schema.ObjectId, ref:'Publication'}
});

module.exports = mongoose.model('Comment', CommentSchema);
