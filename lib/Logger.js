// Logger.js
const fs = require('fs');
const readline = require('readline');
const levenshtein = require('fast-levenshtein');
const Volatile = require('volatile');
const path = require('path');

const TEST_RUN = 1;
const TEST_RECORD = 2;

let Signale;
try {
  Signale = require('signale').Signale;
} catch (e) {
  Signale = false;
}

class Logger {
  constructor(options = {}) {
    this.#options = options;
    this.#pid = this.checkFlag('pid') || process.pid;
    this.xlog = true;
    this.#profile = false;
    this.#xtest = null;
    //this.testlog = null;

    // Process initial options
    this.#checkOptions(this.#options);
  }

  // =============== Private Fields ================
  #options;
  xlog;
  #profile;
  #pid;
  #xtest;
  //testlog;

  #doLogRotation = false
  #rotateInProgress = false
  #oldStream
  #transferStream
  #xgraphStream;
  #xgraphLogPath;
  #currentLogSize = 0;
  #rotationSize;
  #logRotationTime = false;

  // By default, these are the log levels that are turned on or off
  logLevels = {
    verbose: false,
    debug: false,
    info: true,
    warning: true,
    error: true,
    test: false,
    xgraph: false,
    profiler: false,
    yarr: true
  };

  // By default, these are the log types that are available
  logTypes = {
    verbose: { badge: '', color: 'grey', label: 'verbose', fun: 'v' },
    debug: { badge: '', color: 'magenta', label: 'debug', fun: 'd' },
    info: { badge: '', color: 'cyan', label: 'info', fun: 'i' },
    warning: { badge: '', color: 'yellow', label: 'warning', fun: 'w' },
    error: { badge: 'error', color: 'red', label: 'error', stream: process.stderr, fun: 'e' },
    test: { badge: '', color: 'green', label: 'test', fun: 't' },
    xgraph: { badge: '', color: 'magenta', label: 'xgraph', fun: 'x' },
    santa: { badge: '🎅', color: 'red', label: 'santa', fun: 'santa' },
    profiler: { badge: '', color: 'green', label: 'profiler', fun: 'p' },
    yarr: { badge: '💀', color: 'red', label: 'yarr', fun: 'yarr' }
  };

  timers = {};
  timeCsv = '';

  // =============== Public API ================

  initialize() {
    // Setup xgraph.log, rotation, etc.
    this.#createxgraphLog();
    // Setup test logging if needed
    this.#createTestFunction(this.#options.test);
  }

  newLogType(name, typeDef) {
    // If you'd like to add the type globally
    this.#addLogType(name, typeDef);
  }

  setLogLevel(logLevel) {
    this.#setLogLevel(logLevel);
  }

