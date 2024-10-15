const mysql = require('mysql2');
const { Table, Column } = require('./db-classes');

const db = {};
db.conn = null;
db.connAttempts = 0;
db.connect = async function( creds ){
    if( !db.connAttempts ){
        this.conn = mysql.createConnection({
            host: creds.dbhost,
            user: creds.username,
            password: creds.password,
            database: creds.dbname,
            typeCast: function( field, useDefaultTypeCasting ) {
                if ( ( field.type === "BIT" ) && ( field.length === 1 ) ) {
                    var bytes = field.buffer();
                    return( bytes[ 0 ] === 1 );
                }
                return( useDefaultTypeCasting() );
            }
        });
        this.dbname = creds.dbname;
    }
    else return this;

    return new Promise(function(resolve, reject){
        if( db.conn ){
            db.conn.connect(function(err) {
                db.connAttempts++;
                if (err){
                    db.conn = null;
                    reject( err.sqlMessage );
                    return;
                }
                else{
                    resolve( db );
                    return;
                }                
            });
        }
        else reject( "Could not connect to database. Make sure you are using the correct credentials" );
    });
}

db.query = async function(query, params){
    return new Promise(function(resolve, reject){
        if( params ){
            db.conn.query(query, params, function (error, results, fields) {
                if (error){
                    reject(error.sqlMessage);
                }
                else{
                    resolve( [results, fields] );
                }
            });
        }
        else{
            db.conn.query(query, function (error, results, fields) {
                if (error){
                    reject(error.sqlMessage || error.message || error);
                }
                else{
                    resolve( [results, fields] );
                }
            });
        }        
    });   
}

db.close = async function(){
    if( this.conn ) this.conn.close();
}

db.getTableNames = async function(){
    const [rows, cols] = await this.query(`SELECT TABLE_NAME AS name FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA='${db.dbname}'`);
    return rows.map( row => row.name );
}

db.getTableColumms = async function( tableName ){
    let [cols, fields] = await this.query(`SELECT 
        COLUMN_NAME as name, 
        ORDINAL_POSITION as position,
        COLUMN_DEFAULT as defVal,
        IS_NULLABLE as nullable,
        DATA_TYPE as type,
        CHARACTER_MAXIMUM_LENGTH as char_max_length,
        CHARACTER_OCTET_LENGTH as char_oct_length,
        NUMERIC_PRECISION as num_precision,
        NUMERIC_SCALE as num_scale,
        DATETIME_PRECISION as datetime_precision,
        CHARACTER_SET_NAME as charset,
        COLLATION_NAME as collation,
        COLUMN_TYPE as col_type,
        COLUMN_KEY as col_key,
        EXTRA as extra,
        COLUMN_COMMENT as comment
        FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='${db.dbname}' AND TABLE_NAME='${tableName}' ORDER BY ORDINAL_POSITION;`);  
    cols = cols.map( col => new Column( col ) );
    return cols.reduce(function(_cols, col){
        _cols[col.name] = col;
        return _cols;
    }, {});    
}

db.getTables = async function( filter ){
    let [tables, cols] = await this.query(`SELECT TABLE_NAME AS name, ENGINE as engine, TABLE_COLLATION as collation FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA='${db.dbname}'`);
    tables = tables.map( table => new Table( table ) );
    if( filter && filter.length ){
        tables = tables.filter( _table => filter.find( _name => _table.name == _name ) );
    }

    for(let table of tables){
        table.cols = await this.getTableColumms( table.name );
    }

    return tables.reduce(function(_tables, table){
        _tables[table.name] = table;
        return _tables;
    }, {});
}

db.createTable = async function( table ){
    try{
        console.log( "+".green + `Creating table ${table.name.green}` );
        let [results, fields] = await this.query( table.createSql() );
    }
    catch(error){
        console.log( table.createSql() );
        throw error;
    }    
}

db.deleteTable = async function( table ){
    console.log( "-".red + `Dropping table ${table.name.red}` );
    let [results, fields] = await this.query( `DROP TABLE IF EXISTS ${table.name}` );
}


db.addColumn = async function( table, column ){
    console.log( "+".green + `Adding column ${column.name.yellow} => ${table.name.green}` );
    let [results, fields] = await this.query( `ALTER TABLE ${table.name} ADD ${column.createSql()}` );
}

db.dropColumn = async function( table, column ){
    console.log( "+".red + `Dropping column ${column.name.red} <= ${table.name.green}` );
    let [results, fields] = await this.query( `ALTER TABLE ${table.name} DROP COLUMN ${column.name}` );
}

db.modifyColumn = async function( table, column ){
    console.log( "+".yellow + `Modifying column ${column.name.yellow} *=> ${table.name.green}` );
    let [results, fields] = await this.query( `ALTER TABLE ${table.name} MODIFY COLUMN ${column.createSql()}` );
}

db.countRows = async function( table ){
    let [results, fields] = await this.query( `select count(*) as total from ${table.name};` );
    return Number( results[0].total );
}

db.getRows = async function( sql ){
    let [results, fields] = await this.query( sql );
    return results && results.length ? results : [];
}

db.allRows = async function(table, callback, limit = 1000){
    if( !table || !callback ) return;
    let page = 1;
    let maxPages = Math.ceil( await this.countRows( table ) / limit );
    let priCols = table.priColumns.map( col => col.name );
    let orderBy = priCols.length ? ` ORDER BY ${priCols.join(", ")}` : "";    
    while(page <= maxPages){
        let offset = (page - 1) * limit; 
        let sql = `SELECT * FROM ${table.name}${orderBy} LIMIT ${limit} OFFSET ${offset};`;
        let rows = await this.getRows( sql );        
        for(let row of rows){
            callback( row );
        }       
        page++;
    }
}

db.truncateTable = async function( table ){
    let [results, fields] = await this.query( `TRUNCATE TABLE ${table.name};` );
    return results.rowsAffected;
}

db.insertRow = async function( table, row ){
    let colNames = [];
    let colValues = [];
    Object.keys( row ).forEach(function(key){
        let val = row[key];
        if( typeof val == "string" ) val = `'${val}'`;
        else if( val == null ) val = 'NULL';
        colNames.push( key );
        colValues.push( val );
    });

    let sql = `INSERT INTO ${table.name} (${colNames.join(', ')}) values(${colValues.join(', ')});`;

    try{
        let [results, fields] = await this.query( sql );
        return results.rowsAffected;
    }
    catch(err){
        console.log( row, sql );
        throw err;
    }
    
}



module.exports = db;