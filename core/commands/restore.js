const colors = require("colors");
const db = require("../helpers/db");
const files = require("../helpers/files");
const funcs = require("../helpers/funcs");
const path = require("path");
const LineReader = require('n-readlines');
const loading =  require('loading-cli');


async function restore( name, options ){
    let config = files.getVersionConfig( name );
    let snaptables = files.getVersion( name );
    let dbtables = await db.getTables( !options.all && config.filter );

    let _OPTALL = config.all || options.all;

    if( options.tables && options.tables.length && !_OPTALL ){
        let _snaptables = {};
        let _dbtables = {};
        for(let tableName of options.tables){
            if(!snaptables[tableName]) console.log("Warning:".yellow, "Table", tableName.yellow, "was not found in the database. Please note, to preserve the db as-is, table names are case-sensitive");
            else _snaptables[tableName] = snaptables[tableName];
            if( dbtables[tableName] ) _dbtables[tableName] = dbtables[tableName];
        }
        snaptables = _snaptables;
        dbtables = _dbtables;
    }

    changes = {
        additions: 0,
        deletions: 0,
        modifications: 0
    }

    let tablesToCreate = funcs.diff( snaptables, dbtables );
    for(let name in tablesToCreate){ 
        await db.createTable( tablesToCreate[name] );
        changes.additions++;
    }
    let tablesToDrop = funcs.diff( dbtables, snaptables );
    for(let name in tablesToDrop){ 
        await db.deleteTable( tablesToDrop[name] );
        changes.deletions++;
    }

    let tablesToCheck = funcs.intersect( snaptables, dbtables );
    for( let name in tablesToCheck ){
        let table = tablesToCheck[name];
        let dbtable = dbtables[name];
        let colsToAdd = funcs.diff( table.cols, dbtables[name].cols );
        for(let colName in colsToAdd){
            await db.addColumn( table, colsToAdd[colName] );
            changes.additions++;
        }
        let colsToDrop = funcs.diff( dbtables[name].cols, table.cols );
        for(let colName in colsToDrop){
            await db.dropColumn( table, colsToDrop[colName] );
            changes.deletions++;
        }
        let colsToCheck = funcs.intersect( table.cols, dbtable.cols );
        for(let colName in colsToCheck){
            let col = colsToCheck[colName];
            if( !col.equal( dbtable.cols[colName] ) ){
                await db.modifyColumn( table, col );
                changes.modifications++;
            }
        }
        
    }

    if( (config.data && config.data.length && !options.noData) || (_OPTALL && !options.noData) ){
        let withData = config.data;
        if( _OPTALL ){
            withData = [];
            for( let tableName in snaptables ) withData.push( tableName );
        }
        for(let tableName of withData){
            if( !_OPTALL && options.data && options.data.length && !options.data.find(_tableName => tableName)) continue;
            if( snaptables[tableName] ){
                let table = snaptables[tableName];
                let versPath = files.versPath( name );
                let tableConfig = files.jsonRead( path.join(versPath, `${tableName}.config.json` ), { total: 0 } );
                let loader = loading( `${tableName}:`.green + ` restoring ${tableConfig.total} rows` );
                loader.frame(["|", "/", "-", "\\"]);
                loader.color = "green";
                loader.start();
                await db.truncateTable( table );
                const lineReader = new LineReader( path.join(versPath, `${tableName}.data` ) );
                let line;
                let data = "";
                let depth = 0;
                let restored = 0;
                while (line = lineReader.next()) {
                    let _line = line;
                    if( _line == "<@dbsnap row>" ){ depth++; continue; }
                    else if( _line == "<@dbsnap endrow>" ){ depth--; }
                    else{ data += _line; }

                    if( depth == 0 ){
                        let row = null;
                        try{
                            row = JSON.parse( data.replaceAll("'", "''") );                            
                        }
                        catch(err){
                            console.log("Warning:".yellow, "Some data could not be inserted");
                            console.log(`Error: ${err.message}`.red);
                            console.log();
                            console.log( data );
                            console.log();
                        }
                        finally{
                            data = "";
                        }
                        
                        try{
                            if( row ){
                                await db.insertRow( table, row );
                                changes.additions++;
                                restored++;
                           }
                        }
                        catch(err){
                            loader.stop();
                            console.log(`Error: ${err.message}`.red);
                            throw err;
                        }
                        
                    }
                }
                loader.stop();
                console.log( `${tableName}:`.green, `restored ${restored} rows` );
            }
        }
    }

    if(changes.additions || changes.deletions || changes.modifications){
        console.log(`Done restoring database to version ${name.yellow}`);
        let changesStr = [];
        if( changes.additions ) changesStr.push(`${changes.additions}`.green + " additions");
        if( changes.modifications ) changesStr.push(`${changes.modifications}`.yellow + " modifications");
        if( changes.deletions ) changesStr.push(`${changes.deletions}`.red + " deletions");
        console.log( changesStr.join(", ") );
    }
    else{
        console.log('Already up to date'.yellow)
    }

}

module.exports = async function( name, config ){
    try{
        if( !files.versionExists( name ) ){
            console.log( `snapshot ${name.red} not found!` );
            return;
        }
        //console.log("Restoring database to version " + name.yellow);
        await db.connect( config );
        await restore( name, config );
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