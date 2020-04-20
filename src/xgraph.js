#! /usr/bin/env node

// -:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-

const genesis = require('../lib/Genesis.js');
const nexus = require('../lib/Nexus.js');
const createLogger = require('../lib/Logger.js');
const fs = require('fs');
const path = require('path');
const log = createLogger({verbose: true});
let originalArgv;

process.on('unhandledRejection', (reason, promise) => {
	require('signale').fatal(reason);
	require('signale').fatal(promise);	
	process.stderr.write(reason.toString());
	process.exit(1);
});


let cli = function (argv) {
	originalArgv = argv.slice(0);

	//remove reference to node and xgraph
	argv = argv.slice(2);

	if (argv.length == 0) argv[0] = 'help';
	let subcommand = argv[0];
	let _cwd = (process.cwd());
	let CacheDir;

	const version = require('../package.json').version;

	let options = processOptions(argv.slice(1));

	switch (subcommand) {
		case 'x':
		case 'e':
		case '-x':
		case 'run':
		case '--execute':
		case 'execute': {
			execute(options);
			break;
		}

		case 'r':
		case '-r':
		case '--reset':
		case 'reset': {
			reset(options);
			break;
		}

		case 'c':
		case '-c':
		case '--compile':
		case 'compile': {
			compile(options);
			break;
		}

		case 'd':
		case '-d':
		case '--deploy':
		case 'deploy': {
			deploy(options);
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
			generate(argv.slice(1), options);
			break;
		}

		case 'cache': {
			xgraphcache(argv);
			break;
		}

		case '--version':
		case '-v': {
			log.i(version);
			break;
		}

		default: {
			log.i(`Unknown command <${subcommand}>`);
			help();
			break;
		}
	}

	function help() {

		let helpFile = path.join(__dirname, '../res/xgraphHelp.txt');

		let helpFileText = fs.readFileSync(helpFile);

		let helpText = `
		(function(){
			let text = \`${helpFileText}\`; 
			return text;
		})();
		`;

		let help = eval(helpText);

		process.stdout.write(help);
	}
};

function xgraphcache(argv){
	if ('clean' == argv[1].toLowerCase()){
		try {
			const appdata = path.join((process.env.APPDATA || path.join(process.env.HOME,
				(process.platform == 'darwin' ? 'Library/Preferences' : ''))), '.xgraph');
			let files = fs.readdirSync(appdata);
			if (files.length>0) {
				log.v('Removed:');
			}else{
				log.v('No files to remove in ', appdata);
			}
			for (let file of files){
				try {
					fs.unlinkSync(path.join(appdata, file));
					log.v(`\t${file}`);
				}catch(err){
					log.e('xgraph cache clean failed to remove', file);
				}
			}
		}
		catch (error){
			log.e('xgraph cache clean failed with error', error);
			process.exit(1);
		}
	}else{
		log.e('unknown xgraph cache command ', argv.join(' '));
		process.exit(1);
	}
	log.i('xgraph cache clean success!');
}

function processOptions(arguments) {
	let options = require('minimist')(arguments);

	//clean the options and make sure that lowercase versions of all keys are available
	for (let key in options) options[key.toLowerCase()] = options[key];

	// format cwd
	if ('cwd' in options && (typeof options.cwd === 'string')) {
		options.cwd = path.normalize(options.cwd);
		if (!path.isAbsolute(options.cwd)) {
			options.cwd = path.resolve(`.${path.sep}`, options.cwd);
		}
	} else {
		options.cwd = path.resolve(`.${path.sep}`);
	}

	// check if cwd exists
	if (!fs.existsSync(options.cwd)) {
		log.e('--cwd ' + options.cwd + ' does not exist.');
		process.exit(1);
	}

	// format cache
	if ('cache' in options && (typeof options.cache === 'string')) {
		options.cache = path.normalize(options.cache);
		if (!path.isAbsolute(options.cache)) {
			options.cache = path.resolve(`.${path.sep}`, options.cache);
		}
	}
	else {
		options.cache = path.resolve(options.cwd, 'cache');
	}
	return options;
}

async function reset(Options) {
	if (Array.isArray(Options)) Options = processOptions(Options);
	try {
		await genesis(Object.assign({ state: 'production' }, Options));
		return await startNexusProcess(Options);
	} catch (e) {
		log.e('xgraph failed with error: ', e);
		process.exit(1);
	}
}

async function deploy(Options) {
	if (Array.isArray(Options)) Options = processOptions(Options);
	try {
		return	await startNexusProcess(Options);

	} catch (e) {
		log.e('xgraph failed with error: ', e);
		process.exit(1);
	}
}

async function execute(Options) {
	if (Array.isArray(Options)) Options = processOptions(Options);
	try {
		await genesis(Object.assign({ state: 'development' }, Options));
		return await startNexusProcess(Options);
	} catch (e) {
		log.e('xgraph failed with error: ', e);
		process.exit(1);
	}
}

async function compile(Options) {
	if (Array.isArray(Options)) Options = processOptions(Options);
	try {
		await genesis(Object.assign({ state: 'production' }, Options));
	} catch (e) {
		log.e('xgraph failed with error: ', e);
		process.exit(1);
	}
}


