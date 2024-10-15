const colors = require("colors");
const db = require("../helpers/db");
const files = require("../helpers/files");
const funcs = require("../helpers/funcs");
const fs = require("fs");
const path = require("path");


async function take( name, options ){
    let dbtables = await db.getTables();
    let config = {
        filter: options.tables && options.tables.length && !options.all ? options.tables : null,
        data: options.data && options.data.length && !options.all ? options.data : null,
        all: options.all ? true : false
    };

    if( options.withData ){        
        if( config.filter ) config.data = config.filter;
        else{
            config.data = [];
            for(let tableName in dbtables) config.data.push( tableName );
        }        
    }

    if( config.filter && !config.all ){
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

        let withData = config.data;

        if( config.all ){
            withData = [];
            for(let tableName in dbtables) withData.push( tableName );
        }

        if( withData ){
            let versPath = files.versPath( name );
            let hasNewLine = /[\n]+/;
            for(let tableName of withData){
                if(!dbtables[tableName]) continue;
                let table = dbtables[tableName];
                let writer = fs.createWriteStream( path.join( versPath, `${tableName}.data` )  );
                let numRows = 0;
                await db.allRows( table, function( row ){
                    let data = JSON.stringify( row );
                    if( hasNewLine.test( data ) ){
                        writer.write( "<@dbsnap row>\n" );
                        writer.write( data );
                        writer.write( "\n" );
                        writer.write( "<@dbsnap endrow>\n" );
                    }
                    else{
                        writer.write( data );
                        writer.write( "\n" );
                    }     
                    numRows++;               
                });
                writer.close();
                files.jsonWrite( path.join(versPath, `${tableName}.config.json`), { total: numRows } );
            }
        }
        
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