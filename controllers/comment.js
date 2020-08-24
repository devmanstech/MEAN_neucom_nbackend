'use strict'

var moment = require('moment');
var Follow = require('../models/follow');
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
    Follow.find({user:req.user.sub}).populate('followed').exec((err, follows) => {
        var follows_clean = [];
        follows.forEach((follow) => {
            follows_clean.push(follow.followed);
        });
        follows_clean.push(req.user.sub);
        Comment.find({emitter: {"$in": follows_clean}, publication}).sort('-created_at').populate('emitter','-password -role').exec((err, comments) => {
            if(err) return res.status(500).send({message: 'Error al devolver el publicaciones'});

            if(!comments) return res.status(404).send({message:'No hay publicaciones'});

            return res.status(200).send(
                comments
            );
        });

    });
}

module.exports = {
    addComment,
    getComments
}
