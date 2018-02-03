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

			if(!fs.existsSync(Vlt.File)) {
                let fd = fs.openSync(Vlt.File, 'w+');
                fs.closeSync(fd);
            }

            if(fun) {
                fun(errors, com);
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

            log.i(recordObjects[0]);

            for(var i=0; i<recordObjects.length; i++){

            	let recordObject = recordObjects[i];
            	let objectLength = Object.keys(recordObject).length;
            	let columnCounter = 0;

            	for(var key in recordObject){
            		buffer = buffer + recordObject[key];
            		columnCounter++;
            		if(columnCounter != objectLength) {
            			buffer = buffer + ',';
					} else if (i !== recordObjects.length-1 ) {
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


        /**
         * WriteFile takes an array of record objects (or arrays) and writes over the file found in Vlt.File. WriteFile
         * will overwrite any data currently in the file. To add records to an existing file, use AppendRecords.
         * @param {object} com 					The command object.
         * @param {array} com.RecordObjects	    An array of records as objects that will be written to the file.
         * @callback fun
         */
        WriteFile(com, fun){
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
                log.i("--CSV/WriteFile/callback");
                if(err){
                    log.e(err);
                    errors = err;
                }

                let fs = Vlt.Fs;
                let records = cmd.Records;


                let fd = fs.openSync(Vlt.File, 'w');
                Vlt.Fs.writeFile(fd, records, backcall);

                function backcall(err) {
                    log.i("--CSV/WriteFile/callback/backcall");
                    if (err) {
                        log.e(err);
                        errors = err;
                    }

                    fs.closeSync(fd);

                    if(fun) {
                        fun(errors, com);
                    }
                }
			}
        }


        /**
		 * ReadRecords reads all the records from the file specified in Vlt.File and returns the records as an array
         * of objects.
         * @param {object} com 					The command object.
         * @return {array} com.RecordObjects	An array of records as objects that will be written to the file.
         * @callback fun
         */
		ReadRecords(com, fun){
			log.i("--CSV/ReadRecords");
			let that = this;
			let Par = this.Par;
			let Vlt = this.Vlt;
			let errors = null;

			let fs = Vlt.Fs;

            let fd = fs.openSync(Vlt.File, 'r');
			Vlt.Fs.readFile(fd, "utf8", callback);

			function callback(err, data){
				log.i("--CSV/ReadRecords/callback")
                if(err){
                    log.e(err);
                    errors = err;
                }

                fs.closeSync(fd);

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


        /**
         * AppendRecords takes an array of record obejcts and appends the records to the end of the file
         * found at Vlt.File. AppendRecords does not overwrite current records.
         * @param {object} com 					The command object.
         * @param {array} com.RecordObjects	    An array of records as objects that will be appended to the file.
         * @callback fun
         */
        AppendRecords(com, fun){
            log.i("--CSV/AppendRecords");
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
                log.i("--CSV/AppendRecords/callback")
                if(err){
                    log.e(err);
                    errors = err;
                }

                let fs = Vlt.Fs;
                let records = cmd.Records;


                let fd = fs.openSync(Vlt.File, 'a+');
                fs.readFile(fd, "utf8", backcall);


                function backcall(err, data) {
                    log.i("--CSV/AppendRecords/callback/backcall");
                    if (err) {
                        log.e(err);
                        errors = err;
                    }

                    if(data != ""){
                        records = "\n" + records;
                    }


                    fs.writeFile(fd, records, callbackAgain);

                    function callbackAgain(err) {
                        if (err) {
                            log.e(err);
                            errors = err;
                        }

                        fs.closeSync(fd);

                        if (fun) {
                            fun(errors, com);
                        }
                    }
                }
            }
        }


        /**
         * DeleteRecord takes a single record object and removes the first instance of that record from the file. If
         * the record cannot be found in the file, com.DeletedRecord will return as false.
         * @param {object} com 					The command object.
         * @param {array} com.RecordObject	    A record as an object that will be deleted from the file.
         * @return {bool} com.DeletedRecord     True if the record was sucessfully deleted, false if the record could
         *                                          not be found.
         * @callback fun
         */
        DeleteRecord(com, fun){
            log.i("--CSV/DeleteRecords");
            let that = this;
            let Par = this.Par;
            let Vlt = this.Vlt;
            let errors = null;

            let fs = Vlt.Fs;
            let recordObject = [com.RecordObject];


            let ObjectsToCSVCommand = {
                Cmd: "ObjectsToCSV",
                RecordObjects: recordObject
            }

            that.send(ObjectsToCSVCommand, Par.Pid, callback);


            function callback(err, cmd){
                log.i("--CSV/DeleteRecords/callback")
                if(err){
                    log.e(err);
                    errors = err;
                }

                let record = cmd.Records;
                log.i(record);


                let fd = fs.openSync(Vlt.File, 'r+');
                fs.readFile(fd, "utf8", backcall);

                function backcall(err, data) {
                    log.i("--CSV/DeleteRecords/callback/backcall")
                    com.RecordDeleted = false;

                    let records = data.split("\n");
                    let buffer = "";
                    let recordFound = false;
                    for(var i=0; i<records.length; i++){
                        if(recordFound == true || record != records[i]){
                            buffer = buffer + records[i];
                            if(i != records.length-1){
                                buffer = buffer + "\n";
                            }
                        } else {
                            recordFound = true;
                            com.RecordDeleted = true;
                        }
                    }
                    log.i(buffer);
                    fs.closeSync(fd);
                    fd = fs.openSync(Vlt.File, 'w+');
                    fs.writeFile(fd, buffer, callbackAgain);

                    function callbackAgain(err, msg){
                        log.i("--CSV/DeleteRecords/callback/backcall/callbackAgain")

                        fs.closeSync(fd);

                        if (fun) {
                            fun(errors, com);
                        }

                    }
                }
            }
        }
	}

	return {dispatch:CSV.prototype};
})();