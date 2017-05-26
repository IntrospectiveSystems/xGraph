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
		var async = require('async');
		var proc = require('child_process');

		if ('System' in Start) {
			startSystem(com.System, (system) => {
				let child = that.Vlt.Systems[systemPid].Process;
				child.stdout.on('data', (data) => {

					console.log(system.Name + ': ' + data.toString());
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
			if (Start.Async) {
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
					child.on('close', (code) => {
						console.log(code);
					});
					func();
				});
			}, (err) => {
				callback();
			})

		}

		function startSystem(system, callback) {
			let workDir = Nxs.genPath(system.Work);

			// TODO: Change params to argv 2-n
			// TODO: Handle failed system starts
			console.log(process.argv[2]);
			let child = proc.fork(process.argv[1], [process.argv[2]],{cwd:workDir, silent:true});


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
			// TODO:
			// Send command to system to close
			// Remove from Systems list
			if(fun) fun(null, com);
		}

	}



	function SetSystems(com, fun) {
		var that = this;
		if ('Systems' in com) {
			that.Par.Systems = com.Systems;
			that.Save();
		}
		if (fun) fun(null, com);
	}

	function GetInfo(com, fun) {
		var that = this;
		if ('Filter' in com && 'Systems' in com.Filter) {
			com.Info = {};
			com.Info.Systems = that.Par.Systems;
			// TODO: Parse live system list into object with only systemPids
			//com.Info.Live = systemPids
			if (fun) fun(null, com);
		}

	}









})();