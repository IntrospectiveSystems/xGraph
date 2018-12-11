const fs = require('fs');
const {Signale} = require('signale');
const Volatile = require('volatile');

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
	let term = new Signale({
		disabled: false,
		interactive: false,
		stream: process.stdout,
		types: {
			verbose: {
				badge: '',
				color: 'grey',
				label: 'verbose'
			},
			debug: {
				badge: '',
				color: 'magenta',
				label: 'debug'
			},
			info: {
				badge: '',
				color: 'cyan',
				label: 'info'
			},
			warning: {
				badge: '',
				color: 'yellow',
				label: 'warning'
			},
			error: {
				badge: '',
				color: 'red',
				label: 'error'
			},
			santa: {
				badge: '🎅',
				color: 'red',
				label: 'santa'
			}
		}
	});

	function checkFlag(flag) {
		// console.dir(__options);
		return flag in __options && __options[flag];
	}

	// The logging function for writing to xgraph.log to the current working directory
	const xgraphlog = (...str) => {
		xgraphlog.buffer.lock((val) => {
			val += `${log.logFileParse(str)}\n`;
			return val;
		});
		//if we dont currently have a write loop, start that
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
				return val;
			});
		});
	};

	// Set the default logging profile
	//in this order, too, its great.
	let printVerbose = false;
	let printDebug = false;
	let printInfo = true;
	let printWarn = true;
	let printError = true;

	if (checkFlag('silent')
		|| checkFlag('loglevel') === 'silent'
		|| checkFlag('loglevelsilent')) {
		printInfo = false;
		printWarn = false;
		printError = false;
	}

	if (checkFlag('debug')
		|| checkFlag('loglevel') === 'debug'
		|| checkFlag('logleveldebug')) {
		printDebug = true;
	}

	if (checkFlag('verbose')
		|| checkFlag('loglevel') === 'verbose'
		|| checkFlag('loglevelverbose')) {
		printVerbose = true;
		printDebug = true;
	}

	let log = {
		v: (...str) => {
			xgraphlog(new Date().getTime(), ...str);
			if (!printVerbose) return;
			term.verbose(...str);
			// term.info(...str);
			// process.stdout.write(log.parse(log.tag.verbose, str));
		},
		d: (...str) => {
			xgraphlog(new Date().getTime(), ...str);
			if (!printDebug) return;
			term.debug(...str);
			// process.stdout.write(log.parse(log.tag.debug, str));
		},
		i: (...str) => {
			xgraphlog(new Date().getTime(), ...str);
			if (!printInfo) return;
			// console.log(Buffer.from(str[0]));
			term.info(...str);
			// process.stdout.write(log.parse(log.tag.info, str));
		},
		w: (...str) => {
			xgraphlog(new Date().getTime(), ...str);
			if (!printWarn) return;
			term.warning(...str);
			// process.stdout.write(log.parse(log.tag.warn, str));
		},
		e: (...str) => {
			xgraphlog(new Date().getTime(), ...str);
			if (!printError) return;
			term.error(...str);
			// process.stdout.write(log.parse(log.tag.error, str));
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
					// if (line.length > 80) {
					// 	line = line.substr(0, 34)
					// 		+ ' ... ' + line.substr(-34, 34);
					// }
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

	// log.tag = {};
	// log.tag.verbose = '\u001b[90m[VRBS]';
	// log.tag.debug = '\u001b[35m[DBUG]';
	// log.tag.info = '\u001b[36m[INFO]';
	// log.tag.warn = '\u001b[33m[WARN]';
	// log.tag.error = '\u001b[31m[ERRR]';
	log.eol = '\u001b[39m\r\n';

	log.eol = '\r\n';
	log.tag = {
		verbose: '', debug: '', info: '', warn: '', error: ''
	};

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