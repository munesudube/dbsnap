const fs = require('fs');
const path = require('path');
const prompt = require('prompt-sync')({sigint: true});
const funcs = require('./funcs');
const { Table } = require('./db-classes');
const colors = require("colors");

const _module = {};
_module.dirName = ".dbsnap";
_module.configFilePath = path.join(_module.dirName, "config.json");
_module.versDirPath = path.join( _module.dirName, "snapshots");
_module.config = null;

_module.versPath = function( name ){
    return path.join( this.versDirPath, `${name}` );
}

_module.jsonRead = function( path, defObj = {} ){
    if( fs.existsSync( path ) ) return JSON.parse( fs.readFileSync( path ) );
    return defObj;
}

_module.jsonWrite = function( path, obj ){
    fs.writeFileSync( path, JSON.stringify( obj ) );
    return true;
}

_module.loadConfig = function(){
    if( fs.existsSync( this.configFilePath ) ) this.config = this.jsonRead( this.configFilePath );
    else this.config = {};   
}

_module.saveConfig = function(){
    if( this.config ) this.jsonWrite( this.configFilePath, this.config );
}

_module.init = function(){
    if( !fs.existsSync( this.dirName ) ) fs.mkdirSync( this.dirName );
    if( !fs.existsSync( this.versDirPath ) ) fs.mkdirSync( this.versDirPath );
    if( !this.config ) this.loadConfig();    
}

_module.versionExists = function( name ){
    return fs.existsSync( this.versPath( name ) );
}

_module.deleteVersion = function( name ){
    fs.rmSync( this.versPath( name ), { recursive: true } );
}

_module.saveVersion = function( name, tables, config = {}, force = false ){
    this.init();
    if( this.versionExists( name ) ){
        if( !force ){
            if(!funcs.confirm( "This will override the existing " + name.yellow + ", continue?" )) return false;
        }        
        this.deleteVersion( name );
    }
    let versPath = this.versPath( name );
    fs.mkdirSync( versPath );
    for(let table in tables){
        this.jsonWrite( path.join( versPath, `${table}.table.json` ), tables[table] );
    }
    this.jsonWrite( path.join( versPath, `config.json` ), config );
}

_module.getVersionNames = function(){
    this.init();
    return fs.readdirSync( this.versDirPath );
}

_module.getVersionConfig = function( name ){
    this.init();
    if( !this.versionExists( name ) ) return null;
    let versPath = this.versPath( name );
    return this.jsonRead( path.join( versPath, "config.json" ), {  filter: null });
}

_module.getVersion = function( name ){
    this.init();
    if( !this.versionExists( name ) ) return null;
    let versPath = this.versPath( name );
    let tableRegex = /.table.json$/;
    let tables = {};
    let filenames = fs.readdirSync( versPath ).filter( fileName => tableRegex.test( fileName ) );
    for(let filename of filenames){
        let tablename = filename.replace('.table.json', "");
        tables[tablename] = new Table( this.jsonRead( path.join( versPath, filename ) ) );
    }
    return tables;
}

module.exports = _module;