(function Initiate() {

	var dispatch = {
		Setup: Setup,
		Start: Start,
		Stop: Stop,
		SetSystems: SetSystems,
		GetInfo: GetInfo
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		console.log('Initiate::Setup');
		var that = this;
		that.Vlt.Systems = {};
		fun();
	}


	// Read through par, Start processes
	// If System is defined in com, start that particular system (if system is already started: stop and then restart)
	// TODO: Add handling for stopping systems by alias (may involve stopping multiple instances)
	function Start(com, fun) {
		console.log('Initiate::Start');
		var that = this;
		var async = this.require('async');
		var proc = this.require('child_process');


		if ('System' in com) {
			startSystem(com.System, (systemPid) => {
				let child = that.Vlt.Systems[systemPid].Process;
				let system = that.Vlt.Systems[systemPid];
				child.stdout.on('data', (data) => {

					console.log(com.System.Name + ': ' + data.toString());
				});
				child.on('message', function(message) {
					let cmd = JSON.parse(message);
					if ('Cmd' in cmd && cmd.Cmd === 'Finished') {
						com.System = {};
						com.System.Name = system.Name;
						com.System.Pid = child.pid;
						if (fun) fun(null, com);
					} else {
						console.log(cmd);
					}
				});
				child.on('error', (err) => {
					console.log(err);
				});
				child.on('close', (code) => {
					console.log(code);
				});
			});
		} else {
			if (that.Par.Start || that.Vlt.Start) {
				if (com.Async) {
					startSystemsAsync(that.Par.Systems, () => {
						console.log('Systems Started');
						fun();
					});
				} else {
					startSystems(that.Par.Systems, () => {
						console.log('Systems Started');
						fun();
					})
				}
			} else {
				that.Vlt.Start = true;
				fun();
			}
		}

		// Utility functions
		function startSystems(systemArr, callback) {

			async.eachSeries(systemArr, (system, func) => {

				startSystem(system, (systemPid) => {
					let child = that.Vlt.Systems[systemPid].Process;
					child.stdout.on('data', (data) => {

						console.log(system.Name + ': ' + data.toString());
					});
					child.on('message', function(message) {
						let cmd = JSON.parse(message);
						if ('Cmd' in cmd && cmd.Cmd === 'Finished') {
							func();
						} else {
							console.log(cmd);
						}
					});
					child.on('error', (err) => {
						console.log(err);
					});
					child.on('close', (code) => {
						console.log(code);
					});
				});
			}, (err) => {
				callback();
			})

		}

		function startSystemsAsync(systemArr, callback) {

			async.each(systemArr, (system, func) => {

				startSystem(system, (systemPid) => {
					let child = that.Vlt.Systems[systemPid].Process;

					child.stdout.on('data', (data) => {
						console.log(system.Name + ': ' + data.toString());
					});
					child.on('message', function(message) {
						let cmd = JSON.parse(message);
						console.log(cmd);
					});
					child.on('error', (err) => {
						console.log(err);
					});
					child.on('exit', (code) => {
						console.log(systemPid, ': exited with code: ', code, ', removing from systems cache');
						delete that.Vlt.Systems[systemPid];
					});
					func();
				});
			}, (err) => {
				callback();
			})

		}

		function startSystem(system, callback) {
			let workDir = that.genPath(system.Work);

			// TODO: Handle failed system starts
			// TODO: Pass args from Systems array instead of inherit from parent proccess
			let args = process.argv.slice(2);

			console.log("Process args",process.argv, args);
			let child = proc.fork(process.argv[1], args,{cwd:workDir, silent:true});


			that.Vlt.Systems[child.pid] = {};
			that.Vlt.Systems[child.pid].Process = child;
			if ('Name' in system) {
				that.Vlt.Systems[child.pid].Name = system.Name;
			} else {
				that.Vlt.Systems[child.pid].Name = child.pid;
			}
			callback(child.pid);
		}
	}

	function Stop(com, fun) {
		var that = this;
		if ('System' in com && com.System in that.Vlt.Systems) {
			// TODO: Change to send message to child allowing it to handle closing gracefully
			let child = that.Vlt.Systems[com.System].Process;
			child.kill();
			delete(that.Vlt.Systems[com.System]);
		}
		if(fun) fun(null, com);
	}


	function SetSystems(com, fun) {
		var that = this;
		if ('Systems' in com) {
			that.Par.Systems = com.Systems;
			that.save();
		}
		if (fun) fun(null, com);
	}

	function GetInfo(com, fun) {
		var that = this;
		if ('Filter' in com && 'Systems' in com.Filter) {
			com.Info = {};
			com.Info.Systems = that.Par.Systems;
			// TODO: Parse live system list into object with only systemPids
			if (fun) fun(null, com);
		}

	}









})();