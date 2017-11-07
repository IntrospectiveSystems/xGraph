(function Validate() {
	let hashIt;

	var dispatch = {
		Start: Start,
		"*": DummyCatch
	};

	return {
		dispatch: dispatch
	};


	function Start(com, fun) {
		log.v('Test::Start');
		//save context for use in fs readfile subcontext
		let that = this;

		//load required functions
		const fs = this.require('fs');
		// function for seting the appropriate pid references in  cmds and genmodule
		const setPid = (val) => {
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
					that.send(test.Command, that.Vlt.InstModule, (err, returnedCommand) => {
						let bMatch = true;
						let keys, key, hash, hashStash = [], msgIdx;

						//check for a binary match with the test.json test callback
						if ('Response' in test) {
							keys = Object.keys(test.Response);
							for (let i = 0; i < keys.length; i++) {
								///fail if either the values are not equal, 
								///or the value is "*" and key is in the returned command 
								if ((test.Response[keys[i]] !== returnedCommand[keys[i]])
									&& !((test.Response[keys[i]] == "*") && (keys[i] in returnedCommand))) {
									bMatch = false;
									break;
								}
							}
						}

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
					});
				});
			}

			log.v('\nAll tests concluded.\n');
			let fails = 0;
			for (let key in Results) {
				let keys = Object.keys(Results[key]);
				log.v(keys[0] + ' : ' + (Results[key][keys[0]] ? "Pass" : "Fail"));
				if (!Results[key][keys[0]])
					fails++;
			}
			if (fails == 0)
				log.v("\nAll tests Passed!");
			else
				log.v(`\n${fails} of ${Results.length} tests Failed.`)
		}


		//load the test.json file

		that.Vlt.Test = setPid(JSON.parse(that.Par.TestJson));

		//build the module inst from test.json required state
		let inst = {};
		inst.Module = that.Par.TestModule;
		inst.Par = that.Vlt.Test.State;

		//instantiate the module
		//this calls setup and start in the instance
		that.genModule(inst, (err, instApex) => {
			that.Vlt.InstModule = instApex;
			that.Vlt.Test = setPid(that.Vlt.Test);
			RunTests();
		});


		//finish start:May happen before the test commences 
		fun(null, com);

	}

	function DummyCatch(com, fun) {
		//log.v(`Validate::DummyCatch ${JSON.stringify(com, null,2)}`);

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