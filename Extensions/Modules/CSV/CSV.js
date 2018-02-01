//# sourceURL=CSV.js
(
    /**
	 * The CSV Module saves data in object or array format to a CSV file.
     * @param {string=} this.Par.File   		The file to be accessed. Defaults to "NewFile.csv".
	 * @param {bool=} this.Par.FileHasHeader 	True if the CSV file has a header row, false if it does not. Defaults
	 * 												to false.
     */
	function CSV() {

	class CSV {

        /**
		 * The Setup command sets up the connection to the node.js FileSystem, fs.
         * @param {object} com 	The command object.
         * @callback fun
         */
		Setup(com, fun) {
			log.i("--CSV/Setup");
			let that = this;
			let Par = this.Par;
			let Vlt = this.Vlt;
			let errors = null;

            let fs = this.require('fs');

            if(fs == null || fs == undefined){
                errors = "Unable to load fs.";
            }

            Vlt.Fs = fs;

            if(fun) {
                fun(errors, com);
            }
		}

        /**
		 * The Start command opends the file that will be read using node.js FileSystems, and records whether the file
		 * will have a header row.
         * @param {object} com 	The command object.
         * @callback fun
         */
		Start(com, fun){
			log.i("--CSV/Start");
			let that = this;
			let Par = this.Par;
			let Vlt = this.Vlt;
			let errors = null;

			let fs = Vlt.Fs;

			Vlt.File = "NewFile.csv";
			if(Par.File){
				Vlt.File = Par.File;
			}

			Vlt.FileHasHeader = false;
			if(Par.FileHasHeader){
				Vlt.FileHasHeader = true;
			}

			fs.open(Vlt.File, 'a+', callback);

			function callback(err, fd){
				log.i("--CSV/Start/callback")
				if(err){
					log.e(err);
					errors = err;
 				}
 				Vlt.Fd = fd;

				if(fun) {
                    fun(errors, com);
                }
			}
		}


        /**
		 * ObjectsToCSV takes an array of objects and converts the objects to a CSV string.
         * @param {object} com 					The command object.
         * @param {array} com.RecordObjects 	An array of objects (or arrays) that should be converted to a CSV string.
		 * @return {string} com.Records 		A CSV string representation of the objects passed in com.RecordObjects.
         * @callback fun
         */
        ObjectsToCSV(com, fun){
            log.i("--CSV/ObjectsToCSV");
            let that = this;
            let Par = this.Par;
            let Vlt = this.Vlt;
            let errors = null;


            let recordObjects = com.RecordObjects;
            let buffer = "";


            for(var i=0; i<recordObjects.length; i++){

            	let recordObject = recordObjects[i];
            	let objectLength = Object.keys(recordObject).length;
            	let columnCounter = 0;

            	for(var key in recordObject){
            		buffer = buffer + recordObject[key];
            		columnCounter++;
            		if(columnCounter != objectLength) {
            			buffer = buffer + ',';
					} else {
            			buffer = buffer + "\n";
					}
				}

			}

			com.Records = buffer;

            if(fun) {
                fun(errors, com);
            }
        }


        /**
		 * CSVToObjects takes a CSV string of records and converts it to an array of Objects. If the file has a header,
		 * objects will use the header strings as keys, and the record strings as values.
         * @param {object} com 					The command object.
		 * @param {string} com.Records 			A string representation of the CSV records that will be converted to objects.
         * @return {array} com.RecoredObjects	An array of records as objects.
		 * @callback fun
         */
        CSVToObjects(com, fun){
            log.i("--CSV/CSVToOjbects");
            let that = this;
            let Par = this.Par;
            let Vlt = this.Vlt;
            let errors = null;

            let recordString = com.Records;
            let recordObjectBufferArray = [];

            let records = recordString.split("\n");


            for(var i = 0; i<records.length; i++){
            	let recordString = records[i];
            	let recordValues = recordString.split(",");
            	let recordObject = {};
            	for(var j = 0; j<recordValues.length; j++){
					recordObject[j] = recordValues[j];
				}
				recordObjectBufferArray.push(recordObject);
			}

			com.RecordObjects = recordObjectBufferArray;

            if(fun) {
                fun(errors, com);
            }
        }

        WriteRecords(com, fun){
            log.i("--CSV/WriteFile");
            let that = this;
            let Par = this.Par;
            let Vlt = this.Vlt;
            let errors = null;

            let recordObjects = com.RecordObjects;

            let ObjectsToCSVCommand = {
            	Cmd: "ObjectsToCSV",
				RecordObjects: recordObjects
			}


			that.send(ObjectsToCSVCommand, Par.Pid, callback);
            function callback(err, cmd){
                log.i("--CSV/WriteRecords/callback")
                if(err){
                    log.e(err);
                    errors = err;
                }

                let records = cmd.Records;

                Vlt.Fs.writeFileSync(Vlt.Fd, records, backcall);

			}

            function backcall(err) {
                log.i("I got yo back");
                if (err) {
                    log.e(err);
                    errors = err;
                }

                if(fun) {
                    fun(errors, com);
                }
            }
        }

        /**
		 *
         * @param com
         * @param fun
         * @return com.DataSet
         */
		ReadRecords(com, fun){
			log.i("--CSV/ReadRecords");
			let that = this;
			let Par = this.Par;
			let Vlt = this.Vlt;
			let errors = null;

			Vlt.Fs.readFile(Vlt.Fd, "utf8", callback);

			function callback(err, data){
				log.i("--CSV/ReadRecords/callback")
                if(err){
                    log.e(err);
                    errors = err;
                }

				let records = data;

				let CSVToObjectsCommand = {
					Cmd: "CSVToObjects",
					Records: records
				}

				that.send(CSVToObjectsCommand, Par.Pid, backcall);

				function backcall(err, cmd){
                    log.i("--CSV/ReadRecords/callback/backcall")
                    if(err){
                        log.e(err);
                        errors = err;
                    }

                    com.RecordObjects = cmd.RecordObjects;

                    if(fun) {
                        fun(errors, com);
                    }
				}

            }


		}

	}

	return {dispatch:CSV.prototype};
})();