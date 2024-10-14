const colors = require("colors");
const db = require("../helpers/db");
const files = require("../helpers/files");

module.exports = async function( config ){
    let versions = files.getVersionNames();
    if( versions.length ){
        for(let name of files.getVersionNames()){
            console.log( name.yellow );
        }
    }
    else{
        console.log( "No versions found" );
    }
}