const fs = require('fs');
const readline = require('readline');
const levenshtein = require('fast-levenshtein');
const Volatile = require('volatile');

const TEST_RUN = 1;
const TEST_RECORD = 2;

let Signale;
try {
	Signale = require('signale').Signale;
} catch (e) {
	Signale = false;
}

class Logger {
	// =============== Constructor ======================
	//TODO:: Refactor constructor
	constructor(__options) {	
		this.#options = __options || {};

		// Parse options and process all relevant flags
		this.#checkOptions(this.#options);

		// Create Signale terminal interface
		this.#createTerminalInterface(this.#options);


		// Create volatile buffer to output to xgraph.log
		this.#createxgraphLog();

		// Create all log shorthand functions from #logTypes
		this.#createLogFunctions();

		this.#createTestFunction(this.#options.test);

		// Finished constructing Logger		
	}

	// =============== Private Properties ===============	

	#term;
	#xtest;
	#xgraphlog;
	#testlog;
	#xlog = true;
	#options;
	#profile = false;	
	#logFlags = {
		silent: 'silent',
		debug: ['error'],
		verbose: ['error', 'info', 'debug', 'verbose', 'warning'],
		xgraph: ['xgraph']
	};
	#logTypes = {
		verbose: {
			badge: '',
			color: 'grey',
			label: 'verbose',
			fun: 'v'
		},
		debug: {
			badge: '',
			color: 'magenta',
			label: 'debug',
			fun: 'd'
		},
		info: {
			badge: '',
			color: 'cyan',
			label: 'info',
			fun: 'i'
		},
		warning: {
			badge: '',
			color: 'yellow',
			label: 'warning',
			fun: 'w'
		},
		error: {
			badge: '',
			color: 'red',
			label: 'error',
			stream: process.stderr,
			fun: 'e'
		},
		test: {
			badge: '',
			color: 'green',
			label: 'test',
			fun: 't'
		},
		xgraph: {
			badge: '',
			color: 'magenta',
			label: 'xgraph',
			fun: 'x'
		},
		santa: {
			badge: '🎅',
			color: 'red',
			label: 'santa',
			fun: 'santa'
		},
		profiler: {
			badge: '',
			color: 'green',
			label: 'profiler',
			fun: 'p'
		},		
		yarr: {
			badge: '💀',
			color: 'red',
			label: 'yarr',
			fun: 'yarr'
		}
	};	

	// =============== Private Methods ==================


	/**
	 * @param {object{}} typeDefs
	 * @param {string} typeDefArr[].color
	 * @param {string} typeDefArr[].label
	 * @param {string} typeDefArr[].badge
	 */
	#addLogTypes(typeDefs) {
		for (let typeName in typeDefs) {
			let typeDef = typeDefs[typeName];
			this.#addLogType(typeName, typeDef);
		}
	}

	/**
	 * @param {object} typeDef
	 * @param {string} typeDef.color
	 * @param {string} typeDef.label
	 * @param {string} typeDef.badge
	 * @param {string} name
	 */
	#addLogType(name, typeDef) {		
		this.#logTypes[name] = typeDef;
	}

	#createTerminalInterface(options) {

		this.#term = new Signale({
			disabled: false,
			interactive: false,
			stream: process.stdout,
			scope: options.scope,
			types: this.#logTypes
		});

	}

	#createxgraphLog() {
		let that = this;
		this.#xgraphlog = (...str) => {			
			that.#xgraphlog.buffer.lock((val) => {
				val += `${that.logFileParse(str)}\n`;
				return val;
			});
			//if we dont currently have a write loop, start that
			if (!that.#xgraphlog.busy) {
				that.#xgraphlog.busy = true;
				that.#xgraphlog.updateInterval();
			}
		}
		this.#xgraphlog.buffer = new Volatile('');
		this.#xgraphlog.updateInterval = async () => {
			let str;
			await that.#xgraphlog.buffer.lock(val => {
				str = val;
				return '';
			});
			fs.appendFile(`${that.checkFlag('cwd')}/xgraph.log`, str, (_err) => {
				that.#xgraphlog.buffer.lock(val => {
					if (val !== '') {
						// we have more in out buffer, keep calling out to the thing
						process.nextTick(that.#xgraphlog.updateInterval);
					} else {
						that.#xgraphlog.busy = false;
					}
					return val;
				});
			});
		};

	}

	#createLogFunctions() {
		for (let logName in this.#logTypes) {
			let logType = this.#logTypes[logName];
			if (logType.fun == undefined) continue;
			if (logType.fun == 't') continue;
			if (logType.fun == 'p') continue;
			this.#createLogFunction(logType, logName);
		}
	}
	#createLogFunction(logType, logName) {
		let that = this;
		this[logType.fun] = (...str) => {			
			if (that.#xlog) {				
				that.#xgraphlog(new Date().getTime(), ...str);
			}
			if (!that.logLevels[logName]) return;
			that.#term[logName](...str);
		}
	}
	#createTestFunction(testOpt) {		
		let that = this;
		if (testOpt) {
			this.#testlog = (...str) => {
				that.#testlog.buffer.lock((val) => {
					console.log('logFileParse: ', val);
					val += `${that.logFileParse(str)}\n`;
					return val;
				});
				//if we dont currently have a write loop, start that
				if (!that.#testlog.busy) {
					that.#testlog.busy = true;
					that.#testlog.updateInterval();
				}
			}
			this.#testlog.buffer = new Volatile('');
			this.#testlog.updateInterval = async () => {
				let str;
				await that.#testlog.buffer.lock(val => {
					str = val;
					return '';
				});
				if (that.#xtest) {
					let filename = 'validate.log'
					if (that.#xtest == TEST_RECORD) {
						filename = 'test.log'
					}
					switch (that.#xtest) {
						case TEST_RUN:
							break;
						case TEST_RECORD:
							break;
					}

					fs.appendFile(`${that.checkFlag('cwd')}/${filename}`, str, (_err) => {
						that.#testlog.buffer.lock(val => {
							if (val !== '') {
								// we have more in out buffer, keep calling out to the thing
								process.nextTick(that.#testlog.updateInterval);
							} else {
								that.#testlog.busy = false;
							}
							return val;
						});
					});
				}
			};
		}
		if (testOpt == "record") {
			this.#xtest = TEST_RECORD;
			this.#setLogLevel(['test']);
			if (fs.existsSync(`${this.checkFlag('cwd')}/test.log`)) {
				fs.unlink(`${this.checkFlag('cwd')}/test.log`, (err) => {
					if (err) throw err;
				});
			}
		}
		if (testOpt == "run") {
			this.#xtest = TEST_RUN;
			this.#setLogLevel(['test']);
			if (fs.existsSync(`${this.checkFlag('cwd')}/validate.log`)) {
				fs.unlink(`${this.checkFlag('cwd')}/validate.log`, (err) => {
					if (err) throw err;
				});
			}
			if (fs.existsSync(`${this.checkFlag('cwd')}/results.log`)) {
				fs.unlink(`${this.checkFlag('cwd')}/results.log`, (err) => {
					if (err) throw err;
					console.log(`${this.checkFlag('cwd')}/results.log was deleted`);
				});
			}
		}
		this.t = (...str) => {
			if (!that.logLevels.test) return;
			that.#term.test(...str);
			that.#testlog(...str);
			if (that.#xlog) {				
				that.#xgraphlog(new Date().getTime(), ...str);
			}
		}
	}	

	#setLogLevel(logLevel) {	

		if (logLevel == 'silent') {
			for (let channel in this.logLevels) {
				this.logLevels[channel] = false;
			}			
			return;
		}

		for (let level of logLevel) {
			this.logLevels[level] = true;
		}
	}

	#checkOptions(options) {
		// Iterate through options
		for (let key in options) {
			// If the key is a valid option
			switch (key) {
				case 'types':
					this.#addLogTypes(options.types);
					break;
				case 'loglevel':
					this.#setLogLevel(options.loglevel);
					break;
				case 'loglevelsilent':
				case 'silent':
					this.#setLogLevel(this.#logFlags.silent);
					break;
				case 'logleveldebug':
				case 'debug':
					this.#setLogLevel(this.#logFlags.debug);
					break;
				case 'loglevelverbose':
				case 'verbose':
					this.#setLogLevel(this.#logFlags.verbose);
					break;
				case 'xgraph':
					this.#setLogLevel(this.#logFlags.xgraph);
					break;
				case 'xlog':					
					if (options.xlog == 'false') {this.#xlog = false;} else {this.#xlog = true;}
					break;
				case 'profile':
					this.#profile = true;
					this.#setLogLevel(['profiler']);
					break;
			}
		}
	}

	// =============== Public Properties ================
	timers = {};
	timeCsv = '';
	logLevels = {
		verbose: false,
		debug: false,
		info: true,
		warning: true,
		error: true,
		test: false,
		xgraph: false,
		profiler: false		
	};

	/*
	help(functionName) {
		//Display parameters and purpose of public functions
	}*/

	p(profile, ...str) {
		if (!this.logLevels.profiler) return undefined;
		this.#term.profiler(profile, ...str);
		if (typeof profile == 'object') {
			return this.time(profile);
		} else {
			return this.time(profile, ...str);
		}
	}
	pi(profile) {
		if (!this.logLevels.profiler) return;
		this.#term.profiler(profile);
	}


	// =============== Public Methods ===================
	checkFlag(flag) {
		if (!this.#options) return false;
		return flag in this.#options && this.#options[flag];
	}

	newLogType(name, typeDef) {		
		//TODO:: Ensure name is valid		
		this.#addLogType(name, typeDef);
		this.#createTerminalInterface(this.#options);
		//TODO:: Ensure typeDef is valid
		this.#createLogFunction(typeDef, name);		
	}

	setLogLevel(logLevel) {
		//TODO:: Ensure logLevel is valid
		this.#setLogLevel(logLevel);
	}

	config(config) {
		let newConfig = {};
		Object.assign(newConfig, this.#options, config);
		this.#createTerminalInterface(newConfig);	
	}

	logFileParse(outputs) {
		try {
			let arr = [];
			for (let obj of outputs) {
				if (obj == null){
					arr.push('null');
					continue;
				}				
				if (typeof obj == 'object') {
					// if the object has defined a way to be seen, use it
					if (obj.hasOwnProperty('toString')) {
						arr.push(obj.toString());
					}
					else {
						try {
							//otherwise try to stringify it
							arr.push(JSON.stringify(obj, null, 2));
						} catch (e) {
							// if we fail (ex, cyclic objects), just dump the keys
							arr.push('Object keys: '
								+ JSON.stringify(Object.keys(obj), null, 2));
						}
					}
				} else if (typeof obj == 'undefined') {
					arr.push('undefined');								
				} else {
					arr.push(obj.toString());
				}
			}
			return arr.join(' ');
		} catch (ex) {
			let write = process.stdout.write;
			write('\u001b[31m[ERRR] An error has occurred trying to parse a log.\n');
			write('\u001b[31m[ERRR] ============================================\n');
			write(ex.toString() + '\n');
			write('\u001b[31m[ERRR] ============================================\n');
		}
	}	

	time(name) {
		if (!this.#profile) return 0;
		let id = Math.floor(Math.random() * 100000);
		this.timers[id] = {
			start: this.microtime(),
			name: name
		}
		return id;
	}
	microtime() {
		let hrTime = process.hrtime();
		return (hrTime[0] * 1000000 + hrTime[1] / 1000);
	}
	timeEnd(id) {
		if (!this.#profile) return;
		if (!(id in (this.timers || {})))
			return;
		let elapsed = (this.microtime() - this.timers[id].start) / 1000;
		let output = {};
		if (typeof this.timers[id].name == 'object') {
			output = this.timers[id].name;
		}
		output.start = this.timers[id].start;
		output.elapsed = elapsed;
		this.#term.profiler(output);
		delete this.timers[id];
	}
	async validateTest() {
		let that = this;
		let result = 1 // Success

		if (!fs.existsSync(`${that.checkFlag('cwd')}/test.log`) || !fs.existsSync(`${that.checkFlag('cwd')}/test.log`)) {

			let write = process.stdout.write;
			write('Test Validation ERROR: missing files')
			if (!fs.existsSync(`${that.checkFlag('cwd')}/test.log`)) {
				write(`\t${that.checkFlag('cwd')}/test.log`)
			}
			if (!fs.existsSync(`${that.checkFlag('cwd')}/validate.log`)) {
				write(`\t${that.checkFlag('cwd')}/validate.log`)
			}
			return false
		}
		if (fs.existsSync(`${that.checkFlag('cwd')}/results.log`)) {
			fs.unlink(`${that.checkFlag('cwd')}/results.log`, (err) => {
				if (err) throw err;
			});
		}

		const fileStream_test = fs.createReadStream(`${that.checkFlag('cwd')}/test.log`);

		const rl_test = readline.createInterface({
			input: fileStream_test,
			crlfDelay: Infinity
		});
		// Note: using the crlfDelay option to recognize all instances of CR LF
		// ('\r\n') in input.txt as a single line break.

		let test_str_map = new Map()
		let failed_strs = []
		for await (const line of rl_test) {
			test_str_map.set(line, true)
		}

		const fileStream_validate = fs.createReadStream(`${that.checkFlag('cwd')}/validate.log`);

		const rl_validates = readline.createInterface({
			input: fileStream_validate,
			crlfDelay: Infinity
		});

		for await (const line of rl_validates) {
			if (test_str_map.has(line)) {
				test_str_map.delete(line)
			} else {
				failed_strs.push(line)
			}
		}

		if (failed_strs.length > 0) result = 0 // TEST HAS FAILED

		for (let failed_str of failed_strs) {
			let lowest_distance = 10000
			let lowest_str = null
			for (let [key, value] of test_str_map) {
				let distance = levenshtein.get(failed_str, key)
				if (distance < lowest_distance) {
					lowest_distance = distance
					lowest_str = key
				}
			}
			let str = `MATCH FAILED:\n\t${failed_str}\n`
			if (lowest_str != null) {
				str = `MATCH FAILED:\n\t${failed_str}\n\t ! ${lowest_str}\n`
			}

			fs.appendFileSync(`${that.checkFlag('cwd')}/results.log`, str, (_err) => {
				if (_err) {
					console.log(`testlog append failed: ${str}   (results.log)`)
				}
			});
		}
		let ms = 2000 // wait two seconds to let the supposedly sycronous file writes to finish			
		await new Promise(r => setTimeout(r, ms));

		process.exit(result)
	}
}

// Export the class instead of a function
module.exports = Logger;