const CacheInterface = require('./CacheInterface.js');
const fs = require('fs');
const Path = require('path');
const Uuid = require('uuid/v4');
const stripComments = require('strip-comments');
const createLogger = require('./Logger.js');

module.exports = function xGraph(__options = {}) {
	this.__options = __options;
	let eventListeners = {
		exit: [],
		setup: [],
		start: [],
		run: []
	};

	let dispatchEvent = this.dispatchEvent = function dispatchEvent(eventName, options) {
		for (let callback of eventListeners[eventName]) {
			callback(options);
		}
	};

	this.on = function on(eventName, listener) {
		eventListeners[eventName].push(listener);
	};

	this.boot = function boot() {
		return (async function (__options) {
			let log = createLogger(__options);
			// global.log = log; // TODO HACK REMOVE
			let consoleNotification = false;
			let cacheInterface;
			let Config = {};					// The read config.json
			let ModCache = {};					// {<folder>: <module>}
			let Stop = {};						// {<Apex pid>:<function>}
			let EntCache = {};					// {<Entity pid>:<Entity>
			let ImpCache = {};					// {<Implementation path>: <Implementation(e.g. disp)>}
			let Nxs = {
				genPid,
				genModule,
				addModule,
				genEntity,
				deleteEntity,
				saveEntity,
				getFile,
				GetModule,
				loadDependency,
				sendMessage,
				exit,
			};

			function checkFlag(flag) {
				// console.dir(__options);
				return flag in __options && __options[flag];
			}

			function createRequireFromContext(context) {
				return cacheInterface.loadDependency.bind(cacheInterface,
					cacheInterface.ApexIndex[context.Par.Apex]);
			}

			function createRequireFromModuleType(modtype) {
				return cacheInterface.loadDependency.bind(cacheInterface, modtype);
			}

			function indirectEvalImp(entString, ...injections) {
				let _eval = _ => {
					// log.w(_)
					return (1,eval)(_);
				};

				//sanitize entString!
				entString = stripComments(entString).trim();

				let container = `(function(log, require) {
					return ${entString}
				})`;
				let imp = _eval(container);
				// imp = imp(...injections);
				imp = imp(...injections);

				if(typeof imp === 'function') {
					imp = { dispatch: imp.prototype };
					// log.w(container);
				}
				
				if (typeof imp != 'undefined') {
					if (!('dispatch' in imp)) {
						log.e('Entity does not return a dispatch Table');
						throw new Error('E_NO_DISPATCH_TABLE');
					}
					return imp;
				} else {
					if (!('dispatch' in imp)) {
						log.e('Invalid Entity File');
						throw new Error('E_INVALID_ENTITY');
					}
				}
			}


			log.i('=================================================');
			log.i('Nexus Warming Up:');

			//set CWD
			__options.cwd = __options.cwd ? Path.resolve(__options.cwd) : Path.resolve('.');
			log.v(`CWD set to ${__options.cwd}`);

			//set Cache location
			__options.cache = __options.cache || Path.join(__options.cwd, 'cache');

			// if the cache doesnt exist, throw
			if (!fs.existsSync(__options.cache)) {
				log.e(`No cache exists at ${__options.cache}. Try xgraph run`);
				throw new Error(`No cache exists at ${__options.cache}. Try xgraph run`);
			}

			await initiate();

			let externalPid = genPid();
			return {
				send: function send(com, pid, fun) {
					// log.v(com, pid);
					if (!('Passport' in com))
						com.Passport = {};
					com.Passport.To = pid;
					com.Passport.Apex = externalPid;
					if (fun)
						com.Passport.From = externalPid;
					if (!('Pid' in com.Passport))
						com.Passport.Pid = genPid();

					sendMessage(com, fun);
				},
				Pid: externalPid,
				Apex: externalPid
			};

			////////////////////////////////////////////////////////////////////////////////////////////////
			//
			// Only Function Definitions Beyond This Point
			//
			//

			/**
			 *  The main process of starting an xGraph System.
			 */
			async function initiate() {
				log.i('--Nexus/Initiate');
				let Setup = {};
				let Start = {};
				cacheInterface = new CacheInterface({
					path: __options.cache,
					log
				});


				let cache = await cacheInterface.loadCache();
				Start = cache.start;
				Setup = cache.setup;
				Stop = Object.assign(Stop, cache.stop);

				await setup();

				await start();

				run();

				/////////////////////////////////////////////////////////////////////////////////////////
				//
				// Only Helper Functions Beyond This Point
				//
				//


				/**
				 * Call setup on the required Module Apexes
				 */
				async function setup() {
					log.i('--Nexus/Setup');
					//build the setup promise array
					let setupArray = [];

					for (let pid in Setup) {
						setupArray.push(new Promise((resolve, _reject) => {
							let com = {};
							com.Cmd = Setup[pid];
							com.Passport = {};
							com.Passport.To = pid;
							com.Passport.Pid = genPid();
							sendMessage(com, resolve);
						}));
					}

					await Promise.all(setupArray);
					log.v('--Nexus: All Setups Complete');

				}

				/**
				 * Call Start on the required Module Apexes
				 */
				async function start() {
					log.i('--Nexus/Start');
					//build the setup promise array
					let startArray = [];

					for (let pid in Start) {
						startArray.push(new Promise((resolve, _reject) => {
							let com = {};
							com.Cmd = Start[pid];
							com.Passport = {};
							com.Passport.To = pid;
							com.Passport.Pid = genPid();
							sendMessage(com, resolve);
						}));
					}

					await Promise.all(startArray);
					log.v('--Nexus: All Starts Complete');
				}

				/**
				 * Send Finished command if the process was generated
				 */
				function run() {
					log.i('--Nexus/Run');
					if ('send' in process) {
						process.send('{"Cmd":"Finished"}');
					}
				}
			}

			//
			//
			// Helper Functions as well as Entity definition
			//
			//

			/**
			 * @description stop the system by calling all stop methods and
			 * releasing all entities from memory
			 * exit code 0 will gracefully exit,
			 * @param {number} [code=0] the code to exit with
			 */
			async function exit(code = 0) {
				log.i('--Nexus/Stop');
				//build the Stop promise array
				let stopTasks = [];

				log.i('Nexus unloading node modules');
				log.v(Object.keys(require.cache).join('\n'));

				for (let pid in Stop) {
					stopTasks.push(new Promise((resolve, _reject) => {
						let com = {};
						com.Cmd = Stop[pid];
						com.Passport = {};
						com.Passport.To = pid;
						com.Passport.Pid = genPid();
						sendMessage(com, resolve);
					}));
				}
				await Promise.all(stopTasks);
				log.v('--Nexus: All Stops Complete');

				dispatchEvent('exit', { exitCode: code });
			}

			/**
			 * replace the macros for local path info
			 * @param {string} str the string which to return the macro of
			 */
			function Macro(str) {
				let state = 1;
				let chr;
				let s = '';
				let param;
				for (let i = 0; i < str.length; i++) {
					chr = str.charAt(i);
					switch (state) {
						case 1:
							if (chr == '{') {
								param = '';
								state = 2;
							} else {
								s += chr;
							}
							break;
						case 2:
							if (chr == '}') {
								if (param in __options)
									s += __options[param];
								else
									throw 'Parameter <' + param + '> not defined';
								state = 1;
							} else {
								param += chr;
							}
							break;
					}
				}
				if (state != 1)
					throw 'Curley brackets not matched in __Macro';
				return s;
			}


			/**
			 * generate a 32 character hex pid
			 */
			function genPid() {
				let str = Uuid();
				let pid = str.replace(/-/g, '').toUpperCase();
				return pid;
			}

			/**
			 * Send a message from an entity to an Apex entity.
			 * If a callback is provided, return when finished
			 * @param {object} com 			the message object
			 * @param {string} com.Cmd 		the command of the message
			 * @param {object} com.Passport	the information about the message
			 * @param {string} com.Passport.To the Pid of the recipient module
			 * @param {string} com.Passport.Pid the ID of the message
			 * @param {string=} com.Passport.From the Pid of the sending module
			 * @callback fun 				the callback function to return to when finished
			 */
			function sendMessage(com, fun = _ => _) {
				if (!('Passport' in com)) {
					log.w('Message has no Passport, ignored');
					log.w('    ' + JSON.stringify(com));
					fun('No Passport');
					return;
				}
				if (!('To' in com.Passport) || !com.Passport.To) {
					log.w('Message has no destination entity, ignored');
					log.w('    ' + JSON.stringify(com));
					fun('No recipient in message', com);
					return;
				}
				if (!('Pid' in com.Passport)) {
					log.w('Message has no message id, ignored');
					log.w('    ' + JSON.stringify(com));
					fun('No message id', com);
					return;
				}

				let pid = com.Passport.To;
				let apx = com.Passport.Apex || pid;

				if (pid in EntCache) {
					done(null, EntCache[pid]);
					return;
				} else {
					// if(pid in ApexIndex) apx = pid;
					getEntityContext(pid, done);
				}

				function done(err, entContext) {
					if (err) {
						log.w(err);
						log.w(JSON.stringify(com, null, 2));
						fun(err, com);
						return;
					}

					if ((pid in cacheInterface.ApexIndex) || (entContext.Par.Apex == apx)) {
						entContext.dispatch(com, reply);
					} else {
						let err = 'Trying to send a message to a non-Apex'
							+ 'entity outside of the sending module';
						log.w(err);
						log.w(JSON.stringify(com, null, 2));
						fun(err, com);
					}
				}
				function reply(err, q) {
					// log.i('NEXUS MESSAGE:', com)
					fun(err, q);
				}
			}



			/**
			 * The base class for all xGraph Entities
			 * @param {object} nxs 	the nxs context to give the entity acess too
			 * @param {object} imp 	the evaled Entity functionality returned by the dispatch table
			 * @param {object} par	the par of the entity
			 */
			function Entity(nxs, imp, par) {
				let Par = par;
				let Imp = imp;
				let Vlt = {};

				return {
					Par,
					Vlt,
					dispatch,
					genModule,
					genModules,
					addModule,
					genEntity,
					deleteEntity,
					genPid,
					send,
					save,
					getFile,
					require,
					exit
				};

				/**
				 * Given a module name, `require` loads the module, returning the module object.
				 * @param {string} string 	the string of the module to require/load
				 */
				function require(string) {
					return nxs.loadDependency(Par.Apex, Par.Pid, string.toLowerCase());
				}

				function exit(code) {
					nxs.exit(code);
				}

				/**
				 * get a file in the module.json module definition
				 * @param {string} filename  	The file to get from this module's module.json
				 * @callback fun 				return the file to caller
				 */
				function getFile(filename, fun) {
					log.v(`Entity - Getting file ${filename} from ${Par.Module}`);
					nxs.getFile(Par.Module, filename, fun);
				}

				/**
				 * Route a message to this entity with its context
				 * @param {object} com		The message to be dispatched in this entities context
				 * @param {string} com.Cmd	The actual message we wish to send
				 * @callback fun
				 */
				function dispatch(com, fun = _ => _) {
					try {
						let disp = Imp.dispatch;
						if (com.Cmd in disp) {
							disp[com.Cmd].call(this, com, fun);
							return;
						}
						if ('*' in disp) {
							disp['*'].call(this, com, fun);
							return;
						}
						log.w(`${com.Cmd} not found in Entity ${this.Par.Module}`);
						fun('Nada', com);
					} catch (e) {
						log.e(`Error in ${this.Par.Entity} Command ${com.Cmd}`);
						log.e(e.toString());

						process.exit(2);
					}
				}

				/**
				 * Entity access to the genModule command.
				 * genModule is the same as genModules.
				 * genModule expects two parameters: moduleObject and fun.
				 *
				 * The moduleObject parameter is an object that contains data for each module that will be
				 * generated. If only one module needs to be generated, then moduleObject can be a simple
				 * module definition. If more then one module needs to be generated, moduleObject has a
				 * key for each module definition, such as in a system structure object.
				 *
				 * When this.genModule is called from an entity, the moduleObject 
				 * and fun parameters are passed
				 * along to nxs.genModule, which starts the module and adds it to the system.
				 * @param {object} moduleObject		Either a single module definition, or an object containing
				 * 										multiple module definitions.
				 * @callback fun
				 */
				function genModule(moduleObject, fun) {
					// log.v('--Entity/genModule');
					nxs.genModule(moduleObject, fun);
				}

				/**
				 * Add a module into the in memory Module Cache (ModCache)
				 * @param {string} modName 		the name of the module
				 * @param {string} modZip 		the zip of the module
				 * @callback fun 							the callback just returns the name of the module
				 */
				function addModule(modName, modZip, fun) {
					nxs.addModule(modName, modZip, fun);
				}

				/**
				 * Entity access to the genModule command.
				 * genModule expects two parameters: moduleObject and fun.
				 *
				 * The moduleObject parameter is an object that contains data for each module that will be
				 * generated. If only one module needs to be generated, then moduleObject can be a simple
				 * module definition. If more then one module needs to be generated, moduleObject has a
				 * key for each module definition, such as in a system structure object.
				 *
				 * When this.genModule is called from an entity, 
				 * the moduleObject and fun parameters are passed
				 * along to nxs.genModule, which starts the module and adds it to the system.
				 * @param {object} moduleObject		Either a single module definition, or an object containing
				 * 										multiple module definitions.
				 * @callback fun
				 */
				function genModules(moduleObject, fun) {
					//	log.v('--Entity/genModule');
					nxs.genModule(moduleObject, fun);
				}

				/**
				 * deletes the current entity
				 * @callback fun
				 */
				function deleteEntity(fun) {
					nxs.deleteEntity(Par.Pid, fun);
				}

				/**
				 * Create an entity in the same module. Entities can only communicate within a module.
				 * @param {object} par 			The parameter object of the entity to be generated.
				 * @param {string} par.Entity 	The entity type that will be generated.
				 * @param {string=} par.Pid		The pid to set as the pid of the entity.
				 * @callback fun
				 */
				function genEntity(par, fun) {
					nxs.genEntity(Par.Apex, par, fun);
				}

				/**
				 * Create and return a 32 character hexadecimal pid.
				 */
				function genPid() {
					return nxs.genPid();
				}

				/**
				 * Sends the command object and the callback function to
				 * the xGraph part (entity or module, depending
				 * on the fractal layer) specified in the Pid.
				 * @param {object} com  	The message object to send.
				 * @param {string} com.Cmd	The function to send the message to in the destination entity.
				 * @param {string} pid 		The pid of the recipient (destination) entity.
				 * @callback fun
				 */
				function send(com, pid, fun) {
					// log.v(com, pid);
					// TODO this code is duplicated when giving the npm API
					if (!('Passport' in com))
						com.Passport = {};
					com.Passport.To = pid;
					if ('Apex' in Par)
						com.Passport.Apex = Par.Apex;
					if (fun)
						com.Passport.From = Par.Pid;
					if (!('Pid' in com.Passport))
						com.Passport.Pid = genPid();
					nxs.sendMessage(com, fun);
				}

				/**
				 * Save this entity, including it's current Par, to the cache.
				 * If this entity is not an Apex, send the save message to Apex of this entity's module.
				 * If it is an Apex we save the entity's information,
				 * as well as all other relevant information
				 * @callback fun
				 */
				function save(fun) {
					nxs.saveEntity(Par, fun);
				}
			}

			/**
			 * Creates an Entity in the module, which is defined by the apx, from the given entity definition
			 * The entity is then stored in EntCache (the location of all "in Memory" entities)
			 * @param {string} apx 			the Pid of the module Apex in which this entity will be generated
			 * @param {object} par 			the Par of the entity that will be created
			 * @param {string} par.Entity 	The entity type that will be generated
			 * @param {string=} par.Pid		the pid to define as the pid of the entity
			 * @return {pid} par.Pid		the pid of the generated entity
			 * @callback fun
			 */
			async function genEntity(apx, par, fun = _ => log.e(_)) {
				if (!('Entity' in par)) {
					fun('No Entity defined in Par');
					return;
				}

				let impkey = (cacheInterface.ApexIndex[apx] + '/' + par.Entity);
				let mod = ModCache[cacheInterface.ApexIndex[apx]];

				if (!(par.Entity in mod.files)) {
					log.e('<' + par.Entity + '> not in module <' + cacheInterface.ApexIndex[apx] + '>');
					fun('Null entity');
					return;
				}

				if (!(impkey in ImpCache)) {
					let entString = await new Promise(async (res, _rej) => {
						mod.file(par.Entity).async('string').then((string) => res(string));
					});
					ImpCache[impkey] = indirectEvalImp(entString, log, createRequireFromContext(this));
				}

				par.Pid = par.Pid || genPid();
				par.Module = cacheInterface.ApexIndex[apx];
				par.Apex = apx;

				EntCache[par.Pid] = new Entity(Nxs, ImpCache[impkey], par);
				fun(null, par.Pid);
			}

			/**
			 * Delete an entity from the module's memory.  If the entity is an Apex of a Module,
			 * then delete all the entities found in that module as well.
			 * @param {string} pid 		the pid of the entity
			 * @callback fun  			the callback to return the pid of the generated entity to
			 */
			function deleteEntity(pid, fun = (err, _pid) => { if (err) log.e(err); }) {
				cacheInterface.deleteEntity(pid, (err, removedPidArray) => {

					//remove ent from EntCache (in RAM)
					for (let i = 0; i < removedPidArray.length; i++) {
						let entPid = removedPidArray[i];
						if (entPid in EntCache) {
							delete EntCache[entPid];
						}
					}
					log.v(`Removed ${(removedPidArray.length == 1) ? 'Entity' : 'Entities'
					} ${removedPidArray.join(' ')}`);
					fun(err, pid);
				});
			}

			/**
			 * Save an entity file. Make sure that all nested files exist in the
			 * cache prior to saving said file
			 * @param {object} par 		the par of the entity
			 * @callback fun  			the callback to return the pid of the generated entity to
			 */
			async function saveEntity(par, fun = (err, _pid) => { if (err) log.e(err); }) {
				let saveEntity = (async (par) => {
					await new Promise((res, rej)=>{
						cacheInterface.saveEntityPar(par, (err, pid) => {
							if (err){
								log.e(err, 'saving ', pid); 
								rej(err);
							}
							log.v(`Saved entity ${par.Pid}`);
							res();
						});
					});
				});

				//check if the entity is the modules Apex
				if (par.Pid != par.Apex) {
					//check if the Apex exists in the cache
					cacheInterface.getEntityPar(par.Apex, async (err) => {
						if (err) {

							//get the Apex's par from the EntCache
							let apexPar = EntCache[par.Apex].Par;

							log.v('Must first save the Apex -- Saving...');
							await saveEntity(apexPar);
							await saveEntity(par);
							fun(null, par.Pid);
						} else {
							//this entity is not the apex and the apex is alread in the cache
							await saveEntity(par);
							fun(null, par.Pid);
						}
					});
				} else {
					await saveEntity(par);
					fun(null, par.Pid);
				}
			}

			/**
			 * Add a module into the in memory Module Cache (ModCache)
			 * @param {string} modName 		the name of the module
			 * @param {string} modZip 		the zip of the module
			 * @callback fun 							the callback just returns the name of the module
			 */
			async function addModule(modName, modZip, fun) {
				//modZip is the uint8array that can be written directly to the cache directory
				if (checkFlag('allow-add-module')) {
					cacheInterface.addModule(modName, modZip, (err, path) => {
						fun(err, path);
					});
				} else {
					let err = 'addModule not permitted in current xGraph process\n'
						+'run xgraph with --allow-add-module to enable';
					log.w(err);
					fun(err);
				}
			}

			/**
			 * Access a file that exists in the module.json
			 * @param {string} module 		the module to look for the file in
			 * @param {string} filename 	the name of the file we're looking for
			 * @callback fun				the callback to return the pid of the generated entity to
			 */
			function getFile(module, filename, fun = _ => _) {
				let mod = ModCache[module];
				if (filename in mod.files) {
					mod.file(filename).async('string').then((dat) => {
						fun(null, dat);
					});
					return;
				}
				let err = `Error: File ${filename} does not exist in module ${module}`;
				log.e(err);
				fun(err);
			}

			/**
			 * load a dependency for a module
			 * @param {string} apx 		pid of the entities apex
			 * @param {string} pid 		the pid of the entity
			 * @param {string} str 			the string of the module to require
			 */
			function loadDependency(apx, pid, str) {
				let moduleType = cacheInterface.ApexIndex[apx];
				return cacheInterface.loadDependency(moduleType, str);
			}

			/**
			 * Spin up an entity from cache into memory and retrievd its context
			 * otherwise just return it's context from memory
			 * @param {string} apx 		the pid of the entities apex
			 * @param {string} pid 		the pid of the entity
			 * @callback fun  			the callback to return the pid of the generated entity to
			 */
			function getEntityContext(pid, fun = _ => _) {
				// TODO issue #23, check entcache here to see if we dont have to load from cache.
				cacheInterface.getEntityPar(pid, (err, data) => {
					if (err) {
						log.e(`Error retrieving a ${data.moduleType} from cache. Pid: ${pid}`);
						log.e(err);
						fun('Unavailable');
						return;
					}
					let par = JSON.parse(data.toString());
					let impkey = par.Module + '/' + par.Entity;
					if (impkey in ImpCache) {
						BuildEnt();
						return;
					}

					GetModule(par.Module, async function (err, mod) {
						if (err) {
							log.e('Module <' + par.Module + '> not available');
							fun('Module not available');
							return;
						}

						if (!(par.Entity in mod.files)) {
							log.e('<' + par.Entity + '> not in module <' + par.Module + '>');
							fun('Null entity');
							return;
						}

						let entString = await new Promise(async (res, _rej) => {
							mod.file(par.Entity).async('string').then((string) => res(string));
						});

						log.v(`Spinning up entity ${par.Module}-${par.Entity.split('.')[0]}`);
						ImpCache[impkey] = indirectEvalImp(entString, log, 
							createRequireFromModuleType(par.Module));
						BuildEnt();
					});

					function BuildEnt() {
						// TODO: rethink the whole process of having to call out a setup and start
						EntCache[pid] = new Entity(Nxs, ImpCache[impkey], par);
						fun(null, EntCache[pid]);
					}
				});
			}

			/**
			 * Starts an instance of a module that exists in the cache.
			 * After generating, the instance Apex receives a setup and start command synchronously
			 * @param {Object} inst 		Definition of the instance to be
			 * spun up or an object of multiple definitions
			 * @param {string?} inst.Module 	The name of the module to spin up
			 * @param {Object=} inst.Par	The par of the to be encorporated with the Module Apex Par
			 * @callback fun 				(err, pid of module apex)
			 */
			async function genModule(moduleDefinition, fun = _ => _) {
				moduleDefinition = JSON.parse(JSON.stringify(moduleDefinition));
				let moduleDefinitions = moduleDefinition;
				if ('Module' in moduleDefinition && (typeof moduleDefinition.Module == 'string')) {
					moduleDefinitions = { 'Top': moduleDefinition };
				}

				let Setup = {};
				let Start = {};
				let PromiseArray = [];
				let symbols = {};

				// loop over the keys to assign pids to the local dictionary and the
				// module definitions (moduleDefinitions)
				for (let key in moduleDefinitions) {
					symbols[key] = genPid();
				}

				//compile each module
				for (let moduleKey in moduleDefinitions) {
					//do a GetModule and compile instance for each 
					PromiseArray.push(new Promise((res, _rej) => {
						let inst = moduleDefinitions[moduleKey];
						GetModule(inst.Module, async function (err, mod) {
							if (err) {
								log.e('GenModule err -', err);
								fun(err);
								return;
							}
							let pidapx = symbols[moduleKey];
							cacheInterface.ApexIndex[pidapx] = inst.Module;


							for (let key in inst.Par) {
								let val = inst.Par[key];

								if (typeof val == 'string') {
									if (val.startsWith('$')) {
										let symbol = val.substr(1);
										if (symbol in symbols) {
											inst.Par[key] = symbols[symbol];
										} else {
											log.w(`${symbol} not in Module key list`);
											log.v(`${Object.keys(symbols)}`);
										}
									}

									if (val.startsWith('\\')) {
										let escaping = val.charAt(1);
										if (escaping == '$' || escaping == '\\') {
											//these are valid escape character
											inst.Par[key] = val.substr(1);
										} else {
											//invalid
											log.w(`\\${escaping} is not a valid escape sequence, ignoring.`);
										}
									}
								} else {
									inst.Par[key] = val;
								}
							}

							await compileInstance(pidapx, inst);

							let schema = await new Promise(async (res, _rej) => {
								if ('schema.json' in mod.files) {
									mod.file('schema.json').async('string').then(function (schemaString) {
										res(JSON.parse(schemaString));
									});
								} else {
									log.e('Module <' + inst.Module + '> schema not in ModCache');
									res();
									return;
								}
							});

							if ('$Setup' in schema.Apex)
								Setup[pidapx] = schema.Apex['$Setup'];
							if ('$Start' in schema.Apex)
								Start[pidapx] = schema.Apex['$Start'];
							res();
						});
					}));
				}

				await Promise.all(PromiseArray);

				log.v('Modules', JSON.stringify(symbols, null, 2));
				log.v('Setup', JSON.stringify(Setup, null, 2));
				log.v('Start', JSON.stringify(Start, null, 2));

				await setup();

				await start();

				fun(null, ('Top' in symbols) ? symbols['Top'] : null, symbols);


				/**
			 * Call setup on the required Module Apexes
			 */
				async function setup() {
					//build the setup promise array
					let setupArray = [];

					for (let pid in Setup) {
						setupArray.push(new Promise((resolve, _reject) => {
							let com = {};
							com.Cmd = Setup[pid];
							com.Passport = {};
							com.Passport.To = pid;
							com.Passport.Pid = genPid();
							sendMessage(com, resolve);
						}));
					}

					await Promise.all(setupArray);
				}

				/**
				 * Call Start on the required Module Apexes
				 */
				async function start() {
					//build the setup promise array
					let startArray = [];

					for (let pid in Start) {
						startArray.push(new Promise((resolve, _reject) => {
							let com = {};
							com.Cmd = Start[pid];
							com.Passport = {};
							com.Passport.To = pid;
							com.Passport.Pid = genPid();
							sendMessage(com, resolve);
						}));
					}

					await Promise.all(startArray);
				}
			}

			/**
			 * Generate array of entities from module
			 * Module must be in cache
			 *
			 * @param {string} pidapx 		The first parameter is the pid assigned to the Apex
			 * @param {object} inst
			 * @param {string} inst.Module	The module definition in dot notation
			 * @param {object} inst.Par		The par object that defines the par of the instance
			 * @param {boolean} saveRoot	Add the setup and start functions of the
			 * apex to the Root.Setup and start
			 */
			async function compileInstance(pidapx, inst, saveRoot = false) {
				log.v('compileInstance', pidapx, JSON.stringify(inst, null, 2));
				let Local = {};
				let modnam = (typeof inst.Module == 'object') ? inst.Module.Module : inst.Module;
				let mod;
				let ents = [];
				modnam = modnam.replace(/:\//g, '.');

				if (modnam in ModCache) {
					mod = ModCache[modnam];
				} else {
					log.e('Module <' + modnam + '> not in ModCache');
					process.exit(1);
					return;
				}

				let schema = await new Promise(async (res, rej) => {
					if ('schema.json' in mod.files) {
						mod.file('schema.json').async('string').then(function (schemaString) {
							res(JSON.parse(schemaString));
						});
					} else {
						log.e('Module <' + modnam + '> schema not in ModCache');
						process.exit(1);
						rej();
						return;
					}
				});

				let entkeys = Object.keys(schema);

				//set Pids for each entity in the schema
				for (let j = 0; j < entkeys.length; j++) {
					let entkey = entkeys[j];
					if (entkey === 'Apex') {
						Local[entkey] = pidapx;
					} else {
						Local[entkey] = genPid();
					}
				}

				//unpack the par of each ent
				for (let j = 0; j < entkeys.length; j++) {
					let entkey = entkeys[j];
					//start with the pars from the schema
					let ent = schema[entkey];
					ent.Pid = Local[entkey];
					ent.Module = modnam;
					ent.Apex = pidapx;

					//unpack the config pars to the par of the apex of the instance
					if (entkey == 'Apex' && 'Par' in inst) {
						let pars = Object.keys(inst.Par);
						for (let ipar = 0; ipar < pars.length; ipar++) {
							let par = pars[ipar];
							ent[par] = inst.Par[par];
						}
					}

					//pars all values for symbols
					let pars = Object.keys(ent);
					for (let ipar = 0; ipar < pars.length; ipar++) {
						let par = pars[ipar];
						let val = ent[par];
						if (entkey == 'Apex' && saveRoot) {
							// if (par == '$Setup') { Setup[ent.Pid] = val; }
							// if (par == '$Start') { Start[ent.Pid] = val; }
						}
						ent[par] = await symbol(val);
					}
					ents.push(ent);
				}

				let entsPromise = [];

				for (let par of ents) {
					entsPromise.push((async function () {
						let impkey = modnam + par.Entity;
						if (!(impkey in ImpCache)) {
							let entString = await new Promise(async (res, _rej) => {
								mod.file(par.Entity).async('string')
									.then((string) => res(string));
							});
							ImpCache[impkey] = indirectEvalImp(entString, log, createRequireFromModuleType(modnam));
						}
						EntCache[par.Pid] = new Entity(Nxs, ImpCache[impkey], par);
						cacheInterface.EntIndex[par.Pid] = par.Apex;
					})());
				}
				await Promise.all(entsPromise);

				async function symbol(val) {
					if (typeof val === 'object') {
						if (Array.isArray(val)) {
							val.map(v => symbol(v));
							val = await Promise.all(val);
						} else {
							for (let key in val) {
								val[key] = await symbol(val[key]);
							}
						}
						return val;
					}
					if (typeof val !== 'string')
						return val;
					let sym = val.substr(1);
					if (val.charAt(0) === '#' && sym in Local)
						return Local[sym];
					if (val.charAt(0) === '\\')
						return sym;
					return val;
				}
			}

			/**
			 * For retrieving modules
			 * Modules come from the cache directory on the harddrive or the
			 * ModCache if its already been read to RAM.
			 * @param {Object} modRequest
			 * @param {String} modRequest.Module
			 * @param {String=} modRequest.Source
			 * @param {Function} fun
			 * @returns mod
			 */
			function GetModule(ModName, fun = _ => _) {
				ModName = ModName.replace(/:\//g, '.');
				if (ModName in ModCache) return fun(null, ModCache[ModName]);
				else cacheInterface.getModule(ModName, (err, moduleZip) => {
					if (err) return fun(err);
					ModCache[ModName] = moduleZip;
					return fun(null, ModCache[ModName]);
				});
			}


		})(this.__options);
	};
};

if (!module.parent) module.exports(process.argv);
