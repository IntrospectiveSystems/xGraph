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

	async function serve() {
		let configPath = path.join(__dirname, '../res/BrokerServer');
		// console.log(`config at ${configPath}`);

		let cachePath = path.join(process.cwd(), '.broker');
		// console.log(`Cache at ${cachePath}`);

		let xgraphArgv = [
			'--cwd', configPath, '--cache', cachePath,
			'--core', 'mb://modulebroker.xgraphdev.com'].concat(argv.slice(3));
		// console.log(`args ${xgraphArgv}`);
		await xgraph.execute(xgraphArgv);
	}

	function add() {
		let configPath = path.join(__dirname, '../res/BrokerAdd');
		// console.log(`config at ${configPath}`);
		let tmp = require('tmp');

		tmp.dir(async function _tempFileCreated(err, tempPath, cleanupCallback) {
			if (err) throw err;
			let cachePath = path.join(tempPath, 'cache');
			// console.log(`Cache at ${cachePath}`);

			let xgraphArgv = [
				'--cwd', configPath, '--cache', cachePath,
				'--core', 'mb://modulebroker.xgraphdev.com'].concat(argv.slice(3));
			// console.log(`args ${xgraphArgv}`);
			await xgraph.execute(xgraphArgv);

			setTimeout(cleanUp, 20000);
			// cleanUp();

			async function cleanUp() {
				try {
					await remDir(cachePath);
					log.d(`tmp directory cleaned`);
					cleanupCallback();
					log.d(`tmp directory removed`);
				} catch (error) {
					log.w(`Error cleaning or removing tmp directory:\n\t`,error);
				}
			}

			function remDir(path) {
				console.log(`terminating ${path}`);
				return (new Promise(async (resolve, reject) => {
					if (fs.existsSync(path)) {
						let files = fs.readdirSync(path);
						let promiseArray = [];

						for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
							promiseArray.push(new Promise(async (resolve2, reject2) => {
								let curPath = path + "/" + files[fileIndex];
								if (fs.lstatSync(curPath).isDirectory()) {
									// recurse
									await remDir(curPath);
									resolve2();
								} else {
									// delete file
									log.v("Removing File ", files[fileIndex].split(".")[0]);
									fs.unlinkSync(curPath);
									resolve2();
								}
							}));
						}
						//make sure all the sub files and directories have been removed;
						await Promise.all(promiseArray);
						log.v("Removing Directory ", path);
						fs.rmdirSync(path);
						resolve()
					} else {
						log.v("trying to remove nonexistant path ", path);
						resolve();
					}
				}));
			}

		});
	}


	function notImplemented() {
		console.log(`Broker: "broker ${cmd}" is not yet implemented`);
	}


	function help() {

		let helpFile = path.join(__dirname, '../res/brokerHelp.txt');

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
