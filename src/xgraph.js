#! /usr/bin/env node

// -:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-

let cli = function (argv) {
	let originalArgv = argv.slice(0);
	argv = argv.slice(2);
	if (argv.length == 0) argv[0] = 'help';
	let subcommand = argv[0];
	let cwd = (process.cwd());
	let CacheDir;

	const fs = require('fs');
	const path = require('path');
	const version = require('../package.json').version;
	const genesis = require('../lib/Genesis.js');
	const nexus = require('../lib/Nexus.js');
	let options = require('minimist')(argv.slice(1));

	//clean the options and make sure that lowercase versions of all keys are available
	for (let key in options) options[key.toLowerCase()] = options[key];

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

	// format cwd
	if ('cwd' in options && (typeof options.cwd === 'string')) {
		options.cwd = path.normalize(options.cwd);
		if (!path.isAbsolute(options.cwd)) {
			options.cwd = path.resolve('./', options.cwd);
		}
	} else {
		options.cwd = path.resolve('./');
	}

	//check if cwd exists
	if (!fs.existsSync(options.cwd)) {
		console.error('--cwd ' + options.cwd + ' does not exist.');
		process.exit(1);
	}

	// Directory is passed in Params.Cache or defaults to "cache" in the cwd.
	if ('cache' in options && (typeof options.cache === 'string')) {
		options.cache = path.normalize(options.cache);
		if (!path.isAbsolute(options.cache)) {
			options.cache = path.resolve('./', options.cache);
		}
	}
	else {
		options.cache = path.resolve(options.cwd, "cache");
	}

	switch (subcommand) {
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
			generate(argv.slice(1));
			break;
		}

		case '--version':
		case "-v": {
			console.log(version);
			break
		}
		default: {
			console.log(`Unknown command <${subcommand}>`);
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
				if (names.length > 0) {
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

		let helpFile = path.join(__dirname, '../res/xgraphHelp.txt');

		let helpFileText = fs.readFileSync(helpFile);

		let helpText = `
		(function(){
			let text = \`${helpFileText}\`; 
			return text;
		})();
		`;

		let help = eval(helpText);

		console.log(help);
	}

	async function reset() {
		try {
			state = 'production';
			await genesis(Object.assign({ state }, options));
			let processPath = options["cwd"] || path.resolve(`.${path.sep}`);
			// process.chdir(processPath);
			startNexusProcess();
		} catch (e) {
			console.error(e);
		}
	}

	async function deploy() {
		try {
			startNexusProcess();

		} catch (e) {
			console.error(e);
		}
	}

	async function execute() {
		try {
			state = 'development';
			await genesis(Object.assign({ state }, options));
			startNexusProcess();
		} catch (e) {
			console.error(e);
		}
	}

	async function compile() {
		try {
			state = 'production';
			await genesis(Object.assign({ state }, options));
		} catch (e) {
			console.error(e);
		}
	}


	async function startNexusProcess() {
		//get the cache dir
		let cacheDir = options["cache"];
		console.log(`Starting Run Engine from ${cacheDir}`);

		// // HACK: no idea whyt we're messing with this. remove it att some point and see what happens
		// process.env.NODE_PATH = path.join(path.dirname(cacheDir), "node_modules");

		//combine flags and path overrides to create the options object for nexus
		let system = new nexus(options);
		system.on('exit', _ => {
			// HACK: to restart systems
			// HACK: to restart systems
			if (_.exitCode == 72) {
				setTimeout(_ => {
					system = null
					cacheDir = null;
					cli(originalArgv);
				}, 0);
			}
		});

		try {
			await system.boot();
		} catch (e) {
			console.error(e);
			process.exit(1);
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

		for (let index = 0; index < names.length; index++) {
			let systemPath;
			let name = names[index];
			createDirectories(name);
			createSystem();
		}

		function createDirectories(name) {
			let regEx = new RegExp("(?:\\.\\/?\\/)|(?:\\.\\\\?\\\\)|\\\\?\\\\|\\/?\\/");
			let makeDirectories = name.split(regEx);
			let makePath = "";
			let thisDirectory = "";

			if (path.isAbsolute(name)) {
				if (name.charAt(0) != path.sep) {
					makePath = makeDirectories.shift();
				}
				systemPath = name;
			} else {
				let sysDir = options['cwd'] || path.resolve('./');
				makePath = sysDir;
				systemPath = path.join(sysDir, name);
			}

			console.log("Generating system in directory: ", systemPath);

			for (let i = 0; i < makeDirectories.length; i++) {
				if (makeDirectories[i] && makeDirectories[i] != "") {
					thisDirectory = makeDirectories[i];
					makePath += path.sep + thisDirectory;
					makeDirectory(makePath);
				}
			}
		}

		function createSystem() {
			const ConfigTemplate =
			{
				"Sources": {},
				"Modules": {
					"Deferred": []
				}
			};

			if (!fs.existsSync(path.join(systemPath, 'config.json'))) {
				try {
					fs.writeFileSync(path.join(systemPath, 'config.json'), JSON.stringify(ConfigTemplate, null, '\t'));
					console.log("System generated at: " + systemPath);
				} catch (e) {
				}
			} else {
				console.log(`No system generated. The system already exists: ${systemPath}`);
			}
		}
	}

	function initModule(names) {

		for (let index = 0; index < names.length; index++) {
			let modulePath;
			let name = names[index];
			let module = createDirectories(name);
			createModule(module);
		}

		function createDirectories(name) {
			let regEx = new RegExp("(?:\\.\\/?\\/)|(?:\\.\\\\?\\\\)|\\\\?\\\\|\\/?\\/");
			let makeDirectories = name.split(regEx);
			let makePath = "";
			let thisDirectory = "";

			if (path.isAbsolute(name)) {
				if (name.charAt(0) != path.sep) {
					makePath = makeDirectories.shift();
				}
				modulePath = name;
			} else {
				let moduleDir = options['cwd'] || path.resolve('./');
				makePath = moduleDir;
				modulePath = path.join(moduleDir, name);
			}
			console.log("Generating module in directory: ", modulePath);

			for (let i = 0; i < makeDirectories.length; i++) {

				if (makeDirectories[i] && makeDirectories[i] != "") {
					thisDirectory = makeDirectories[i];
					makePath += path.sep + thisDirectory;
					makeDirectory(makePath);
				}
			}

			return thisDirectory;
		}

		function createModule(name) {
			let Schema = {
				"Apex": {
					"$Setup": "Setup",
					"$Start": "Start",
					"Entity": `${name}.js`
				}
			};

			let entityFile = path.join(__dirname, '../res/entity.js');

			let entityFileText = fs.readFileSync(entityFile);

			let entityText = `(function(){
				let text = \`${entityFileText}\`;
				return text;
			})();`;

			let jsTemplate = eval(entityText);

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

			if (!fs.existsSync(path.join(modulePath, `${name}.js`))) {
				try {
					fs.writeFileSync(path.join(modulePath, 'schema.json'), JSON.stringify(Schema, null, '\t'));
					fs.writeFileSync(path.join(modulePath, `${name}.js`), jsTemplate);
					fs.writeFileSync(path.join(modulePath, 'module.json'), JSON.stringify(moduleJson, null, '\t'));
					fs.writeFileSync(path.join(modulePath, 'test.json'), JSON.stringify(testJson, null, '\t'));
					console.log("Module generated at: " + modulePath);
				} catch (e) {
				}
			} else {
				console.log("No module generated. Module already exists: " + modulePath);
			}
		}
	}

	function makeDirectory(dir) {
		try {
			fs.mkdirSync(dir);
		} catch (e) {
		}
	}
};

if (require.main === module || !('id' in module)) {
	cli(process.argv);
} else module.exports = {
	exec: cli,
	Nexus: require('../lib/Nexus.js'),
	Genesis: require('../lib/Genesis.js')
};
