//# sourceURL=SimpleDataStore.js
(function SimpleDataStore() {

	//-----------------------------------------------------dispatch
	let dispatch = {
		Setup,
		GetData,
		SetData
	};

	return {
		dispatch: dispatch
	};

	/**
	 * Set a location to store the required data/variables
	 * @param {Object} com 
	 * @callback fun 
	 */
	function Setup(com, fun) {
		log.i(`--SimpleDataStore/Setup`);

		this.Vlt.data = {};

		fun(null, com);
	}


	/**
	 * One of the primary functions of the module. This is used for retrieving stored data. 
	 * @param {Object} com 
	 * @param {String} com.Key 		The key of the stored data. Data returned from this.Vlt.data[com.Key].
	 * @callback fun 
	 */
	function GetData(com, fun) {
		log.v("SimpleDataStore/GetData ", com.Key);
		let err = null;
		if (com.Key in this.Vlt.data)
			com.Data = this.Vlt.data[com.Key];
		else {
			err = `Key ${com.Key} not in */SimpleDataStore this.Vlt.data`;
			com.Data = null;
		}

		// log.d(`returning data ${com.Data}`);
		fun(err, com);
	}


	/**
	 * One of the primary functions of the module. This is used for setting stored data. 
	 * @param {Object} com 
	 * @param {String} com.Key 		The key of the stored data. Data set to this.Vlt.data[com.Key].
	 * @param {Object} com.Data		The data to be stored.
	 * @callback fun 
	 */
	function SetData(com, fun) {
		log.v("SimpleDataStore/SetData ", com.Key);

		if (com.Key in this.Vlt.data) {
			log.v("over writing data in ", com.Key)
		} else {
			// log.v("set data at key ", com.Key);
		}

		this.Vlt.data[com.Key] = com.Data;
		fun(null, com);
	}

})();
