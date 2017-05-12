(function Test() {

	var dispatch = {
		StartTests:StartTests
	};

	return {
		dispatch: dispatch
	};

	function StartTests(com, fun) {
		var that = this;
		console.log('test::StartTests');
		Query(com.ModuleServer);
		GetModule(com.ModuleServer);
		AddModule(com.ModuleServer);




		// test Cases::
		function Query(pid) {
			//TODO: load test cases from json
			let cmd = {
				Cmd: 'Query',
				Filters: {
					output:'GenPage'
				}
			};
			that.send(cmd,pid, function(err, com) {
				console.log('test:Query:Callback: ', com);
			})

		}
		function AddModule(pid) {
			console.log('Test:AddModule');
			fs.readFile(Nxs.genPath('xGraph:/Work/ModuleServer/testModule5.zip'), done);

			function done(err, data) {
				if (err) {
					console.log(err);
					fun(err);
					return;
				}
				let cmd = {
					Cmd: 'AddModule',
					Info: {
						name: 'testModule5'
					},
					Module: data
				};
				that.send(cmd, pid, function(err, com) {
					console.log('test:GetModule:Callback: ', com);
				})

			}

		}

		function GetModule(pid) {
			let cmd = {
				Cmd: 'GetModule',
				Name: 'testModule5'
			};
			that.send(cmd, pid, function(err, com) {
				console.log('test:GetModule:Callback: ', com);
			})

		}

		if (fun) {
			fun(null, com);
		}

	}
})();