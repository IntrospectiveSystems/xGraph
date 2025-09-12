#! /usr/bin/env node

// -:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-

const genesis = require('../lib/Genesis.js');
const nexus = require('../lib/Nexus.js');
const Logger = require('../lib/Logger.js');
const Log = require('../lib/Log.js');
const GlobalSources = require('../lib/GlobalSources.js');
const fs = require('fs');
const path = require('path');


let options = {
	cwd: '.'
};

let arguments = process.argv.slice(2);
for(let arg = 0; arg < arguments.length; ++ arg)
{
	let option = arguments[arg];    
	switch (option) {
		case '--cwd': 
			options.cwd = arguments[++arg];
			break;
		case '--verbose':
			options.verbose = true;
			break;
		case '--debug':
			options.debug = true;
			break;
		case '--test':
			options.test = arguments[++arg];
			break;
		case '--rotatelogs':
			options.rotatelogs = true;
			break;
	}
}

const logger = new Logger(options);
const log = new Log(logger, 'xgraph', options);

if (options.test && options.test === 'validate') {
	log.validateTest();  // will terminate program and return 0: FAILED or 1: SUCCESS
}

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

		case 'source': {
			sourceCommand(argv.slice(1), Object.assign({}, options, { logger: log }));
			break;
		}

		case 'spawn':
		case 's': {
			spawn(argv.slice(1), options);
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
				log.x('Removed:');
			}else{
				log.x('No files to remove in ', appdata);
			}
			for (let file of files){
				try {
					fs.unlinkSync(path.join(appdata, file));
					log.x(`\t${file}`);
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

	// Load global sources and merge them with runtime options
	try {
		const globalSources = new GlobalSources();
		const globalSourcesMap = globalSources.getGlobalSources();
		
		// Add global sources to options if they haven't been overridden at runtime
		for (const [sourceName, sourcePath] of Object.entries(globalSourcesMap)) {
			// Only add global source if it's not already defined in runtime options
			if (!(sourceName in options)) {
				options[sourceName] = sourcePath;
			}			
		}	
	} catch (error) {
		// Silently continue if global sources can't be loaded
		// This ensures xgraph still works even if .xgraph file is corrupted
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
		// TODO: Handle other exit codes in a more structured way in the future		
		if (_.exitCode == 0) {		
			log.i('Nexus exited normally with exit code 0');

			process.exit(0);
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


async function source(args, Options) {
	if (Array.isArray(Options)) Options = processOptions(Options);
	return sourceCommand(args, Options);
}

async function spawn(args, Options) {
	if (Array.isArray(Options)) Options = processOptions(Options);
	
	const xGraphSpawner = require('../lib/xGraphSpawner.js');
	const spawner = new xGraphSpawner();
	
	// Parse spawn-specific arguments
	let spawnOptions = {
		configPath: Options.config,
		cwd: Options.cwd,
		websocketPort: Options.port,
		silent: Options.silent,
		verbose: Options.verbose,
		debug: Options.debug
	};
	
	// Handle additional arguments
	for (let i = 0; i < args.length; i++) {
		switch (args[i]) {
			case '--port':
				spawnOptions.websocketPort = parseInt(args[++i]);
				break;
			case '--name':
				spawnOptions.name = args[++i];
				break;
		}
	}
	
	try {
		log.i('Spawning xGraph system as subprocess...');
		
		// Set up event handlers
		spawner.on('processSpawned', ({ processId, wsPort, pid }) => {
			log.i(`Process spawned: ID=${processId}, PID=${pid}, WebSocket Port=${wsPort}`);
		});
		
		spawner.on('processExit', ({ processId, code, signal }) => {
			log.i(`Process ${processId} exited with code ${code}, signal: ${signal}`);
		});
		
		spawner.on('processError', ({ processId, error }) => {
			log.e(`Process ${processId} error:`, error);
		});
		
		spawner.on('processOutput', ({ processId, type, data }) => {
			if (Options.verbose || Options.debug) {
				log.i(`Process ${processId} ${type}:`, data.trim());
			}
		});
		
		const spawnResult = await spawner.spawn(spawnOptions);
		
		log.i('xGraph system spawned successfully');
		log.i(`Process ID: ${spawnResult.processId}`);
		log.i(`System PID: ${spawnResult.pid}`);
		log.i(`WebSocket Port: ${spawnResult.wsPort}`);
		
		// Keep the main process alive to monitor the spawned process
		process.on('SIGINT', () => {
			console.log('SIGINT received, terminating spawned processes...');
			log.i('Terminating spawned processes...');
			spawner.killAll();
			//process.exit(0);
		});
		
		return spawnResult;
		
	} catch (error) {
		log.e('Failed to spawn xGraph system:', error.message);
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
				log.x(`Generate new xGraph ${names.length > 1 ?
					'systems' : 'system'} with ${names.length > 1 ?
					'names' : 'name'}: ${args.slice(1)}`);
				initSystem(names, Options);
			} else {
				log.x('No system name provided. Cannot generate'
					+'system without a system name: "xgraph generate system name".');
			}
			break;
		}
		case 'module':
		case 'm': {
			let names = args.slice(1);
			if (names.length > 0) {
				log.x(`Generate new xGraph ${names.length > 1 ?
					'modules' : 'module'} with ${names.length > 1 ?
					'names' : 'name'}: ${args.slice(1)}`);
				initModule(names, Options);
			} else {
				log.x('No system name provided. Cannot generate'
					+'system without a system name: "xgraph generate system name".');
			}
			break;
		}
		case 'service':
		case 'svc': {
			let names = args.slice(1);
			if (names.length > 0) {
				log.x(`Generate new xGraph ${names.length > 1 ?
					'services' : 'service'} with ${names.length > 1 ?
					'names' : 'name'}: ${args.slice(1)}`);
				initService(names, Options);
			} else {
				log.x('No system name provided. Cannot generate'
					+'system without a system name: "xgraph generate system name".');
			}
			break;
		}
		default: {
			log.x('Invalid option for the generate command. Try'
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

		let testJson = {
			'State': {},
			'Cases': []
		};

		if (!fs.existsSync(path.join(modulePath, `${name}.js`))) {
			try {
				fs.writeFileSync(path.join(modulePath, 'schema.json'), JSON.stringify(Schema, null, '\t'));
				fs.writeFileSync(path.join(modulePath, `${name}.js`), jsTemplate);				
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

function initService(names, Options) {


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
				'$Init': 'Init',				
				'Entity': `${name}.js`
			}
		};

		let entityFile = path.join(__dirname, '../res/entity.service.js.template');

		let entityFileText = fs.readFileSync(entityFile);

		let entityText = `(function(){
			let text = \`${entityFileText}\`;
			return text;
		})();`;

		let jsTemplate = eval(entityText);

		if (!fs.existsSync(path.join(modulePath, `${name}.js`))) {
			try {
				fs.writeFileSync(path.join(modulePath, 'schema.json'), JSON.stringify(Schema, null, '\t'));
				fs.writeFileSync(path.join(modulePath, `${name}.js`), jsTemplate);
				log.i('Service Module generated at: ' + modulePath);
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

function sourceCommand(args, options = {}) {
	const GlobalSources = require('../lib/GlobalSources.js');
	const globalSources = new GlobalSources();
	
	// Create a basic logger if not available
	const logger = options.logger || { i: console.log, e: console.error, w: console.warn };
	
	if (args.length === 0) {
		logger.i('Usage: xgraph source <add|remove|list> [name] [path]');
		logger.i('');
		logger.i('Commands:');
		logger.i('  add <name> <path>    Add a global source directory');
		logger.i('  remove <name>        Remove a global source directory');
		logger.i('  list                 List all global source directories');
		return;
	}

	const subcommand = args[0];

	try {
		switch (subcommand) {
			case 'add': {
				if (args.length < 3) {
					logger.e('Usage: xgraph source add <name> <path>');
					process.exit(1);
				}
				const name = args[1];
				const sourcePath = args[2];
				const resolvedPath = globalSources.addSource(name, sourcePath);
				logger.i(`Added global source '${name}' -> ${resolvedPath}`);
				break;
			}

			case 'remove': {
				if (args.length < 2) {
					logger.e('Usage: xgraph source remove <name>');
					process.exit(1);
				}
				const name = args[1];
				globalSources.removeSource(name);
				logger.i(`Removed global source '${name}'`);
				break;
			}

			case 'list': {
				const sources = globalSources.listSources();
				if (Object.keys(sources).length === 0) {
					logger.i('No global sources configured');
				} else {
					logger.i('Global sources:');
					for (const [name, sourcePath] of Object.entries(sources)) {
						logger.i(`  ${name} -> ${sourcePath}`);
					}
				}
				break;
			}

			default: {
				logger.e(`Unknown source command: ${subcommand}`);
				logger.i('Valid commands: add, remove, list');
				process.exit(1);
			}
		}
	} catch (error) {
		logger.e('Source command failed:', error.message);
		process.exit(1);
	}
}

// Always export functions for module use
module.exports = {
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
	source,
	spawn,
	s: spawn,
	
	processOptions,

	Nexus: require('../lib/Nexus.js'),
	Genesis: require('../lib/Genesis.js'),
	xGraphSpawner: require('../lib/xGraphSpawner.js'),
	SourceManager: require('../lib/GlobalSources.js')
};

// Run CLI only when executed directly
if (require.main === module || !('id' in module)) {
	cli(process.argv);
}
