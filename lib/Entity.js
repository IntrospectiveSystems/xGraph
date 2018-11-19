

/**
 * The base class for all xGraph Entities
 * @param {object} nxs 	the nxs context to give the entity acess too
 * @param {object} imp 	the evaled Entity functionality returned by the dispatch table
 * @param {object} par	the par of the entity
 */



class Instance {
	constructor(imp) {

	}
}

module.exports.Entity = class Entity {
	constructor(nxs, imp, par, log) {
		this.Par = par;
		// this.Imp = imp;
		this.Vlt = {};
		this.log = log;
		this.nxs = nxs;

		if(typeof imp === 'string') {
			// TODO make this part work later, by imprting the functionality of parsing
			// TODO entity files (the og string version) and caching them for future use
			// hey, also, cache the class not the mod object.
		}

		// TODO this is only here for legacy implementations that still use
		// TODO IIFEs to create an entity
		if(typeof imp === 'object') {
			log.w('IIFE entity definitions are deprecated');
			log.w(`upgrade ${this.Par.Module} to a class definition`);
			//create a fake class
			let container = function Container() {}
			// inject all of the commands into it
			// for(let commandName in imp.dispatch) {
			// 	container.prototype[commandName] = imp.dispatch[commandName];
			// }
			container.prototype = imp.dispatch;
			// now imp should be a fake-o class
			imp = container;
		}

		// at this point, lets assume that imp is a class
		// which eventually, should never be container

		this.instance = new imp();

	}

	/**
	 * Given a module name, `require` loads the module, returning the module object.
	 * @param {string} string 	the string of the module to require/load
	 */
	require(string) {
		return this.nxs.loadDependency(this.Par.Module, this.Par.Pid, string.toLowerCase());
	}

	exit(code) {
		this.nxs.exit(code);
	}

	/**
	 * get a file in the module.json module definition
	 * @param {string} filename  	The file to get from this module's module.json
	 * @callback fun 				return the file to caller
	 */
	getFile(filename, fun) {
		this.log.v(`Entity - Getting file ${filename} from ${this.Par.Module}`);
		this.nxs.getFile(this.Par.Module, filename, fun);
	}

	/**
	 * Route a message to this entity with its context
	 * @param {object} com		The message to be dispatched in this entities context
	 * @param {string} com.Cmd	The actual message we wish to send
	 * @callback fun
	 */
	dispatch(com, fun = _ => _) {
		try {
			let disp = this.instance;
			// this.log.w(this.instance.prototype)
			if (com.Cmd in disp) {
				disp[com.Cmd].call(this, com, fun);
				return;
			}
			if ('*' in disp) {
				disp['*'].call(this, com, fun);
				return;
			}
			this.log.w(`${com.Cmd} not found in Entity ${this.Par.Module}`);
			fun('Nada', com);
		} catch (e) {
			this.log.e(`Error in ${this.Par.Entity} Command ${com.Cmd}`);
			this.log.e(e.toString());
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
	genModule(moduleObject, fun) {
		// log.v('--Entity/genModule');
		this.nxs.genModule(moduleObject, fun);
	}

	/**
	 * Add a module into the in memory Module Cache (ModCache)
	 * @param {string} modName 		the name of the module
	 * @param {string} modZip 		the zip of the module
	 * @callback fun 							the callback just returns the name of the module
	 */
	addModule(modName, modZip, fun) {
		this.nxs.addModule(modName, modZip, fun);
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
	genModules(moduleObject, fun) {
		//	log.v('--Entity/genModule');
		this.nxs.genModule(moduleObject, fun);
	}

	/**
	 * deletes the current entity
	 * @callback fun
	 */
	deleteEntity(fun) {
		this.nxs.deleteEntity(this.Par.Pid, fun);
	}

	/**
	 * Create an entity in the same module. Entities can only communicate within a module.
	 * @param {object} par 			The parameter object of the entity to be generated.
	 * @param {string} par.Entity 	The entity type that will be generated.
	 * @param {string=} par.Pid		The pid to set as the pid of the entity.
	 * @callback fun
	 */
	genEntity(par, fun) {
		par.Module = this.Par.Module;
		par.Apex = this.Par.Apex;
		this.nxs.genEntity(par, fun);
	}

	/**
	 * Create and return a 32 character hexadecimal pid.
	 */
	genPid() {
		return this.nxs.genPid();
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
	send(com, pid, fun) {
		// log.v(com, pid);
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
		this.nxs.sendMessage(com, fun);
	}

	/**
	 * Save this entity, including it's current Par, to the cache.
	 * If this entity is not an Apex, send the save message to Apex of this entity's module.
	 * If it is an Apex we save the entity's information,
	 * as well as all other relevant information
	 * @callback fun
	 */
	save(fun) {
		this.nxs.saveEntity(this.Par, fun);
	}

	
}

module.exports.ApexEntity = class ApexEntity extends module.exports.Entity {
	constructor(a, b, c) {
		super(a, b, c);
	}
}
