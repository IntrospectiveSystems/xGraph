//# sourceURL=MSSQL.js
(function MSSQL() {
	class MSSQL {

		Setup(com, fun) {
            log.i("--MSSQL/Setup");
            let that = this;
            let Par = this.Par;
            let Vlt = this.Vlt;
            let errors = null;

            let mssql = that.require('mssql');

            Vlt.Mssql = mssql;

            if(fun)
                fun(errors, com);
		}

		Start(com, fun){
            log.i("--MSSQL/Start");
            let that = this;
            let Par = this.Par;
            let Vlt = this.Vlt;
            let errors = null;

            let mssql = that.require('mssql');

            let connection = new mssql.ConnectionPool(Par.ConnectionObject);

            Vlt.Connection = connection;

            connection.connect(callback);

            function callback(err){
                if (err) {
                    log.e(err);
                    errors = err;
                }

                log.i("connected");

                if(fun)
                    fun(errors, com);
            }

		}

        Query(com, fun) {
            log.i("--MSSQL/Query");
            let that = this;
            let Par = this.Par;
            let Vlt = this.Vlt;
            let errors = null;

            let mssql = Vlt.Mssql;
            let connection = Vlt.Connection;



            let StatementObject = com.StatementObject;

            let sql = StatementObject.Sql;
            let inputs = StatementObject.Inputs;
            let outputs = StatementObject.Outputs;

            log.i(sql);
            log.i(inputs);
            log.i(outputs);


            let statement = new mssql.PreparedStatement(connection);


            let values = {};

            if(inputs) {
                for (let i = 0; i < inputs.length; i++) {
                    let name = inputs[i].name;
                    let type = inputs[i].type;
                    log.i(name);
                    log.i(type);
                    values[name] = inputs[i].value;
                    log.i("here");
                    statement.input(name, type);
                }
            }

            if(outputs) {
                for (let i = 0; i < outputs.length; i++) {
                    let name = outputs[i].name;
                    let type = outputs[i].type;
                    statement.output(name, type);
                }
            }

            if (fun)
                fun(errors, com);


            statement.prepare(sql, callback);

            function callback(err) {
                if (err) {
                    log.e(err);
                    errors = err;
                }

                statement.execute(values, backcall);

                function backcall(err, result) {
                    if (err) {
                        log.e(err);
                        errors = err;
                    }

                    log.i(result);
                    if (fun)
                        fun(errors, com);
                }
            }


		}


	}
	return {dispatch:MSSQL.prototype}
})();