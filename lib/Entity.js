

/**
 * The base class for all xGraph Entities
 * @param {object} nxs 	the nxs context to give the entity acess too
 * @param {object} imp 	the evaled Entity functionality returned by the dispatch table
 * @param {object} par	the par of the entity
 */

module.exports.Entity = class Entity {
	constructor(nxs, imp, par, log) {	

		if(typeof imp === 'string') {
			// TODO make this part work later, by imprting the functionality of parsing
			// TODO entity files (the og string version) and caching them for future use
			// hey, also, cache the class not the mod object.
		}

		// TODO this is only here for legacy implementations that still use
		// TODO IIFEs to create an entity
		if(typeof imp === 'object') {
			//create a fake class
			let container = function() {};
			// inject all of the commands into it
			// for(let commandName in imp.dispatch) {
			// 	container.prototype[commandName] = imp.dispatch[commandName];
			// }
			// * prototype is ONLY on class function. it defines the functions
			// * to inject into the instance, when created.

			container.prototype = imp.dispatch;

			// now imp should be a fake-o class
			imp = container;
		}

		// at this point, lets assume that imp is a class
		// which eventually, should never be container (maybe, idk, who am i, god?)

		// !!!
		// TODO make this not bad ty
		// * ALMOST BOSS

		this.instance = new imp();
		this.instance.Par = par;
		this.instance.Vlt = {};				
		
		this.instance.require = this.require.bind(this.instance, nxs);		
		this.instance.save = this.save.bind(this.instance, nxs);
		this.instance.genPid = this.genPid.bind(this.instance, nxs);
		this.instance.getFile = this.getFile.bind(this.instance, nxs);
		this.instance.getServices = this.getServices.bind(this.instance, nxs);
		this.instance.exit = this.exit.bind(this.instance, nxs);
		this.instance.log = log;

		this.instance.send = this.send.bind(this.instance, nxs, true);
		this.instance.sendLocal = this.send.bind(this.instance, nxs, false);
		this.instance.dispatch = this.dispatch;
		
		this.instance.genModule = this.genModule.bind(this.instance, nxs);
		this.instance.genModules = this.genModules.bind(this.instance, nxs);
		this.instance.addModule = this.addModule.bind(this.instance, nxs);
		
		this.instance.genEntity = this.genEntity.bind(this.instance, nxs);
		this.instance.deleteEntity = this.deleteEntity.bind(this.instance, nxs);
	}	

	/**
	 * Given a module name, `require` loads the module, returning the module object.
	 * @param {string} string 	the string of the module to require/load
	 */
	require(nxs, string) {
		return nxs.loadDependency(this.Par.Module, this.Par.Pid, string.toLowerCase());
	}

	// this literally only exists for that one line in nexus that asks the entcache
	// for an entity's Par.Apex.
	// Apex will be removed from Par eventually, so this serves as a first stepping stone.
	get Apex () {
		return this.instance.Par.Apex;
	}	

	exit(nxs, code = 0) {
		nxs.exit(code);
	}

	/**
	 * Scan the array of Pids and send a 'GetServices'
	 * command to each in turn to accumulate the 
	 * services used by a partifcular module
	 * @param {array} services	Pid array of service providers that support 'GetServices' function
	 * @return {promise} Promise that resolves to an object of keyed service functions
	 * The services parameter is optional and if not provided the list from Par if any is used.
	 * The elements of 'services' reference a module that is expected to support a 'GetServices'
	 * function.
	 * 
	 * Usage: this.Svc = await this.getServices();
	 * The promise returned resolves to an object of services collected from the service providers.
	 * The services can then be called such that Svc.<function name> to access the actual service.
	 */
	async getServices(nxs, services) {		
		let srvcs;
		if(services === undefined) {
			if('Services' in this.Par) {
				srvcs = this.Par.Services;
			} else {				
				this.log.w(`No service providers defined for ${this.Par.Entity}`);
				return;
			}
		} else {
			srvcs = services;
		}
		return nxs.getServices(srvcs, this);
	}

	/**
	 * get a file in the module.json module definition
	 * @param {string} filename  	The file to get from this module's module.json
	 * @callback {function} fun 	Return the file to caller
	 */
	getFile(nxs, filename, fun) {
		this.log.x(`Entity - Getting file ${filename} from ${this.Par.Module}`);
		nxs.getFile(this.Par.Module, filename, fun);
	}

	/**
	 * Route a message to this entity with its context
	 * @param {object} com		The message to be dispatched in this entities context
	 * @param {string} com.Cmd	The actual message we wish to send
	 * @callback fun
	 */
	dispatch(com, fun = _ => _) {
		try {
			if (com.Cmd in this) {
				this[com.Cmd](com, fun);
				return;
			}
			if ('*' in this) {
				this['*'](com, fun);
				return;
			}
			this.log.w(`${com.Cmd} not found in Entity ${this.Par.Module}`);
			fun('Nada', com);
		} catch (e) {
			this.log.e(`Error in ${this.Par.Entity} Command ${com.Cmd}`);
			this.log.e(e.toString());
			process.exit(2); // ! potential for malicious attacks. genEntity something
			// ! meant to break, kill a server also bad because of the API. if it shuts
			// ! process down, and theres a second system in process...
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
	genModule(nxs, moduleObject, fun) {
		// log.x('--Entity/genModule');
		nxs.genModule(moduleObject, fun);
	}

	/**
	 * Add a module into the in memory Module Cache (ModCache)
	 * @param {string} modName 		the name of the module
	 * @param {string} modZip 		the zip of the module
	 * @callback fun 							the callback just returns the name of the module
	 */
	addModule(nxs, modName, modZip, fun) {
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
	genModules(nxs, moduleObject, fun) {
		//	log.x('--Entity/genModule');
		nxs.genModule(moduleObject, fun);
	}

	/**
	 * deletes the current entity
	 * @callback fun
	 */
	deleteEntity(nxs, fun) {
		nxs.deleteEntity(this.Par.Pid, fun);
	}

	/**
	 * Create an entity in the same module. Entities can only communicate within a module.
	 * @param {object} par 			The parameter object of the entity to be generated.
	 * @param {string} par.Entity 	The entity type that will be generated.
	 * @param {string=} par.Pid		The pid to set as the pid of the entity.
	 * @callback fun
	 */
	genEntity(nxs, par, fun) {
		par.Module = this.Par.Module;
		par.Apex = this.Par.Apex;
		nxs.genEntity(par, this.log, fun);
	}

	/**
	 * Create and return a 32 character hexadecimal pid.
	 */
	genPid(nxs) {
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
	send(nxs, clean, com, pid, fun) {
		if(clean) com = JSON.parse(JSON.stringify(com));
		// log.x(com, pid);
		// TODO this code is duplicated when giving the npm API
		if (!('Passport' in com))
			com.Passport = {};
		com.Passport.To = pid;
		if ('Apex' in this.Par)
			com.Passport.Apex = this.Par.Apex;
		if (fun)
			com.Passport.From = this.Par.Pid;
		if (!('Pid' in com.Passport))
			com.Passport.Pid = this.genPid();
		nxs.sendMessage(com, fun ? (err, cmd) => {
			if(clean) cmd = JSON.parse(JSON.stringify(cmd));
			if(fun) fun(err, cmd);
		} : undefined);
	}

	/**
	 * Save this entity, including it's current Par, to the cache.
	 * If this entity is not an Apex, send the save message to Apex of this entity's module.
	 * If it is an Apex we save the entity's information,
	 * as well as all other relevant information
	 * @callback fun
	 */
	save(nxs, fun) {
		nxs.saveEntity(this.Par, fun);
	}

	
}

module.exports.ApexEntity = class ApexEntity extends module.exports.Entity {
	constructor(a, b, c) {
		super(a, b, c);
	}
}
