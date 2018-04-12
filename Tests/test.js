const {execSync} = require('child_process');

function exec(cmd) {
	console.log(`\n> ${cmd}\n`);
	execSync(cmd, {stdio: 'inherit'});
}

try {
	console.log('Starting Testing Script');

	exec('npm install -g .');
	exec('which xgraph');
	exec('xgraph -v');
	exec('xgraph c --CWD ValidateSystem --local ./ValidateSystem/ --core');

	console.log('');
	process.exit(0);
} catch (e) {
	console.error(e);
	process.exit(1);
}

