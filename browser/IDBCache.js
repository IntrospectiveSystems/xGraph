const path = require('path');
const SemVer = require('../lib/SemVer.js');
// const fs = require('fs');
const jszip = require('jszip');
const version = '0.0.1';
const ver130 = new SemVer(version);
const dotCache = {version};
const Uuid = require('uuid/v4');
const {openDb, deleteDb} = require('idb');
const {createLogger} = require('../lib/Logger.js');
// const { spawn } = require('child_process');
//This node module provides all the interface capabilities to an xgraph cache directory.
class Database {
	constructor(dbName) {
		this._dbName = dbName;
		this._tables = [];
	}

	addTable(table) {
		this._tables.push(table);
	}

	async delete() {
		await deleteDb(this._dbName);
	}

	async create() {
		this._db = await openDb(this._dbName, 2, db => {
			for(let table of this._tables) {
				db.createObjectStore(table.name);
			}
		});

		for(let table of this._tables) {
			table.link(this._db);
		}
	}
}

class Table {
	constructor (tableName) {
		this._name = tableName;
	}
	get name () {
		return this._name;
	}
	link (db) {
		this._db = db;
	}
	async exists(key) {
		const db = this._db;
		return !!(await db.transaction(this._name).objectStore(this._name).get(key));
	}
	async get(key) {
		const db = this._db;
		return await db.transaction(this._name).objectStore(this._name).get(key);
	}
	async set(key, val) {
		const db = this._db;
		const tx = db.transaction(this._name, 'readwrite');
		tx.objectStore(this._name).put(val, key);
		return tx.complete;
	}
	async delete(key) {
		const db = this._db;
		const tx = db.transaction(this._name, 'readwrite');
		tx.objectStore(this._name).delete(key);
		return tx.complete;
	}
	async clear() {
		const db = this._db;
		const tx = db.transaction(this._name, 'readwrite');
		tx.objectStore(this._name).clear();
		return tx.complete;
	}
	async keys() {
		const db = this._db;
		return db.transaction(this._name).objectStore(this._name).getAllKeys();
	}
}


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
			else
				this.log = createLogger(__options);

			this.db = new Database(__options.path);
			this.modules = new Table('modules');
			this.instances = new Table('instances');
			this.metadata = new Table('metadata');
			this.db.addTable(this.instances);
			this.db.addTable(this.modules);
			this.db.addTable(this.metadata);
			await this.db.create();

			await this.initDirectories();
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
		if (!await this.metadata.exists('version')) {
			await this.metadata.set('version', version);
			await this.metadata.set('created', new Date().toString());
			this._wroteManifest = true;
		} else this._wroteManifest = false;
	}

	get wroteManifest() {
		return this._wroteManifest;
	}

	clean() {
		this.delete();
		this.initDirectories();
	}

	async delete() {
		await this.db.delete();
		await this.db.create();
	}

	//retrieve a module from the cache
	async getModule(moduleType, fun = _ => _) {
		let __options = this.__options;
		let log = this.log;

		let data = await this.modules.get(moduleType);
		
		let zip = new jszip();
		await zip.loadAsync(data, {
			base64: true
		});
		fun(null, zip);
		return zip;
	}

	//adds a module to the cache
	async addModule(moduleType, moduleZip) {
		this.log.v('ADD MODULE', moduleType);
		await this.modules.set(moduleType, moduleZip);
	}

	//return the json of pars related to a single entity based on it's pid 
	async getEntityPar(pid, fun = _ => _) {
		// let log = this.log;
		const log = this.log;
		// debugger;
		if (!(pid in this._entIndex)) {
			log.w('returning unknown pid', pid);
			log.w(this._entIndex);
			return fun(new Error('E_UNKNOWN_PID'), { moduleType: 'Unknown' });
		}
		const apx = this._entIndex[pid];

		if (!(apx in this._apexIndex)) {
			log.w('returning unknown apex pid');
			return fun(new Error('E_UNKNOWN_APEX_PID'), { moduleType: 'Unknown' });
		}
		const moduleType = this._apexIndex[apx];
		const key = `${moduleType}:${apx}:${pid}`;

		let par = (await this.instances.get(key));

		log.d(par);
		fun(null, par);
		return par;

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
		const setup = {}, start = {}, stop = {}, apexIndex = {}, entIndex = {};
		const instances = await this.instances.keys();

		for(const info of instances) {
			const [module, apex, pid] = info.split(':');
			const par = JSON.parse(await this.instances.get(info));
			entIndex[pid] = apex;
			apexIndex[apex] = module;

			if ('$Setup' in par)
				setup[pid] = par.$Setup;
			if ('$Start' in par)
				start[pid] = par.$Start;
			if ('$Stop' in par)
				stop[pid] = par.$Stop;
		}

		// debugger;

		// log.v('EntIndex', JSON.stringify(entIndex, null, 2));
		// log.v('Setup', JSON.stringify(setup, null, 2));
		// log.v('Start', JSON.stringify(start, null, 2));
		// log.v('Stop', JSON.stringify(stop, null, 2));

		this._entIndex = entIndex;
		this._apexIndex = apexIndex;

		return { apexIndex, setup, start, stop };
	}


	loadDependency(moduleType, _) {
		log.w(`<${moduleType}> require is not supported on the browser`)
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
		const log = this.log;
		const symbols = {};
		const ents = [];
		const name =  inst.Module.replace(/[/:]/g, '.');

		if (!await this.modules.exists(name))
			throw new Error('Module <' + name + '> not in ModCache');

		const mod = await jszip().loadAsync(await this.modules.get(name), {
			base64: true
		});

		log.v('createInstance', pidapx, JSON.stringify(inst, null, 2));

		if(!('schema.json' in mod.files))
			throw new Error(`no schema in <${name}>`);

		const schemaText = await mod.file('schema.json').async('string');
		const schema = JSON.parse(schemaText);

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
				symbols[entkey] = pidapx;
			else
				symbols[entkey] = this.genPid();
		}

		for (let entIndex in schema) {
			// log.w(entIndex);
			let ent = schema[entIndex];
			if (typeof ent !== 'object') throw new Error('E_INVALID_SCHEMA', { Module: name });
			if (entIndex === 'Apex') {
				for (let key in inst.Par) {
					ent[key] = inst.Par[key];
				}
			}
			ent.Pid = symbols[entIndex];
			ent.Apex = pidapx;
			ent.Module = name;
			ent = replaceSymbols(ent, symbols);
			ents.push(ent);
		}

		function replaceSymbols(obj, dict, regex = /^[$#]/) {
			return _.transform(obj, recurse);

			function recurse(res, val, key) {
				if(typeof val === 'object') {
					res[key] = _.transform(val, recurse);
					return;
				} else if(typeof val === 'string') {
					if(val.match(regex)) {
						res[key] = dict[val.substr(1)];
					} else res[key] = val;
				} else res[key] = val;
			}
		}

		log.v('Entity Pars to save:', ents);

		for (let entity of ents) {

			const key = `${name}:${entity.Apex}:${entity.Pid}`;
			// try { fs.mkdirSync(path); } catch (e) { ''; }
			// path = Path.join(path, entity.Pid + '.json');

			await this.instances.set(key, JSON.stringify(entity));
		}
		return ents;
	}
};
