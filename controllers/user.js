'use strict'
var bcrypt = require('bcrypt-nodejs');
var mongoosePaginate = require('mongoose-pagination');
var fs = require('fs');
var path = require('path');

var User = require('../models/user'); //p cargar modelos
var Follow = require('../models/follow');
var Publication = require('../models/publication');
var jwt = require('../services/jwt');

//metodos de prueba
function home(req, res){
    res.status(200).send({
        message: 'Hola mundo desde el servidor de NodeJS'
    });
}

function pruebas(req, res){
    console.log(req.body);
    res.status(200).send({
        message: 'Accion de pruebas en el servidor de Node JS'
    });
}
//registro
function saveUser(req, res){
    var params = req.body;
    var user = new User();

    if(params.name && params.surname &&
        params.nick && params.email && params.password){
            
            user.name = params.name;
            user.surname = params.surname;
            user.nick = params.nick;
            user.email = params.email;
            user.role = 'ROLE_USER';
            user.image = null;

            //Controlar usuarios duplicados
            User.find({ $or: [
                {email: user.email.toLowerCase()},
                {nick: user.nick.toLowerCase()}
            ]}).exec((err, users) => {
                if(err) return res.status(500).send({message: 'Error en la peticion de usuarios'});

                if(users && users.length >= 1){
                    return res.status(200).send({message: 'El usuario que intentas registrar ya existe'});
                }else{
                     //cifrar contrasena
            bcrypt.hash(params.password, null, null, (err, hash) => {
                user.password = hash;

                user.save((err, userStored) => {
                    if(err) return res.status(500).send({message: 'Error al guardar usuario'})

                    if(userStored){
                        res.status(200).send({user: userStored});
                    }else{
                        res.status(404).send({message: 'No se ha registrado el usuario'});
                    }
                });
            });
                }
            });

 
        }else{
            res.status(200).send({
                message: 'Envia los campos necesarios'
            });
        }
}
//login
function loginUser(req, res){
    var params = req.body;

    var email = params.email;
    var password = params.password;

    User.findOne({email: email}, (err, user) => {
        if(err) return res.status(500).send({message: 'Error en la peticion'});
    
        if(user){
            bcrypt.compare(password, user.password, (err, check) => {
                if(check){
                   
                   if(params.gettoken){
                    //generar y devolver token
                    return res.status(200).send({
                        token: jwt.createToken(user)
                    });
                   }else{
                    //devolver datos del usuario
                    user.password = undefined;
                    return res.status(200).send({user})
                   }
                   
                }else{
                    return res.status(404).send({message: 'El usuario no se ha podido identificar'});
                }
            });
        }else{
            return res.status(404).send({message: 'El usuario no se ha podido identificar'});
        }
    });
}





//conseguir datos de un usuario
function getUser(req, res){
    var userId = req.params.id;

    User.findById(userId, (err, user) => {
        if(err) return res.status(500).send({message: 'Error en la peticion'});

        if(!user) return res.status(404).send({message: 'El usuario no existe'});

        followThisUser(req.user.sub, userId).then((value) => {
            user.password = undefined;
            return res.status(200).send({
                user, 
                following: value.following,
                followed: value.followed
            });
        });
            
    });
}   //funcion asincrona

async function followThisUser(identity_user_id, user_id) {
    var following = await Follow.findOne({ "user": identity_user_id, "followed": user_id }).exec().then((follow) => {
        return follow;
    }).catch((err) => {
        return handleError(err);
    });
 
    var followed = await Follow.findOne({ "user": user_id, "followed": identity_user_id }).exec().then((follow) => {
        console.log(follow);
        return follow;
    }).catch((err) => {
        return handleError(err);
    });
 
    return {
        following: following,
        followed: followed
    }
}
//devolver listado de usuarios paginados
function getUsers(req, res){
    var identity_user_id = req.user.sub;

    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }

    var itemsPerPage = 5;

    User.find().sort('_id').paginate(page, itemsPerPage,(err, users, total) => {
        if(err) return res.status(500).send({message: 'Error en la peticion'});

        if(!users) return res.status(404).send({message: 'No hay usuarios disponibles'});
        followUserIds(identity_user_id).then((value) => {
           
           
            return res.status(200).send({
                users,
                users_following: value.following,
                users_follow_me: value.followed,
                total,
                pages: Math.ceil(total/itemsPerPage)
            });
        
        });
        
    });
}
async function followUserIds(user_id){
    var following = await Follow.find({"user": user_id}).select({'_id': 0, '__uv': 0, 'user': 0}).exec().then((follows)=>{
        var follows_clean=[];
    
        follows.forEach((follow)=>{
            follows_clean.push(follow.followed);
        });
    console.log(follows_clean);
        return follows_clean;
    }).catch((err)=>{
        return handleerror(err);
    });
var followed = await Follow.find({"followed": user_id}).select({'_id': 0, '__uv': 0, 'followed': 0}).exec().then((follows)=>{
        var follows_clean=[];   //procesar los following ids
    
        follows.forEach((follow)=>{
        follows_clean.push(follow.user);
    });
        return follows_clean;
        }).catch((err)=>{
    
        return handleerror(err);
    });
    console.log(following);
        return {             //procesar los followed ids
        following: following,
        followed: followed
    }
}

