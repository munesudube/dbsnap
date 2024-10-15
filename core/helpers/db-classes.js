class Column{
    constructor( obj ){
        if( typeof obj == "string" ) obj = { name: obj };
        this.name = obj?.name;
        this.position = obj?.position || 0;
        this.defVal = obj?.defVal;
        this.nullable = obj?.nullable;
        this.type = obj?.type;
        this.char_max_length = obj?.char_max_length;
        this.char_oct_length = obj?.char_oct_length;
        this.num_precision = obj?.num_precision;
        this.num_scale = obj?.num_scale;
        this.datetime_precision = obj?.datetime_precision;
        this.charset = obj?.charset;
        this.collation = obj?.collation;
        this.col_type = obj?.col_type;
        this.col_key = obj?.col_key;
        this.extra = obj?.extra;
        this.comment = obj?.comment;
        this.auto_increment = obj?.extra.toLowerCase() == "auto_increment";
    }

    createSql(){
        const name = "`" + this.name + "`";
        const type = this.col_type ? ` ${this.col_type}` : "";
        const nullability = this.nullable?.toLowerCase() == "no" ? " NOT NULL" : " NULL";
        const collation = this.collation ? ` COLLATE '${this.collation}'` : "";
        let defVal = "";
        if(this.defVal != null){
            if( this.type == "longtext" || this.type == "enum" || this.type == "varchar" || this.type == "datetime" ) defVal = ` DEFAULT '${this.defVal}'`;
            else defVal = ` DEFAULT ${this.defVal}`;
        }       
        const auto_increment = this.auto_increment ? " AUTO_INCREMENT" : "";
        return `${name}${type}${nullability}${defVal}${auto_increment}${collation}`;
    }

    equal( column ){        
        return this.name == column.name 
        && this.defVal == column.defVal
        && this.nullable == column.nullable 
        && this.col_type == column.col_type
        && this.char_max_length == column.char_max_length
        && this.char_oct_length == column.char_oct_length
        && this.num_precision == column.num_precision
        && this.num_scale == column.num_scale
        && this.datetime_precision == column.datetime_precision;       
    }
}

class Table{
    constructor( obj ){
        if( typeof obj == "string" ) obj = { name: obj };
        this.name = obj?.name;
        this.engine = obj?.engine;
        this.collation = obj?.collation;
        this.cols = {};
        if( obj?.cols ){
            for( let name in obj.cols ){
                let col = obj.cols[name];
                this.cols[name] = col instanceof Column ? col : new Column( col );
            }
        }
    }

    //Returns an array of columns order by position
    get columns(){        
        let cols = [];
        let _cols = [];
        for(let name in this.cols)_cols.push( this.cols[name] );
        while( _cols.length ){
            let min = null;
            for(let col of _cols){
                if( !min || col.position <= min.position ) min = col;
            }
            cols.push( min );
            _cols = _cols.filter(col => col.name != min.name);
        }
        return cols;
    }

    //Returns sql to create table
    createSql(){
        const name = "`" + this.name + "`";
        const collation = this.collation ? `\nCOLLATE='${this.collation}'` : '';
        const engine = this.engine ? `\nENGINE=${this.engine}` : '';
        const columns = this.columns;        
        let columnsSql = columns.reduce(function( sql, col, i ){
            let _sql = i ? `${sql},` : sql;
            return `${_sql}\n${col.createSql()}`;
        }, '');

        let primaryColsStr = columns.filter( col => col.col_key.toLowerCase() == "pri" ).map(col => "`" +  col.name + "`").join(",");
        let primarySql = primaryColsStr ? `,\nPRIMARY KEY (${primaryColsStr}) USING BTREE` : "";
        
        let sql = `CREATE TABLE ${name} (${columnsSql}${primarySql}\n)${collation}${engine}`;
        return sql;
    }
}


module.exports = {
    Table: Table,
    Column: Column
}