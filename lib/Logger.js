const fs = require('fs');
const readline = require('readline');
const levenshtein = require('fast-levenshtein');

let Signale;
try {
	Signale = require('signale').Signale;
}catch (e) {
	Signale = false;
}
const browserLog = (function() {
	try {
		return {
			verbose: console.debug.bind(window.console, '%c[VRBS] %s', 'color: gray'),
			debug: console.debug.bind(window.console, '%c[DBUG] %s', 'color: magenta'),
			info: console.info.bind(window.console, '%c[INFO] %s', 'color: cyan; background-color:#242424;'),
			warning: console.warn.bind(window.console, '%c[WARN] %s', 'color: yellow; background-color:#242424;'),
			error: console.error.bind(window.console, '%c[ERRR] %s', 'color: red'),
			santa: console.log.bind(window.console, '%c[SNTA] %s', 'color: green')
		};
	} catch (e) {
		return {
			verbose: _=>_,
			debug: _=>_,
			warning: _=>_,
			info: _=>_,
			error: _=>_,
			santa: _=>_
		}
	}
})();
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
	let term;
	if (Signale) term = new Signale({
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
				label: 'error',
				stream: process.stderr
			},
			test: {
				badge: '',
				color: 'green',
				label: 'test'
			},
			xgraph: {
				badge: '',
				color: 'magenta',
				label: 'xgraph'
			},
			santa: {
				badge: '🎅',
				color: 'red',
				label: 'santa'
			}
		}
	});
	else term = browserLog;

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
		fs.appendFile(`${checkFlag('cwd')}/xgraph.log`, str, (_err) => {
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

	// The logging function for writing to xgraph.log to the current working directory
	const testlog = (...str) => {
		testlog.buffer.lock((val) => {
			val += `${log.logFileParse(str)}\n`;
			return val;
		});
		//if we dont currently have a write loop, start that
		if (!testlog.busy) {
			testlog.busy = true;
			testlog.updateInterval();
		}
	};

	testlog.buffer = new Volatile('');

	// Set the default logging profile
	//in this order, too, its great.
	let printVerbose = false;
	let printDebug = false;
	let printInfo = true;
	let printWarn = true;
	let printError = true;
	let printProfile = false;
    let printTest = false;
	let printxGraph = false;
	let xlog = true;
    let xtest = null;

    const TEST_RUN = 1
    const TEST_RECORD = 2

	if(checkFlag('xlog') === 'silent') {
		xlog = false;
	}

	if(checkFlag('test') === 'record') {
		xtest = TEST_RECORD;
        printTest = true
        if (fs.existsSync(`${checkFlag('cwd')}/test.log`)) {
            fs.unlink(`${checkFlag('cwd')}/test.log`, (err) => {
                if (err) throw err;
            }); 	
        }
    }

	if(checkFlag('test') === 'run') {
		xtest = TEST_RUN;
        printTest = true
        if (fs.existsSync(`${checkFlag('cwd')}/validate.log`)) {
            fs.unlink(`${checkFlag('cwd')}/validate.log`, (err) => {
                if (err) throw err;
            }); 	
        }
        if (fs.existsSync(`${checkFlag('cwd')}/results.log`)) {
            fs.unlink(`${checkFlag('cwd')}/results.log`, (err) => {
                if (err) throw err;
                console.log(`${checkFlag('cwd')}/results.log was deleted`);
            }); 	
        }
	}
	
	testlog.updateInterval = async () => {
		let str;
		await testlog.buffer.lock(val => {
			str = val;
			return '';
		});
        if (xtest) {
            let filename = 'validate.log'
            if (xtest == TEST_RECORD) {
                filename = 'test.log'
            }
            switch (xtest) {
                case TEST_RUN:
                    break;
                case TEST_RECORD:
                    break;
            }
    
            fs.appendFile(`${checkFlag('cwd')}/${filename}`, str, (_err) => {
                testlog.buffer.lock(val => {
                    if (val !== '') {
                        // we have more in out buffer, keep calling out to the thing
                        process.nextTick(testlog.updateInterval);
                    } else {
                        testlog.busy = false;
                    }
                    return val;
                });
            });
        }
	};

	if(checkFlag('profile')) {
		printProfile = true;
		printInfo = false;
		printWarn = false;
        printTest = false;
		// printError = false;
	} else if (checkFlag('silent')
		|| checkFlag('loglevel') === 'silent'
		|| checkFlag('loglevelsilent')) {
		printInfo = false;
		printWarn = false;
        printTest = false;
		//printError = false;
	} else if (checkFlag('debug')
		|| checkFlag('loglevel') === 'debug'
		|| checkFlag('logleveldebug')) {
		printDebug = true;
		printTest = true;
		printxGraph = true;
	} else if (checkFlag('verbose')
		|| checkFlag('loglevel') === 'verbose'
		|| checkFlag('loglevelverbose')) {
		printVerbose = true;
		printDebug = true;
        printTest = true;
	}
	
	if(checkFlag('xlog')) {
		printxGraph = true;
	}
	

	let log = {
		x: (...str) => {
			if (xlog) {
				xgraphlog(new Date().getTime(), ...str);
			}			
			if (printxGraph) {
				term.xgraph(...str);
			}
		},
		v: (...str) => {
			if (xlog) {
				xgraphlog(new Date().getTime(), ...str);
			}			
			if (printVerbose) {
				term.verbose(...str);
			}	
		},
		d: (...str) => {
			if (xlog) {
				xgraphlog(new Date().getTime(), ...str);
			}		
			if (printDebug) {
				term.debug(...str);
			}
		},
		i: (...str) => {
			if (xlog) {
				xgraphlog(new Date().getTime(), ...str);
			}			
			if (printInfo) {
				term.info(...str);
			}			
		},
		w: (...str) => {
			if (xlog) {
				xgraphlog(new Date().getTime(), ...str);
			}		
			if (printWarn) {
				term.warning(...str);
			}			
		},
		e: (...str) => {			
			
			if (xlog) {
				xgraphlog(new Date().getTime(), ...str);
			}
			if (printError) {
				term.error(...str);
			}			
        },
		t: (...str) => {			
			
			if (xlog) {
				xgraphlog(new Date().getTime(), ...str);
			}
			if (xtest) {
				testlog(...str);
			}
			if (printTest) {
				term.test(...str);
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
		},
        async validateTest() {
            result = 1 // Success

            if (!fs.existsSync(`${checkFlag('cwd')}/test.log`) || !fs.existsSync(`${checkFlag('cwd')}/test.log`)) {

                let write = process.stdout.write;
                write('Test Validation ERROR: missing files')
                if (!fs.existsSync(`${checkFlag('cwd')}/test.log`)) {
                    write(`\t${checkFlag('cwd')}/test.log`)
                }
                if (!fs.existsSync(`${checkFlag('cwd')}/validate.log`)) {
                    write(`\t${checkFlag('cwd')}/validate.log`)
                }
                return false
            }
            if (fs.existsSync(`${checkFlag('cwd')}/results.log`)) {
                fs.unlink(`${checkFlag('cwd')}/results.log`, (err) => {
                    if (err) throw err;
                }); 	
            }
    
            const fileStream_test = fs.createReadStream(`${checkFlag('cwd')}/test.log`);

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

            const fileStream_validate = fs.createReadStream(`${checkFlag('cwd')}/validate.log`);

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

                fs.appendFileSync(`${checkFlag('cwd')}/results.log`, str, (_err) => {
                    if (_err) {
                        console.log (`testlog append failed: ${str}   (results.log)`)                    
                    }
                });
            }
			let ms = 2000 // wait two seconds to let the supposedly sycronous file writes to finish
			const sleep = ms =>  new Promise(r => setTimeout(r, ms));
			await new Promise(r => setTimeout(r, ms));
	
			process.exit(result)
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
		verbose: '', debug: '', info: '', warn: '', error: '', test: '', xgraph: '', santa: ''
	};
	log.timeCsv = '';

	log.microtime = _ => {
		let hrTime = process.hrtime();
		return (hrTime[0] * 1000000 + hrTime[1] / 1000);
	};
	log.time = name => {
		if(!printProfile) return 0;
		// console.log('starting ' + name)
		log.timers = log.timers || {};
		let id = Math.floor(Math.random() * 100000);
		log.timers[id] = {
			start: log.microtime(),
			name: name
		}
		return id;
	};
	log.timeEnd = id => {
		if(!printProfile) return 0;
		
		if (!(id in (log.timers || {})))
			return;
		let elapsed = (log.microtime() - log.timers[id].start) / 1000;
		const str = `${log.timers[id].name}\t${log.timers[id].start}\t${elapsed}\n`;
		process.stdout.write(str);
		log.timeCsv += str;
		log.timers[id] = undefined;
	};
	
	return log;

};