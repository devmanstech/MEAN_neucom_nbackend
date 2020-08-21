'use strict'

var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var Comment = require('../models/comment');
var User = require('../models/user');
var Follow = require('../models/follow');

/*function commentUser(req,res){
    res.status(200).send({
        message: 'Comentarios prueba'
    });
}
*/
function sendComment(req, res){ //funcion para enviar comentarios
    var params = req.body;

    if(!params.text || !params.receiver) return res.status(200).send({message: 'Comentario publicado exitosamente'});

    var comment = new Comment();
    comment.emmitter = req.user.sub;
    comment.receiver = req.receiver;
    comment.text = params.text;
    comment.created_at = moment().unix();

    comment.save((err, commentStored) => {
        if(err)return res.status(500).send({message: 'Error en la peticion'});
        if(!commentStored)return res.status(500).send({message: 'Error al publicar comentario'});

        res.status(200).send({comment: commentStored}); 
    });
}

function receivedComment(req, res){  //obtener comentarios que nos enviaron
    var userId = req.body.sub;  //recogemos el ide del usuario que tenemos logueado
    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }

    var itemsPerPage = 4;
    //Extraer de la base de datos con find
    Comment.find({receiver: userId}).populate('emitter').paginate(page, itemsPerPage, (err, comment, total) => {
        if(err) return res.status(500).send({message: 'Error en la peticion'});
        if(!comment) return res.status(404).send({message: 'No hay comentarios que mostrar' });

        return res.status(200).send({
            total: total,
            pages: Math.ceil(total/itemsPerPage),
            comment
        })
    });
}

module.exports = {
    sendComment, 
    receivedComment
}