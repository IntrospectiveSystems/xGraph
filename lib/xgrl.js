

const log = new (require('signale').Signale)({
	disabled: false,
	interactive: false,
	stream: process.stdout,
	types: {
		v: {
			badge: '',
			color: 'grey',
			label: 'verbose'
		},
		d: {
			badge: '',
			color: 'magenta',
			label: 'debug'
		},
		i: {
			badge: '',
			color: 'cyan',
			label: 'info'
		},
		w: {
			badge: '',
			color: 'yellow',
			label: 'warning'
		},
		e: {
			badge: '',
			color: 'red',
			label: 'error'
		}
	}
});
const fs = require('fs');
const path = require('path');
const https = require('https');
const appdata = path.join((process.env.APPDATA || path.join(process.env.HOME,
	(process.platform == 'darwin' ? 'Library/Preferences' : ''))), '.xgraph');
try { fs.mkdirSync(appdata); } catch (e) { ''; }


module.exports = {
	modDefinition
};


async function modDefinition(xgrl) {
	let protocol = xgrl.split(/:\/\//)[0];
	let _domain = xgrl.split(/:\/\//)[1];

	let protocolObject = await getProtocolModule(protocol);

	//need to rebuild the par from the argsArr
	// log.v(protocolObject.Par);

	// "exmaple.com:23897"
	let argsArr = _domain.split(/:/);
	// log.v(argsArr);

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

	// log.v(protocolObject.Par);

	let moduleDefinition = {
		Module: 'BrokerProxy',
		Par: protocolObject.Par
	};

	return {
		moduleDefinition,
		zip: protocolObject.Module,
	};
}

/**
* load protocol to access modules
*/
function getProtocolModule(protocol) {
	return new Promise(function (resolve, reject) {
		let cacheFilepath = path.join(appdata, protocol);
		if (fs.existsSync(cacheFilepath)) {
			return resolve(JSON.parse(fs.readFileSync(cacheFilepath).toString()));
		}

		let options = {
			host: 'protocols.xgraphdev.com',
			port: 443,
			path: '/' + protocol,
			method: 'GET',
			rejectUnauthorized: false,
		};

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

