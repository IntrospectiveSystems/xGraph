#! /usr/bin/env node
// anything above this line is removed on npm run build.
// -:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-

let cli = function (argv) {
	const version = require('../package.json').version;
	const path = require('path');
	const fs = require('fs');
	const xgraph = require('../src/xgraph.js');

	if (argv.length == 2) argv[2] = 'help';
	let cmd = argv[2];

	switch (cmd) {
		case 'serve':
		case 'server':
		case 's': {
			serve()
			break;
		}
		case 'add':
		case 'a': {
			add();
			break;
		}
		case 'push': {
			notImplemented();
			break;
		}
		case 'pull': {
			notImplemented();
			break;
		}
		case 'h':
		case 'help': {
			help();
			break;
		}
		default: {
			console.log(`Broker: Unknown command <${cmd}>`);
			help();
			break;
		}
	}

	function serve(){
		let xgraphArgv = ['node', 'xgraph.js', 'x'].concat(argv.slice(3));

		xgraph.exec(xgraphArgv);
	}


	function notImplemented() {
		console.log(`Broker: "broker ${cmd}" is not yet implemented`);
	}


	function help() {

		let helpFile = path.join(__dirname, 'brokerHelp.txt');

		let helpFileText = fs.readFileSync(helpFile);

		let helpText = `
		(function(){
			let text = \`${helpFileText}\`; 
			return text;
		})();
		`;

		let help = eval(helpText);

		console.log(help);
	}
}

if (require.main === module || !('id' in module)) {
	cli(process.argv);
} else module.exports = {};
