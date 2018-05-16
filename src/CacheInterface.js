const Path = require('path');
const SemVer = require('./SemVer.js');
const fs = require('fs');
const jszip = require('jszip');
const ver130 = new SemVer('1.3');

module.exports = class CacheInterface {
	constructor(__options) {
		this.__options = __options;
		// this.loadCache();
	}

	getModule(moduleType, fun = _ => _) {
		let __options = this.__options;
		let that = this;

		//get the module from cache
		let cachedMod;
		
		if(this._version < ver130) {
			log.d('old');
			cachedMod = Path.join(__options.path, moduleType, 'Module.zip');
		}else {
			log.d('new');
			cachedMod = Path.join(__options.path, 'System', moduleType, 'Module.zip');
			log.d(cachedMod);
		}

		fs.lstat(cachedMod, function (err, stat) {
			if (err) {
				log.e(`Error retreiving ${cachedMod} from cache`);
				fun(err);
			}
			if (stat) {
				if (!stat.isDirectory()) {
					fs.readFile(cachedMod, async function (err, data) {
						if (err) {
							fun(err);
							return;
						}
						fun(null, await new Promise(async (res, rej) => {
							let zip = new jszip();
							zip.loadAsync(data).then((mod) => res(mod));
						}));
						return;
					});
				}
			} else {
				err = `Module ${cachedMod} does not exist in the cache`
				log.e(err);
				fun(err);
				return;
			}
		});
	}
	
	getEntityPar(moduleType, apx, pid, fun = _ => _) {
		log.d('getEntityPar', moduleType, apx, pid);
		let __options = this.__options;
		let that = this;
		let path;
		// log.d(this._version);

		if(this._version < ver130) {
			log.d('old');
			path = Path.join(__options.path, moduleType, apx, `${pid}.json`);
		}else {
			log.d('new');
			path = Path.join(__options.path, 'System', moduleType, apx, `${pid}.json`);
			log.d(path);
		}

		fs.readFile(path, fun);
	}

	async loadCache() {
		let __options = this.__options;
		let that = this;
		let manifestPath = Path.join(__options.path, '.cache');
		let setup = {}, start = {}, stop = {}, apexIndex = {};
		let manifest = await new Promise(resolve => {
			fs.lstat(manifestPath, (err, stat) => {
				if(!err && stat.isFile()) {
					resolve(JSON.parse(fs.readFileSync(manifestPath)));
				} else {
					resolve({version: '1.2.1'});
				}
			});
		});
		let version = this._version = new SemVer(manifest.version);

		let modulesDirectory;
		if(version < new SemVer('1.3')) {
			modulesDirectory = Path.join(__options.path, '');
		}else {
			modulesDirectory = Path.join(__options.path, 'System');
		}

		log.d(modulesDirectory);
		// await new Promise(res => fs.readFile(Path.__options``)
		// let modulesFolder = Path.join(__options.path, '');
		var folders = fs.readdirSync(modulesDirectory);


		for (var ifold = 0; ifold < folders.length; ifold++) {
			let folder = folders[ifold];
			log.d(folder);
			let path = Path.join(modulesDirectory, folder, 'Module.zip');
			if (!fs.existsSync(path))
				continue;

			parseMod(folder)

			function parseMod(folder) {
				let dir = Path.join(modulesDirectory, folder);
				var instancefiles = fs.readdirSync(dir);
				for (var ifile = 0; ifile < instancefiles.length; ifile++) {
					var file = instancefiles[ifile];

					//check that it's an instance of the module
					if (file.length !== 32)
						continue;

					var path = Path.join(dir, file);
					if (fs.lstatSync(path).isDirectory()) {
						apexIndex[file] = folder;
						let instJson = JSON.parse(fs.readFileSync(Path.join(path, `${file}.json`)));

						if ('$Setup' in instJson)
							setup[file] = instJson.$Setup;
						if ('$Start' in instJson)
							start[file] = instJson.$Start;
						if ('$Stop' in instJson)
							stop[file] = instJson.$Stop;

						// log.d(file);
					}
				}
			}
		}

		log.v('ApexIndex', JSON.stringify(apexIndex, null, 2));
		log.v('Setup', JSON.stringify(setup, null, 2));
		log.v('Start', JSON.stringify(start, null, 2));
		log.v('Stop', JSON.stringify(stop, null, 2));

		return {apexIndex, setup, start, stop};
	}



}