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
    profileI: { badge: '', color: 'green', label: 'profileI', fun: 'pi' },
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
    console.log('Profiler:', output);
    delete this.timers[id];
  }

  microtime() {
    let hrTime = process.hrtime();
    return (hrTime[0] * 1000000 + hrTime[1] / 1000);
  }

  async validateTest() {
    // ... your same test validation code ...
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
          await this.#rotateLog();
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

  #rotateLog() {
    return new Promise((resolve, reject) => {
      this.#xgraphStream.end(() => {
        const timestamp = this.toLocalISOString();
        const rotatedName = path.join(
          this.checkFlag('cwd'),
          `xgraph.${timestamp}.log`
        );
        fs.rename(this.#xgraphLogPath, rotatedName, (err) => {
          if (err) {
            console.error('Error rotating xgraph.log:', err);
            reject(err);
          }
          this.#xgraphStream = fs.createWriteStream(this.#xgraphLogPath, { flags: 'a' });
          this.#currentLogSize = 0;
          resolve();
        });
      });
    });
  }

  #shouldRotate() {
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

    const offsetStr = sign + pad(offsetHours) + ':' + pad(offsetMins);
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${offsetStr}`;
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