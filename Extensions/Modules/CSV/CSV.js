//# sourceURL=CSV.js
(
    /**
	 * The CSV entity saves data in object or array format to a CSV file. If the file does not exist, it will be created.
     * If the file already exists, the file will be accessed. If CSV is given a header, the new header will be written
     * to a new file on creation or on a WriteFile command, and the first row of the file will be ignored on ReadRecords.
     * @param {string=} this.Par.File   The file (or file path) to be accessed. Defaults to "NewFile.csv".
	 * @param {array=} this.Par.Header  An array of strings representing the header row of the CSV file. The number of
     *                                  columns in the header must match the number of columns in each CSV record.
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
		 * The Start command opens the file that will be read using node.js FileSystems, and records the files header if
         * the file has a header row.
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
			if(Par.Header){
				Vlt.FileHasHeader = true;
				Vlt.Header = Par.Header;
                let buffer = "";
                for(let i=0; i<Par.Header.length; i++){
				    buffer = buffer + Par.Header[i];
				    if(i < Par.Header.length-1){
				        buffer = buffer + ',';
                    }
                }
                Vlt.HeaderString = buffer;
			}

			if(!fs.existsSync(Vlt.File)) {
                let fd = fs.openSync(Vlt.File, 'w+');
                if(Vlt.FileHasHeader){
                    fs.writeFileSync(fd, Vlt.HeaderString);
                }

                fs.closeSync(fd);
            }

            if(fun) {
                fun(errors, com);
            }
		}



        /**
		 * ObjectsToCSV takes an array of objects and returns the objects as a CSV string.
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
		 * CSVToObjects takes an array of records as strings and returns the records as an array of record Objects. If
         * the file has a header, the objects will use the header strings as keys, and the record strings as values.
         * @param {object} com 					The command object.
		 * @param {array} com.Records 			An array of records as CSV strings.
         * @return {array} com.RecoredObjects	An array of records as objects.
		 * @callback fun
         */
        CSVToObjects(com, fun){
            log.i("--CSV/CSVToOjbects");
            let that = this;
            let Par = this.Par;
            let Vlt = this.Vlt;
            let errors = null;


            let recordObjectBufferArray = [];
            let records = com.Records;


            for(var i = 0; i<records.length; i++){
            	let recordString = records[i];
            	let recordValues = recordString.split(",");

            	let recordObject = {};
            	for(var j = 0; j<recordValues.length; j++){
                    if(Vlt.FileHasHeader){
                        recordObject[Vlt.Header[j]] = recordValues[j];
                    } else {
                        recordObject[j] = recordValues[j];
                    }
				}
				recordObjectBufferArray.push(recordObject);
			}

			com.RecordObjects = recordObjectBufferArray;

            if(fun) {
                fun(errors, com);
            }
        }


        /**
         * WriteFile takes an array of record objects (or arrays) and writes over the file (Vlt.File). WriteFile
         * will overwrite any data currently in the file. If the file has a header, the header will be the first row
         * written to the file. To add records to an existing file, use AppendRecords.
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

            if(Vlt.FileHasHeader){
                recordObjects.splice(0, 0, Vlt.Header);
            }

            let ObjectsToCSVCommand = {
            	Cmd: "ObjectsToCSV",
				RecordObjects: recordObjects
			}


			that.send(ObjectsToCSVCommand, Par.Pid, callback);

            function callback(err, cmd){
                if(err){
                    log.e(err);
                    errors = err;
                }

                let fs = Vlt.Fs;
                let records = cmd.Records;


                let fd = fs.openSync(Vlt.File, 'w');
                Vlt.Fs.writeFile(fd, records, backcall);

                function backcall(err) {
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
		 * ReadFile reads all the records from the file specified in Vlt.File and returns the records as an array
         * of objects.
         * @param {object} com 					The command object.
         * @return {array} com.RecordObjects	An array of records as objects read from the file.
         * @callback fun
         */
		ReadFile(com, fun){
			log.i("--CSV/ReadFile");
			let that = this;
			let Par = this.Par;
			let Vlt = this.Vlt;
			let errors = null;

			let fs = Vlt.Fs;

            let fd = fs.openSync(Vlt.File, 'r');
			Vlt.Fs.readFile(fd, "utf8", callback);

			function callback(err, data){
                if(err){
                    log.e(err);
                    errors = err;
                }

                fs.closeSync(fd);

				let records = data.split("\n");
				if(Vlt.FileHasHeader){
				    records.splice(0, 1);
                }


				let CSVToObjectsCommand = {
					Cmd: "CSVToObjects",
					Records: records
				}

				that.send(CSVToObjectsCommand, Par.Pid, backcall);

				function backcall(err, cmd){
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
         * AppendRecords takes an array of record objects and appends the records to the end of the file
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
                if(err){
                    log.e(err);
                    errors = err;
                }

                let fs = Vlt.Fs;
                let records = cmd.Records;


                let fd = fs.openSync(Vlt.File, 'a+');
                fs.readFile(fd, "utf8", backcall);


                function backcall(err, data) {
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
         * @param {object} com.RecordObject	    A record as an object that will be deleted from the file.
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
                if(err){
                    log.e(err);
                    errors = err;
                }

                let record = cmd.Records;


                let fd = fs.openSync(Vlt.File, 'r+');
                fs.readFile(fd, "utf8", backcall);

                function backcall(err, data) {
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
                    fs.closeSync(fd);
                    fd = fs.openSync(Vlt.File, 'w+');
                    fs.writeFile(fd, buffer, callbackAgain);

                    function callbackAgain(err, msg){

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