console.log("Executing");

console.log(process.cwd());
process.env.NODE_PATH = "node_modules/";
const { spawn } = require('child_process');
const ls = spawn("node", ["/home/trevor/xGraph/Nexus/Nexus/Nexus.js", ...process.argv], { env: process.env });

ls.stdout.on('data', (data) => {
	console.log(`stdout: ${data}`);
});

ls.stderr.on('data', (data) => {
	console.log(`stderr: ${data}`);
});

ls.on('close', (code) => {
	console.log(`child process exited with code ${code}`);
});