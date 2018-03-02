//# sourceURL=MySQL.js
(
/**
 * The MySQL entity provides three functionalities for interacting with MySQL databases: connecting, querying, and
 * disconnecting. This functionality is provided by wrapping the mysql npm module. For additional information on how
 * connections and queries should be made, see the documentation for mysql.
 * @param {object} this.Par.ConnectionObject    An object holding all the options for connecting to the MySQL database.
 */
function MySQL() {
	class MySQL {
        /**
         * The Setup command will set up a reference to the mysql npm module. The reference to mysql is saved to Vlt.Mysql.
         * @param {object} com 	The command object.
         * @callback fun
         */
		Setup(com, fun) {
            log.i("--MySQL/Setup");
            let that = this;
            let Par = this.Par;
            let Vlt = this.Vlt;
            let errors = null;

		    let mysql = that.require('mysql');

            Vlt.Mysql = mysql;

            if(fun)
			    fun(errors, com);
		}

        /**
         * The Start command will set up a connection to the database server using the connection information provided
         * in this.Par.ConnectionObject. A reference to the connection is saved in Vlt.Connection.
         * @param {object} com 	The command object.
         * @callback fun
         */
		Start(com, fun){
            log.i("--MySQL/Start");
            let that = this;
            let Par = this.Par;
            let Vlt = this.Vlt;
            let errors = null;


            var connection = Vlt.Mysql.createConnection(Par.ConnectionObject);
            Vlt.Connection = connection;

			fun(errors, com);
		}

        /**
         * The Query command recieves a query object, constructed of an "sql" key as well as additional options, and
         * sends the query to the connection referenced at Vlt.Connection.
         * @param {object} com 	            The command object.
         * @param {object} com.QueryObject  An object containing the SQL query and any query options.
         * @return {array} com.Results      An array of result objects.
         * @return {array} com.Fields       An array with details about the table fields.
         * @callback fun
         */
		Query(com, fun){
            log.i("--MySQL/Query");
            let that = this;
            let Par = this.Par;
            let Vlt = this.Vlt;
            let errors = null;

            let connection = Vlt.Connection;
            let queryObject = com.QueryObject;

            connection.query(queryObject, callback);

            function callback(error, results, fields){
                if(error){
                    errors = error;
                }



                com.Results = results;
                com.Fields = fields;

                if(fun)
                    fun(errors, com);
            }
        }


        /**
         * The Disconnect command will stop the connection to the MySQL server. To reconnect, the "Start" command must
         * be recieved.
         * @param {object} com 	The command object.
         * @callback fun
         */
        Disconnect(com, fun){
            log.i("--MySQL/Disconnect");
            let that = this;
            let Par = this.Par;
            let Vlt = this.Vlt;
            let errors = null;

            let connection = Vlt.Connection;
            connection.end(function(err) {

                if(err)
                    errors = err;

                if(fun)
                    fun(errors, com);
            });


        }
    }
    return {dispatch:MySQL.prototype};
})();