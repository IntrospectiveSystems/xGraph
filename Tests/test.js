const path = require('path');
const xgraph = require('xgraph');
const { spawn, execSync } = require('child_process');
const which = require('which');
const fs = require('fs');
const rimraf = require('rmdir-recursive').sync;
const fast = process.argv.indexOf('--fast') > -1;
const debug = process.argv.indexOf('--debug') > -1;
const full = !fast;


process.on('SIGINT', _ => {
	if('proc' in exec && exec.proc !== null) {
		exec.proc.kill();
	}
});

function exec(cmd, checkLength = false) {
	return new Promise(async (resolve) => {
		console.log(`\n> ${cmd}\n`);

		// if we dont need to check anything, just do a simple exec
		// with inherit to give isTTY: true
		if(!checkLength) {
			execSync(cmd, {stdio: 'inherit'});
			resolve();
			return;
		}

		//elsewise, lets parse this command out
		let command = cmd.split(' ')[0];
		let args = cmd.split(' ').slice(1);
		let hasOutput = false;

		// normalizing the command to a path
		command = await new Promise((resolve) => {
			try {
				//if its a file, roll with it
				fs.lstatSync(command).isFile();
				resolve(command);
			} catch (e) {
				//it probably wasnt a file though, so we'll call which on it
				which(command, (err, path) => {
					if(err) resolve(command);
					// and resolve to the path is returns.
					else resolve(path);
				});
			}
		});

		// spawn a process with all streams piped to events.
		const proc = spawn(command, args, {stdio: 'inherit'});
		exec.proc = proc;
		// pipe streams back to our own streams
		// proc.stdout.on('data', (data) => {
		// 	if(data.toString().trim() !== '' && !hasOutput) {
		// 		// if we get anything of substance back, remember that!
		// 		hasOutput = true;
		// 	}
		// 	process.stdout.write(data.toString());
		// });
		// proc.stderr.on('data', (data) => process.stderr.write(data.toString()));

		// when it exits, validate its a zero, and we've had output...
		// then resolve this exec call.
		proc.on('close', (code) => {
			console.log('asdf');
			if(code != 0) process.exit(code);
			// if(!hasOutput) process.exit(1);
			exec.proc = null;
			resolve();
		});
	});
	// if(output.trim() == '') {
	// 	console.log('Command machine broke.');
	// 	system.exit(1);
	// }
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

(async () => {
	try {
		console.log('Starting Testing Script');
		console.log(`Platform:   ${system}`);
		console.log(`Windows:    ${windows}`);
		console.log(`macOS:      ${mac}`);
		console.log(`Linux:      ${linux}`);
		console.log(`Unix:       ${unix}`);

		let npmxgraph = path.resolve('./node_modules/.bin/xgraph' + (windows ? '.cmd' : ''));
		if(debug) {
			npmxgraph = 'node --inspect-brk=52310 ' + path.resolve('./node_modules/xgraph/src/xgraph.js');
		}

		// build npm version
		if(full) await exec(`${npmxgraph} -v`, true);

		// run tests on npm version
		await exec(`${npmxgraph} r --CWD ValidationSystem --loglevel verbose --local ./ValidationSystem/Modules`, true);
		

		if(full) {
			await exec(`${npmxgraph} c --CWD ValidationSystem --verbose --local ./ValidationSystem/Modules`, true);
			await exec(`${npmxgraph} d --CWD ValidationSystem --verbose --local ./ValidationSystem/Modules`, true);
			await exec(`${npmxgraph} x --CWD ValidationSystem --verbose --local ./ValidationSystem/Modules`, true);
			rimraf('ValidationSystem/cache');
			await exec(`${npmxgraph} x --CWD ValidationSystem --verbose --local ./ValidationSystem/Modules`, true);
		}

		console.log('\u001b[42;30mAll Tests passed Successfully!\nCongratulations, you\'re ready to merge!\u001b[0m');
		process.exit(0);
	} catch (e) {
		console.log(e.message);
		process.exit(1);
	}

})();
