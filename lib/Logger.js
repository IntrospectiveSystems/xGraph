const fs = require('fs');

/**
 * Creates the log object and returns it.
 * The defined log levels for outputting to the std.out() (ex. log. v(), log. d() ...)
 * Levels include:
 * v : verbose		Give too much information
 * d : debug		For debugging purposes not in production level releases
 * i : info			General info presented to the end user
 * w : warn			Failures that dont result in a system exit
 * e : error 		Critical failure should always follow with a system exit
 */
module.exports = function createLogger(__options) {

	function checkFlag(flag) {
		// console.dir(__options);
		return flag in __options && __options[flag];
	}
	
	class Volatile {
		constructor(obj) {
			this.obj = obj;
		}
		lock(actionFunction) {
			return new Promise(unlock => {
				let inst = this;
				if (this.queue instanceof Promise) {
					this.queue = this.queue.then(async function () {
						let ret = actionFunction(inst.obj);
						if (ret instanceof Promise) ret = await ret;
						inst.obj = ret;
						unlock();
					});
				} else {
					this.queue = new Promise(async (resolve) => {
						let ret = actionFunction(this.obj);
						if (ret instanceof Promise) ret = await ret;
						this.obj = ret;
						unlock();
						resolve();
					});
				}
			});
		}
		toString() {
			return this.obj.toString() || 'no toString defined';
		}
	}

	// The logging function for writing to xgraph.log to the current working directory
	const xgraphlog = (...str) => {
		xgraphlog.buffer.lock((val) => {
			// console.log('previous', val);
			// console.log('adding', `${log.logFileParse(str)}${endOfLine}`);
			return val + `${log.logFileParse(str)}\n`;
		});
		if (!xgraphlog.busy) {
			xgraphlog.busy = true;
			xgraphlog.updateInterval();
		}
	};
	xgraphlog.buffer = new Volatile('');
	xgraphlog.updateInterval = async () => {
		let str;
		await xgraphlog.buffer.lock(val => {
			str = val;
			return '';
		});
		fs.appendFile(`${process.cwd()}/xgraph.log`, str, (_err) => {
			xgraphlog.buffer.lock(val => {
				if (val !== '') {
					// we have more in out buffer, keep calling out to the thing
					process.nextTick(xgraphlog.updateInterval);
				} else {
					xgraphlog.busy = false;
				}
			});
		});
	};

	// Set the default logging profile
	let printVerbose = false;
	let printDebug = false;
	let printInfo = true;
	let printWarn = true;
	let printError = true;

	if (checkFlag('silent') || checkFlag('loglevelsilent')) {
		printInfo = false;
		printWarn = false;
		printError = false;
	}

	if (checkFlag('logleveldebug')) {
		printVerbose = true;
		printDebug = true;
	}

	if (checkFlag('verbose') || checkFlag('loglevelverbose')) {
		printVerbose = true;
	}

	let log = {
		v: (...str) => {
			xgraphlog(new Date().getTime(), ...str);
			if (!printVerbose) return;
			process.stdout.write(log.parse(log.tag.verbose, str));
		},
		d: (...str) => {
			xgraphlog(new Date().getTime(), ...str);
			if (!printDebug) return;
			process.stdout.write(log.parse(log.tag.debug, str));
		},
		i: (...str) => {
			xgraphlog(new Date().getTime(), ...str);
			if (!printInfo) return;
			process.stdout.write(log.parse(log.tag.info, str));
		},
		w: (...str) => {
			xgraphlog(new Date().getTime(), ...str);
			if (!printWarn) return;
			process.stdout.write(log.parse(log.tag.warn, str));
		},
		e: (...str) => {
			xgraphlog(new Date().getTime(), ...str);
			if (!printError) return;
			process.stdout.write(log.parse(log.tag.error, str));
		},
		parse: (tag, outputs) => {
			try {
				let arr = [];
				for (let obj of outputs) {
					if (typeof obj == 'object') {
						// if the object has defined a way to be seen, use it
						if (obj.hasOwnProperty('toString')) arr.push(obj.toString());
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
				let lines = arr.join(' ').split(/[\r]{0,1}[\n]/);
				let output = '';
				for (let line of lines) {
					if (line.length > 80) {
						line = line.substr(0, 34)
							+ ' ... ' + line.substr(-34, 34);
					}
					output += `${tag} ${line}${log.eol}`;
				}
				return output;
			} catch (ex) {
				let write = process.stdout.write;
				write('\u001b[31m[ERRR] An error has occurred trying to parse a log.\n');
				write('\u001b[31m[ERRR] ============================================\n');
				write(ex.toString() + '\n');
				write('\u001b[31m[ERRR] ============================================\n');
			}

		},
		logFileParse: (outputs) => {
			try {
				let arr = [];
				for (let obj of outputs) {
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
	};

	log.tag = {};
	log.tag.verbose = '\u001b[90m[VRBS]';
	log.tag.debug = '\u001b[35m[DBUG]';
	log.tag.info = '\u001b[36m[INFO]';
	log.tag.warn = '\u001b[33m[WARN]';
	log.tag.error = '\u001b[31m[ERRR]';
	log.eol = '\u001b[39m\r\n';

	log.microtime = _ => {
		let hrTime = process.hrtime();
		return (hrTime[0] * 1000000 + hrTime[1] / 1000);
	};
	log.time = _ => {
		log.timers = log.timers || {};
		log.timers[_] = log.microtime();
	};
	log.timeEnd = _ => {
		if (!(_ in (log.timers || {})))
			return;
		let elapsed = (log.microtime() - log.timers[_]) / 1000;
		log.timers[_] = undefined;
		log.i(`${_}: ${elapsed.toFixed(2)}ms`);
	};

	return log;

};