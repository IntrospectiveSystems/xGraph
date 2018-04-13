(function GenModuleSurrogate() {
	class GenModuleSurrogate {
		Setup(com, fun) {
			fun(null, com);
		}

		/**
		 * @description Generates a Module Server side, from another system.
		 * @param {Object} com 
		 * @param {callback} fun 
		 * @memberof GenModuleSurrogate
		 */
		async GenModule(com, fun) {
			this.genModule(this.Par.ModuleDefinition, async (err, apx) => {
				// log.d(`Gen Module Surrogate recieved entity [${apx}]`);
				com.Pid = pidInterchange(apx);
				com.PidInterchange = true;
				fun(null, com);
			});
		}
	}

	return {dispatch: GenModuleSurrogate.prototype};
})();