(
	/**
	 * The Validate entity is the Apex and only entity of
	 * the Validate Module. This entity requires its Start
	 * function to be invoked during the Start phase of
	 * Nexus startup.
	 * 
	 * The main capability of this entity is to GenModule
	 * the module being tested and then perform the tests
	 * laid out it the test.json file.
	 */
	function Validate() {

		//!!! please refrain from copy pasting 600 lines from stack overflow directly
		//!!! into your own code maybe. try using a library, or if it has to be wrapped,
		//!!! put it in another file. and if it has to be inline, like this implementation
		//!!! is, (not has to be), do your due and replace all \n\n with \n a few times
		//!!! to remove all the lines of empty.
		// pls, with love
		let md5 = function () {
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
		}();

		let dispatch = {
			Start: Start,
			'*': DummyCatch
		};

		return {
			dispatch: dispatch
		};

		/**
		 * The only required function of the Validate module.
		 * This function genModules the Module being tested 
		 * then carries out the tests.
		 * @param {Object} com the command object
		 * @param {Function} fun callback
		 */
		function Start(com, fun) {
			log.v('--Validate/Start');
			//save context for use in fs readfile subcontext
			let that = this;

			// function for seting the appropriate pid
			// references in  cmds and genmodule
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

			//To run the tests
			const RunTests = async _ => {
				let Results = [];
				log.i('Beginning the tests.');
				log.v(that.Vlt.Test.Cases.length + ' Tests');
				for (let tidx = 0; tidx < that.Vlt.Test.Cases.length; tidx++) {
					log.v(`Performing test ${tidx + 1}`);
					let test = that.Vlt.Test.Cases[tidx];
					await new Promise((resolve, _reject) => {
						if (test.Command.Cmd == 'Setup' || test.Command.Cmd == 'Start') {
							let bMatch = true;
							let _message, _keys, _key, hash, hashStash = [], msgIdx;
							if ('SentMessages' in test) {
								for (msgIdx = 0; msgIdx < test.SentMessages.length; msgIdx++) {
									hash = MD5(JSON.stringify(test.SentMessages[msgIdx]));
									hashStash.push(hash);
									if (hash in that.Vlt.SentMessages) {
										that.Vlt.SentMessages[hash]--;
									} else {
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


							//test dom appedings
							if ((typeof document != 'undefined') && test.Document) {
								let arr = test.Document;
								for (let index = 0; index < arr.length; index++) {
									let id = arr[index];
									if (!document.getElementById(`XGRAPH-${id}`)) {
										bMatch = false;
									} else{
										log.v(`XGRAPH-${id} appended to document appropriately`);
									}
								}
							}


							let result = {};
							result[test.Command.Cmd] = bMatch;


							Results.push(result);

							// we need a way to differentiate the
							// SentMessages object between setup and start runs.
							// Since we are not doing this currently a fail during
							// setup will
							// propagate and fail Start.

							// that.Vlt.SentMessages = {};

							resolve();
							return;
						}

						that.Vlt.SentMessages = {};
						log.v(`Test Sent ${JSON.stringify(test.Command, null, 2)}`);
						let timeout = test.Timeout || 2000;
						let timer;
						let testReply = (err, returnedCommand) => {
							clearTimeout(timer);
							let bMatch = true;
							if(err === 'TIMEOUT') {
								log.w('Test command timed out. if this command just takes a while,');
								log.w('provide a longer timeout in the test.json');
								bMatch = false;
								resolve();
							}
							if(err != null) {
								log.w('Test returned an error');
								log.w(err);
								bMatch = false;
								resolve();
							}
							let keys, _key, hash, hashStash = [], msgIdx;

							//check for a binary match with the test.json test callback
							if ('Response' in test) {
								delete returnedCommand.Passport;
								log.v(`Test Returned ${JSON.stringify(returnedCommand, null, 2)}`);

								parseObject(test.Response, returnedCommand);

							}
							function parseObject(ob, ret) {
								keys = Object.keys(ob);
								for (let i = 0; i < keys.length; i++) {
									let key = keys[i];

									if (typeof ob[key] === 'object' && ob[key] !== null) {
										log.v(`Recursive check on key ${key}`);
										if (!(key in ret)) {
											bMatch = false;
											return;
										}
										parseObject(ob[key], ret[key]);
										return;
									}
									///fail if either the values are not equal, 
									///or the value is "*" and key is in the returned command 
									if ((ob[key] !== ret[key])
										&& !((ob[key] == '*') && (key in ret))) {
										bMatch = false;
										return;
									}
								}
							}

							if ('SentMessages' in test) {
								for (msgIdx = 0; msgIdx < test.SentMessages.length; msgIdx++) {
									hash = MD5(JSON.stringify(test.SentMessages[msgIdx]));
									hashStash.push(hash);
									Response;
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
							resolve();
						};
						timer = setTimeout(testReply.bind(this, 'TIMEOUT', {}), timeout);
						that.send(test.Command, that.Vlt.InstModule, testReply);
					});
				}

				log.v('All tests concluded.');
				let fails = 0;

				let maxKeyLength = 0;
				for (let key in Results) {
					maxKeyLength = Math.max(maxKeyLength, (Object.keys(Results[key])[0]).length);
				}

				for (let key in Results) {
					let keys = Object.keys(Results[key]);
					let formattedKey = (Array(maxKeyLength).join(' ') + keys[0]).substr(-maxKeyLength);
					log.i(formattedKey + ': ' + (Results[key][keys[0]] ? 
						'\u2713 Pass' : (typeof document != 'undefined') ?
							'\u2715 Fail' : '\u001b[31m\u2715 Fail'));
					if (!Results[key][keys[0]])
						fails++;
				}
				if (fails == 0) {
					log.v('All tests Passed!');
					process.exit(0);
				}
				else {
					log.v(`\n\n${fails} of ${Results.length} tests Failed.`)
					process.exit(1);
				}
			}


			//load the test.json file
			log.w(that.Par)
			that.Vlt.Test = setPid(JSON.parse(that.Par.TestJson));

			//build the module inst from test.json required state
			let inst = {};
			inst.Module = that.Par.TestModule;
			inst.Par = that.Vlt.Test.State;

			function Macro(obj) {
				switch(typeof obj) {
					case 'object': {
						for(let key in obj) {
							obj[key] = Macro(obj[key]);
						}
						break;
					}
					case 'string': {
						if(obj.startsWith('$') && (obj.substr(1) in that.Par.Links)) {
							return that.Par.Links[obj.substr(1)];
						}
					}
					default: {
						return obj;
						break;
					}
				}

				return obj
			}

			inst.Par = Macro(inst.Par);

			log.v('Callig genMod on ', JSON.stringify(inst, null, 2));
			//instantiate the module
			//this calls setup and start in the instance
			that.genModule(inst, (err, instApex) => {
				that.Vlt.InstModule = instApex;
				that.Vlt.Test = setPid(that.Vlt.Test);
				log.v('Test Json is :', JSON.stringify(that.Vlt.Test, null, 2));
				if (typeof document != 'undefined') {

					inst.Module = 'xGraph.RootView';
					inst.Par = {
						Layout: instApex
					};
					that.genModule(inst, (err, instApex) => {
						RunTests();
					});
				} else {
					RunTests();
				}
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
			if (!this.Vlt.SentMessages)
				this.Vlt.SentMessages = {};
			if ('Passport' in com)
				delete com.Passport;
			log.v(`${this.Par.TestModule} sent ${JSON.stringify(com, null, 2)}`);

			let hash = MD5(JSON.stringify(com));
			this.Vlt.SentMessages[hash] = (this.Vlt.SentMessages[hash] || 0) + 1;

			if (fun)
				fun(null, com);
		}


	})();