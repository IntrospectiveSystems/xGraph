const Path = require('path');
const SemVer = require('./SemVer.js');
const fs = require('fs');
const jszip = require('jszip');
const ver130 = new SemVer('1.3');

//This node module provides all the interface capabilities to an xgraph cache directory.

module.exports = class CacheInterface {
	constructor(__options) {
		this.__options = __options;
	}

	get ApexIndex() {
		return this._apexIndex;
	}

	set ApexIndex(val) {
		this._apexIndex = val;
	}

	get EntIndex() {
		return this._entIndex;
	}

	set EntIndex(val) {
		this._entIndex = val;
	}

	//retrieve a module from the cache
	getModule(moduleType, fun = _ => _) {
		let __options = this.__options;
		let cachedMod;

		if (this._version < ver130) {
			cachedMod = Path.join(__options.path, moduleType, 'Module.zip');
		} else {
			cachedMod = Path.join(__options.path, 'System', moduleType, 'Module.zip');
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
				err = `Module ${cachedMod} does not exist in the cache`;
				log.e(err);
				fun(err);
				return;
			}
		});
	}

	//adds a module to the cache
	addModule(moduleType, moduleZip, fun = _ => _) {
		let __options = this.__options;
		let cachedMod;

		if (this._version < ver130) {
			cachedMod = Path.join(__options.path, moduleType);
		} else {
			cachedMod = Path.join(__options.path, 'System', moduleType);
		}

		try { fs.mkdirSync(cachedMod); } catch (e) { log.v(`${cachedMod} path already exists`); }

		cachedMod = Path.join(cachedMod, 'Module.zip');

		fs.writeFile(cachedMod, moduleZip, (err) => {
			fun(err, cachedMod);
		});
	}

	//return the json of pars related to a single entity based on it's pid 
	getEntityPar(pid, fun = _ => _) {

		let apx = this._entIndex[pid];
		let moduleType = this._apexIndex[apx];

		let __options = this.__options;
		let path;

		if (this._version < ver130) {
			path = Path.join(__options.path, moduleType, apx, `${pid}.json`);
		} else {
			path = Path.join(__options.path, 'System', moduleType, apx, `${pid}.json`);
		}

		fs.readFile(path, fun);
	}

	//delete an entity from the cache
	async deleteEntity(pid, fun = _ => _) {
		let apx = this._entIndex[pid];
		let moduleType = this._apexIndex[apx];
		let __options = this.__options;
		let apxpath;

		if (this._version < ver130) {
			apxpath = Path.join(__options.path, moduleType, apx);
		} else {
			apxpath = Path.join(__options.path, 'System', moduleType, apx);
		}

		let rmList = [];
		//we first check to see if it's an apex
		//if so we will read the directory that is the instance of
		//the module and then delete all of the entity files found therein.
		if (apx == pid) {
			let files;
			try { files = fs.readdirSync(apxpath); } catch (e) {
				log.w(e);
				return fun(null, [pid]);
			}
			for (let i = 0; i < files.length; i++) {
				rmList.push(files[i].split('.')[0]);
			}
			await remDir(apxpath);
		} else {
			rmList.push(pid);
			let path = apxpath + '/' + pid + '.json';
			fs.unlinkSync(path);
		}
		return fun(null, rmList);

		/**
		 * Recursive directory deletion
 		* @param {string} path the directory to be recursively removed
		 */
		function remDir(path) {
			return (new Promise(async (resolve, reject) => {
				if (fs.existsSync(path)) {
					let files = fs.readdirSync(path);
					let promiseArray = [];

					for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
						promiseArray.push(new Promise(async (resolve2, reject2) => {
							let curPath = path + '/' + files[fileIndex];
							if (fs.lstatSync(curPath).isDirectory()) {
								// recurse
								await remDir(curPath);
								resove2();
							} else {
								// delete file
								log.v('Removing Entity ', files[fileIndex].split('.')[0]);
								fs.unlinkSync(curPath);
								resolve2();
							}
						}));
					}
					//make sure all the sub files and directories have been removed;
					await Promise.all(promiseArray);
					log.v('Removing Module Directory ', path);
					fs.rmdirSync(path);
					resolve();
				} else {
					log.v('trying to remove nonexistant path ', path);
					resolve();
				}
			}));
		}
	}

	//save an entity by providing the pars json
	saveEntityPar(parObject, fun = _ => _) {
		let moduleType = this._apexIndex[parObject.Apex];
		let __options = this.__options;
		let path;

		if (this._version < ver130) {
			path = Path.join(__options.path, moduleType, parObject.Apex);
		} else {
			path = Path.join(__options.path, 'System', moduleType, parObject.Apex);
		}

		try { fs.mkdirSync(path); } catch (e) {}

		path = Path.join(path, `${parObject.Pid}.json`);

		fs.writeFile(path, JSON.stringify(parObject, null, 2), (err) => {
			this._entIndex[parObject.Pid] = parObject.Apex;
			fun(err, parObject.Pid);
		});
	}

	//load in a cache directory and return the Apex Index, Start, Setup and Stop dictionaries.
	async loadCache() {
		let __options = this.__options;
		let that = this;
		let manifestPath = Path.join(__options.path, '.cache');
		let setup = {}, start = {}, stop = {}, apexIndex = {}, entIndex = {};
		let manifest = await new Promise(resolve => {
			fs.lstat(manifestPath, (err, stat) => {
				if (!err && stat.isFile()) {
					resolve(JSON.parse(fs.readFileSync(manifestPath)));
				} else {
					resolve({ version: '1.2.1' });
				}
			});
		});
		let version = this._version = new SemVer(manifest.version);

		let modulesDirectory;
		if (version < new SemVer('1.3')) {
			modulesDirectory = Path.join(__options.path, '');
		} else {
			modulesDirectory = Path.join(__options.path, 'System');
		}

		var folders = fs.readdirSync(modulesDirectory);


		for (var ifold = 0; ifold < folders.length; ifold++) {
			let folder = folders[ifold];
			let path = Path.join(modulesDirectory, folder, 'Module.zip');
			if (!fs.existsSync(path))
				continue;

			parseMod(folder);

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

						for (let filename of fs.readdirSync(path)) {
							entIndex[Path.parse(filename).name] = file;
						}

						if ('$Setup' in instJson)
							setup[file] = instJson.$Setup;
						if ('$Start' in instJson)
							start[file] = instJson.$Start;
						if ('$Stop' in instJson)
							stop[file] = instJson.$Stop;

					}
				}
			}
		}

		log.v('ApexIndex', JSON.stringify(apexIndex, null, 2));
		log.v('EntIndex', JSON.stringify(entIndex, null, 2));
		log.v('Setup', JSON.stringify(setup, null, 2));
		log.v('Start', JSON.stringify(start, null, 2));
		log.v('Stop', JSON.stringify(stop, null, 2));

		this._entIndex = entIndex;
		this._apexIndex = apexIndex;

		return { apexIndex, setup, start, stop };
	}

	loadDependency(moduleType, moduleName) {
		let __options = this.__options;
		let version = this._version;
		let that = this, nodeModulesPath;
		if (version < new SemVer('1.3')) {
			nodeModulesPath = Path.join(__options.path, moduleType, 'node_modules');
		} else {
			nodeModulesPath = Path.join(__options.path, 'Lib', moduleType, 'node_modules');
		}

		try {
			return require(moduleName);
		} catch (e) {
			try {
				return require(Path.join(nodeModulesPath, moduleName));
			} catch (e) {
				log.e(`error loading ${moduleName}`);
				log.e(e);
				process.exit(1);
			}
		}
	}

};
