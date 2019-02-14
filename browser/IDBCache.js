const path = require('path');
const SemVer = require('../lib/SemVer.js');
// const fs = require('fs');
const jszip = require('jszip');
const version = '0.0.1';
const ver130 = new SemVer(version);
const dotCache = {version};
const Uuid = require('uuid/v4');
const {openDb} = require('idb');
const {createLogger} = require('../lib/Logger.js');
const cacheManifestPath = '.cache.json';
// const { spawn } = require('child_process');
//This node module provides all the interface capabilities to an xgraph cache directory.




module.exports = class IDBCache {
	/**
	 *Creates an instance of CacheInterface.
	 * @param {object} __options
	 * @param {string} __options.path the root of cache. this folder will be the one with a .cache inside it.
	 * @param {string=} __options.log logger object, needs methods: d, v, i, w, and e
	 */
	constructor(__options) {
		this._startup = (async function() {
			this.__options = __options;

			if('log' in this.__options)
				this.log = this.__options.log;
			else this.log = createLogger();

			this._db = await openDb(__options.path, 2, db => {
				db.createObjectStore('fs');
			});

			let that = this;
			
			this.idb = {
				async exists(key) {
					const db = that._db;
					return (await db.transaction('fs').objectStore('fs').get(key)) ? true : false;
				},
				async get(key) {
					const db = that._db;
					return await db.transaction('fs').objectStore('fs').get(key);
				},
				async set(key, val) {
					const db = that._db;
					const tx = db.transaction('fs', 'readwrite');
					tx.objectStore('fs').put(val, key);
					return tx.complete;
				},
				async delete(key) {
					const db = that._db;
					const tx = db.transaction('fs', 'readwrite');
					tx.objectStore('fs').delete(key);
					return tx.complete;
				},
				async clear() {
					const db = that._db;
					const tx = db.transaction('fs', 'readwrite');
					tx.objectStore('fs').clear();
					return tx.complete;
				},
				async keys() {
					const db = that._db;
					return db.transaction('fs').objectStore('fs').getAllKeys();
				},
			};

			this.modCache = {};

			this.initDirectories();
		}).call(this);
	}

	get startup() {
		return this._startup;
	}

	get EntIndex() {
		return this._entIndex;
	}

	set EntIndex(val) {
		this._entIndex = val;
	}

	/**
	 * generate a 32 digit hex number
	 */
	genPid() {
		let str = Uuid();
		let pid = str.replace(/-/g, '').toUpperCase();
		return pid;
	}

	async initDirectories() {
		if (!await this.idb.exists(cacheManifestPath)) {
			await this.idb.set(cacheManifestPath, JSON.stringify(dotCache));
			this._wroteManifest = true;
		} else this._wroteManifest = false
	}

	get wroteManifest() {
		return this._wroteManifest;
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
	async addModule(moduleType, moduleZip) {
		await this.idb.set(moduleType, moduleZip);
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
		let manifestPath = path.join(__options.path, 'cache.json');
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



	/**
	 * Generate array of entities from module
	 * Module must be in cache
	 *
	 * @param {string} pidapx 		The first parameter is the pid assigned to the Apex
	 * @param {object} inst
	 * @param {string} inst.Module	The module name in dot notation
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
			// TODO create real errors in error custom errors class
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

		log.v('Entity Pars to save:', ents);

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
