

/**
 * The base class for all xGraph Entities
 * @param {object} nxs 	the nxs context to give the entity acess too
 * @param {object} imp 	the evaled Entity functionality returned by the dispatch table
 * @param {object} par	the par of the entity
 */
module.exports = function Entity(nxs, imp, par) {
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
		return nxs.loadDependency(Par.Module, Par.Pid, string.toLowerCase());
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
		par.Module = Par.Module;
		par.Apex = Par.Apex;
		nxs.genEntity(par, fun);
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