const colors = require("colors");
const db = require("../helpers/db");
const files = require("../helpers/files");


async function take( name, config ){
    let dbtables = await db.getTables();
    files.saveVersion( name, dbtables, false );
}

module.exports = async function( name, config ){
    console.log("Taking database snapshot " + name.yellow);
    try{
        await db.connect( config );
        await take( name, config );
    }
    catch(error){
        if(typeof error == "string") console.log( error.red );
        if(typeof error == "object"){
            if(typeof error.message == "string") console.log( error.message.red );
            else console.log( error );
        }
    }
    finally{
        await db.close();
    }   
}