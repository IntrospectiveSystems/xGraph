#! /usr/bin/env node
// anything above this line is removed on npm run build.
// -:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-


process.on('unhandledRejection', (reason, _promise) => {
	process.stderr.write('\u001b[31m' + '------- [Unhandled Promise Rejection] -------' + '\u001b[39m\n');
	if('stack' in reason) process.stderr.write('\u001b[31m' + reason.stack + '\u001b[39m\n');
	else if ('message' in reason) process.stderr.write('\u001b[31m' + reason.message + '\u001b[39m\n');
	else process.stderr.write('\u001b[31m' + reason.toString() + '\u001b[39m\n');
	process.stderr.write('\u001b[31m' + '------- [/Unhandled Promise Rejection] ------' + '\u001b[39m\n');
	process.exit(1);
});


let cli = function (argv) {

	//just do a quick dumb check to see if we have node as a first argument
	let originalArgv = argv.slice(0);
	let originalCwd = process.cwd();

	if (argv[0].indexOf('node') > -1) {
		argv = argv.slice(1);
	} else {
		log.i('REAL COMMAND LINE ARGUMENTS DETECTED. ABORT. REPEAT,\r\n\t\tAB0RT\r\n\t\t\t\tM IS5  I ON.');
		log.i('---------------------------------------------------');
		log.i(argv.join('\n'));
		log.i('---------------------------------------------------');
		process.exit(1);
	}

	const { execSync } = require('child_process');
	const fs = require('fs');
	const path = require('path');
	let state = 'production';
	if (argv.length == 1) argv[1] = 'help';
	let args = argv.slice(1);
	let pathOverrides = {};
	let nodeVersion = '8.9.1';
	let CacheDir;
	const version = require('../package.json').version;
	const genesis = require('./Genesis.js');
	const nexus = require('./Nexus.js');
	const createLogger = require('./Logger.js');
	let flags = {};

	processSwitches();
	const log = {} //createLogger(Object.assign({verbose: true}));

	switch (args[0]) {
		case 'x':
		case '-x':
		case 'run':
		case '--execute':
		case 'execute': {
			execute();
			break;
		}

		case 'r':
		case '-r':
		case '--reset':
		case 'reset': {
			reset();
			break;
		}

		case 'c':
		case '-c':
		case '--compile':
		case 'compile': {
			compile();
			break;
		}

		case 'd':
		case '-d':
		case '--deploy':
		case 'deploy': {
			deploy();
			break;
		}

		case 'help':
		case 'h':
		case '-h':
		case '--help': {
			help();
			break;
		}

		case 'g':
		case '-g':
		case 'generate':
		case 'init': {
			generate(args.slice(1));
			break;
		}

		case '--version':
		case '-v': {
			log.i(version);
			break;
		}
		default: {
			log.i(`Unknown command <${argv[1]}>`);
			help();
			break;
		}
	}

	async function generate(args) {
		switch (args[0]) {
			case 'system':
			case 's': {
				let names = args.slice(1);
				if (names.length > 0) {
					log.i(`Generate new xGraph ${names.length > 1 ? 'systems' : 'system'} with ${
						names.length > 1 ? 'names' : 'name'}: ${args.slice(1)}`);
					initSystem(names);
				} else {
					log.e('No system name provided. \n'+
					'Cannot generate system without a system name: "xgraph generate system_name".');
				}
				break;
			}
			case 'module':
			case 'm': {
				let names = args.slice(1);
				if (names.length > 0) {
					log.i(`Generate new xGraph ${names.length > 1 ? 'modules' : 'module'} with ${
						names.length > 1 ? 'names' : 'name'}: ${args.slice(1)}`);
					initModule(names);
				} else {
					log.e('No module name provided.  \n'+
					'Cannot generate module without a module name: "xgraph generate module_name".');
				}
				break;
			}
			default: {
				log.e('Invalid option for the generate command.  \n'+
				'Try "xgraph generate module" or "xgraph generate system".');
			}
		}
	}

	function help() {

		let helpFile = path.join(__dirname, 'help.txt');

		let helpFileText = fs.readFileSync(helpFile);

		let helpText = `
		(function(){
			let text = \`${helpFileText}\`; 
			return text;
		})();
		`;

		let help = eval(helpText);

		log.i(help);
	}

	async function reset() {
		try {
			state = 'production';
			await genesis(Object.assign(Object.assign({ state }, flags), pathOverrides));
			let processPath = pathOverrides['cwd'] || path.resolve(`.${path.sep}`);
			// process.chdir(processPath);
			startNexusProcess();
		} catch (e) {
			log.e(e);
		}
	}

	async function deploy() {
		try {
			startNexusProcess();

		} catch (e) {
			log.e(e);
		}
	}

	async function execute() {
		try {
			state = 'development';
			await genesis(Object.assign(Object.assign({ state }, flags), pathOverrides));
			startNexusProcess();
		} catch (e) {
			log.e(e);
		}
	}

	async function compile() {
		try {
			state = 'production';
			// console.dir(pathOverrides);
			await genesis(Object.assign(Object.assign({ state }, flags), pathOverrides));
		} catch (e) {
			log.e(e);
		}
	}


	async function startNexusProcess() {
		//get the cache dir
		let cacheDir = pathOverrides['cache'];
		log.i(`Starting from ${cacheDir}`);

		// HACK: no idea whyt we're messing with this. remove it att some point and see what happens
		process.env.NODE_PATH = path.join(path.dirname(cacheDir), 'node_modules');

		//combine flags and path overrides to create the options object for nexus
		let system = new nexus(Object.assign(flags, pathOverrides));
		system.on('exit', _ => {
			// HACK: to restart systems
			// HACK: to restart systems
			if (_.exitCode == 72) {
				setTimeout(_ => {
					// process.chdir(originalCwd);
					system = null;
					cacheDir = null;
					cli(originalArgv);
				}, 0);
			}
		});

		try {
			await system.boot();
		} catch (e) {
			log.e(e);
			process.exit(1);
		}

	}

	function processSwitches() {
		let argIterator = (() => {
			let nextIndex = 0;
			return {
				next: () => {
					if (nextIndex < args.length) {
						let obj = {
							value: args[nextIndex],
							index: (nextIndex),
							done: false
						};
						nextIndex++;
						return obj;
					} else {
						return { done: true };
					}
				},
				delete: (count) => {
					args.splice(nextIndex - 1, count);
					nextIndex = nextIndex - count;
				}
			};
		})();

		let argumentObject = argIterator.next();

		while ('value' in argumentObject) {
			let argument = argumentObject.value;
			let i = argumentObject.index;

			if (typeof argument == 'undefined') {
				log.e('error parsing Switches');
				process.exit(1);
			}
			if (argument.startsWith('--')) {
				let key = args[i].slice(2);
				applySwitch(key, i);
			}

			argumentObject = argIterator.next();
		}

		// sanitize and default cwd
		if ('cwd' in pathOverrides && typeof pathOverrides.cwd === 'string') {
			pathOverrides['cwd'] = path.normalize(pathOverrides['cwd']);
		} else {
			pathOverrides['cwd'] = path.normalize(process.cwd());
		}

		pathOverrides.cwd = path.resolve(pathOverrides.cwd);
		if (!fs.existsSync(pathOverrides.cwd)) {
			log.e('--cwd ' + pathOverrides.cwd + ' does not exist.');
			process.exit(1);
		}

		// Directory is passed in Params.Cache or defaults to "cache" in the current working directory.
		pathOverrides['cache'] = pathOverrides['cache'] || path.resolve(pathOverrides.cwd, 'cache');

		if (!('cache' in pathOverrides))
			pathOverrides.cache = 'cache';

		if (!path.isAbsolute(pathOverrides.cache)) {
			pathOverrides.cache = path.resolve(pathOverrides.cwd, pathOverrides.cache);
		}

		function applySwitch(argumentString, i) {
			let numRemainingArgs = args.length - i - 1;

			if (numRemainingArgs >= 1) { // switch has another argument
				let nextArg = args[i + 1];
				if (!nextArg.startsWith('--')) {
					//if its just some more plain text, not another switch
					//we add it to path overrides
					pathOverrides[argumentString.toLowerCase()] = args[i + 1];
					argIterator.delete(2);
				} else {
					//otherwise, we add it to flags
					flags[argumentString.toLowerCase()] = true;
					argIterator.delete(1);
				}
			} else {
				//otherwise, we add it to flags
				flags[argumentString.toLowerCase()] = true;
				argIterator.delete(1);
			}
		}
	}










	// -------------------------------------------------------------
	//                       templating stuff
	// -------------------------------------------------------------

	function initSystem(names) {

		for (let index = 0; index < names.length; index++) {
			let name = names[index];
			let systemPath = createDirectories(name);
			createSystem(systemPath);
		}

		function createDirectories(name) {
			let regEx = new RegExp('(?:\\.\\/?\\/)|(?:\\.\\\\?\\\\)|\\\\?\\\\|\\/?\\/');
			let makeDirectories = name.split(regEx);
			let makePath = '';
			let thisDirectory = '';
			let systemPath;

			if (path.isAbsolute(name)) {
				if (name.charAt(0) != path.sep) {
					makePath = makeDirectories.shift();
				}
				systemPath = name;
			} else {
				let sysDir = pathOverrides['cwd'] || path.resolve('./');
				makePath = sysDir;
				systemPath = path.join(sysDir, name);
			}

			log.i('Generating system in directory: ', systemPath);

			for (let i = 0; i < makeDirectories.length; i++) {
				if (makeDirectories[i] && makeDirectories[i] != '') {
					thisDirectory = makeDirectories[i];
					makePath += path.sep + thisDirectory;
					makeDirectory(makePath);
				}
			}
			return systemPath;
		}

		function createSystem(systemPath) {
			const ConfigTemplate =
				{
					'Sources': {},
					'Modules': {
						'Deferred': []
					}
				};

			if (!fs.existsSync(path.join(systemPath, 'config.json'))) {
				try {
					fs.writeFileSync(path.join(systemPath, 'config.json'), 
						JSON.stringify(ConfigTemplate, null, '\t'));
					log.i('System generated at: ' + systemPath);
				} catch (e) {
					log.e(e);
				}
			} else {
				log.i(`No system generated. The system already exists: ${systemPath}`);
			}
		}
	}

	function initModule(names) {

		for (let index = 0; index < names.length; index++) {
			let name = names[index];
			let [module, modulePath] = createDirectories(name);
			createModule(module, modulePath);
		}
		
		function createDirectories(name) {
			let regEx = new RegExp('(?:\\.\\/?\\/)|(?:\\.\\\\?\\\\)|\\\\?\\\\|\\/?\\/');
			let modulePath;
			let makeDirectories = name.split(regEx);
			let makePath = '';
			let thisDirectory = '';

			if (path.isAbsolute(name)) {
				if (name.charAt(0) != path.sep) {
					makePath = makeDirectories.shift();
				}
				modulePath = name;
			} else {
				let moduleDir = pathOverrides['cwd'] || path.resolve('./');
				makePath = moduleDir;
				modulePath = path.join(moduleDir, name);
			}
			log.i('Generating module in directory: ', modulePath);

			for (let i = 0; i < makeDirectories.length; i++) {

				if (makeDirectories[i] && makeDirectories[i] != '') {
					thisDirectory = makeDirectories[i];
					makePath += path.sep + thisDirectory;
					makeDirectory(makePath);
				}
			}

			return [thisDirectory, modulePath];
		}

		function createModule(name, modulePath) {
			let Schema = {
				'Apex': {
					'$Setup': 'Setup',
					'$Start': 'Start',
					'Entity': `${name}.js`
				}
			};

			let entityFile = path.join(__dirname, 'entity.js.template');

			let entityFileText = fs.readFileSync(entityFile);

			let entityText = `(function(){
				let text = \`${entityFileText}\`;
				return text;
			})();`;

			let jsTemplate = eval(entityText);

			let moduleJson = {
				'name': `${name}`,
				'version': '0.0.1',
				'info': {
					'author': ''
				},
				'doc': 'README.md',
				'input': {
					'required': [
						{
							'Cmd': '',
							'required': {
							},
							'optional': {
							}
						}
					],
					'optional': [
						{
							'Cmd': '',
							'required': {
							},
							'optional': {
							}
						}
					]
				},
				'output': {
					'required': [
						{
							'par': '',
							'Cmd': '',
							'required': {
							},
							'optional': {
							}
						}
					],
					'optional': [
						{
							'par': '',
							'Cmd': '',
							'required': {
							},
							'optional': {
							}
						}
					]
				},
				'par': {
					'required': {},
					'optional': {}
				}
			};

			let testJson = {
				'State': {},
				'Cases': []
			};

			if (!fs.existsSync(path.join(modulePath, `${name}.js`))) {
				try {
					fs.writeFileSync(path.join(modulePath, 'schema.json'), 
						JSON.stringify(Schema, null, '\t'));
					fs.writeFileSync(path.join(modulePath, `${name}.js`), jsTemplate);
					fs.writeFileSync(path.join(modulePath, 'module.json'), 
						JSON.stringify(moduleJson, null, '\t'));
					fs.writeFileSync(path.join(modulePath, 'test.json'), 
						JSON.stringify(testJson, null, '\t'));
					log.i('Module generated at: ' + modulePath);
				} catch (e) {
					log.w(e);
				}
			} else {
				log.i('No module generated. Module already exists: ' + modulePath);
			}
		}
	}

	function makeDirectory(dir) {
		try {
			fs.mkdirSync(dir);
		} catch (e) {
			log.w(e);
		}
	}

};

if (require.main === module || !('id' in module)) {
	cli(process.argv);
} else module.exports = {
	Nexus: require('./Nexus.js'),
	Genesis: require('./Genesis.js')
};

