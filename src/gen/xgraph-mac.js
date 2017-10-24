const { execSync } = require('child_process');
const tar = require('targz');
const fs = require('fs');
const mergedirs = require('merge-dirs').default;

let system = 'macOS';
let linux = false;
let windows = false;
let mac = true;
let unix = true;

let cwd = (process.cwd());
let bindir = process.argv[0].substr(0, process.argv[0].lastIndexOf('/'));

if(process.argv.length == 1) process.argv[1] = 'help';

switch(process.argv[1]) {
  case 'run': {
    run();
    break;
  }
  case 'help':
  case '--help': {
    help();
    break;
  }
  case 'g':
  case 'init': {
    init(process.argv.slice(2));
    break;
  }
  default: {
    console.log(`unknown command <${process.argv[1]}>`);
    help();
    break;
  }
}

async function init(args) {
  
  console.log('[', ...args, ']');

}

function help() {
	console.log(`
  xGraph
  Introspective Systems LLC

    Commands:
      help: displays this help screen.
      run: Starts a system from config or cache
        Example: xgraph run --config config.json
                 xgraph run --cache cache/
        
  `);
}

async function run() {
	try {
		await new Promise((resolve, reject) => ensureNode(_ => { if (_) resolve(); else reject(); }));
		console.log('look for config/cache here: ' + cwd);
		console.log('executable is here: ' + bindir);
		startChildProcess();
	} catch (e) {
		console.log(`ERR: ${e}`);
	}
}

function ensureNode(fun) {
		console.error(`System ${system} is not yet supported`);
	}

function install() {

	return new Promise((resolve) => {
	console.error(`System ${system} is not yet supported`);
	//node-msi.fetch.start

  });
}

//set all command line arguments to ENV variables
// let arg;
// for (let iarg = 0; iarg < process.argv.length; iarg++) {
// 	arg = process.argv[iarg];
// 	console.log(arg);
// 	parts = arg.split('=');
// 	if (parts.length == 2) {
// 		if (parts[0].toLowerCase() == "xgraph"){
// 			process.env['XGRAPH'] = parts[1];
// 		}
// 		else{
// 			process.env[parts[0]] = parts[1];
// 		}
// 	}
// }

// process.env.NODE_PATH = "node_modules/";
// const { spawn } = require('child_process');

// console.log(`\nNexus Path: ${process.env.XGRAPH}/Nexus/Nexus/Nexus.js`);
// const ls = spawn("node", [process.env.XGRAPH+"/Nexus/Nexus/Nexus.js", ...process.argv], { env: process.env });

// ls.stdout.on('data', (data) => {
// 	console.log(`${data}`);
// });

// ls.stderr.on('data', (data) => {
// 	console.log(`${data}`);
// });

// ls.on('close', (code) => {
// 	console.log(`child process exited with code ${code}`);
// });

function startChildProcess() {

  // set all command line arguments to ENV variables
  let arg;
  for (let iarg = 0; iarg < process.argv.length; iarg++) {
    arg = process.argv[iarg];
    console.log(arg);
    parts = arg.split('=');
    if (parts.length == 2) {
      if (parts[0].toLowerCase() == "xgraph") {
        process.env['XGRAPH'] = parts[1];
      }
      else {
        process.env[parts[0]] = parts[1];
      }
    }
  }

  process.env.NODE_PATH = "node_modules/";
  const { spawn } = require('child_process');

  console.log(`\nNexus Path: ${bindir.substr(0, bindir.lastIndexOf('/'))}/lib/Nexus/Nexus.js`);
  const ls = spawn("node", [`${bindir.substr(0, bindir.lastIndexOf('/'))}/lib/Nexus/Nexus.js`, ...process.argv], { env: process.env });

  ls.stdout.on('data', (data) => {
    console.log(`${data}`);
  });

  ls.stderr.on('data', (data) => {
    console.log(`${data}`);
  });

  ls.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
}









// -------------------------------------------------------------
//                       templating stuff
// -------------------------------------------------------------

let launchConfigBase = {
  version: "0.2.0",
  configurations: []
};
let config = (repo, system) => {return {
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
}};

function initSystem() {

}

function initModule() {

}

function initView() {

}