(function Initiate() {

	var dispatch = {
		Setup: Setup,
		Start: Start
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		console.log('Initiate::Setup');
		fun();
	}


	// Read through par, Start processes
	function Start(com, fun) {
		console.log('Initiate::Start');
		var proc = require('child_process');

		let child = proc.fork('/home/alex/xGraph/xGraph/Nexus/Nexus/Nexus.js', ['xGraph=/home/alex/xGraph/xGraph'], {cwd:'/home/alex/xGraph/xGraph/Work/ModuleServer'});
		child.on('message', function(message) {
			let obj = JSON.parse(message);
			console.log(obj.cmd);
			console.log(message);
		});

		function startSystemsSync(systemArr, callback) {

			// Iterate through par.Systems
			// Start each System and wait for response

		}

		function startSystems(systemArr, callback) {

		}

		fun();
	}



	function AddSystems(com, fun) {
		var that = this;

		if ('Systems' in com) {
			that.Par.Systems = com.Systems;
			that.Save();
		}
		if (fun) fun(null, com);
	}









})();