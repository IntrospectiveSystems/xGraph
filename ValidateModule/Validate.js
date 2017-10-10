(function Validate() {


	var dispatch = {
		Start: Start,
		"*": DummyCatch
	};

	return {
		dispatch: dispatch
	};


	function Start(com, fun) {
		this.log('Test::Start');
		//save context for use in fs readfile subcontext
		let that = this;

		//load required functions
		const fs = this.require('fs');
		const async = this.require('async');
		// funciton for seting the appropriate pid references in  cmds and genmodule
		const setPid = (val) =>{
			if (typeof val === 'object') {
				return (Array.isArray(val) ? 
					val.map(v => setPid(v)) : 
					Object.entries(val).map(([key, val]) => {
						return [key, setPid(val)];
					}).reduce((prev, curr) => {
						prev[curr[0]]=curr[1];
						return prev;
					}, {})
				);
			}
			if (val === 'xGraphTestPid')
				return that.Par.Pid;
			else if(val === 'xGraphSelfPid')
				return that.Vlt.InstModule||'xGraphSelfPid';

			return val;
		};

		//To run the tests
		const RunTests = _=> {
			let Results = [];
			
			that.log(that.Vlt.Test.Cases.length + " Tests");
			async.eachSeries(that.Vlt.Test.Cases, (test, next) => {
				debugger;
				if (test.Command.Cmd=="Setup" || test.Command.Cmd=="Start"){
					let bMatch = true;
					let message, keys, key;
					if ("SentMessages" in test){
						for (let msgIdx=0; msgIdx<test.SentMessages.length; msgIdx++){
							message = test.SentMessages[msgIdx];
							keys = Object.keys(message);
							for (let i=0; i<keys.length; i++) {
								key = keys[i];
								if (message[key] !== that.Vlt.SentMessages[msgIdx][key]) {
									bMatch = false;
									break;
								}
							}
						}
					}
					let result = {};
					result[test.Command.Cmd] = bMatch;

					Results.push(result);
					next();
					return;
				}
				that.send(test.Command, that.Vlt.InstModule, (err, returnedCommand) => {
					let bMatch = true;
					
					//check for a binary match with the test.json test callback
					if ('Callback' in test) {
						let keys = Object.keys(test.Callback);
						for (let i=0; i<keys.length; i++) {
							if (test.Callback[keys[i]] !== returnedCommand[keys[i]]) {
								bMatch = false;
								break;
							}
						}
					}
					let result = {};
					result[test.Command.Cmd] = bMatch;

					Results.push(result);
					next();
				});

			}, (err) => {
				that.log('\nAll tests concluded.\n');
				let fails = 0;
				for (let key in Results) {
					let keys = Object.keys(Results[key]);
					that.log (keys[0]+ ' : '+ Results[key][keys[0]]);
					if (!Results[key][keys[0]])
						fails++;
				}
				if (fails == 0)
					that.log("All tests Passed!");
				else
					that.log(`${fails} of ${Results.length} tests Failed.`)
					
			});
		};

		//load the test.json file
		fs.readFile(that.genPath(that.Par.TestModule)+"/test.json", (err, data) => {
			that.Vlt.Test = setPid(JSON.parse(data));

			//build the module inst from test.json required state
			let inst = {};
			inst.Module = that.Par.TestModule;
			inst.Par = that.Vlt.Test.State;
						
			//instantiate the module
			//this calls setup and start in the instance
			that.genModule(inst, (err, instApex)=>{
				that.Vlt.InstModule = instApex;
				that.Vlt.Test = setPid(that.Vlt.Test);
				RunTests();
			});

		});

		//finish start:May happen before the test commences 
		fun(null, com);
	}

	function DummyCatch(com, fun){
		this.log(`Validate::DummyCatch ${JSON.stringify(com, null,2)}`);
		
		if (!this.Vlt.SentMessages)
			this.Vlt.SentMessages = [];

		this.Vlt.SentMessages.push(com);
		

		if (fun)
			fun(null, com);
	}

})();