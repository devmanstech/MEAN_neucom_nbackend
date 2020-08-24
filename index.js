'use strict'
require('dotenv').config()


var mongoose = require('mongoose');
var app = require('./app');
var port = 3800;

//Conectarse a la base de datos
mongoose.Promise = global.Promise;
mongoose.connect(`mongodb://${process.env.DB_SERVER}:27017/${process.env.DB_DATABASE}`,
    // { useMongoClient: true}
    ).then(() => {
        console.log("+Hola+La conexion a la base de datos se ha realizado exitosamente");

        //crear servidor
        app.listen(port, () => {
            console.log("Servidor Corriendo en http://localhost:3800");
        })
    })
    .catch(err => console.log(err));