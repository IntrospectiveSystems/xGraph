(function Test() {

	var dispatch = {
		StartTests:StartTests
	};

	return {
		dispatch: dispatch
	};

	function StartTests(com, fun) {
		var that = this;
		let pid = com.ModuleServer;
		console.log('test::StartTests');
		//AddModule();
		//Query();
		//GetModule();
		GetDocumentation();
		if (fun) fun(null, com);

		// test Cases::
		function Query() {
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
		function AddModule() {
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
					Name: 'testModule5',
					Module: data
				};
				that.send(cmd, pid, function(err, com) {
					console.log('test:AddModule:Callback: ', com);
				})
			}
		}

		function GetModule() {
			let cmd = {
				Cmd: 'GetModule',
				Name: 'testModule'
			};
			that.send(cmd, pid, function(err, com) {
				console.log('test:GetModule:Callback: ', com);
			})

		}

		function GetDocumentation() {

			let cmd = {
				Cmd:'GetDocumentation',
				Name: 'testModule1',
			};
			console.log(that.Par);

			that.send(cmd, pid, (err, com) => {
				var buf = Buffer.from(com.Info, 'base64');
				console.log(buf.toString('ascii'));
			})
		}



	}
})();