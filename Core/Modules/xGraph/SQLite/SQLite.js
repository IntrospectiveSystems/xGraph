//# sourceURL=SQLite.js
(/**
 *  The SQLite entity is an adapter that allows xGraph to communicate with SQLite databases.
 *  This entity wraps the npm module SQLite3.
 *  @param {String=} this.Par.Filename   The filename for the SQLite database being accessed. If no filename is
 *                                          provided, the database will be stored in memory.
 *  @param {String=} this.Par.Mode       The mode for opening the database.
 */
function SQLite() {

    class SQLite {

        /**
         * The Setup command sets up the connection to the SQLite3 node module and saves it in Vlt.Sqlite3.
         * @param {object} com  The command object.
         * @callback fun
         */
		Setup(com, fun) {
            log.i("--SQLite/Setup");
			let that = this;
			let Par = this.Par;
			let Vlt = this.Vlt;
			let errors = null;

            let sqlite3 = this.require('sqlite3');

            if(sqlite3 == null || sqlite3 == undefined){
            	errors = "Unable to load sqlite3.";
			}

            Vlt.Sqlite3 = sqlite3;

            fun(errors, com);

		}

        /**
         * The Start command sets up the connection to the SQLite database named in Par.Filename.
         * @param {object} com  The command object.
         * @callback fun
         */
		Start(com, fun){
            log.i("--SQLite/Start");
            let that = this;
            let Par = this.Par;
            let Vlt = this.Vlt;
            let errors = null;

            let sqlite3 = Vlt.Sqlite3;

            let filename = ":memory:";
            let mode = Par.Mode;
            let database = null;

            if(Par.Filename){
				filename = Par.Filename;
			}

			if(mode){
                database = new sqlite3.Database(filename, mode, callback);
			} else {
                database = new sqlite3.Database(filename, callback);
			}


            function callback(err){
            	if(err){
                    log.e("Unable to open database.");
                    log.e("err: "+err);
            		errors = err;
				} else {
            	    log.i("Database opened succesfully.");
            	    Vlt.Database = database;
                }

                fun(errors, com);
            }
        }

        /**
         * Configure sets a configuration option for the database. A valid Option and Value must be provided.
         * Options include:
         *  - trace: provide a function callback as a value. Invoked when an SQL statement executes,
         *              with a rendering of the statement text.
         *  - profile: provide a function callback. Invoked every time an SQL statement executes.
         *  - busyTimeout: provide an integer as a value. Sets the busy timeout.
         * @param {object} com          The command object.
         * @param {String} com.Option   trace | profile | busyTimeout
         * @param {*} com.Value             If Option is trace or profile, com.Value is a function. For busyTimeout,
         *                                  com.Value is an integer.
         * @callback fun
         */
        Configure(com, fun){
            log.i("--SQLite/Configure");
            let that = this;
            let Par = this.Par;
            let Vlt = this.Vlt;
            let errors = null;

            let sqlite3 = Vlt.Sqlite3;
            let database = Vlt.Database;

            let option = com.Option;
            let value = com.Value;

            database.configure(option, value);

            fun(errors, com);

        }

        /**
         * Close closes the database.
         * @param {object} com  The command object.
         * @callback fun
         */
        Close(com, fun){
            log.i("--SQLite/Close");
            let that = this;
            let Par = this.Par;
            let Vlt = this.Vlt;
            let errors = null;

            let sqlite3 = Vlt.Sqlite3;
            let database = Vlt.Database;

            database.close(callback);

            function callback(err){
                if(err){
                    log.e("Unable to close database.");
                    log.e("error: "+err);
                    errors = err;
                } else {
                    log.i("Database closed successfully.");
                }

                fun(errors, com);
            }
        }

        /**
         * Runs the provided SQL query with the provided parameters. It does not retrieve any result data.
         * @param {object} com      The command object.
         * @param {String} com.Sql  The SQL Query that will be run. If the query has placeholders the values must be provided in com.Param.
         * @param {*=} com.Param         The parameters to replace the placeholders in the SQL Query.
         * @callback fun
         */
        Run(com, fun){
            log.i("--SQLite/Run");
            let that = this;
            let Par = this.Par;
            let Vlt = this.Vlt;
            let errors = null;

            let sqlite3 = Vlt.Sqlite3;
            let database = Vlt.Database;

            let param = [];
            let sql = com.Sql;

            if(com.Param){
                param = com.Param;
            }

            database.run(sql, param, callback);

            function callback(err){
                if(err){
                    log.e("Unable to run SQL statement.");
                    log.e("error: "+err);
                    errors = err;
                } else {
                    log.i("Run: Statement ran successfully.");
                }
                fun(errors, com);
            }
        }

        /**
         * Get runs the SQL query with the specified parameters and returns the first result row.
         * @param {object} com          The callback function.
         * @param {String} com.Sql      The SQL Query that will be run. If the query has placeholders the values must be provided in com.Param.
         * @param {*=} com.Param        The parameters to replace the placeholders in the SQL Query.
         * @callback fun
         * @return {object} com.Row     The first row returned by the Sql query.
         */
        Get(com, fun){
            log.i("--SQLite/Get");
            let that = this;
            let Par = this.Par;
            let Vlt = this.Vlt;
            let errors = null;

            let sqlite3 = Vlt.Sqlite3;
            let database = Vlt.Database;

            let param = [];
            let sql = com.Sql;

            if(com.Param){
                param = com.Param;
            }

            database.get(sql, param, callback);

            function callback(err, row){
                if(err){
                    log.e("Unable to get SQL statement.");
                    log.e("error: "+err);
                    errors = err;
                } else {
                    log.i("Get: Statement ran successfully.");
                    com.Row = row;
                }
                fun(errors, com);
            }
        }

        /**
         * The All command runs the SQL query with the specified parameters and returns all result rows.
         * @param {object} com          The command object.
         * @param {String} com.Sql      The SQL Query that will be run. If the query has placeholders the values must be provided in com.Param.
         * @param {*=} com.Param        The parameters to replace the placeholders in the SQL Query.
         * @callback fun
         * @return {object} com.Rows    All the rows returned by the Sql query.
         */
        All(com, fun){
            log.i("--SQLite/All");
            let that = this;
            let Par = this.Par;
            let Vlt = this.Vlt;
            let errors = null;

            let sqlite3 = Vlt.Sqlite3;
            let database = Vlt.Database;

            let param = [];
            let sql = com.Sql;

            if(com.Param){
                param = com.Param;
            }

            database.all(sql, param, callback);

            function callback(err, rows){
                if(err){
                    log.e("Unable to get SQL statement.");
                    log.e("error: "+err);
                    errors = err;
                } else {
                    log.i("All: Statement ran successfully.");
                    log.i(rows);
                    com.Rows = rows;
                }
                fun(errors, com);
            }
        }
        
        /**
         * The Exect command runs all SQL queries in the supplied string. No result rows are retrieved.
         * If a query fails, no subsequent statements will be executed.
         * statements will be executed.
         * @param {object} com      The command object.
         * @param {String} com.Sql  The SQL query that will be run.
         * @callback fun
         */
        Exec(com, fun){
            log.i("--SQLite/Exec");
            let that = this;
            let Par = this.Par;
            let Vlt = this.Vlt;
            let errors = null;

            let sqlite3 = Vlt.Sqlite3;
            let database = Vlt.Database;

            let sql = com.Sql;

            database.exec(sql, callback);

            function callback(err){
                if(err){
                    log.e("Unable to get SQL statement.");
                    log.e("error: "+err);
                    errors = err;
                } else {
                    log.i("Exec: Statement ran successfully.");
                }
                fun(errors, com);
            }
        }

	}

	return {dispatch:SQLite.prototype};

})();