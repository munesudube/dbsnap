const prompt = require('prompt-sync')({sigint: true});

const _module = {};
_module.isEmpty = function( obj ){
    return !Object.keys(obj).length;
}

_module.confirm = function( question ){
    while( true ){
        let response = prompt( `${question} (y/n): ` ).toLowerCase();
        if( response == "y" ) return true;
        else if( response == "n" ) return false;
    }
}

//Returns an object with properties in objA that are not found in objB
_module.diff = function( objA, objB ){
    let obj = {};
    for(let prop in objA) if( !objB[prop] ) obj[prop] = objA[prop];
    return obj;
}

//Returns an object with properties found in both objA and objB
_module.intersect = function( objA, objB ){
    let obj = {};
    for(let prop in objA) if( objB[prop] ) obj[prop] = objA[prop];
    return obj;
}

module.exports = _module;