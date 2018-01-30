//# sourceURL=CSV.js
(function CSV() {

	class CSV {

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

		Start(com, fun){
			log.i("--CSV/Start");
			let that = this;
			let Par = this.Par;
			let Vlt = this.Vlt;
			let errors = null;

			let fs = Vlt.Fs;

			Vlt.Filename = "NewFile.csv";
			if(Par.Filename){
				Vlt.Filename = Par.Filename + ".csv";
			}

			Vlt.FileHasHeader = false;
			if(Par.FileHasHeader){
				Vlt.FileHasHeader = true;
			}

			fs.open(Vlt.Filename, 'a+', callback);

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
		 * @param com
         * @param fun
         * @constructor
         */
        ObjectsToCSV(com, fun){
            log.i("--CSV/ObjectsToCSV");
            let that = this;
            let Par = this.Par;
            let Vlt = this.Vlt;
            let errors = null;


            let objects = com.Records;
            let buffer = "";


            for(var i=0; i<objects.length; i++){
            	let object = objects[i];
            	for(var key in object){
            		buffer = buffer + object[key];
				}
			}

        }


        CSVToObjects(com, fun){
            log.i("--CSV/CSVToOjbects");
            let that = this;
            let Par = this.Par;
            let Vlt = this.Vlt;
            let errors = null;

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

			Vlt.Fs.readFile(Vlt.Fd, callback);

			function callback(err, data){
				log.i("--CSV/ReadFile/callback")
                if(err){
                    log.e(err);
                    errors = err;
                }




				if(fun) {
                    fun(errors, com);
                }
            }


		}

		WriteFile(com, fun){
			log.i("--CSV/WriteFile");
            let that = this;
            let Par = this.Par;
            let Vlt = this.Vlt;
            let errors = null;


            Vlt.Fs.writeFileSync(Vlt.Fd,"This,Is,A,CSV,Line\nThis,Is,Another,CSV,Line", callback);
            function callback(err){
            	log.i("I got yo back");
            	log.i(err);
			}

            fun(errors, com);
		}

	}

	return {dispatch:CSV.prototype};
})();