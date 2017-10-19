const {execSync} = require('child_process');
const tar = require('targz');
const fs = require('fs');
const mergedirs = require('merge-dirs').default;

let system = 'linux';
let linux = true;
let windows = false;
let mac = false;
let unix = true;

let cwd = (process.cwd());
let bindir = process.argv[0].substr(0, process.argv[0].lastIndexOf('/'));

// console.log('OS:', system);

// console.log(...process.argv);

if(process.argv.length == 1) process.argv[1] = 'run';

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
  default: {
    console.log(`unknown command <${process.argv[1]}>`);
    help();
    break;
  }
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
        
  `)
}

async function run() {
  try{
    await new Promise((resolve, reject) => ensureNode(_ => {if(_) resolve(); else reject();}));
    console.log('look for config/cache here: ' + cwd);
    console.log('executable is here: ' + bindir);
  }catch(e) {
    console.log(`ERR: ${e}`);
  }
}

function ensureNode(fun) {
  if(linux) {
    let node = (execSync('which node').toString());
    node = '';
    if(node != '') {
      console.log();
      fun(true);
    }
    else {
      require('https').get({
        host: 'nodejs.org',
        path: '/dist/v8.4.0/node-v8.4.0-linux-x64.tar.gz'
      }, (response) => {
        let body = '';
        response.pipe(fs.createWriteStream(bindir + '/node.tar.gz'));
        response.on('end', function() {
          // console.log('extraction time!');
          tar.decompress({
            src: bindir + '/node.tar.gz',
            dest: bindir
          }, function() {
            // console.log(mergedirs);
            try {
              mergedirs('node-v8.4.0-linux-x64/bin', '/usr/bin', 'overwrite');
              mergedirs('node-v8.4.0-linux-x64/include', '/usr/include', 'overwrite');
              mergedirs('node-v8.4.0-linux-x64/lib', '/usr/lib', 'overwrite');
              mergedirs('node-v8.4.0-linux-x64/share', '/usr/share', 'overwrite');
              //TODO RIMRAF THE ZIP AND EXTRACTED FILES
              console.log('dun');
            }catch(e) {
              console.log('Could not install node, try running the command again with sudo\n');
              console.log("If the problem persists, email support@introspectivesystems.com");
              console.log('with this ' + e.toString());
            }
            
          });
        });
      });
    }
  }
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