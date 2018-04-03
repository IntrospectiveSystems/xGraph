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

	function Setup(com, fun) {
		log.i(`--SimpleDataStore/Setup`);

		this.Vlt.data = {};

		fun(null, com);
	}

	function GetData(com, fun) {
		log.v("SimpleDataStore/GetData ", com.Key);
		let err = null;
		if (com.Key in this.Vlt.data)
			com.Data = this.Vlt.data[com.Key];
		else {
			err = `Key ${com.Key} not in this.Vlt.data`;
			com.Data = null;
		}

		// log.d(`returning data ${com.Data}`);
		fun(err, com);
	}

	function SetData(com, fun) {
		log.v("SimpleDataStore/SetData ", com.Key);

		if (com.Key in this.Vlt.data) {
			log.v("over writing data in ", com.Key)
		} else {
			log.v("set data at key ", com.Key);
		}

		this.Vlt.data[com.Key] = com.Data;
		// log.d(`setting data ${com.Data}`);
		fun(null, com);
	}

})();
