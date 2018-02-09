### MySQL

v1.0

Introspective Systems

---

MySQL provides an interface for MySQL databases. This module wraps the npm
node module, [mysql](https://www.npmjs.com/package/mysql). Connecting and
Querying commands use objects to communicate with mysql. The objects
should be constructed using the options outlined in the
[mysql documentation](https://www.npmjs.com/package/mysql).


### Module Interface

#### Module Definition Parameters (`this.Par`)

Parameters are defined in the module definition and stored in `this.Par`.
Below, the Parameters that CSV expects are defined.

- **Par.ConnectionObject** (*required*): An object containing all the information
                        needed to connect to a MySQL server or database.

---

#### Output Commands
The Output Commands are all the command that MySQL can send.

(*MySQL does not send any output commands.*)


---

#### Input Commands
In addition to Start and Setup, MySQL accepts two commands to interact with
a MySQL server or database: Query and Disconnect. A connection to a database
is established in the Start command. Any SQL statement can be sent using the
Query command. When the interaction is complete, it is good practice to
disconnect the connection.


##### Setup(com, fun)
Setup is sent when the MySQL module is first generated. Here, the reference
to the mysql npm module is established, and the reference is saved in Vlt.Mysql.

###### Parameters
- **com** (*required*): The command object.
- **fun** (*required*): The callback function.


##### Start(com, fun)
The Start command uses the connection options, referenced in the ConnectionObject,
to establish a connection to the MySQL server or database. The available options
can be found in the [mysql documentation](https://www.npmjs.com/package/mysql).

###### Parameters
- **com** (*required*): The command object.
- **fun** (*required*): The callback function.


##### Query(com, fun)
The Query command uses the query options, referenced in com.QueryObject,
to establish a connection to the MySQL server or database. The available options
can be found in the [mysql documentation](https://www.npmjs.com/package/mysql).

###### Parameters
- **com** (*required*): The command object.
- **com.QueryObject** (*required*): An object containing the SQL query options.
- **fun** (*required*): The callback function.


##### Disconnect(com, fun)
The disconnect command will stop the connection to the MySQL server. To
reconnect, the Start command must then be received by MySQL.

###### Parameters
- **com** (*required*): The command object.
- **fun** (*required*): The callback function.