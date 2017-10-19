console.log("Executing");

console.log(process.cwd());
console.log(JSON.stringify(process.env, null, 2));

process.env.NODE_PATH = "node_modules/";
const { spawn } = require('child_process');

console.log(`\nNexus Path: ${process.env.HOME}/xGraph/Nexus/Nexus/Nexus.js`);
const ls = spawn("node", [process.env.HOME+"/xGraph/Nexus/Nexus/Nexus.js", ...process.argv], { env: process.env });

ls.stdout.on('data', (data) => {
	console.log(`${data}`);
});

ls.stderr.on('data', (data) => {
	console.log(`${data}`);
});

ls.on('close', (code) => {
	console.log(`child process exited with code ${code}`);
});