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

	// move in to the test directory
	process.chdir('Tests');
	exec('xgraph c --CWD ValidationSystem --local ./ValidationSystem/Modules');

	exec('xgraph d --CWD ValidationSystem --local ./ValidationSystem/Modules');

	console.log('');
	process.exit(0);
} catch (e) {
	console.log('');
	process.exit(1);
}

