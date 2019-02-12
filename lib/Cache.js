const Path = require('path');
const SemVer = require('./SemVer.js');
const fs = require('fs');
const jszip = require('jszip');
const ver130 = new SemVer('1.3');
const dotCache = { version: '1.3.0' };
const Uuid = require('uuid/v4');
const { spawn } = require('child_process');
//This node module provides all the interface capabilities to an xgraph cache directory.

module.exports = class CacheInterface {
	/**
	 *Creates an instance of CacheInterface.
	 * @param {object} __options
	 * @param {string} __options.path the root of cache. this folder will be the one with a .cache inside it.
	 * @param {string=} __options.log logger object, needs methods: d, v, i, w, and e
	 */
	constructor(__options) {
		this.__options = __options;
		let backupLog = {
			d: _ => _, v: _ => _, i: _ => _, w: _ => _, e: _ => _
		};
		this.log = {
			v: (..._) => {
				(__options.log || backupLog).v('[CACHE]', ..._);
			},
			d: (..._) => {
				(__options.log || backupLog).d('[CACHE]', ..._);
			},
			w: (..._) => {
				(__options.log || backupLog).w('[CACHE]', ..._);
			},
			e: (..._) => {
				(__options.log || backupLog).e('[CACHE]', ..._);
			},
			i: (..._) => {
				(__options.log || backupLog).i('[CACHE]', ..._);
			}
		};

		this.modCache = {};

		this.initDirectories();
	}


	get EntIndex() {
		return this._entIndex;
	}

	set EntIndex(val) {
		this._entIndex = val;
	}

	/**
	 * Recursive directory deletion
	 * Used for cache cleanup
	 * @param {string} path the directory to be recursively removed
	 */
	remDir(path) {
		let files = [];
		if (fs.existsSync(path)) {
			files = fs.readdirSync(path);
			files.forEach((file, _index) => {
				let curPath = path + '/' + file;
				if (fs.lstatSync(curPath).isDirectory()) {
					// recurse
					this.remDir(curPath);
				} else {
					// delete file
					fs.unlinkSync(curPath);
				}
			});
			fs.rmdirSync(path);
		}
	}

	/**
	 * generate a 32 digit hex number
	 */
	genPid() {
		let str = Uuid();
		let pid = str.replace(/-/g, '').toUpperCase();
		return pid;
	}

	initDirectories() {
		let __options = this.__options;
		let log = this.log;
		let packageString = JSON.stringify({ dependencies: {} }, null, 2);
		//write the compiled package.json to disk
		try { fs.mkdirSync(__options.path); } catch (e) {
			if (e.code !== 'EEXIST') log.w(e);
		}
		try { fs.mkdirSync(Path.join(Path.resolve(__options.path), 'System')); } catch (e) {
			if (e.code !== 'EEXIST') log.w(e);
		}
		try { fs.mkdirSync(Path.join(Path.resolve(__options.path), 'Lib')); } catch (e) {
			if (e.code !== 'EEXIST') log.w(e);
		}

		let packagePath = Path.join(Path.resolve(__options.path), 'package.json');
		if (!fs.existsSync(packagePath)) fs.writeFileSync(packagePath, packageString);
		let cacheManifestPath = Path.join(Path.resolve(__options.path), 'cache.json');
		if (!fs.existsSync(cacheManifestPath)) {
			fs.writeFileSync(cacheManifestPath, JSON.stringify({
				version: '1.3.0'
			}, '\t', 1));
		}
	}

	clean() {
		this.delete();
		this.initDirectories();
	}

	delete() {
		let __options = this.__options;
		if (fs.existsSync(__options.path)) {
			// log.i(__options.path);
			this.remDir(__options.path);
			// log.i(this);
			// log.i('woo');
		}
	}

	//retrieve a module from the cache
	getModule(moduleType, fun = _ => _) {
		let __options = this.__options;
		let log = this.log;
		let cachedMod;

		if (this._version < ver130) {
			cachedMod = Path.join(__options.path, moduleType, 'Module.zip');
		} else {
			cachedMod = Path.join(__options.path, 'System', moduleType, 'Module.zip');
		}

		log.v(cachedMod);
		log.v(fs.existsSync(cachedMod));

		fs.lstat(cachedMod, function (err, stat) {
			if (err) {
				log.e(`Error retreiving ${cachedMod} from cache`);
				log.e(err);
				fun(err);
			}
			if (stat) {
				if (!stat.isDirectory()) {
					fs.readFile(cachedMod, async function (err, data) {
						if (err) {
							fun(err);
							return;
						}
						fun(null, await new Promise(async (res, _rej) => {
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
	async addModule(moduleType, moduleZip64) {
		return new Promise(async (resolveModule, rejectModule) => {
			let log = this.log;
			let moduleZip = Buffer.from(moduleZip64, 'base64');
			let __options = this.__options;
			let cachedMod, libdir;

			if (this._version < ver130) {
				cachedMod = Path.join(__options.path, moduleType);
				libdir = Path.join(__options.path, moduleType);
			} else {
				cachedMod = Path.join(__options.path, 'System', moduleType);
				libdir = Path.join(__options.path, 'Lib', moduleType);
			}

			try { fs.mkdirSync(cachedMod); } catch (e) { log.v(`${cachedMod} path already exists`); }
			try { fs.mkdirSync(libdir); } catch (e) { log.v(`${cachedMod} path already exists`); }

			cachedMod = Path.join(cachedMod, 'Module.zip');

			this.modCache[moduleType] = moduleZip;

			await new Promise(res => {
				fs.writeFile(cachedMod, moduleZip, (err) => {
					res(err);
				});
			});

			//install npm dependencies
			let zipObj = new jszip();
			await zipObj.loadAsync(moduleZip);

			if ('package.json' in zipObj.files) {
				let packageString;
				packageString = await zipObj.file('package.json').async('string');
				let packagePath = Path.join(libdir, 'package.json');
				log.v(`Installing dependencies for ${moduleType}`);

				await new Promise((resolve, reject) => {
					fs.writeFile(packagePath, packageString, err => {
						if (err) return reject(err);
						resolve();
					});
				});

				await new Promise((resolve, reject) => {
					fs.writeFile(packagePath, packageString, err => {
						if (err) return reject(err);
						resolve();
					});
				});

				try {
					await new Promise((resolve, reject) => {
						//call npm install on a childprocess of node
						let npmCommand = (process.platform === 'win32' ? 'npm.cmd' : 'npm');


						let npmInstallProcess = spawn(npmCommand, [
							'install'
						], {
							cwd: Path.resolve(libdir)
						});



						// npmInstallProcess.stdout.on('data', process.stdout.write);
						// npmInstallProcess.stderr.on('data', process.stderr.write);

						npmInstallProcess.stdout.on('error', e => log.v('stdout/err: ' + e));
						npmInstallProcess.stderr.on('error', e => log.v('stderr/err: ' + e));

						npmInstallProcess.on('err', function (err) {
							log.e('Failed to start child process.');
							log.e('err:' + err);
							reject(err);
						});

						npmInstallProcess.on('exit', function (code) {
							if (code == 0) {
								// log.v(`${moduleType}: dependencies installed correctly`);
							} else {
								log.e(`${moduleType}: npm process exited with code: ${code}`);
								process.exit(1);
								reject();
							}
							fs.unlinkSync(packagePath);
							resolve();
						});
					});


				} catch (e) {
					log.e(e);
					log.e(e.stack);
					rejectModule(e);
				}

				//write the compiled package.json to disk
				fs.writeFileSync(Path.join(libdir, 'package.json'), packageString);
			} else {
				log.v(`no dependencies to install for ${moduleType}`);
				// resolve();
			}
			resolveModule(moduleType);
		});
	}

	//return the json of pars related to a single entity based on it's pid 
	getEntityPar(pid, fun = _ => _) {
		// let log = this.log;
		let log = this.log;
		if (!(pid in this._entIndex)) {
			log.w('returning unknown pid', pid);
			log.w(this._entIndex);
			return fun(new Error('E_UNKNOWN_PID'), { moduleType: 'Unknown' });
		}
		let apx = this._entIndex[pid];

		if (!(apx in this._apexIndex)) {
			log.w('returning unknown apex pid');
			return fun(new Error('E_UNKNOWN_APEX_PID'), { moduleType: 'Unknown' });
		}
		let moduleType = this._apexIndex[apx];
		let __options = this.__options;
		let path;
		if (this._version < ver130) {
			path = Path.join(__options.path, moduleType, apx, `${pid}.json`);
		} else {
			path = Path.join(__options.path, 'System', moduleType, apx, `${pid}.json`);
		}

		fs.readFile(path, (err, data) => {
			if (err) {
				log.w(err);
				return fun(err, { moduleType });
			} else return fun(err, data);
		});
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
			return (new Promise(async (resolve, _reject) => {
				if (fs.existsSync(path)) {
					let files = fs.readdirSync(path);
					let promiseArray = [];

					for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
						promiseArray.push(new Promise(async (resolve2, _reject2) => {
							let curPath = path + '/' + files[fileIndex];
							if (fs.lstatSync(curPath).isDirectory()) {
								// recurse
								await remDir(curPath);
								resolve2();
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

		try { fs.mkdirSync(path); } catch (e) {
			if (e.code !== 'EEXIST') log.w(e);
		}

		path = Path.join(path, `${parObject.Pid}.json`);

		fs.writeFile(path, JSON.stringify(parObject, null, 2), (err) => {
			this._entIndex[parObject.Pid] = parObject.Apex;
			fun(err, parObject.Pid);
		});
	}

	//load in a cache directory and return the Apex Index, Start, Setup and Stop dictionaries.
	async loadCache() {
		let log = this.log;
		let __options = this.__options;
		let manifestPath = Path.join(__options.path, 'cache.json');
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

		let folders = fs.readdirSync(modulesDirectory);


		for (let ifold = 0; ifold < folders.length; ifold++) {
			let folder = folders[ifold];
			let path = Path.join(modulesDirectory, folder, 'Module.zip');
			if (!fs.existsSync(path))
				continue;

			parseMod(folder);

		}
		function parseMod(folder) {
			let dir = Path.join(modulesDirectory, folder);
			let instancefiles = fs.readdirSync(dir);
			for (let ifile = 0; ifile < instancefiles.length; ifile++) {
				let file = instancefiles[ifile];
				//check that it's an instance of the module
				if (file.length !== 32)
					continue;

				let path = Path.join(dir, file);
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

		log.v('EntIndex', JSON.stringify(entIndex, null, 2));
		log.v('Setup', JSON.stringify(setup, null, 2));
		log.v('Start', JSON.stringify(start, null, 2));
		log.v('Stop', JSON.stringify(stop, null, 2));

		this._entIndex = entIndex;
		this._apexIndex = apexIndex;

		return { apexIndex, setup, start, stop };
	}

	loadDependency(moduleType, moduleName) {
		let log = this.log;
		let __options = this.__options;
		let version = this._version;
		let nodeModulesPath;
		if (version < ver130) {
			nodeModulesPath = Path.join(__options.path, moduleType, 'node_modules', moduleName);
		} else {
			nodeModulesPath = Path.join(__options.path, 'Lib', moduleType, 'node_modules', moduleName);
		}
		try {
			delete require.cache[nodeModulesPath];
			delete require.cache[moduleName];
		} catch (e) { log.w(e); }
		try {
			return require(nodeModulesPath);
		} catch (e) {
			try {
				return require(moduleName);
			} catch (e) {
				log.v(fs.existsSync(nodeModulesPath));
				log.v(moduleType, moduleName);
				log.v(nodeModulesPath.split(Path.sep).join('\n> '));
				log.e(`error loading ${moduleName}`);
				log.e(e);
				process.exit(1);
			}
		}
	}



	/**
	 * Generate array of entities from module
	 * Module must be in cache
	 *
	 * @param {string} pidapx 		The first parameter is the pid assigned to the Apex
	 * @param {object} inst
	 * @param {string} inst.Module	The module definition in dot notation
	 * @param {object} inst.Par		The par object that defines the par of the instance
	 * @param {boolean} saveRoot	Add the setup and start functions to the Root.Setup and start
	 */
	async createInstance(inst, pidapx = this.genPid()) {
		let log = this.log;
		let Local = {};
		let modnam = inst.Module;
		let mod;
		let ents = [];
		modnam = modnam.replace(/[/:]/g, '.');
		let zipmod = new jszip();
		log.v('createInstance', pidapx, JSON.stringify(inst, null, 2));

		function parseMacros(obj) {
			for (let key in obj) {
				if (typeof obj[key] == 'string') {
					if (obj[key].startsWith('#') && (obj[key].trim().split('\n').length == 1)) {

						let sym = obj[key].substr(1);
						if (sym in Local) obj[key] = Local[obj[key].substr(1)];
						else {
							log.e(`Local Symbol #${sym} is not defined`);
							throw new Error(`Local Symbol #${sym} is not defined`);
						}
					}
				}
				else if (typeof obj[key] == 'object') obj[key] = parseMacros(obj[key]);
			}
			return obj;
		}

		log.v('parseMacros', pidapx, JSON.stringify(inst, null, 2));

		//check if we have the module, put it in mod (jszip object)
		if (modnam in this.modCache) {
			//TODO Dont use then, use es8 async/await
			mod = await new Promise(async (res, _rej) => {
				zipmod.loadAsync(this.modCache[modnam]).then((zip) => {
					res(zip);
				});
			});
		} else {
			log.e('Module <' + modnam + '> not in ModCache');
			throw new Error('Module <' + modnam + '> not in ModCache');
		}

		// get the schema json from the zip
		let schema = await new Promise(async (res, rej) => {
			// log.w(mod.files);
			if ('schema.json' in mod.files) {
				mod.file('schema.json').async('string').then(function (schemaString) {
					res(JSON.parse(schemaString));
				});
			} else {
				log.e('Module <' + modnam + '> schema not in ModCache');
				process.exit(1);
				rej();
				// reject();
				return;
			}
		});

		let entkeys = Object.keys(schema);
		if (!('Apex' in schema)) {
			log.v('keys in schema.json');
			log.v(Object.keys(schema).join('\r\n'));
			throw new SyntaxError('Apex key not present in schema.json.');
		}

		//set Pids for each entity in the schema
		for (let j = 0; j < entkeys.length; j++) {
			let entkey = entkeys[j];
			if (entkey === 'Apex')
				Local[entkey] = pidapx;
			else
				Local[entkey] = this.genPid();
		}

		for (let entIndex in schema) {
			// log.w(entIndex);
			let ent = schema[entIndex];
			if (typeof ent !== 'object') throw new Error('E_INVALID_SCHEMA', { Module: modnam });
			if (entIndex === 'Apex') {
				for (let key in inst.Par) {
					ent[key] = inst.Par[key];
				}
			}
			ent.Pid = Local[entIndex];
			ent.Apex = pidapx;
			ent.Module = modnam;
			ent = parseMacros(ent);
			ents.push(ent);
		}

		log.v(`Entity Pars to save: \n${JSON.stringify(ents, null, 2)}`);

		for (let entity of ents) {

			let path = Path.join(this.__options.path, 'System', modnam, entity.Apex);
			try { fs.mkdirSync(path); } catch (e) { ''; }
			path = Path.join(path, entity.Pid + '.json');

			await new Promise(res => {
				fs.writeFile(path, JSON.stringify(entity, null, 2), _ => {
					res();
				});
			});
		}
		return ents;
	}
};
