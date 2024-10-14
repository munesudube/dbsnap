# Db snap
Database versioning tool. Used to take snapshots of your database tables and then restore any of the snapshots later. It works by saving the state of your database in files then later using those files to restore the same state. Although this tool is fully capable of tracking your database changes and snapshots, you may choose to also commit the tracking files in **git**.

## Installation
**> npm install dbsnap**

## Example Usage
Go to your project folder or where you would like the snapshots to be saved

First setup database credentials  (note: this is done only once per project)  
**> dbsnap set --username** myuser **--password** 12345 **--dbname** mydb  

Take a snapshot of database and save it as **v1.0.0**  
**> dbsnap take** v1.0.0

Make changes to database  
Then restore database to snapshot that was saved as **v1.0.0**  
**> dbsnap restore** v1.0.0    

To see a list of saved snapshots  
**> dbsnap list**

#### Notes
- When setting up credentials you can also specify **--dbhost** and **--port**
- **dbsnap** saves snapshots in a subfolder named **.dbsnap** add this to **git** if you want to track with **git**
- Database credentials are stored in a file named **.dbsnap.json**, make sure to add it to **.gitignore** to avoid sharing credentials
- Currently this only works for mysql databases
- Currently this only tracks table structures and not the data within (updates will be coming soon to add this)

Feel free to contact me via **dev.munesu@gmail.com** if you run into any issues or have any questions.