async function startNexusProcess(Options) {
	if (Array.isArray(Options)) Options = processOptions(Options);

	let cacheDir = Options['cache'];
	log.i(`Starting Nexus from ${cacheDir}`);

	let system = new nexus(Options);
	system.on('exit', _ => {
		// HACK: to restart systems
		if (_.exitCode == 72) {
			setTimeout(_ => {
				system = null;
				cacheDir = null;
				cli(originalArgv);
			}, 0);
		}
	});

	try {
		await system.boot();
		return system;
	} catch (e) {
		log.e('xgraph failed with error: ', e);
		process.exit(1);
	}
}


async function generate(args, Options) {
	if (Array.isArray(Options)) Options = processOptions(Options);
	switch (args[0]) {
		case 'system':
		case 's': {
			let names = args.slice(1);
			if (names.length > 0) {
				log.v(`Generate new xGraph ${names.length > 1 ?
					'systems' : 'system'} with ${names.length > 1 ?
					'names' : 'name'}: ${args.slice(1)}`);
				initSystem(names, Options);
			} else {
				log.v('No system name provided. Cannot generate'
					+'system without a system name: "xgraph generate system name".');
			}
			break;
		}
		case 'module':
		case 'm': {
			let names = args.slice(1);
			if (names.length > 0) {
				log.v(`Generate new xGraph ${names.length > 1 ?
					'modules' : 'module'} with ${names.length > 1 ?
					'names' : 'name'}: ${args.slice(1)}`);
				initModule(names, Options);
			} else {
				log.v('No system name provided. Cannot generate'
					+'system without a system name: "xgraph generate system name".');
			}
			break;
		}
		default: {
			log.v('Invalid option for the generate command. Try'
				+'"xgraph generate module" or "xgraph generate system".');
		}
	}
}

function initSystem(names, Options) {
	let systemPath;

	for (let index = 0; index < names.length; index++) {
		let systemPath;
		let name = names[index];
		createDirectories(name);
		createSystem();
	}

	function createDirectories(name) {
		let regEx = new RegExp('(?:\\.\\/?\\/)|(?:\\.\\\\?\\\\)|\\\\?\\\\|\\/?\\/');
		let makeDirectories = name.split(regEx);
		let makePath = '';
		let thisDirectory = '';

		if (path.isAbsolute(name)) {
			if (name.charAt(0) != path.sep) {
				makePath = makeDirectories.shift();
			}
			systemPath = name;
		} else {
			let sysDir = Options['cwd'] || path.resolve(`.${path.sep}`);
			makePath = sysDir;
			systemPath = path.join(sysDir, name);
		}

		for (let i = 0; i < makeDirectories.length; i++) {
			if (makeDirectories[i] && makeDirectories[i] != '') {
				thisDirectory = makeDirectories[i];
				makePath += path.sep + thisDirectory;
				makeDirectory(makePath);
			}
		}
	}

	function createSystem() {
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
				'';
			}
		} else {
			log.i(`No system generated. The system already exists: ${systemPath}`);
		}
	}
}

function initModule(names, Options) {

	let modulePath;

	for (let index = 0; index < names.length; index++) {
		let modulePath;
		let name = names[index];
		let module = createDirectories(name);
		createModule(module);
	}

	function createDirectories(name) {
		let regEx = new RegExp('(?:\\.\\/?\\/)|(?:\\.\\\\?\\\\)|\\\\?\\\\|\\/?\\/');
		let makeDirectories = name.split(regEx);
		let makePath = '';
		let thisDirectory = '';

		if (path.isAbsolute(name)) {
			if (name.charAt(0) != path.sep) {
				makePath = makeDirectories.shift();
			}
			modulePath = name;
		} else {
			let moduleDir = Options['cwd'] || path.resolve(`.${path.sep}`);
			makePath = moduleDir;
			modulePath = path.join(moduleDir, name);
		}

		for (let i = 0; i < makeDirectories.length; i++) {

			if (makeDirectories[i] && makeDirectories[i] != '') {
				thisDirectory = makeDirectories[i];
				makePath += path.sep + thisDirectory;
				makeDirectory(makePath);
			}
		}

		return thisDirectory;
	}

	function createModule(name) {
		let Schema = {
			'Apex': {
				'$Setup': 'Setup',
				'$Start': 'Start',
				'Entity': `${name}.js`
			}
		};

		let entityFile = path.join(__dirname, '../res/entity.js.template');

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
				fs.writeFileSync(path.join(modulePath, 'schema.json'), JSON.stringify(Schema, null, '\t'));
				fs.writeFileSync(path.join(modulePath, `${name}.js`), jsTemplate);
				fs.writeFileSync(path.join(modulePath, 'module.json'),
					JSON.stringify(moduleJson, null, '\t'));
				fs.writeFileSync(path.join(modulePath, 'test.json'), JSON.stringify(testJson, null, '\t'));
				log.i('Module generated at: ' + modulePath);
			} catch (e) {
				'';
			}
		} else {
			log.w('No module generated. Module already exists: ' + modulePath);
		}
	}
}

function makeDirectory(dir) {
	try {
		fs.mkdirSync(dir);
	} catch (e) {
		'';
	}
}

if (require.main === module || !('id' in module)) {
	cli(process.argv);
} else module.exports = {
	execute,
	x: execute,
	e: execute,
	reset,
	r: reset,
	compile,
	c: compile,
	deploy,
	d: deploy,
	generate,
	g: generate,

	processOptions,

	Nexus: require('../lib/Nexus.js'),
	Genesis: require('../lib/Genesis.js')
};

