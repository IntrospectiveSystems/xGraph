/* eslint no-console: 0 */  // --> OFF

const browserLog = (function(__options) {
	try {
		return {
			verbose: console.debug.bind(window.console, '%c[VRBS] %s',
				'color: gray'),
			debug: console.debug.bind(window.console, '%c[DBUG] %s',
				'color: magenta'),
			info: console.info.bind(window.console, '%c[INFO] %s',
				'color: cyan; background-color:#242424;'),
			warning: console.warn.bind(window.console, '%c[WARN] %s',
				'color: yellow; background-color:#242424;'),
			error: console.error.bind(window.console, '%c[ERRR] %s',
				'color: red'),
			santa: console.log.bind(window.console, '%c[SNTA] %s',
				'color: green')
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

module.exports.createLogger = function createLogger(__options = {}) {
	function checkFlag(flag) {
		// console.dir(__options);
		return flag in __options && __options[flag];
	}

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

	return {
		v: printVerbose ? browserLog.verbose : _=>_,
		d: printDebug ? browserLog.debug : _=>_,
		i: printInfo ? browserLog.info : _=>_,
		w: printWarn ? browserLog.warning : _=>_,
		e: printError ? browserLog.error : _=>_
	};
}
