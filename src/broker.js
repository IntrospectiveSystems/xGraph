#! /usr/bin/env node
// anything above this line is removed on npm run build.
// -:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-

let cli = function (argv) {
	const version = require('../package.json').version;
	const path = require('path');

	let cmd = argv[0];
	let options = require('minimist')(argv.slice(1));

	//clean the options and make sure that lowercase versions of all keys are available
	for (let key in options) options[key.toLowerCase()] = options[key];

	switch (cmd){
		case 'serve':
		case 'server':
		case 's': {
			break;
		}
		case 'add':
		case 'a': {
			add();
			break;
		}
		case 'push':{
			push();
			break;
		}
		case 'pull': {
			pull();
			break;
		}
		case 'h':
		case 'help':{
			help();
			break;
		}
		default: {
			console.log(`Broker: Unknown command <${subcommand}>`);
			help();
			break;
		}
	}


	function help() {

		let helpFile = path.join(__dirname, 'Help.txt');

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

if (require.main === module || !('id' in module)) {
		cli(process.argv);
	} else module.exports = {};
