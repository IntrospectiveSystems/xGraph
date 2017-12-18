### SQLite

v1.0

Introspective Systems, LLC

---

SQLite is an adapter that allows xGraph to communicate with SQLite
databases. SQLite wraps the Sqlite3 node.js module.

[How-to's and examples]

### Module Interface

#### Module Definition Parameters (`this.Par`)

Parameters are defined in the module definition and stored in this.Par.
Below, the Parameters that SQLite expects are defined.

- **Par.Filename** (*required*): The filename of the SQLite database that
                                    will be accessed or created.

---

#### Output Commands
The Output Commands are all the command that SQLite can send.

*(SQLite does not send any commands.)*

---

#### Input Commands
The Input Commands are all the command that SQLite can
receive.

##### Setup(com, fun)
Setup is called when the SQLite module is first generated. The Setup
command sets up the connection to the SQLite3 node module.

###### Parameters
- **com** (*required*): The command object.

###### Returns
*None*


##### Start(com, fun)
Setup is called when the SQLite module is first generated. The Setup
command sets up the connection to the SQLite3 node module.

###### Parameters
- **com** (*required*): The command object.

###### Returns
*None*


##### Configure(com, fun)
Configure sets a configuration option for the database. A valid Option
and Value must be provided.

###### Parameters
- **com** (*required*): The command object.
- **com.Option** (*required*): `'trace'` | `'profile'` | `'busyTimeout'`
- **com.Value** (*required*): If Option is trace or profile, com.Value
        is a function. For busyTimeout, com.Value is a an integer.

###### Returns
*None*


##### Close(com, fun)
The Close command closes the database.

###### Parameters
- **com** (*required*): The command object.

###### Returns
*None*


##### Run(com, fun)
Run runs the provided SQL query with the provided parameters. It does not
retrieve any result data.

###### Parameters
- **com** (*required*): The command object.
- **com.Sql** (*required*): The SQL Query that will be run. If the query
                        has placeholders the values for the placeholders
                        must be provided in com.Param.
- **com.Param**: The parameters to replace the placeholders in the SQL Query.

###### Returns
*None*


##### Get(com, fun)
Get runs the SQL query with the specified parameters and returns the first result row.

###### Parameters
- **com** (*required*): The command object.
- **com.Sql** (*required*): The SQL Query that will be run. If the query
                        has placeholders the values for the placeholders
                        must be provided in com.Param.
- **com.Param**: The parameters to replace the placeholders in the SQL Query.

###### Returns
- **com.Row**: The first row returned by the Sql query.


##### All(com, fun)
The All command runs the SQL query with the specified parameters and returns all result rows.

###### Parameters
- **com** (*required*): The command object.
- **com.Sql** (*required*): The SQL Query that will be run. If the query
                        has placeholders the values for the placeholders
                        must be provided in com.Param.
- **com.Param**: The parameters to replace the placeholders in the SQL Query.

###### Returns
- **com.Rows**: The all rows returned by the Sql query.


##### Each(com, fun)
The Each command runs the SQL query with the specified parameters and
calls the callback once for each result row.

###### Parameters
- **com** (*required*): The command object.
- **com.Sql** (*required*): The SQL Query that will be run. If the query
                        has placeholders the values for the placeholders
                        must be provided in com.Param.
- **com.Param**: The parameters to replace the placeholders in the SQL Query.
- **com.Callback** (*required*): The callback function that will be called
                        once for each row returned.

###### Returns
*None*


##### Exec(com, fun)
The Exect command runs all SQL queries in the supplied string. No result
rows are retrieved. If a query fails, no subsequent statements will be
executed. statements will be executed.

###### Parameters
- **com** (*required*): The command object.
- **com.Sql** (*required*): The SQL Query that will be run.

###### Returns
*None*