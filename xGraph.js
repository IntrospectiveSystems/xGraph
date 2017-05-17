//Load the required modules
(function() {
	var fs = require('fs');
	var async = require('async');
	var async = require('async');
	var uuid = require('node-uuid');
	var Pid24;
	var EntCache = {};
	var Nxs = {
		genPid: genPid,
		genEntity: genEntity,
		send: send
	}
	console.log("\n\n\n");
	console.log('=================================================');
	console.log('=================================================');
	console.log('=================================================');

	// Process input arguments and define macro parameters
	var args = process.argv;
	let arg;
	let parts;
	let Params = {};
	for (var iarg = 0; iarg < args.length; iarg++) {
		console.log(args);
		arg = args[iarg];
		parts = arg.split('=');
		if (parts.length == 2) {
			Params[parts[0]] = parts[1];
		}
	}

})();
