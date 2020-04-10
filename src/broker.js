#! /usr/bin/env node
// anything above this line is removed on npm run build.
// -:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-

let cli = function (argv) {
	const version = require('../package.json').version;
	const path = require('path');
	const fs = require('fs');
	const xgraph = require('../src/xgraph.js');
	const createLogger = require('../lib/Logger.js');
	const log = createLogger({verbose: true});

	if (argv.length == 2) argv[2] = 'help';
	let cmd = argv[2];

	switch (cmd) {
		case 'serve':
		case 'server':
		case 's': {
			serve();
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
			log.w(`Broker: Unknown command <${cmd}>`);
			help();
			break;
		}
	}

	async function serve() {
		let configPath = path.join(__dirname, '../res/BrokerServer');
		let cachePath = path.join(process.cwd(), '.broker');

		let xgraphArgv = [
			'--cwd', configPath, '--cache', cachePath].concat(argv.slice(3));

		if (xgraphArgv.indexOf('--port') == -1) xgraphArgv.push('--port', '27000');
		if (xgraphArgv.indexOf('--websocketport') == -1) xgraphArgv.push('--websocketport', '27002');
		if (xgraphArgv.indexOf('--source') == -1)
			xgraphArgv.push('--source', 'mb://modulebroker.xgraphdev.com');

		log.d(`Broker serve:\n${JSON.stringify(xgraphArgv, null, 2)}`);

		try{
			let system = await xgraph.execute(xgraphArgv);
			log.d(typeof system, system);
		} catch (e) {log.e(e)}
	}

	function add() {
		let configPath = path.join(__dirname, '../res/BrokerAdd');
		let tmp = require('tmp');

		tmp.dir(async function _tempFileCreated(err, tempPath, cleanupCallback) {
			if (err) throw err;
			let cachePath = path.join(tempPath, 'cache');

			let xgraphArgv = [
				'--cwd', configPath, '--cache', cachePath].concat(argv.slice(3));
			if (xgraphArgv.indexOf('--path') == -1 && fs.existsSync(xgraphArgv[4]))
				xgraphArgv.splice(4, 0, '--path');
			if (xgraphArgv.indexOf('--host') == -1) xgraphArgv.push('--host', 'localhost');
			if (xgraphArgv.indexOf('--port') == -1) xgraphArgv.push('--port', '27000');
			if (xgraphArgv.indexOf('--source') == -1)
				xgraphArgv.push('--source', 'mb://modulebroker.xgraphdev.com');

			log.d(`Broker add:\n${JSON.stringify(xgraphArgv, null, 2)}`);
			
			
			try{
				let system = await xgraph.execute(xgraphArgv);
				system.on('exit', (evt) => {
					log.i('system finished code', evt.exitCode);
					cleanUp();
				});
			} catch (e) {log.e(e)}

			async function cleanUp() {
				try {
					await remDir(cachePath);
					cleanupCallback();
				} catch (error) {
					log.w('Error cleaning or removing tmp directory:\n\t', error);
				}
			}

			function remDir(path) {
				return (new Promise(async (resolve) => {
					if (fs.existsSync(path)) {
						let files = fs.readdirSync(path);
						let promiseArray = [];

						for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
							promiseArray.push(new Promise(async (resolve2) => {
								let curPath = path + '/' + files[fileIndex];
								if (fs.lstatSync(curPath).isDirectory()) {
									// recurse
									await remDir(curPath);
									resolve2();
								} else {
									// delete file
									fs.unlinkSync(curPath);
									resolve2();
								}
							}));
						}
						//make sure all the sub files and directories have been removed;
						await Promise.all(promiseArray);
						fs.rmdirSync(path);
						resolve();
					} else {
						resolve();
					}
				}));
			}
		});
	}


	function notImplemented() {
		log.w(`Broker: 'broker ${cmd}' is not yet implemented`);
	}


	function help() {
		let helpFile = path.join(__dirname, '../res/brokerHelp.txt');
		let helpFileText = fs.readFileSync(helpFile);

		let helpText = `(function(){
			let version = '${version}';
			let text = \`${helpFileText}\`; 
			return text;
		})();`;

		let help = eval(helpText);
		process.stdout.write(help);
	}
};

if (require.main === module || !('id' in module)) {
	cli(process.argv);
} else module.exports = {};
