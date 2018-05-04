#! /usr/bin/env node
// anything above this line is removed on npm run build.
// -:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-

let cli = function (argv) {
	//just do a quick dumb check to see if we have node as a first argument
	let originalArgv = argv.slice(0);
	let originalCwd = process.cwd();

	if (argv[0].indexOf('node')) {
		argv = argv.slice(1);
	} else {
		console.log('REAL COMMAND LINE ARGUMENTS DETECTED. ABORT. REPEAT,\r\n\t\tAB0RT\r\n\t\t\t\tM IS5  I ON.');
		console.log('---------------------------------------------------');
		console.log(argv.join('\n'));
		console.log('---------------------------------------------------');
		process.exit(1);
	}

	const { execSync } = require('child_process');
	const tar = require('targz');
	const fs = require('fs');
	const path = require('path');
	const mergedirs = require('merge-dirs').default;
	let state = 'production';
	if (argv.length == 1) argv[1] = 'help';
	let args = argv.slice(1);
	let pathOverrides = {};
	let nodeVersion = "8.9.1";
	let cwd = (process.cwd());
	let bindir = argv[0].substr(0, argv[0].lastIndexOf(path.sep));
	let CacheDir;
	const version = require('../package.json').version;
	const genesis = require('./Genesis.js');
	const nexus = require('./Nexus.js');
	let subcommand = '';
	let flags = {};


	let windows, mac, linux, unix, system;

	switch (process.platform) {
		case 'win32': {
			system = 'windows';
			windows = true;
			unix = linux = mac = false;
			break;
		}
		case 'darwin': {
			system = 'macOS';
			windows = linux = false;
			unix = mac = true;
			break;
		}
		case 'linux': {
			system = 'linux';
			linux = unix = true;
			mac = windows = false;
			break;
		}
		default: {
			// arbitrary unix system
			system = 'unix';
			unix = true;
			linux = mac = windows = false;
			break;
		}
	}

	processSwitches();

	switch (args[0]) {
		case 'x':
		case '-x':
		case 'run':
		case '--execute':
		case 'execute': {
			subcommand = 'execute';
			execute();
			break;
		}

		case 'r':
		case '-r':
		case '--reset':
		case 'reset': {
			subcommand = 'reset';
			reset();
			break;
		}

		case 'c':
		case '-c':
		case '--compile':
		case 'compile': {
			subcommand = 'compile';
			compile();
			break;
		}

		case 'd':
		case '-d':
		case '--deploy':
		case 'deploy': {
			subcommand = 'deploy';
			deploy();
			break;
		}

		case 'help':
		case 'h':
		case '-h':
		case '--help': {
			subcommand = 'help';
			help();
			break;
		}
		case 'g':
		case '-g':
		case 'generate':
		case 'init': {
			subcommand = 'generate';
			generate(args.slice(1));
			break;
		}

		case '--version':
		case "-v": {
			subcommand = 'version';
			console.log(version);
			break
		}
		default: {
			console.log(`Unknown command <${argv[1]}>`);
			help();
			break;
		}
	}

	async function generate(args) {
		switch (args[0]) {
			case 'system':
			case 's': {
				let names = args.slice(1);
				if(names.length > 0) {
					console.log(`Generate new xGraph ${names.length > 1 ? 'systems' : 'system'} with ${names.length > 1 ?
						'names' : 'name'}: ${args.slice(1)}`);
					initSystem(names);
				} else {
					console.log('No system name provided. Cannot generate system without a system name: "xgraph generate system name".');
				}
				break;
			}
			case 'module':
			case 'm': {
				let names = args.slice(1);
				if(names.length > 0) {
					console.log(`Generate new xGraph ${names.length > 1 ? 'modules' : 'module'} with ${names.length > 1 ?
						'names' : 'name'}: ${args.slice(1)}`);
					initModule(names);
				} else {
					console.log('No system name provided. Cannot generate system without a system name: "xgraph generate system name".');
				}
				break;
			}
			default: {
				console.log(`Invalid option for the generate command. Try "xgraph generate module" or "xgraph generate system".`);
			}
		}
	}

	function help() {
		console.log(`
\x20\x20\x20\x20xGraph ${version}
Introspective Systems LLC

Compile and Run xGraph systems with a few simple commands.

Unless otherwise specified, commands will look in the current working
directory for a config.json file or cache directory, depending on the
command.

If the system includes local module sources, these must be listed after
the command and options, [--source directory ...].

xGraph

Usage: xgraph [command] [options] [--source directory ...]

Command:
\x20\x20help         h                    : Displays this help screen.
\n
\x20\x20compile      c                    : Generates a cache from a system
\x20\x20                                    structure file.
\n
\x20\x20deploy       d                    : Run a system from the cache.
\n
\x20\x20reset        r                    : Run a system from system structure
\x20\x20                                    file, resetting the system's cache.
\n
\x20\x20generate <module|system>  g <m|s> : Generate a new module or system
\x20\x20                                    from a template with the given
\x20\x20                                    name.
\n
\x20\x20execute      x                    : Run a system from the cache, or
\x20\x20                                    the system's module references, or
\x20\x20                                    compiling the system structure file
\x20\x20                                    if the cache does not exist.
\n
Options:
\x20\x20--cwd                             : Sets the current working directory
\x20\x20                                    for the command.
\x20\x20--config                          : Specifies a system's structure file.
\x20\x20--cache                           : Specifies a system's cache directory.
\x20\x20--allow-add-module                : Enable a module to add new modules
\x20\x20                                    in memory to the Module cache.

Examples:
\x20\x20Compile the system in the current directory.
\x20\x20\x20\x20\x20\x20xgraph compile
\n
\x20\x20Deploy a module from a system structure file.
\x20\x20\x20\x20\x20\x20xgraph deploy --config ./ExampleSystems/HelloWorld/config.json
\n
\x20\x20Reset a system in a different working directory with an external source.
\x20\x20\x20\x20\x20\x20xgraph reset --cwd ./MultipleSystemsTemplate/Systems/Plexus/ --xGraph ../xGraph
\n
\x20\x20Generate a new module called MyFirstModule.
\x20\x20\x20\x20\x20\x20xgraph generate module MyFirstModule
`);
	}

	async function reset() {
		try {
			await ensureNode();
			state = 'production';
			await genesis(Object.assign({ state }, pathOverrides));
			let processPath = pathOverrides["cwd"] || path.resolve(`.${path.sep}`);
			// process.chdir(processPath);
			startNexusProcess();
		} catch (e) {
			console.error(e);
		}
	}

	async function deploy() {
		try {
			await ensureNode();
			startNexusProcess();

		} catch (e) {
			console.error(e);
		}
	}

	async function execute() {
		try {
			await ensureNode();
			state = 'development';
			await genesis(Object.assign({ state }, pathOverrides));
			startNexusProcess();
		} catch (e) {
			console.error(e);
		}
	}

	async function compile() {
		try {
			await ensureNode();
			state = 'production';
			// console.dir(pathOverrides);
			await genesis(Object.assign({ state }, pathOverrides));
		} catch (e) {
			console.error(e);
		}
	}


	async function startNexusProcess() {
		//get the cache dir
		let cacheDir = pathOverrides["cache"];
		console.log(`Starting from ${cacheDir}`);

		// HACK: no idea whyt we're messing with this. remove it att some point and see what happens
		process.env.NODE_PATH = path.join(path.dirname(cacheDir), "node_modules");

		//combine flags and path overrides to create the options object for nexus
		let system = new nexus(Object.assign(flags, pathOverrides));
		system.on('exit', _ => {
			// HACK: to restart systems
			if (_.exitCode == 72) {
				setTimeout(_ => {
					// process.chdir(originalCwd);
					cli(originalArgv);
				}, 1000);
			}
		});

		try {
			await system.boot();
		} catch (e) {
			console.error(e);
			process.exit(1);
		}

	}

	async function ensureNode() {
		if (linux) {
			let node = (execSync('which node').toString());

			if (node != '') {
				console.log(`Node appears to be installed.  If you have problems we recommend you have Node v${nodeVersion} installed.`);

				return;
			} else {
				await install();
			}
		} else if (mac) {
			let node = (execSync('which node').toString());

			if (node != '') {
				console.log(`Node appears to be installed.  If you have problems we recommend you have Node v${nodeVersion} installed.`);
				return;
			} else {
				await install();
			}
		} else {
			console.warn(`\u001b[33m[WARN] Automated Version Validation for ${system} is not yet supported.\r\nYou will need to install Node v${nodeVersion} manually, if you have not already.\u001b[39m`);
		}
	}

	function install() {
		// this should be updated to take into account chipsets (i.e. ARM) and architectures (32-bit and 64-bit)  -slm 11/15/2017
		return new Promise((resolve) => {
			let installAttempted = false;
			if (linux) {
				require('https').get({
					host: 'nodejs.org',
					path: '/dist/v' + nodeVersion + '/node-v' + nodeVersion + '-linux-x64.tar.gz'
				}, (response) => {
					let body = '';
					response.pipe(fs.createWriteStream(bindir + '/node.tar.gz'));
					response.on('end', function () {
						// console.log('extraction time!');
						tar.decompress({
							src: bindir + '/node.tar.gz',
							dest: bindir
						}, function () {
							// console.log(mergedirs);
							installAttempted = true;
							try {
								mergedirs('node-v' + nodeVersion + '-linux-x64/bin', '/usr/bin', 'overwrite');
								mergedirs('node-v' + nodeVersion + '-linux-x64/include', '/usr/include', 'overwrite');
								mergedirs('node-v' + nodeVersion + '-linux-x64/lib', '/usr/lib', 'overwrite');
								mergedirs('node-v' + nodeVersion + '-linux-x64/share', '/usr/share', 'overwrite');
								//TODO RIMRAF THE ZIP AND EXTRACTED FILES
								// console.log('dun');
								resolve();
							} catch (e) {
								console.log('Could not install node, try running the command again with sudo\n');
								console.log("If the problem persists, email support@introspectivesystems.com");
								console.log('with this ' + e.toString());
								process.exit(1);
								resolve();
							}
						});
					});
				});
			}

			if (mac) {
				// maybe this should be altered to pull the .pkg file but this works for now -slm 11/16/2017
				require('https').get({
					host: 'nodejs.org',
					path: '/dist/v' + nodeVersion + '/node-v' + nodeVersion + '-darwin-x64.tar.gz'
				}, (response) => {
					let body = '';
					response.pipe(fs.createWriteStream(bindir + '/node.tar.gz'));
					response.on('end', function () {
						tar.decompress({
							src: bindir + '/node.tar.gz',
							dest: bindir
						}, function () {
							installAttempted = true;
							try {
								mergedirs('node-v' + nodeVersion + '-darwin-x64/bin', '/usr/local/bin', 'overwrite');
								mergedirs('node-v' + nodeVersion + '-darwin-x64/include', '/usr/local/include', 'overwrite');
								mergedirs('node-v' + nodeVersion + '-darwin-x64/lib', '/usr/local/lib', 'overwrite');
								mergedirs('node-v' + nodeVersion + '-darwin-x64/share', '/usr/local/share', 'overwrite');
								resolve();
							} catch (e) {
								try {
									mergedirs('node-v' + nodeVersion + '-darwin-x64/bin', '/usr/bin', 'overwrite');
									mergedirs('node-v' + nodeVersion + '-darwin-x64/include', '/usr/include', 'overwrite');
									mergedirs('node-v' + nodeVersion + '-darwin-x64/lib', '/usr/lib', 'overwrite');
									mergedirs('node-v' + nodeVersion + '-darwin-x64/share', '/usr/share', 'overwrite');
									resolve();
								} catch (e) {
									console.log('Could not install node, try running the command again with sudo\n');
									console.log("If the problem persists, email support@introspectivesystems.com");
									console.log('with this ' + e.toString());
									process.exit(1);
									resolve();
								}
							}
						});
					});
				});
			}

			if (windows) {
				console.error(`${system} is not yet supported.`);
			}

			if (!installAttempted) {
				console.error(`Node installation was skipped.  Please verify Node v${nodeVersion} is installed.`);
			}
		});
	}

	function processSwitches() {
		let argLoop = (() => {
			let nextIndex = 0;
			return {
				next: () => {
					if (nextIndex < args.length) {
						let obj = { value: args[nextIndex], idx: (nextIndex), done: false };
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

		let returnVal = argLoop.next();

		while ('value' in returnVal) {
			let str = returnVal.value;
			let i = returnVal.idx;
			// console.log(i);
			if (typeof str == 'undefined') {
				console.error('error parsing Switches');
				process.exit(1);
			}
			if (str.startsWith('--')) {
				let key = args[i].slice(2);
				applySwitch(key, i);
			}
			// console.log(i);
			returnVal = argLoop.next();
		}

		//sanitize and default cwd
		if('cwd' in pathOverrides && typeof pathOverrides.cwd === 'string') {
			pathOverrides['cwd'] = path.normalize(pathOverrides['cwd']);
		} else {
			pathOverrides['cwd'] = path.normalize(process.cwd());
		}

		pathOverrides["cache"] = pathOverrides["cache"] || path.resolve(pathOverrides.cwd, "cache");

		// Directory is passed in Params.Cache or defaults to "cache" in the current working directory.

		if (!('cache' in pathOverrides))
			pathOverrides.cache = 'cache';

		pathOverrides.cwd = path.resolve(pathOverrides.cwd || process.cwd());

		if (!path.isAbsolute(pathOverrides.cache)) {
			pathOverrides.cache = path.resolve(pathOverrides.cwd, pathOverrides.cache);
		}

		function applySwitch(str, i) {
			let remainingArgs = args.length - i - 1;
			// if (str == "debug") {
			// 	console.log("Doing the debug thing");
			// 	argLoop.delete(1);
			// 	return;
			// }
			if (remainingArgs >= 1) { // switch has another argument
				if (!args[i + 1].startsWith('--')) {
					//if its justt some more plain text, not another switch
					//we add it to path overrides
					pathOverrides[str.toLowerCase()] = args[i + 1];
					argLoop.delete(2);
				} else {
					//otherwise, we add it to flags
					flags[str.toLowerCase()] = true;
				}
			}
		}
	}










	// -------------------------------------------------------------
	//                       templating stuff
	// -------------------------------------------------------------

	let launchConfigBase = {
		version: "0.2.0",
		configurations: []
	};

	let config = (repo, system) => {
		return {
			name: system,
			type: "node",
			request: "launch",
			cwd: `\${workspaceRoot}/Systems/${system}`,
			program: '${workspaceRoot}/../xGraph/Nexus/Nexus/Nexus.js',
			args: [
				"xGraph=${workspaceRoot}/../xGraph",
				`${repo}=\${workspaceRoot}`,
				"development=true"
			]
		}
	};

	function initSystem(names) {
		let systemPath;
		const ConfigTemplate = {
			"Sources": {},
			"Modules": {
				"Deferred": []
			}
		};

		for (let index = 0; index < names.length; index++) {
			let name = names[index];

			if (path.isAbsolute(name)) {
				systemPath = name;
			} else {
				let systemDir = pathOverrides['cwd'] || path.join(path.resolve('./'), 'Systems');
				systemPath = path.join(systemDir, name);
				console.log("Generating system in directory: ", systemDir);

				//ensure that the systems or modules directory exists
				try {
					fs.mkdirSync(systemDir);

				} catch (e) {

				}
			}



			try {
				fs.mkdirSync(systemPath);
				fs.writeFileSync(path.join(systemPath, 'config.json'), JSON.stringify(ConfigTemplate, null, '\t'));
				console.log("System generated at: " + systemPath);
			} catch (e) {
				console.log(`The system already exists: ${systemPath}`);
			}



		}
	}

	function initModule(names) {
		let modulePath;
		let Schema = {
			"Apex": {
				"$Setup": "Setup",
				"$Start": "Start"
			}
		};
		for (let index = 0; index < names.length; index++) {
			let name = names[index];

			if (path.isAbsolute(name))
				modulePath = name;
			else {
				let moduleDir = pathOverrides['cwd'] || path.join(path.resolve('./'), 'Modules');
				modulePath = path.join(moduleDir, name);
				console.log("Module dir is ", moduleDir);

				try {
					fs.mkdirSync(moduleDir);
				} catch (e) {

				}
			}

			try {
				fs.mkdirSync(modulePath);
			} catch (e) {
				console.log(`The module already exists: ${modulePath}`);
			}

			let jsTemplate =
				`//# sourceURL=${name}.js
			(function ${name}() {
			\tclass ${name} {
			\t\tSetup(com, fun) {
			\t\t\t//this function is typically used to allow the entity/module to handle any internal setup
			\t\t\t//procedures prior to being connected to by other entities/modules

			\t\t\tfun(null, com);
			\t\t}

			\t\tStart(com, fun){
			\t\t\t//this function is typically used to allow the entity/module to handle any external setup
			\t\t\t//procedures

			\t\t\tfun(null, com);
			\t\t}
			\t}
			\treturn {dispatch:${name}.prototype}
			})();`;

			Schema.Apex.Entity = `${name}.js`;

			let moduleJson = {
				"name": `${name}`,
				"version": "0.0.1",
				"info": {
					"author": ""
				},
				"doc": "README.md",
				"input": {
					"required": [
						{
							"Cmd": "",
							"required": {
							},
							"optional": {
							}
						}
					],
					"optional": [
						{
							"Cmd": "",
							"required": {
							},
							"optional": {
							}
						}
					]
				},
				"output": {
					"required": [
						{
							"par": "",
							"Cmd": "",
							"required": {
							},
							"optional": {
							}
						}
					],
					"optional": [
						{
							"par": "",
							"Cmd": "",
							"required": {
							},
							"optional": {
							}
						}
					]
				},
				"par": {
					"required": {},
					"optional": {}
				}
			};

			let testJson = {
				"State": {},
				"Cases": []
			};

			fs.writeFileSync(path.join(modulePath, 'schema.json'), JSON.stringify(Schema, null, '\t'));
			fs.writeFileSync(path.join(modulePath, `${name}.js`), jsTemplate);
			fs.writeFileSync(path.join(modulePath, 'module.json'), JSON.stringify(moduleJson, null, '\t'));
			fs.writeFileSync(path.join(modulePath, 'test.json'), JSON.stringify(testJson, null, '\t'));
		}
	}

	function initView() {

	}
}

if (require.main === module || !('id' in module)) cli(process.argv);
else module.exports = {
	Nexus: require('./Nexus.js'),
	Genesis: require('./Genesis.js')
};
