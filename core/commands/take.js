const colors = require("colors");
const db = require("../helpers/db");
const files = require("../helpers/files");
const funcs = require("../helpers/funcs");


async function take( name, options ){
    let dbtables = await db.getTables();
    let config = {
        filter: options.tables && options.tables.length ? options.tables : null 
    };
    if( config.filter ){
        let _dbtables = {};
        for( let tableName of config.filter ){
            if( !dbtables[tableName] ){
                console.log("Warning:".yellow, "Table", tableName.yellow, "was not found in the database. Please note, to preserve the db as-is, table names are case-sensitive");
            }
            else{
                _dbtables[tableName] = dbtables[tableName];
            }
        }
        dbtables = _dbtables;
    }
    if( funcs.isEmpty( dbtables ) ){
        console.log( "Nothing to snapshot".yellow );
    }
    else{
        files.saveVersion( name, dbtables, config, false );
    }        
}

module.exports = async function( name, config ){
    console.log("Taking database snapshot " + name.yellow);
    try{
        await db.connect( config );
        await take( name, config );
        console.log("Done!".green);
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