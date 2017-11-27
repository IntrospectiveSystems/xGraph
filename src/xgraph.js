const { execSync } = require('child_process');
const tar = require('targz');
const fs = require('fs');
const path = require('path');
const mergedirs = require('merge-dirs').default;
let state = 'production';
let args = process.argv.slice(1);
let pathOverrides = {};


// #ifdef LINUX
let system = 'linux';
let linux = true;
let windows = false;
let mac = false;
let unix = true;
// #endif
// #ifdef MAC
let system = 'macOS';
let linux = false;
let windows = false;
let mac = true;
let unix = true;
// #endif
// #ifdef WINDOWS
let system = 'windows';
let linux = false;
let windows = true;
let mac = false;
let unix = false;
// #endif
let nodeVersion = "8.9.1";

let cwd = (process.cwd());
let bindir = process.argv[0].substr(0, process.argv[0].lastIndexOf('/'));
let CacheDir;

if (process.argv.length == 1) process.argv[1] = 'help';

processSwitches();

switch (args[0]) {
	case 'x':
	case 'run':
	case 'execute': {
		execute();
		break;
	}

	case 'r':
	case 'reset': {
		reset();
		break;
	}

	case 'c':
	case 'compile': {
		compile();
		break;
	}

	case 'd':
	case 'deploy': {
		deploy();
		break;
	}

	case 'help':
	case '--help': {
		help();
		break;
	}
	case 'g':
	case 'generate':
	case 'init': {
		generate(args.slice(1));
		break;
	}
	default: {
		console.log(`Unknown command <${process.argv[1]}>`);
		help();
		break;
	}
}

async function generate(args) {
	switch (args[0]) {
		case 'system':
		case 's': {
			let names = args.slice(1);
			console.log(`Create xGraph ${names.length > 1 ? 'Systems' : 'System'} with ${names.length > 1 ?
				'names' : 'name'}: ${args.slice(1)}`);
			initSystem(names);
			break;
		}
		case 'module':
		case 'm': {
			let names = args.slice(1);
			console.log(`Create xGraph ${names.length > 1 ? 'Modules' : 'Module'} with ${names.length > 1 ?
				'names' : 'name'}: ${args.slice(1)}`);
			initModule(names);
			break;
		}
	}
}

function help() {
	console.log(`
  xGraph
  Introspective Systems LLC

    Commands:
      help: displays this help screen.
      run: Starts a system from config or cache
        Example: xgraph compile --config config.json
                 xgraph deploy --cache cache/
    
  `);
}

async function reset() {
	try {
		await ensureNode();
		state = 'production';
		await genesis();
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
		if (fs.existsSync(pathOverrides['Cache'] || 'cache')) {
			startNexusProcess();
		} else {
			state = 'develop';
			await genesis();
			startNexusProcess();
		}
	} catch (e) {
		console.error(e);
	}
}

async function compile() {
	try {
		await ensureNode();
		state = 'production';
		await genesis();
	} catch (e) {
		console.error(e);
	}
}


function startNexusProcess() {
	const { spawn } = require('child_process');
	let processPath = pathOverrides["cwd"] || path.resolve('./');
	console.log("Process Path is ", processPath);

	let cacheDir = pathOverrides["cache"];
	console.log(cacheDir);
	// #ifdef LINUX
	const ls = spawn("node", [`${bindir.substr(0, bindir.lastIndexOf('/'))}/lib/Nexus/Nexus.js`, ...process.argv, JSON.stringify(pathOverrides)], { cwd: processPath, env: { NODE_PATH: path.join(path.dirname(cacheDir), "node_modules/"), PATH: process.env.PATH } });
	// #endif
	// #ifdef MAC
	const ls = spawn("node", [`${bindir.substr(0, bindir.lastIndexOf('/'))}/lib/Nexus/Nexus.js`, ...process.argv, JSON.stringify(pathOverrides)], { cwd: processPath, env: { NODE_PATH: path.join(path.dirname(cacheDir), "node_modules/"), PATH: process.env.PATH } });
	// #endif
	// #ifdef WINDOWS
	const ls = spawn("node.cmd", [`${bindir.substr(0, bindir.lastIndexOf('/'))}/lib/Nexus/Nexus.js`, ...process.argv, JSON.stringify(pathOverrides)], { cwd: processPath, env: { NODE_PATH: path.join(path.dirname(cacheDir), "node_modules/"), PATH: process.env.PATH } });
	// #endif

	ls.stdout.on('data', _ => process.stdout.write(_));
	ls.stderr.on('data', _ => process.stderr.write(_));
	process.stdin.on('data', _ => ls.stdin.write(_));

	ls.on('close', (code) => {
		console.log(`child process exited with code ${code}`);
	});
}

