const path = require('path');
const xgraph = require('xgraph');
const { spawn, execSync } = require('child_process');
const which = require('which');
const fs = require('fs');
const rimraf = require('rmdir-recursive').sync
const fast = process.argv.indexOf('--fast') > -1;
const full = !fast;

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
		let command = cmd.split(' ')[0]
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
					else resolve(path)
				});
			}
		});

		// spawn a process with all streams piped to events.
		const proc = spawn(command, args);

		// pipe streams back to our own streams
		proc.stdout.on('data', (data) => {
			if(data.toString().trim() !== '' && !hasOutput) {
				// if we get anything of substance back, remember that!
				hasOutput = true;
			}
			process.stdout.write(data.toString())
		});
		proc.stderr.on('data', (data) => process.stderr.write(data.toString()));

		// when it exits, validate its a zero, and we've had output...
		// then resolve this exec call.
		proc.on('close', (code) => {
			if(code != 0) process.exit(code);
			if(!hasOutput) process.exit(1);
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

		let npmxgraph = path.resolve("./node_modules/.bin/xgraph" + (windows ? '.cmd' : ''));

		// build npm version
		{
			try {await exec('npm install --verbose');}
			catch(e){
				if(unix) {
					try {
						await exec('sudo npm install --verbose');
					}catch(e) {
						console.error(e);
						process.exit(1);
					}
				}
				else {
					process.exit(1);
				}
			}

			await exec(`${npmxgraph} -v`, true);
		}
		
		// run tests on npm version
		{
			if(full) await exec(`${npmxgraph} c --logleveldebug --CWD ValidationSystem --local ./ValidationSystem/Modules`, true);
			if(full) await exec(`${npmxgraph} d --logleveldebug --CWD ValidationSystem --local ./ValidationSystem/Modules`, true);
			await exec(`${npmxgraph} r --logleveldebug --CWD ValidationSystem --local ./ValidationSystem/Modules`, true);
			if(full) await exec(`${npmxgraph} x --logleveldebug --CWD ValidationSystem --local ./ValidationSystem/Modules`, true);
			if(full) rimraf(`ValidationSystem/cache`);
			if(full) await exec(`${npmxgraph} x --logleveldebug --CWD ValidationSystem --local ./ValidationSystem/Modules`, true);
		}

		console.log('\u001b[42;30mAll Tests passed Successfully!\nCongratulations, you\'re ready to merge!\u001b[0m');
		process.exit(0);
	} catch (e) {
		console.log(e.message);
		process.exit(1);
	}

})()
