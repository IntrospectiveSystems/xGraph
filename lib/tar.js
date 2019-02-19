const tar = require('tar-fs');
const fs = require('fs');
const path = require('path');
const atob = require('atob');

module.exports = {
	extractTar,
	packTar
};


function extractTar(base64, basePath) {
	let bin = atob(base64);
	//BEGIN TMP STUFF (NEEDS CLEANING)
	//TODO: Clean this, make it work with given info
	//Consult w/ Marcus Thurs
	let configPath = path.join(__dirname, '../res/BrokerAdd');
	let tmp = require('tmp');

	tmp.dir(async function _tempFileCreated(err, tempPath, cleanupCallback) {
		if (err) throw err;
		let cachePath = path.join(tempPath, 'cache');

		let xgraphArgv = [
			'--cwd', configPath, '--cache', cachePath
		].concat(argv.slice(3));
		if (xgraphArgv.indexOf('--path') == -1 && fs.existsSync(xgraphArgv[4]))
			xgraphArgv.splice(4, 0, '--path');
		if (xgraphArgv.indexOf('--host') == -1) xgraphArgv.push('--host', 'localhost');
		if (xgraphArgv.indexOf('--port') == -1) xgraphArgv.push('--port', '27000');
		if (xgraphArgv.indexOf('--source') == -1)
			xgraphArgv.push('--source', 'mb://modulebroker.xgraphdev.com');

		let system = await xgraph.execute(xgraphArgv);
		system.on('exit', (evt) => {
			log.i('system finished code', evt.exitCode);
			cleanUp();
		});


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
	//END TMP STUFF
	fs.createReadStream(`${name}.tar`).pipe(tar.extract(dest));
	return;
}

function packTar(basePath) {
	let pack = tar.pack(basePath, {
		entries: [`${loc}.${type}`]
	});
	pack.pipe(fs.createWriteStream(`${loc}.tar`));
	const base64 = 'hjfincveiknjsdeljkn';
	return base64;
}