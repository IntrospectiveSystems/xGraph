console.log("Executing");
console.log(process.cwd());

//set all command line arguments to ENV variables
let arg;
for (let iarg = 0; iarg < process.argv.length; iarg++) {
	arg = process.argv[iarg];
	console.log(arg);
	parts = arg.split('=');
	if (parts.length == 2) {
		if (parts[0].toLowerCase() == "xgraph"){
			process.env['XGRAPH'] = parts[1];
		}
		else{
			process.env[parts[0]] = parts[1];
		}
	}
}

process.env.NODE_PATH = "node_modules/";
const { spawn } = require('child_process');

console.log(`\nNexus Path: ${process.env.XGRAPH}/Nexus/Nexus/Nexus.js`);
const ls = spawn("node", [process.env.XGRAPH+"/Nexus/Nexus/Nexus.js", ...process.argv], { env: process.env });

ls.stdout.on('data', (data) => {
	console.log(`${data}`);
});

ls.stderr.on('data', (data) => {
	console.log(`${data}`);
});

ls.on('close', (code) => {
	console.log(`child process exited with code ${code}`);
});