const CacheInterface = require('./Cache.js');
// const fs = require('fs');
const Path = require('path');
const Uuid = require('uuid/v4');
const Volatile = require('volatile');
const {Entity, ApexEntity, Instance} = require('./Entity.js');

module.exports = function xGraph(__options = {}) {	
	this.__options = __options;
	let eventListeners = {
		exit: [],
		init: [],
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
			const Logger = require('../lib/Logger.js');
			const log = new Logger(__options);
			
			let cacheInterface;
			let ModCache = {};					// {<folder>: <module>}
			let Stop = {};						// {<Apex pid>:<function>}
			let EntCache = {};					// {<Entity pid>:<Entity>
			let ImpCache = {};					// {<Implementation path>: <Implementation(e.g. disp)>}
			let Nxs = {
				genPid,
				getServices,
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

			function createRequireFromModuleType(modtype) {
				return cacheInterface.loadDependency.bind(cacheInterface, modtype);
			}

			function indirectEvalImp(entName, entString, ...injections) {

				let _eval = _ => {
					return (1,eval)(_);
				};
				
				let container = `//# sourceURL=${entName}\n(function(log, require) {const a = ${entString}; return a; })`;				
				let imp = _eval(container);				
				imp = imp(...injections);

				if(typeof imp == 'undefined') {
					if (!('dispatch' in imp)) {
						log.e('Invalid Entity File');
						throw new Error('E_INVALID_ENTITY');
					}
				}

				else if(typeof imp === 'function') return imp;

				//we have a dispatch tabler! (this is either the iife or pseudo class pattern)
				else if(typeof imp === 'object') {
					log.w('IIFE entity definitions are deprecated');
					log.w(`upgrade ${entName} to a class definition`);

					if (!('dispatch' in imp)) {
						log.e('Entity does not return a dispatch Table');
						throw new Error('E_NO_DISPATCH_TABLE');
					}
					let temp = function() {};
					temp.prototype = imp.dispatch;
					imp = temp;
					return imp;
				}

				else {
					log.e('Not even jesus could tell you what went wrong here');
					throw new Error('E_ENTITY_NEEDS_JESUS');
				}

			}

			function SendProfileData() {
				let memory = process.memoryUsage();
				let cpu = process.cpuUsage();
				let uptime = process.uptime();

				log.pi({					
					Type: 'System',
					Memory: memory,
					Cpu: cpu,
					Uptime: uptime
				})
			}


			log.i('=================================================');
			log.i('Nexus Warming Up:');

			
			if (checkFlag("systemProfile")) {
				setInterval(SendProfileData, 1000);
			}

			//set CWD
			__options.cwd = __options.cwd ? Path.resolve(__options.cwd) : Path.resolve('.');

			//set Cache location
			__options.cache = __options.cache || Path.join(__options.cwd, 'cache');
			log.x(`cache set to ${__options.cache}`);		

			await initiate();

			let externalPid = genPid();
			return {
				send: function send(com, pid, fun) {
					// log.x(com, pid);
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
				stop: exit,
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
				
				let Init = {};
				let Setup = {};
				let Start = {};

				let cacheOptions = {
					path: __options.cache, log
				};
	
				if(checkFlag('node_modules')) {
					cacheOptions.node_modules = checkFlag('node_modules');
				}
				cacheInterface = new CacheInterface(cacheOptions);				


				let cache = await cacheInterface.loadCache();
				Init = cache.init;
				Start = cache.start;
				Setup = cache.setup;
				Stop = Object.assign(Stop, cache.stop);

				await init();

				await setup();

				await start();

				run();

				/////////////////////////////////////////////////////////////////////////////////////////
				//
				// Only Helper Functions Beyond This Point
				//
				//

				async function init() {
					log.i('--Nexus/Init');
					//build the init promise array
					let initArray = [];

					for (let pid in Init) {
						initArray.push(new Promise((resolve, _reject) => {
							let com = {};
							com.Cmd = Init[pid];
							com.Passport = {};
							com.Passport.To = pid;
							com.Passport.Pid = genPid();
							sendMessage(com, resolve);
						}));
					}

					await Promise.all(initArray);
					log.x('--Nexus: All Inits Complete');
				}


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
					log.x('--Nexus: All Setups Complete');

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
					log.x('--Nexus: All Starts Complete');
				}

				function run() {
					log.i('--Nexus/Run');					
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
				log.x(Object.keys(require.cache).join('\n'));

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
				log.x('--Nexus: All Stops Complete');

				dispatchEvent('exit', { exitCode: code });
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
			 * Scan the array of Pids and send a 'GetServices'
			 * command to each in turn to accumulate the 
			 * services used by a partifcular module
			 * @return {promise} Promise that resolves to an object of keyed service functions
			 * The elements of 'services' reference a module that is expected to support a 'GetServices'
			 * function 
			 */
			async function getServices(services, instance) {
				let svc = {};			
								
				return new Promise(async (resolve, _reject) => {
					for (let is = 0; is < services.length; is++) {
						let pid = services[is];
						let obj = await service(pid, instance);
						for(let key in obj) {
							svc[key] = obj[key];
						}
					}
					console.log('Nexus/svc', Object.keys(svc));
					resolve(svc);
				});

				/**
				 * Harvest services from a service provider referenced by
				 * the given pid. The service provider module is expected
				 * to implement the 'GetServices' function that adds
				 * an object 'Services' to the com if not present and then 
				 * fills it with key-value pairs where the key is the name
				 * of the service and the value is the function implementing
				 * the service.
				 * @param {*} pid 
				 * Note: This is one-time code so that effiency is not a
				 * critical factor.
				 */
				async function service(pid, instance) {
					let profileMessage = {
						Type: 'Command',
						Cmd: 'GetServices',
						From: instance.Par.Pid,
						To: pid
					}				
					let timerId = log.p(profileMessage);
					

					return new Promise((res, _rej) => {
						let com = {};
						com.Cmd = 'GetServices';
						com.Module = instance;
						com.Passport = {};
						com.Passport.To = pid;
						com.Passport.Pid = genPid();
						com.Services = {};
						sendMessage(com, function(_err, r) {
							if (timerId) log.timeEnd(timerId);
							res(r.Services);
						})
					});
				}
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
				//let timerId;
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
				let profileMessage = {
					Type: 'Command',
					Cmd: com.Cmd,
					From: com.Passport.From,
					To: com.Passport.To
				}
				let timerId = null;
				if (com.Cmd != 'GetServices') {
					timerId = log.p(profileMessage);
				}
				

				let pid = com.Passport.To;
				let apx = com.Passport.Apex || pid;
				if (pid in EntCache) {
					done(null, EntCache[pid]);
					return;
				} else {
					getEntityContext(pid, done);
				}

				async function done(err, entContextVolatile) {
					let entApex = await new Promise(res =>
						entContextVolatile.lock((val) => {
							res(val.Apex);
							return val;
						})
					);

					if (err) {
						log.w(err);
						log.w(JSON.stringify(com, null, 2));
						fun(err, com);
						return;
					}

					//TODO pid instanceOf ApexEntity
					if ((EntCache[pid].Apex == EntCache[pid].Pid) || (entApex == apx)) {
						let entContext = await new Promise(res => entContextVolatile.lock((context) => {
							res(context); return context;
						}));
						entContext.instance.dispatch(com, reply);
					} else {
						let err = 'Trying to send a message to a non-Apex'
							+ 'entity outside of the sending module';
						log.w(err);
						log.w(JSON.stringify(com, null, 2));
						fun(err, com);
					}
				}
				function reply(err, q) {					
					if (timerId) log.timeEnd(timerId);
										
					fun(err, q);
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
			async function genEntity(par, log, fun = _ => log.e(_)) {
				if (!('Entity' in par)) {
					fun('No Entity defined in Par');
					return;
				}
				log.w('genEntity', par);
				par.Pid = par.Pid || genPid();
				
				let impkey = (par.Module + '/' + par.Entity);
				let mod = ModCache[par.Module];

				if (!(par.Entity in mod.files)) {
					log.e('<' + par.Entity + '> not in module <' + par.Module + '>');
					fun('Null entity');
					return;
				}

				if (!(impkey in ImpCache)) {
					let entString = await new Promise(async (res, _rej) => {
						mod.file(par.Entity).async('string').then((string) => res(string));
					});
					ImpCache[impkey] = indirectEvalImp(impkey, entString, log, 
						createRequireFromModuleType(par.Module));
				}

				EntCache[par.Pid] = new Volatile(new Entity(Nxs, ImpCache[impkey], par, log));
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
					log.x(`Removed ${(removedPidArray.length == 1) ? 'Entity' : 'Entities'
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
					await new Promise((res, rej) => {
						cacheInterface.saveEntityPar(par, (err, pid) => {
							if (err){
								log.e(err, 'saving ', pid); 
								rej(err);
							}
							log.x(`Saved entity ${par.Pid}`);
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
							let apexPar = await new Promise((res, _rej) => {
								EntCache[par.Apex].lock((entityContext) => {
									res(entityContext.Par);
									return entityContext;
								});
							});

							log.x('Must first save the Apex -- Saving...');
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
					try {
						let newModname = await cacheInterface.addModule(modName, modZip);
						fun(null, newModname);
					} catch(e) {
						fun(e, modName);
					}
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
			function loadDependency(moduleType, pid, str) {
				return cacheInterface.loadDependency(moduleType, str);
			}			

			/**
			 * Spin up an entity from cache into memory and retrievd its context
			 * otherwise just return it's context from memory
			 * @param {string} apx 		the pid of the entities apex
			 * @param {string} pid 		the pid of the entity
			 * @callback fun  			the callback to return the pid of the generated entity to
			 */
			async function getEntityContext(pid, fun = _ => _) {
				EntCache[pid] = new Volatile({});
				await EntCache[pid].lock((_entityContext) => {
					return new Promise((res, _rej) => {					
						
						cacheInterface.getEntityPar(pid, (err, data) => {
							let par = JSON.parse(data.toString());
							let options = {};							
							if (checkFlag('entity-log')) {
								options.scope = par.Name
							}
							options.pid = pid;
							let entityLog = new Logger(Object.assign(options, __options));
							log.pi({
								Type: 'Entity',
								Modules: [
									{name: par.Name, pid: pid}
								]
							});
							
							
							if (err) {
								log.e(`Error retrieving a ${data.moduleType} from cache. Pid: ${pid}`);
								log.e(err);
								fun('Unavailable');
								return;
							}
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

								log.x(`Spinning up entity ${par.Module}-${par.Entity.split('.')[0]}`);
								ImpCache[impkey] = indirectEvalImp(impkey, entString, entityLog,
									createRequireFromModuleType(par.Module));
								BuildEnt();
							});

							function BuildEnt() {
								// TODO: rethink the whole process of having to call out a setup and start							

								res(new Entity(Nxs, ImpCache[impkey], par, entityLog));

							}
						});
					});
				});
				fun(null, EntCache[pid]);
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

							for (let key in inst.Par) {
								let val = inst.Par[key];

								if (typeof val == 'string') {
									if (val.startsWith('$')) {
										let symbol = val.substr(1);
										if (symbol in symbols) {
											inst.Par[key] = symbols[symbol];
										} else {
											log.w(`${symbol} not in Module key list`);
											log.x(`${Object.keys(symbols)}`);
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

				log.x('Modules', JSON.stringify(symbols, null, 2));
				log.x('Setup', JSON.stringify(Setup, null, 2));
				log.x('Start', JSON.stringify(Start, null, 2));

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
				log.x('compileInstance', pidapx, JSON.stringify(inst, null, 2));
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

					//unpack the inst pars to the par of the apex of the instance
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
						let impkey = modnam + '/'+ par.Entity;
						if (!(impkey in ImpCache)) {
							let entString = await new Promise(async (res, _rej) => {
								if (!(par.Entity in mod.files)){
									log.e('Entity <'+par.Entity+'> not in Module <' + modnam + '>');
									process.exit(1);
									return;
								}
								mod.file(par.Entity).async('string')
									.then((string) => res(string));
							});
							ImpCache[impkey] = indirectEvalImp(impkey, entString, log,
								createRequireFromModuleType(modnam));
						}
						EntCache[par.Pid] = new Volatile(new Entity(Nxs, ImpCache[impkey], par, log));
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
