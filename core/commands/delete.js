const files = require('../helpers/files');


module.exports = function( name ){
    if( files.versionExists( name ) ){
        files.deleteVersion( name );
        console.log( `Done! ${name.yellow} deleted` );
    }
    else console.log( `${name.red} not found!` );
}