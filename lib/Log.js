// Log.js
let Signale;
try {
    Signale = require('signale').Signale;
} catch (e) {
    Signale = false;
}

class Log {
    /**
     * @param {Logger} logger  Reference to the master Logger instance
     * @param {string} scope   A string label / scope for these log messages
     * @param {object} config  Optional local config:
     *                           { types: {...}, logLevel: [...], ... }
     */
    constructor(logger, scope = '', config = {}) {
        this.logger = logger;
        this.scope = scope;       

        // --- 1) Setup local log types ---
        // Start by shallow-cloning the logger's global log types
        // so we have a baseline. Then add any locally-defined types.
        this.localLogTypes = { ...logger.logTypes };
        if (config.types) {
            this.#addLocalLogTypes(config.types);
        }


        // --- 2) Setup local log levels ---
        // We'll clone from the logger's global logLevels,
        // then override with anything in config.logLevel if desired.
        this.localLogLevels = { ...logger.logLevels };       
        if (config.logLevel) {
            this.#setLocalLogLevel(config.logLevel);
        }       

        // Create our own "lightweight" Signale instance with this scope
        // using our local combined log types
        this.#createSignale(this.localLogTypes);


        // If user wants to do further config after instantiation,
        // they can call newLogType(...) or setLogLevel(...) on this instance.
    }

    /**
     * Public method: add a new local log type, then re-init Signale so
     * the new type's method becomes available (e.g. `log.custom("...")`).
     */
    newLogType(name, typeDef) {
        this.#addLocalLogType(name, typeDef);
        this.#createSignale(this.localLogTypes);
    }

    /**
     * Public method: set local log levels after the Log is created.
     * e.g. `log.setLogLevel(['info','special'])`
     */
    setLogLevel(logLevel) {
        this.#setLocalLogLevel(logLevel);
    }

    time(name) {
        this.logger.time(name);
    }

    timeEnd(name) {
        this.logger.timeEnd(name);
    }

    /**
     * Dynamically create log methods for each recognized local log type
     * so that calling, e.g., log.d("Hello") uses both signale and the logger’s xgraph log.
     */
    #createSignale(logTypes) {
        if (Signale) {
            this.term = new Signale({
                disabled: false,
                interactive: false,
                stream: process.stdout,
                scope: this.scope,
                types: logTypes
            });
        } else {
            // fallback if signale not installed
            this.term = console;
        }

        // Now generate convenience methods on `this` for each log type
        for (let logName in logTypes) {
            const def = logTypes[logName];
            if (!def.fun) continue;
            const funName = def.fun;          

            // We'll define a function for that short name
            this[funName] = (...args) => {
                try {
                    // If master logger says xlog is on, we write to xgraph.log
                    if (this.logger.xlog) {
                        if (logName === 'profiler' || logName === 'profileI') { } else {
                            this.logger.xgraphlog(
                                this.logger.toLocalISOString(),
                                '\t' + this.scope,
                                '\t' + logName + '\t',
                                ...args
                            );
                        }
                    }
                    let id;

                    if (logName === 'profiler') {
                        id = this.time(args[0]);
                    }
                    if (logName === 'profileI') {
                        let profile = args[0];
                        if (process.send && typeof profile == 'object') {
                            process.send({ Cmd: "Profile", Profile: profile });
                        }
                    }

                    // Check if our local log level is enabled for this logName
                    if (!this.localLogLevels[logName]) return;

                    // Otherwise, print via signale
                    if (this.term[logName]) {
                        this.term[logName](...args);                        
                        if (logName === 'test') {
                            this.logger.testlog(...args);
                        }
                    } else {
                        // fallback
                        this.term.log(`[${logName.toUpperCase()}]`, ...args);
                    }
                } catch (err) {
                    console.error(err);
                }
            };
        }
    }

    /**
     * Add multiple local log types at once.
     */
    #addLocalLogTypes(typesObj) {
        for (let tName in typesObj) {
            this.#addLocalLogType(tName, typesObj[tName]);
        }
    }

    /**
     * Add one local log type
     */
    #addLocalLogType(name, typeDef) {
        this.localLogTypes[name] = typeDef;
    }

    /**
     * Enable/disable local log levels
     * If `logLevel` is 'silent', turn them all off except profiler if you want.
     * If `logLevel` is an array, turn those on (others off).
     */
    #setLocalLogLevel(logLevel) {
        if (logLevel === 'silent') {
            // turn all off except maybe profiler or none at all
            for (let levelName in this.localLogLevels) {
                if (levelName === 'profiler') continue;
                this.localLogLevels[levelName] = false;
            }
            return;
        }
        if (Array.isArray(logLevel)) {
            // First turn all off
            for (let lvl in this.localLogLevels) {
                this.localLogLevels[lvl] = false;
            }
            // Then enable the listed ones
            for (let lvl of logLevel) {
                this.localLogLevels[lvl] = true;
            }
        }
    }
}

module.exports = Log;