async function ensureNode() {
	// #ifdef LINUX
	let node = (execSync('which node').toString());

	if (node != '') {
		console.log(`Node appears to be installed.  If you have problems we recommend you have Node v${nodeVersion} installed.`);

		return;
	} else {
		await install();
	}
	// #else
	console.error(`System ${system} is not yet supported.  You will need to install Node v${nodeVersion} manually.`);
	// #endif
}

function install() {
	// this should be updated to take into account chipsets (i.e. ARM) and architectures (32-bit and 64-bit)  -slm 11/15/2017
	return new Promise((resolve) => {
		// #ifdef LINUX
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
		// #
		// #else
		console.error(`System ${system} is not yet supported`);
		//node-msi.fetch.start

		// #endif
	});
}

function processSwitches() {
	let argLoop = (() => {
		let nextIndex = 0;
		return {
			next: () => {
				return nextIndex < args.length ?
					{ value: args[nextIndex++], idx: (nextIndex - 1), done: false } :
					{ done: true };
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
		if (str.startsWith('--')) {
			let key = args[i].slice(2);
			applySwitch(key, i);
		}
		returnVal = argLoop.next();
	}

	pathOverrides["cache"] = pathOverrides["cache"] || "./cache";

	// Directory is passed in Params.Cache or defaults to "cache" in the current working directory.

	if (!('cache' in pathOverrides))
		pathOverrides.cache = 'cache';

	if (!path.isAbsolute(pathOverrides.cache)) {
		pathOverrides.cache = path.resolve(path.resolve(pathOverrides.cwd || process.cwd()), pathOverrides.cache);
	}

	function applySwitch(str, i) {
		let remainingArgs = args.length - i - 1;
		if (str == "debug") {
			console.log("Doing the debug thing");
			argLoop.delete(1);
			return;
		}
		if (remainingArgs >= 1) { // switch has a value
			pathOverrides[str.toLowerCase()] = args[i + 1];
			argLoop.delete(2);
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
	let systemDir = pathOverrides['cwd'] || path.join(path.resolve('./'), 'Systems');
	console.log("System dir is ", systemDir);
	const ConfigTemplate = {
		"Sources": {},
		"Modules": {
			"Deferred": []
		}
	};

	try {
		fs.mkdirSync(systemDir);
	} catch (e) {
		console.error(e);
		console.log(`${systemDir} directory already exists`);
	}

	for (let index = 0; index < names.length; index++) {
		let name = names[index];
		let systemPath = path.join(systemDir, name);
		try {
			fs.mkdirSync(systemPath);
		} catch (e) {
			console.error(e);
			console.log(`${systemPath} directory already exists`);
		}
		fs.writeFileSync(path.join(systemPath, 'config.json'), JSON.stringify(ConfigTemplate, null, '\t'));
	}
}

function initModule(names) {
	let moduleDir = pathOverrides['cwd'] || path.join(path.resolve('./'), 'Modules');
	
	let Schema = {
		"Apex": {
			"$Setup": "Setup",
			"$Start": "Start"
		}
	};

	try {
		fs.mkdirSync(moduleDir);
	} catch (e) {
		console.error(e);
		console.log(`${moduleDir} directory already exists`);
	}

	for (let index = 0; index < names.length; index++) {
		let name = names[index];
		let modulePath = path.join(moduleDir, name);
		
		try {
			fs.mkdirSync(modulePath);
		} catch (e) {
			console.error(e);
			console.log(`${modulePath} directory already exists`);
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

		Schema.Apex.Entity = `${name}.js`

		let moduleJson = {
			"input": {
				"required": [
					{
						"Cmd": "Setup"
					},
					{
						"Cmd": "Start"
					}
				],
				"opts": []
			},
			"output": {
				"required": [],
				"opts": []
			},
			"par": {
				"required": [],
				"opts": []
			},
			"name": name,
			"icon": null,
			"doc": null,
			"info": { "author": "NEMO" },
			"src": modulePath
		}

		fs.writeFileSync(path.join(modulePath, 'schema.json'), JSON.stringify(Schema, null, '\t'));
		fs.writeFileSync(path.join(modulePath, `${name}.js`), jsTemplate);
		fs.writeFileSync(path.join(modulePath, 'module.json'), JSON.stringify(moduleJson, null, '\t'));
	}
}

function initView() {

}