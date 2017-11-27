// The defined log levels for outputting to the std.out() (ex. log.v(), log.d() ...)
// Levels include:
// v : verbose		Give too much information 
// d : debug		For debugging purposes not in production level releases
// i : info			General info presented to the end user 
// w : warn			Failures that dont result in a system exit
// e : error 		Critical failure should always follow with a system exit
const endOfLine = require('os').EOL;
const log = global.log = {
	v: (...str) => {
		process.stdout.write(`\u001b[90m[VRBS] ${str.join(' ')} \u001b[39m${endOfLine}`);
	},
	d: (...str) => {
		process.stdout.write(`\u001b[35m[DBUG] ${str.join(' ')} \u001b[39m${endOfLine}`);
	},
	i: (...str) => {
		process.stdout.write(`\u001b[36m[INFO] ${str.join(' ')} \u001b[39m${endOfLine}`);
	},
	w: (...str) => {
		process.stdout.write(`\u001b[33m[WARN] ${str.join(' ')} \u001b[39m${endOfLine}`);
	},
	e: (...str) => {
		process.stdout.write(`\u001b[31m[ERRR] ${str.join(' ')} \u001b[39m${endOfLine}`);
	}
};
console.log = function (...str) {
	log.w('console.log is depricated use defined log levels ... log.i()');
	log.v(...str);
}
console.time = _ => {
	console.timers = console.timers || {};
	console.timers[_] = performance.now();
};
console.timeEnd = _ => {
	if (!(_ in (console.timers || {})))
		return;
	let elapsed = performance.now() - console.timers[_];
	console.timers[_] = undefined;
	log.i(`${_}: ${elapsed}ms`);
}

const { execSync } = require('child_process');
const tar = require('targz');
const fs = require('fs');
const path = require('path');
const mergedirs = require('merge-dirs').default;
let state = 'production';

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

let pathOverrides = {};

// $genesis $load('./Nexus/Nexus/Genesis.js')

let cwd = (process.cwd());
let bindir = process.argv[0].substr(0, process.argv[0].lastIndexOf('/'));
let CacheDir;

if (process.argv.length == 1) process.argv[1] = 'help';

processSwitches();


switch (process.argv[1]) {
	case 'x':
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
		generate(process.argv.slice(2));
		break;
	}
	default: {
		log.w(`Unknown command <${process.argv[1]}>`);
		help();
		break;
	}
}

async function generate(args) {
	log.v(`Generate: ${args}`);
	switch (args[0]) {
		case 'system':
		case 's': {
			log.v(`Create systems with names: ${args.slice(1)}`);
			break;
		}
		case 'module':
		case 'm': {
			log.v(`Create modules with names: ${args.slice(1)}`);
			break;
		}
	}
}

function help() {
	log.v(`
  xGraph
  Introspective Systems LLC

    Commands:
      help: displays this help screen.
      run: Starts a system from config or cache
        Example: xgraph run --config config.json
                 xgraph run --cache cache/
    
  `);
}

async function reset() {
	try {
		await ensureNode();
		state = 'production';
		await genesis();
		startNexusProcess();
	} catch (e) {
		log.e(e);
	}
}

async function deploy() {
	try {
		await ensureNode();
		startNexusProcess();

	} catch (e) {
		log.e(e);
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
		log.e(e);
	}
}

async function compile() {
	try {
		await ensureNode();
		state = 'production';
		await genesis();
	} catch (e) {
		log.e(e);
	}
}


function startNexusProcess() {
	const { spawn } = require('child_process');
	let processPath = pathOverrides["cwd"] || path.resolve('./');
	log.v("Process PAth is ", processPath);


	let cacheDir = pathOverrides["cache"];
	log.v(cacheDir);
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
		log.v(`child process exited with code ${code}`);
	});
}


async function ensureNode() {
	// #ifdef LINUX
	let node = (execSync('which node').toString());

	if (node != '') {
		log.v();
		return;
	} else {
		await install();
	}
	// #else
	console.error(`Ensure Node is not yet supported on ${system}`);
	// #endif
}

function install() {
	return new Promise((resolve) => {
		// #ifdef LINUX
		require('https').get({
			host: 'nodejs.org',
			path: '/dist/v8.4.0/node-v8.4.0-linux-x64.tar.gz'
		}, (response) => {
			let body = '';
			response.pipe(fs.createWriteStream(bindir + '/node.tar.gz'));
			response.on('end', function () {
				// log.v('extraction time!');
				tar.decompress({
					src: bindir + '/node.tar.gz',
					dest: bindir
				}, function () {
					// log.v(mergedirs);
					try {
						mergedirs('node-v8.4.0-linux-x64/bin', '/usr/bin', 'overwrite');
						mergedirs('node-v8.4.0-linux-x64/include', '/usr/include', 'overwrite');
						mergedirs('node-v8.4.0-linux-x64/lib', '/usr/lib', 'overwrite');
						mergedirs('node-v8.4.0-linux-x64/share', '/usr/share', 'overwrite');
						//TODO RIMRAF THE ZIP AND EXTRACTED FILES
						// log.v('dun');
						resolve();
					} catch (e) {
						log.w('Could not install node, try running the command again with sudo\n');
						log.w("If the problem persists, email support@introspectivesystems.com");
						log.w('with this ' + e.toString());
						process.exit(1);
						resolve();
					}
				});
			});
		});
		// #else
		console.error(`System ${system} is not yet supported`);
		//node-msi.fetch.start

		// #endif
	});
}

function processSwitches() {
	// log.v('\u001b[0;32m Process Switches');
	for (let i = 0; i < process.argv.length; i++) {
		let str = process.argv[i];
		if (str.startsWith('--')) {
			let key = process.argv[i].slice(2);
			applySwitch(key, i);
		}
	}

	pathOverrides["cache"] = pathOverrides["cache"] || "./cache";

	// log.v(pathOverrides["cache"])

	// Directory is passed in Params.Cache or defaults to "cache" in the current working directory.
	// CacheDir = Params.cache || Path.join(CWD, "cache");


	// log.v(Object.keys(pathOverrides));

	if (!('cache' in pathOverrides))
		pathOverrides.cache = 'cache';

	if (!path.isAbsolute(pathOverrides.cache)) {
		pathOverrides.cache = path.resolve(path.resolve(pathOverrides.cwd || process.cwd()), pathOverrides.cache);
	}

	// log.v(`cache directory \u001b[1;34m${pathOverrides.cache}\u001b[0m`);
}

function applySwitch(str, i) {
	let val = null;
	if (str == "debug") {
		log.d("Doing the debug thing");
		return;
	}
	if ((i + 1) in process.argv) { // switch has a value
		val = process.argv[i + 1];
	}
	if (val != null)
		pathOverrides[str.toLowerCase()] = val;
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
		],
		env: {
			NODE_PATH: "node_modules"
		}
	}
};

function initSystem() {

}

function initModule() {

}

function initView() {

}