db.createUser(
   {
     user: "root",
     pwd: "10000",
     roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
   }
 )