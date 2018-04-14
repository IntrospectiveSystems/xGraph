const {execSync} = require('child_process');
const path = require('path');
const xgraph = require('xgraph');

function exec(cmd) {
	console.log(`\n> ${cmd}\n`);
	execSync(cmd, {stdio: 'inherit'});
}


let windows, mac, linux, unix, system;

switch(process.platform) {
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

try {
	console.log('Starting Testing Script');
	console.log(`Platform:   ${system}`);
	console.log(`Windows:    ${windows}`);
	console.log(`macOS:      ${mac}`);
	console.log(`Linux:      ${linux}`);
	console.log(`Unix:       ${unix}`);

	// figure out the platform specific path of the standalone, for later use
	let binfolder = 'linux';
	if(mac) binfolder = 'mac';
	if(windows) binfolder = 'windows';
	let extension = '';
	if(windows) extension = '.exe';
	let nativePath = path.join(__dirname, '..', 'bin', binfolder, 'bin', `xgraph${extension}`);

	// build npm version
	{
		try {exec('npm install -g .');}
		catch(e){
			exec('sudo npm install -g .');
		}
		exec('which xgraph');
		exec('xgraph -v');
	}
	
	//build standalone version
	{
		exec('npm run build');
		exec(`${nativePath} -v`);
		// exec('npm run build');
	}

	// move in to the test directory
	process.chdir('Tests');
	
	// run tests on standalone version
	{
		exec(`${nativePath} c --CWD ValidationSystem --local ./ValidationSystem/Modules`);
		exec(`${nativePath} d --CWD ValidationSystem --local ./ValidationSystem/Modules`);
	}

	// run tests on npm version
	{
		exec('xgraph c --CWD ValidationSystem --local ./ValidationSystem/Modules');
		exec('xgraph d --CWD ValidationSystem --local ./ValidationSystem/Modules');
	}

	// test API access
	// {
	// 	console.dir(xgraph);
	// }


	console.log('\u001b[42;30mAll Tests passed Successfully!\nCongratulations, you\'re ready to merge!\u001b[0m');
	process.exit(0);
} catch (e) {
	console.log(e.message);
	process.exit(1);
}

