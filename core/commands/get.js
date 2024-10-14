const helpers = require('../helpers');


module.exports = function( options ){
    const _options = helpers.options.get( options );
    if( helpers.funcs.isEmpty( _options ) ){
        console.log('Currently set options:', 'none'.yellow);
    }
    else{
        console.log('Currently set options:');
        for(let opt in _options){
            let value = _options[opt];
            let type = typeof value;
            console.log( `\t${opt}:`, type == "string" ? `${value}`.yellow : `${value}`.green );
        }
    }    
}