  checkFlag(flag) {
    if (!this.#options) return false;
    return flag in this.#options && this.#options[flag];
  }

  logFileParse(outputs) {
    try {
      let arr = [];
      for (let obj of outputs) {
        if (obj == null) {
          arr.push('null');
          continue;
        }
        if (typeof obj == 'object') {
          if (obj.hasOwnProperty('toString')) {
            arr.push(obj.toString());
          } else {
            try {
              arr.push(JSON.stringify(obj, null, 2));
            } catch (e) {
              arr.push('Object keys: ' + JSON.stringify(Object.keys(obj), null, 2));
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
      return '';
    }
  }

  time(name) {
    if (!this.#profile) return 0;
    let id = Math.floor(Math.random() * 100000);
    this.timers[id] = {
      start: this.microtime(),
      name: name
    };
    return id;
  }

  timeEnd(id) {
    if (!this.#profile) return;
    if (!(id in (this.timers || {}))) return;
    let elapsed = (this.microtime() - this.timers[id].start) / 1000;
    let output = {};
    if (typeof this.timers[id].name === 'object') {
      output = this.timers[id].name;
    }
    output.start = this.timers[id].start;
    output.elapsed = elapsed;
    delete this.timers[id];
  }

  microtime() {
    let hrTime = process.hrtime();
    return (hrTime[0] * 1000000 + hrTime[1] / 1000);
  }

  profile(msg, bTime) {
    if (!this.#profile) return;
    if (process.send) {      
      process.send({Cmd: "Profile", Profile: msg});      
    }
    if (bTime) {
      return this.time(msg);
    }
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

  // =============== Private (Heavy) Methods ================
  async #createxgraphLog() {
    if (!this.#rotationSize) {
      this.#rotationSize = 5 * 1024 * 1024; // 5MB
    }
    if (!this.checkFlag('cwd')) {
      this.#options.cwd = '';
    }
    this.#xgraphLogPath = path.join(this.checkFlag('cwd'), 'xgraph.log');
	if (this.#doLogRotation) {
		const timestamp = this.toLocalISOString();
		this.#xgraphLogPath = path.join(
			this.checkFlag('cwd'),
			`xgraph_${timestamp}.log`
		);
	}
    this.#xgraphStream = fs.createWriteStream(this.#xgraphLogPath, { flags: 'a' });


    if (fs.existsSync(this.#xgraphLogPath)) {
      let currentFileSize = fs.statSync(this.#xgraphLogPath).size;
      if (currentFileSize > 0) {
        this.#currentLogSize = currentFileSize;
      }
    }



    const volatileBuffer = new Volatile('');
    let busy = false;

    this.xgraphlog = (...args) => {
      const line = this.logFileParse(args) + '\n';
      volatileBuffer.lock((val) => {
        val += line;
        return val;
      });
      if (!busy) {
        busy = true;
        flushBuffer();
      }
    };

    const flushBuffer = async () => {
      let dataToWrite;
      await volatileBuffer.lock((val) => {
        dataToWrite = val;
        return '';
      });
      if (!dataToWrite) {
        busy = false;
        return;
      }
      this.#xgraphStream.write(dataToWrite, async (err) => {
        if (err) {
          console.error('Error writing to xgraph.log:', err);
        }
        this.#currentLogSize += Buffer.byteLength(dataToWrite, 'utf8');
        if (this.#shouldRotate()) {
		  this.#rotateLog()
        }
        volatileBuffer.lock((val) => {
          if (val !== '') {
            process.nextTick(flushBuffer);
          } else {
            busy = false;
          }
          return val;
        });
      });
    };
  }

  xgraphlog(..._args) {
    // Placeholder; assigned dynamically in #createxgraphLog
  }

  testlog(..._args) {
    // Placeholder; assigned dynamically in #createTestFunction
  }

  async #waitForLogFile(filepath, interval = 100, timeout = 10000) {
	const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
	const start = Date.now();
	let exists = false

	while (!exists && (Date.now() - start < timeout)) {

		if (fs.existsSync(filepath)) {
			this.#xgraphLogPath = filepath;
			this.#currentLogSize = 0;
			this.#xgraphStream = this.#transferStream;
			exists = true

			setTimeout(() => { // Close old stream after 30 seconds
				this.#oldStream.end('--- Old stream closed after rotation ---\n');
			}, 30 * 1000);
		} else {
			await sleep(interval) // file doesn't exist yet, wait and check again
		}
	}
	if (Date.now() - start > timeout) {
		console.log('Warning: Log rotation call to waitForFile timedout. Log not rotated.')
		return
	}
	console.log(`Info: Log files rotated to: ${this.#xgraphLogPath}`)
	
	return
  }

  async #rotateLog() {
	if (this.#rotateInProgress == true) return
	this.#rotateInProgress = true
	const timestamp = this.toLocalISOString();
	const rotatedName = path.join(
		this.checkFlag('cwd'),
		`xgraph_${timestamp}.log`
	);

	this.#oldStream = this.#xgraphStream;
	this.#transferStream = fs.createWriteStream(rotatedName);

	this.#waitForLogFile(rotatedName)
  }

  #shouldRotate() {
	if (!this.#doLogRotation) return false

    const sizeCondition = this.#rotationSize > 0 && this.#currentLogSize >= this.#rotationSize;
    const now = new Date().getTime();
    const dayCondition = this.#logRotationTime && now >= this.#logRotationTime;
    return sizeCondition || dayCondition;
  }

  toLocalISOString(date = new Date()) {
    const pad = (num) => (num < 10 ? '0' + num : num);

    const offsetMinutes = date.getTimezoneOffset();
    const sign = offsetMinutes > 0 ? '-' : '+';
    const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
    const offsetMins = Math.abs(offsetMinutes) % 60;

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const milliseconds = pad(date.getMilliseconds());

//    const offsetStr = sign + pad(offsetHours) + ':' + pad(offsetMins);
//    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${offsetStr}`;

    const offsetStr = sign + pad(offsetHours) + '_' + pad(offsetMins);
    return `${year}-${month}-${day}T${hours}_${minutes}_${seconds}.${milliseconds}${offsetStr}`;
	
  }

  #createTestFunction(testOpt) {
		let that = this;
		if (testOpt) {
			this.testlog = (...str) => {
				that.testlog.buffer.lock((val) => {
					console.log('logFileParse: ', val);
					val += `${that.logFileParse(str)}\n`;
					return val;
				});
				//if we dont currently have a write loop, start that
				if (!that.testlog.busy) {
					that.testlog.busy = true;
					that.testlog.updateInterval();
				}
			}
			this.testlog.buffer = new Volatile('');
			this.testlog.updateInterval = async () => {
				let str;
				await that.testlog.buffer.lock(val => {
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
						that.testlog.buffer.lock(val => {
							if (val !== '') {
								// we have more in out buffer, keep calling out to the thing
								process.nextTick(that.testlog.updateInterval);
							} else {
								that.testlog.busy = false;
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
	}

  #addLogType(name, typeDef) {
    this.logTypes[name] = typeDef;
  }

  #addLogTypes(typeDefs) {
    for (let typeName in typeDefs) {
      this.#addLogType(typeName, typeDefs[typeName]);
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
					this.#setLogLevel('silent');
					break;
				case 'logleveldebug':
				case 'debug':
					this.#setLogLevel([this.logTypes.debug.label]);
					break;
				case 'loglevelverbose':
				case 'verbose':
					this.#setLogLevel([this.logTypes.verbose.label]);
					break;
				case 'xgraph':
					this.#setLogLevel([this.logTypes.xgraph.label]);
					break;
				case 'xlog':
					if (options.xlog == 'false') { this.xlog = false; } else { this.xlog = true; }
					break;
				case 'profile':
					this.#profile = true;
					this.#setLogLevel(['profiler']);
					break;
				case 'logSize': 
					// Convert from KB to bytes
					this.#rotationSize = options.logSize * 1024;
					break;
				case 'logTime': 
					// Set the log rotation time to midnight					
					let now = new Date();
					let midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 24, 0, 0, 0);
					this.#logRotationTime = midnight.getTime();
					break;
				case 'rotatelogs':
					this.#doLogRotation = true
			}
		}
	}

  #setLogLevel(logLevel) {
    if (logLevel === 'silent') {
      for (let channel in this.logLevels) {
        if (channel === 'profiler') continue;
        this.logLevels[channel] = false;
      }
      return;
    }
    if (Array.isArray(logLevel)) {
      for (let level of logLevel) {
        this.logLevels[level] = true;
      }
    }
  }
}

module.exports = Logger;