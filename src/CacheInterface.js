const Path = require('path');
const SemVer = require('./SemVer.js');
const fs = require('fs');

module.exports = class CacheInterface {
	constructor(__options) {
		this.__options = __options;
		// this.loadCache();
	}
	
	getEntityContext(apx, pid, fun = _ => _) {
		let imp;
		let par;
		let ent;

		// Check to see if pid is also an apex entity in this system
		// if not then we assume that the pid is an entity inside of the sending Module
		if (pid in ApexIndex) {
			apx = pid;
		}

		let folder = ApexIndex[apx];
		let path = __options.cache + '/' + folder + '/' + apx + '/' + pid + '.json';
		fs.readFile(path, function (err, data) {
			if (err) {
				log.e('<' + path + '> unavailable');
				fun('Unavailable');
				return;
			}
			let par = JSON.parse(data.toString());
			let impkey = folder + '/' + par.Entity;
			let imp;
			if (impkey in ImpCache) {
				BuildEnt();
				return;
			}

			GetModule(folder, async function (err, mod) {
				if (err) {
					log.e('Module <' + folder + '> not available');
					fun('Module not available');
					return;
				}

				if (!(par.Entity in mod.files)) {
					log.e('<' + par.Entity + '> not in module <' + folder + '>');
					fun('Null entity');
					return;
				}

				let entString = await new Promise(async (res, rej) => {
					mod.file(par.Entity).async("string").then((string) => res(string))
				});

				log.v(`Spinning up entity ${folder}-${par.Entity.split('.')[0]}`);
				ImpCache[impkey] = indirectEvalImp(entString);
				BuildEnt();
			});

			function BuildEnt() {
				// TODO: rethink the whole process of having to call out a setup and start
				EntCache[pid] = new Entity(Nxs, ImpCache[impkey], par);
				fun(null, EntCache[pid]);
			}
		});
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
		let version = new SemVer(manifest.version);

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