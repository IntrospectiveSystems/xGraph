(function Test() {
	//TODO: Add in functionality for multiple systems + initiate
	//TODO: Add mode for automatically populating TestCases/Callbacks (Possibly load from the modules themselves)

	var dispatch = {
		Setup: Setup,
		Start: Start
	};

	return {
		dispatch: dispatch
	};


	function Setup(com, fun) {
		console.log('Test::Setup');
		fun();
	}

	function Start(com, fun) {
		console.log('Test::Start');
		var that = this;
		var fs = require('fs');
		that.Vlt.TestCases = Nxs.genPath(that.Par.TestCases);
		console.log(that.Vlt.TestCases);

		fs.readFile(that.Vlt.TestCases, (err, data) => {
			let tests = JSON.parse(data);
			RunTests(tests);
		});

		function RunTests(Tests) {
			var async = require('async');

			let Results = [];


			console.log(Tests.length);
			async.eachSeries(Tests, (test, callback) => {
				that.send(test.Command, that.Par[test.Dest], (err, cmd) => {
					console.log('Test Callback: ', cmd, err);
					let bMatch = true;
					if ('Callback' in test) {
						let keys = Object.keys(test.Callback);

						for (let i=0; i++; i<keys.length) {
							if (test.Callback[keys[i]] !== cmd[keys[i]]) {
								bMatch = false;
								break;
							}
						}
					}
					let result = {};
					result[test.Command.Cmd] = bMatch;

					Results.push(result);
					callback();
				});

			}, (err) => {

				console.log('All tests concluded');
				console.log(Results);
				for (let key in Results) {
					let keys = Object.keys(Results[key]);
					console.log (keys[0], ': ', Results[key][keys[0]]);
				}
			})
		}

		fun();
	}
})();