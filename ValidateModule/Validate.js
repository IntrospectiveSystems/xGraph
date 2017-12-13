(
	/**
	 * The Validate entity is the Apex and only entity of the Validate Module. This entity requres its Start function invoked during the Start phase of Nexus startup.
	 * 
	 * The main capability of this entity is to GenModule the module being tested and then perform the tests laid out it the test.json file. 
	 */
	function Validate() {
	let hashIt;

	var dispatch = {
		Start: Start,
		"*": DummyCatch
	};

	return {
		dispatch: dispatch
	};

	/**
	 * The only required function of the Validate module. This function genModules the Module being tested 
	 * then carries out the tests.
	 * @param {Object} com the command object
	 * @param {Function} fun callback
	 */
	function Start(com, fun) {
		log.v('--Validate/Start');
		//save context for use in fs readfile subcontext
		let that = this;

		// function for seting the appropriate pid references in  cmds and genmodule
		const setPid = (val) => {
			if (val === null) return null;
			if (typeof val === 'object') {
				return (Array.isArray(val) ?
					val.map(v => setPid(v)) :
					Object.entries(val).map(([key, val]) => {
						return [key, setPid(val)];
					}).reduce((prev, curr) => {
						prev[curr[0]] = curr[1];
						return prev;
					}, {})
				);
			}
			if (val === 'xGraphTesterPid')
				return that.Par.Pid;
			else if (val === 'xGraphSelfPid')
				return that.Vlt.InstModule || 'xGraphSelfPid';

			return val;
		};
		hashIt = (() => {
			var k = [], i = 0;
			for (; i < 64;) k[i] = 0 | (Math.abs(Math.sin(++i)) * 4294967296);
			function calcMD5(str) {
				var b, c, d, j, x = [], str2 = unescape(encodeURI(str)),
					a = str2.length, h = [b = 1732584193, c = -271733879, ~b, ~c], i = 0;
				for (; i <= a;) x[i >> 2] |= (str2.charCodeAt(i) || 128) << 8 * (i++ % 4);
				x[str = (a + 8 >> 6) * 16 + 14] = a * 8; i = 0; for (; i < str; i += 16) {
					a = h; j = 0; for (; j < 64;) a = [d = a[3], ((b = a[1] | 0) + ((d = ((a[0] +
						[b & (c = a[2]) | ~b & d, d & b | ~d & c, b ^ c ^ d, c ^ (b | ~d)][a = j >> 4])
						+ (k[j] + (x[[j, 5 * j + 1, 3 * j + 5, 7 * j][a] % 16 + i] | 0)))) << (a = [
							7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21][4 * a + j++ % 4
						]) | d >>> 32 - a)), b, c]; for (j = 4; j;) h[--j] = h[j] + a[j];
				} str = '';
				for (; j < 32;) str += ((h[j >> 3] >> ((1 ^ j++ & 7) * 4)) & 15).toString(16);
				return str;
			} return calcMD5;
		})();

		//To run the tests
		const RunTests = async _ => {
			let Results = [];

			log.v(that.Vlt.Test.Cases.length + " Tests");
			for (let tidx = 0; tidx < that.Vlt.Test.Cases.length; tidx++) {
				let test = that.Vlt.Test.Cases[tidx];
				await new Promise((resolve, reject) => {
					if (test.Command.Cmd == "Setup" || test.Command.Cmd == "Start") {
						let bMatch = true;
						let message, keys, key, hash, hashStash = [], msgIdx;
						if ("SentMessages" in test) {
							for (msgIdx = 0; msgIdx < test.SentMessages.length; msgIdx++) {
								hash = hashIt(test.SentMessages[msgIdx]);
								hashStash.push(hash);
								if (hash in that.Vlt.SentMessages)
									that.Vlt.SentMessages[hash]--;
								else {
									bMatch = false;
									break;
								}
							}
						}

						for (msgIdx = 0; msgIdx < hashStash.lenth; msgIdx++) {
							if (that.Vlt.SentMessages[hashStash[msgIdx]] != 0) {
								bMatch = false;
								break;
							}
						}

						let result = {};
						result[test.Command.Cmd] = bMatch;

						Results.push(result);
						that.Vlt.SentMessages = {};
						resolve();
						return;
					}
					log.v(tidx);
					that.send(test.Command, that.Vlt.InstModule, (err, returnedCommand) => {
						log.v(JSON.stringify(returnedCommand, null, 2));
						let bMatch = true;
						let keys, key, hash, hashStash = [], msgIdx;

						//check for a binary match with the test.json test callback
						if ('Response' in test) {
							parseObject(test.Response, returnedCommand);

							function parseObject(ob, ret) {
								log.v(JSON.stringify(ob, null, 2));
								log.v(JSON.stringify(ret, null, 2));
								keys = Object.keys(ob);
								for (let i = 0; i < keys.length; i++) {
									
									if (typeof ob[keys[i]] === 'object' && ob[keys[i]] !== null){
										if(!(keys[i] in ret)) {
											bMatch = false;
											return;
										}
										parseObject (ob[keys[i]], ret[keys[i]]);
										return;
									}
									///fail if either the values are not equal, 
									///or the value is "*" and key is in the returned command 
									if ((ob[keys[i]] !== ret[keys[i]])
										&& !((ob[keys[i]] == "*") && (keys[i] in ret))) {
										bMatch = false;
										break;
									}
								}
							}
						}

						if ("SentMessages" in test) {
							for (msgIdx = 0; msgIdx < test.SentMessages.length; msgIdx++) {
								hash = hashIt(test.SentMessages[msgIdx]);
								hashStash.push(hash);Response
								if (hash in that.Vlt.SentMessages)
									that.Vlt.SentMessages[hash]--;
								else {
									bMatch = false;
									break;
								}
							}
						}

						for (msgIdx = 0; msgIdx < hashStash.lenth; msgIdx++) {
							if (that.Vlt.SentMessages[hashStash[msgIdx]] != 0) {
								bMatch = false;
								break;
							}
						}

						let result = {};
						result[test.Command.Cmd] = bMatch;

						Results.push(result);
						that.Vlt.SentMessages = {};

						resolve();
					});
				});
			}

			log.v('\n\nAll tests concluded.\n');
			let fails = 0;
			
			let maxKeyLength = 0;
			for (let key in Results) maxKeyLength = Math.max(maxKeyLength, (Object.keys(Results[key])[0]).length);

			for (let key in Results) {
				let keys = Object.keys(Results[key]);
				let formattedKey = (Array(maxKeyLength).join(' ') + keys[0]).substr(-maxKeyLength);
				log.i(formattedKey + ': ' + (Results[key][keys[0]] ? "\u2713 Pass" : "\u001b[31m\u2715 Fail"));
				if (!Results[key][keys[0]])
					fails++;
			}
			if (fails == 0)
				log.v("\n\nAll tests Passed!");
			else
				log.v(`\n\n${fails} of ${Results.length} tests Failed.`)
		}


		//load the test.json file
		that.Vlt.Test = setPid(JSON.parse(that.Par.TestJson));

		//build the module inst from test.json required state
		let inst = {};
		inst.Module = that.Par.TestModule;
		inst.Par = that.Vlt.Test.State;
		log.v("Callig genMod on ", JSON.stringify(inst, null, 2));
		//instantiate the module
		//this calls setup and start in the instance
		that.genModule(inst, (err, instApex) => {
			that.Vlt.InstModule = instApex;
			that.Vlt.Test = setPid(that.Vlt.Test);
			log.v("Test Json is :", JSON.stringify(that.Vlt.Test, null, 2));
			RunTests();
		});
		//finish start:May happen before the test commences 
		fun(null, com);
	}

	// //**
	//  * This function catches all messages sent during testing by the module being tested. 
	//  * @param {Object} com 
	//  * @param {Function} fun 
	//  */
	function DummyCatch(com, fun) {
		log.v(`Validate::DummyCatch ${JSON.stringify(com, null, 2)}`);

		if (!this.Vlt.SentMessages)
			this.Vlt.SentMessages = {};

		if ("Passport" in com)
			delete com.Passport;

		let hash = hashIt(com)

		this.Vlt.SentMessages[hash] = (this.Vlt.SentMessages[hash] || 0) + 1;

		if (fun)
			fun(null, com);
	}


})();