#!/usr/bin/env node
const { Command } = require('commander');
const colors = require('colors');
const commands = require('./commands');
const helpers = require('./helpers');

const program = new Command();

program
  .name('dbsnap')
  .description('Database versioning tool. Used to take snapshots of your database tables and then restore any of the snapshots later. Currently only works for mysql')
  .version('1.0.0');

helpers.options.common( program.command("take") )
  .description("Take a snapshot of the database")
  .action(function( name, options ){
    if( helpers.options.fill( options ) ){
      commands.take( name, options );
    }   
    else console.log("Aborted!".red);     
  });

helpers.options.common( program.command("restore") )
  .description("Restore database from snapshot")
  .action(function(name, options ){
    if( helpers.options.fill( options ) ){
      commands.restore( name, options );
    }   
    else console.log("Aborted".red);        
  });

  helpers.options.common( program.command("set") )
  .description("Set options for reuse in the current directory i.e. everytime you run the tool in current directory, the specified option value will be used e.g. username, password")
  .action(function( options ){  
    commands.set( options );        
  });

  program.command("get")
    .description("Get options set for current directory")
    .option('--username', 'database user name')
    .option('--password', 'database user password')
    .option('--dbname', 'database name')
    .option('--dbhost', 'database host')
    .option('--port', 'database port')
    .action(function( options ){  
      commands.get( options );        
    });

program.command("unset")
  .description("Get options set for current directory")
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

