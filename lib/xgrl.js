
const fs = require('fs');
const path = require('path');
const https = require('https');
const createLogger = require('./Logger.js');
const appdata = path.join((process.env.APPDATA || path.join(process.env.HOME,
	(process.platform == 'darwin' ? 'Library/Preferences' : ''))), '.xgraph');
try { fs.mkdirSync(appdata); } catch (e) { ''; }


module.exports = {
	getProtocolObject
};


async function getProtocolObject(xgrl, __options) {
	const log = (('logger' in __options) && (__options['logger'])) ? 
		__options.logger : createLogger(__options);
	log.d(`Get Protocol object ${xgrl}`);
	let protocol = xgrl.split(/:\/\//)[0];
	let _domain = xgrl.split(/:\/\//)[1];

	if (protocol.split(/(\\|\/)/).length>1){
		_domain = protocol;
		protocol = 'fs';
	}

	let protocolObject = await getProtocolModule(protocol, __options);

	//need to rebuild the par from the argsArr

	// "exmaple.com:23897"
	let argsArr = _domain.split(/:/);

	//replace with given arguments
	for (let i = 0; i < argsArr.length; i++) {
		for (let val in protocolObject.Par) {
			if (protocolObject.Par[val] == `%${i+1}`) protocolObject.Par[val] = argsArr[i];
		}
	}
	//replace with given defaults
	for (let def in protocolObject.Default) {
		for (let val in protocolObject.Par) {
			if (protocolObject.Par[val] == def) protocolObject.Par[val] = protocolObject.Default[def];
		}
	}

	let moduleDefinition = {
		Module: 'BrokerProxy',
		Par: protocolObject.Par
	};

	const _ = {
		moduleDefinition,
		zip: protocolObject.Module,
		config: ('Config' in protocolObject)? protocolObject.Config : undefined
	};

	// console.dir(_);

	return _;
}

/**
* load protocol to access modules
*/
function getProtocolModule(protocol, __options) {
	const log = (('logger' in __options) && (__options['logger'])) ? 
			__options.logger : createLogger(__options);
	return new Promise(function (resolve, reject) {
		let cacheFilepath = path.join(appdata, protocol);
		if (fs.existsSync(cacheFilepath)) {
			log.d(`Return ${protocol} from ${cacheFilepath}`);
			return resolve(JSON.parse(fs.readFileSync(cacheFilepath).toString()));
		}

		let options = {
			host: 'protocols.xgraphdev.com',
			port: 443,
			path: '/' + protocol,
			method: 'GET',
			rejectUnauthorized: false,
		};
		
		log.d(`${protocol} from protocols.xgraphdev.com`);

		let req = https.request(options, function (res) {
			res.setEncoding('utf8');
			let response = '';
			res.on('data', function (chunk) {
				response += chunk;
			});
			res.on('end', _ => {
				try {
					resolve(JSON.parse(response));
					try { fs.writeFileSync(cacheFilepath, response); } catch (e) {
						reject({
							code: 1,
							text: `fail to save protocol at ${cacheFilepath}` +
								'\n delete file and try again'
						});
					}
				} catch (e) {
					reject({ code: 0, text: 'try and retrieve locally' });
				}
			});
		});

		req.on('error', function (e) {
			log.e('problem with request: ' + e.message);
			reject({ code: 1, text: 'problem with request: ' + e.message });
		});

		// write data to request body
		req.end();
	});
}