const getCounters = (req, res) => {
    let userId = req.user.sub;
    if(req.params.id){
        userId = req.params.id;      
    }
    getCountFollow(userId).then((value) => {
        return res.status(200).send(value);
    })
}
 
const getCountFollow = async (user_id) => {
    try{
        // Lo hice de dos formas. "following" con callback de countDocuments y "followed" con una promesa
        let following = await Follow.countDocuments({"user": user_id},(err, result) => { return result });
        let followed = await Follow.countDocuments({"followed": user_id}).then(count => count);
        let publication = await Publication.countDocuments({"publication": user_id},(err, result) => {return result});
 
        return { following, followed, publication }
        
    } catch(e){
        console.log(e);
    }
}
//Edicion de datos de usuario
function updateUser(req, res){
    var userId = req.params.id;
    var update = req.body;

    //borrar propiedad password
    delete update.password;

    if(userId != req.user.sub){
        return res.status(500).send({message: 'No tienes permiso para actualizar los datos del usuario'});
    }
    
     //metodo para reparar los nick duplicados
    User.find({ $or: [
        {email: update.email.toLowerCase()},
        {nick: update.nick.toLowerCase()}
    ]}).exec((err, users) =>{

        var user_isset = false;
        users.forEach((user) =>{
            if(user && user._id != userId) user_isset = true;
        });

        if(user_isset) return res.status(404).send({message: 'Los datos ya estan en uso'});
      
        User.findByIdAndUpdate(userId, update, {new:true},(err, userUpdated) => {
            if(err) return res.status(500).send({message: 'Error en la peticion'});
    
            if(!userUpdated) return res.status(404).send({message: 'No se ha podido actualizar el usuario'});
    
            return res.status(200).send({user: userUpdated});
        });

    });
}

//subir archivos de imagen //avatar de usuario
function uploadImage(req, res){
    var userId = req.params.id;
  
  
    if(req.files){
      var file_path = req.files.image.path;
      console.log(file_path);
      var file_split = file_path.split('\\');
      console.log(file_split);
  
      var file_name = file_split[2]; //para que de el nombre de la imagen y se pueda guardar en laBD
      console.log(file_name);
  
      var ext_split = file_name.split('\.'); //para cortar el string por el punto
      console.log(ext_split);
  
      var file_ext = ext_split[1];
      console.log(file_ext);
  
      if(userId != req.user.sub){
        return removeFilesOfUploads(res, file_path, 'No tienes permiso para actualizar los datos del usuario');
  
      }
  
      if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif'){
        //Actualizar documento de usuario logueado
        User.findByIdAndUpdate(userId,{image: file_name},{new:true},(err, userUpdated) => {
          if(err) return res.status(500).send({message: 'Error en la peticion'});
  
          if(!userUpdated) return res.status(404).send({message: 'No se ha podido actualizar el usuario'});
  
          return res.status(200).send({userUpdated});
        });
      }else{
      return  removeFilesOfUploads(res, file_path, 'Extencion no valida');
      }
  
    }else{
      return res.status(200).send({message:'No se han subido imagenes'});
    }
  
  }
  //funcion auxiliar para remover filas
  function removeFilesOfUploads(res, file_path, message){
    fs.unlink(file_path, (err) => {
        return res.status(200).send({message: message});
    });
  }

  function getImageFile(req, res){
    var image_file = req.params.imageFile;
    var path_file = './uploads/users/'+image_file;

    fs.exists(path_file,(exists)=>{
      if(exists){
        res.sendFile(path.resolve(path_file));
      }else{
        res.status(200).send({message: 'No existe la imagen...'});
      }
    });
  }
//donde se exportan los metodos para que se utilicen en los ficheros de rutas

module.exports = {
    home,
    pruebas,
    saveUser,
    loginUser,
    getUser,
    getUsers,
    getCounters,
    updateUser,
    uploadImage,
    getImageFile
}


