const { Option } = require('commander');
const fs = require('fs');

const _module = {};

_module.common = function( cmd ){
    return cmd.option('-u, --username <string>', 'database user name')
    .option('--password <string>', 'database user password')
    .option('--dbname <string>', 'database name')
    .option('--dbhost <string>', 'database host', 'localhost')
    .option('--port <number>', 'database port', '3306')
    .argument('<name>', 'name of the snapshot')
}

function isEmpty( obj ){
    return !Object.keys(obj).length;
}

function getCreds(){
   return _module.get({ username: true, password: true, dbname: true, dbhost: true, port: true });
}

function fillDbOpts( options ){
    function someMissing(){
        return !options.username || !options.password || !options.dbname || !options.port || !options.dbhost;
    }
    if( someMissing() ){
        const creds = getCreds() || {};
        if( creds ){
            for(let cred in creds){ 
                if( !options[cred] ) options[cred] = creds[cred];
            }
        }
        //Check again
        if( someMissing() ){
            const missing = [];
            for(let dbOpt of ["username", "password", "dbname", "port", "dbhost"]){
                if(!options[dbOpt]) missing.push( dbOpt );
            }
            console.log( ("Db options missing: " + missing.join(", ")).red );
        }
        else return true;
    }
    else return true;
}

_module.fill = function( options ){
    let success = true;
    for(let func of [fillDbOpts]){
        success = func(options);
        if(!success) break;
    }
    return success;
}

_module.set = function( opts ){
    try{
        if( !opts || isEmpty(opts) ) return true;
        const fileName = '.dbsnap.json';
        if( !fs.existsSync( fileName ) ){
            fs.writeFileSync( fileName, JSON.stringify( {} ) );
        }
        let _opts = JSON.parse( fs.readFileSync( fileName ) );
        fs.writeFileSync( fileName, JSON.stringify( { ..._opts, ...opts } ) );
        return true;
    }
    catch(error){
        console.log( `${error.message}`.red );
        return false;
    }    
}

_module.unset = function( opts ){
    try{
        const fileName = '.dbsnap.json';
        if( fs.existsSync( fileName ) ){
            let savedOpts = JSON.parse( fs.readFileSync( fileName ) );
            if( savedOpts ){
                const _opts = {};
                if( opts && !isEmpty(opts) ){
                    for(let opt in savedOpts){
                        if( !opts[opt] ) _opts[opt] = savedOpts[opt];
                    }
                }
                fs.writeFileSync( fileName, JSON.stringify( _opts ) );
            }
        }
        else{
            console.log(`${fileName} does not exist`.red)
        }        
        return true;
    }
    catch(error){
        console.log( `${error.message}`.red );
        return false;
    }
}

_module.get = function( opts ){
    let _opts = {};
    try{
        const fileName = '.dbsnap.json';
        if( fs.existsSync( fileName ) ){
            let savedOpts = JSON.parse( fs.readFileSync( fileName ) );
            if( savedOpts ) _opts = savedOpts;
        }     
    }
    catch(error){
        console.log( `${error.message}`.red );
    }
    if( !opts || isEmpty(opts) ) return _opts;
    let _result = {};
    for(let opt in opts){
        _result[opt] = _opts[opt] ? _opts[opt] : null;
    }
    return _result;
}

module.exports = _module;
