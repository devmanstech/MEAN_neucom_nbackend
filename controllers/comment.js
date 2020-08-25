'use strict'

var moment = require('moment');
var Comment = require('../models/comment');


function addComment(req, res){ //agregar comentario
    var params = req.body;
    if(!params.comment || !params.emitter || !params.publication) return res.status(200).send({message: 'Comentario publicado exitosamente'});
    var comment = new Comment();
    comment.emitter = req.user.sub;
    comment.publication = params.publication;
    comment.comment = params.comment;
    comment.created_at = moment().unix();
    comment.save((err, commentStored) => {
        if(err)return res.status(500).send({message: 'Error en la peticion',success:false});
        if(!commentStored)return res.status(500).send({message: 'Error al publicar comentario',success:false});
        return res.status(200).send({message: 'Guardado con éxito',success:true});
    });

}

function getComments(req, res){  //obtener todos los comentarios
    var publication = req.body.publication;
    Comment.find({publication},(err,comments)=>{

        var all_user = [];
            comments.forEach((comment)=>{
                all_user.push(comment.emitter)
        })
        Comment.find({emitter: {"$in": all_user}, publication}).sort('-created_at').populate('emitter','-password -role').exec((err, comments) => {
            if(err) return res.status(500).send({message: 'Error al devolver el publicaciones'});

            if(!comments) return res.status(404).send({message:'No hay publicaciones'});

            return res.status(200).send(
                comments
            );
        })
    })
}

function updateComment(req,res){
    var _id = req.body._id;
    var comment = req.body.comment;
    Comment.findByIdAndUpdate(_id,{comment: comment},{new:true},(err, success) => {
        if(err) return res.status(500).send({message: 'Error en la update comment',success:false});

        if(!success) return res.status(404).send({message: 'update comment error',success:false});

        return res.status(200).send({message: "success",success:true});
    })
}
function deleteComment(req,res){
    var _id = req.params.id;
    Comment.findByIdAndDelete(_id ,(err,success)=>{
        if (err) return res.status(500).send({ message: 'Error delete comment' , success:false});
        if (!success) return res.status(404).send({ message: 'Error delete comment 404' , success:false});
        return res.status(200).send({message: "success",success:true});
    })
}
module.exports = {
    addComment,
    getComments,
    updateComment,
    deleteComment
}
