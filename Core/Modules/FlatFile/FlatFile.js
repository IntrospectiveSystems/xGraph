(function FlatFile() {

	var dispatch = {
		Setup: Setup,
		Get: Get,
		Put: Put,
		List: List,
		Delete: Delete
	};

	return {
		dispatch: dispatch
	};

	/**
	 * Setup database, cache any saved data. Setup save event loop.
	 * @param {Object} com
	 * @param {function} fun
	 */
	function Setup(com, fun) {
		let that = this;
		console.log('FlatFile::Setup');
		that.Vlt.bOpen = false;
		that.Vlt.SaveQueue = 0;
		that.Vlt.Data = {};

		let EventEmitter = that.require('events');
		let fs = that.require('fs');


		if ('Database' in that.Par) {
			that.Vlt.Database = that.Par.Database;
		} else {
			that.Vlt.Database = 'Database.db'
		}


		// -------------  Events ---------------------
		class Emitter extends EventEmitter {}

		that.Vlt.DBEmitter = new Emitter();
		that.Vlt.DBEmitter.on('save', () => {

			// Collect save events and execute only after all are received.
			that.Vlt.SaveQueue++;
			if (that.Vlt.SaveQueue > 1) {
				return;
			}

			const util = that.require('util');
			const setTimeoutPromise = util.promisify(setTimeout);

			Loop();

			function Loop() {
				setTimeoutPromise(1000).then(() => {
					log.i('SaveQueue', that.Vlt.SaveQueue);

					if (that.Vlt.SaveQueue === 1) {
						SaveDB.call(that, that.Vlt.Database, that.Vlt.Data, (err) => {
							that.Vlt.SaveQueue--;
							if (that.Vlt.SaveQueue < 0) {that.Vlt.SaveQueue = 0}
							if (err) log.i(err);
						});
					} else {
						that.Vlt.SaveQueue--;
						if (that.Vlt.SaveQueue < 1) {that.Vlt.SaveQueue = 1}
						Loop();
					}
				});
			}

		});
		// -------------- Events End ------------------


		// Read Database file and read all data into Vlt.Data
		OpenDB.call(that, that.Vlt.Database).then((data) => {

			if (data) {
				that.Vlt.Data = JSON.parse(data);
			}

		}).catch((err) => {
			console.log(err);
		});

		fun(null, com);
	}


	/**
	 * Add a record to the database, stores all key value pairs contained in com.Data
	 * @param {Object} com
	 * @param {Object} com.Data Object containing all Key Value pairs to be saved
	 * @param {function} fun
	 */
	function Put(com, fun) {
		let that = this;

		if ('Data' in com) {
			for (let key in com.Data) {
				that.Vlt.Data[key] = com.Data[key];
			}
			that.Vlt.DBEmitter.emit('save');
			if (fun) fun(null, com);
		} else {
			let err = 'ERR:: No Key provided in command';
			if (fun) fun(err, com);
		}
	}

	/**
	 * List all keys stored in the database, returns as array in com.Info
	 * @param {Object} com
	 * @param {function} fun
	 * @returns {Array} com.Info
	 */
	function List(com, fun) {
		let that = this;
		com.Info = Object.keys(that.Vlt.Data);
		fun(null, com);
	}

	/**
	 * Deletes every record as defined in com.Data.
	 * @param {Object} com
	 * @param {Array} com.Data Array of records to delete
	 * @param {function} fun
	 */
	function Delete(com, fun) {
		let that = this;

		if ('Data' in com) {
			for (let i=0; i<com.Data.length; i++) {
				let key = com.Data[i];
				if (key in that.Vlt.Data) {
					delete that.Vlt.Data[key];
				}
			}
			that.Vlt.DBEmitter.emit('save');
			if (fun) fun(null, com);
		} else {
			if (fun) fun(null, com);
		}
	}

	/**
	 * Get a single record value by key, return in com.Info[key]
	 * @param {Object} com
	 * @param {String} com.Key name of record to retrieve
	 * @param {function} fun
	 * @returns {String} com.Info
	 */
	function Get(com, fun) {
		let that = this;

		if (that.Vlt.Data && 'Key' in com && com.Key in that.Vlt.Data) {
			com.Info = {};
			com.Info[com.Key] = that.Vlt.Data[com.Key];
			fun(null, com);
		} else {
			fun( null, com);
		}
	}


	// ------------ INTERNAL FUNCTIONS -------------------
	/**
	 * Read database file at startup
	 * @param {String} database Local Path to database file
	 * @returns {Promise}
	 */
	function OpenDB(database) {
		let fs = this.require('fs');
		return new Promise((resolve, reject) => {
			fs.readFile(database, (err, data) => {
				if (err) {
					resolve(null);
				} else {
					resolve(data);
				}
			})
		});
	}

	/**
	 * Save all cached data in db file
	 * @param {String} database Local path to database file
	 * @param {Object} data Data to save
	 * @param {function} callback
	 */
	function SaveDB(database, data, callback) {

		let fs = this.require('fs');

		fs.writeFile(database, JSON.stringify(data), (err) => {
			if (err) {
				callback(err);
			} else {
				callback();
			}
		})
	}
})();