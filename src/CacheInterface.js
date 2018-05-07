exports = class CacheInterface {
	constructor(__options) {
		this.__options = __options;
		this.loadCache();
	}

	loadCache() {
		var folders = fs.readdirSync(__options.path);
		

		for (var ifold = 0; ifold < folders.length; ifold++) {
			let folder = folders[ifold];
			let path = Path.join(__options.cache, folder, 'Module.zip');
			if (!fs.existsSync(path))
				continue;

			parseMod(folder)

			function parseMod(folder) {
				let dir = Path.join(__options.cache, folder);
				var instancefiles = fs.readdirSync(dir);
				for (var ifile = 0; ifile < instancefiles.length; ifile++) {
					var file = instancefiles[ifile];

					//check that it's an instance of the module
					if (file.length !== 32)
						continue;

					var path = Path.join(dir, file);
					if (fs.lstatSync(path).isDirectory()) {
						ApexIndex[file] = folder;
						let instJson = JSON.parse(fs.readFileSync(Path.join(path, `${file}.json`)));

						if ('$Setup' in instJson)
							Setup[file] = instJson.$Setup;
						if ('$Start' in instJson)
							Start[file] = instJson.$Start;
						if ('$Stop' in instJson)
							Stop[file] = instJson.$Stop;

						// log.d(file);
					}
				}
			}
		}

		log.v('ApexIndex', JSON.stringify(ApexIndex, null, 2));
		log.v('Setup', JSON.stringify(Setup, null, 2));
		log.v('Start', JSON.stringify(Start, null, 2));
	}



}