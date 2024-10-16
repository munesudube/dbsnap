#!/usr/bin/env node
const { Command } = require('commander');
const colors = require('colors');
const commands = require('./commands');
const helpers = require('./helpers');

const program = new Command();

program
  .name('dbsnap')
  .description('Database versioning tool. Used to take snapshots of your database tables and then restore any of the snapshots later. Currently only works for mysql')
  .version('1.0.6');

program.command("take")
  .description("Take a snapshot of the database")
  .option('-u, --username <string>', 'database user name')
  .option('--password <string>', 'database user password')
  .option('--dbname <string>', 'database name')
  .option('--dbhost <string>', 'database host', 'localhost')
  .option('--port <number>', 'database port', '3306')
  .option('--tables <string>', 'double-quoted comma-separated list of tables e.g --tables "users, products". It snapshots only the listed tables. Other tables will be ignored')
  .option('--data <string>', 'double-quoted comma-separated list of tables for which to save the table data or rows')
  .option('--all', 'include all tables and data')
  .option('--with-data', 'include data for all tables listed')
  .argument('<name>', 'name of the snapshot')
  .action(function( name, options ){
    if( helpers.options.fill( options ) ){
      commands.take( name, options );
    }   
    else console.log("Aborted!".red);     
  });

program.command("restore")
  .description("Restore database from snapshot")
  .option('-u, --username <string>', 'database user name')
  .option('--password <string>', 'database user password')
  .option('--dbname <string>', 'database name')
  .option('--dbhost <string>', 'database host', 'localhost')
  .option('--port <number>', 'database port', '3306')
  .option('--tables <string>', 'double-quoted comma-separated list of tables e.g --tables "users, products". It restores only the listed tables. Other tables will be ignored')
  .option('--data <string>', 'double-quoted comma-separated list of tables for which to restore the table data or rows')
  .option('--no-data', 'do not restore data')
  .argument('<name>', 'name of the snapshot')
  .action(function(name, options ){
    if( helpers.options.fill( options ) ){
      commands.restore( name, options );
    }   
    else console.log("Aborted".red);        
  });

program.command("set")
  .description("Set database parameters. (Note: they are set per directory)")
  .option('-u, --username <string>', 'database user name')
  .option('--password <string>', 'database user password')
  .option('--dbname <string>', 'database name')
  .option('--dbhost <string>', 'database host', 'localhost')
  .option('--port <number>', 'database port', '3306')
  .action(function( options ){  
    commands.set( options );        
  });

  program.command("get")
    .description("Get databaset parameters")
    .option('--username', 'database user name')
    .option('--password', 'database user password')
    .option('--dbname', 'database name')
    .option('--dbhost', 'database host')
    .option('--port', 'database port')
    .action(function( options ){  
      commands.get( options );        
    });

program.command("unset")
  .description("Unset database parameters")
  .option('--username', 'database user name')
  .option('--password', 'database user password')
  .option('--dbname', 'database name')
  .option('--dbhost', 'database host')
  .option('--port', 'database port')
  .action(function( options ){  
    commands.unset( options );        
  });

  program.command("list")
   .description("Lists all the snapshots or versions of your database")
   .action(function( options ){  
    commands.list( options );        
  });

  program.command("delete")
   .description("deletes a snapshot")
   .argument('<name>', 'name of the version/snapshot to delete')
   .action(function( name ){  
    commands.delete( name );        
  });

program.parse();

