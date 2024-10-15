# Db snap
Database versioning tool. Used to take snapshots of your database tables (and optionally data) and then restore any of the snapshots later. It works by saving the state of your database in files then later using those files to restore the same state. Although this tool is fully capable of tracking your database changes and snapshots, you may choose to also commit the tracking files in **git**.

## Installation
**> npm install dbsnap**

## Example Usage
Go to your project folder or where you would like the snapshots to be saved

First setup database credentials  (note: this is done only once per project )  
**> dbsnap set --username** myuser **--password** 12345 **--dbname** mydb  

Take a snapshot of database and save it as **v1.0.0**  
**> dbsnap take** v1.0.0

Make changes to database  
Then restore database to snapshot that was saved as **v1.0.0**  
**> dbsnap restore** v1.0.0    

To see a list of saved snapshots  
**> dbsnap list**

To delete a snapshot named v1.0.1  
**> dbsnap delete v1.0.1**

To snapshot only a specific table (e.g. **users** table) and save the snapshot as **users-v1.0.0**  
**> dbsnap take users-v1.0.0 --tables users**

To snapshot only a specific set of tables (e.g. **user-carts**, **cart-items**, and **products** tables) and save the snapshot as **cart-tables-v1.0.0**  
**> dbsnap take cart-tables-v1.0.0 --tables "user-carts, cart-items, products"**

### Including data

To snapshot all tables (including data) and save the snapshot as **mydb-v1.0.0**  
**> dbsnap take mydb-v1.0.0 --all**

To snapshot all tables but include data for only some of them (e.g.roles table) and save the snapshot as **mydb-v1.0.0**  
**> dbsnap take mydb-v1.0.0 --data roles**  
Or if more than one e.g. (roles and permissions tables)  
**> dbsnap take mydb-v1.0.0 --data "roles, permissions"**  

To snapshot only a specific table (including data) and save the snapshot as **users-v1.0.0**  
**> dbsnap take users-v1.0.0 --tables users --data users**

To snapshot only a specific set of tables (including data) and save the snapshot as **cart-tables-v1.0.0**  
**> dbsnap take cart-tables-v1.0.0 --tables "user-carts, cart-items, products" --with-data**

### Other options

To list all commands, please use  
**> dbsnap help**   
OR  
**> dbsnap help &lt;command-name&gt;** to list all options for a command  

 
## Notes
- When setting up credentials you can also specify **--dbhost** and **--port**
- **dbsnap** saves snapshots in a subfolder named **.dbsnap** add this to **git** if you want to track with **git**
- Database credentials are stored in a file named **.dbsnap.json**, make sure to add it to **.gitignore** to avoid sharing credentials
- Currently this only works for mysql databases
- If you snapshot only a specific table or set of tables, the **restore** operation will not touch the other tables.
- If you make a full snapshot (i.e. no **--tables** options during **take** operation) you can restrict the tables to touch during a **restore** operation by using the **--tables** option (e.g. **> dbsnap restore v2.5.0 --tables "users, products"**) 
- For **restore** operations, **--data** works in a similar fashion to **--tables** i.e. it is not required when restoring tables. By default snapshots that include data will restore that data as well. However, you can restrict which data to restore by using the **--data** option (e.g. **> dbsnap restore v2.5.0 --data "roles, permissions"** will restore all the tables but will only restore data for **roles** and **permissions** tables)

Feel free to contact me via **dev.munesu@gmail.com** if you run into any issues or have any questions.

