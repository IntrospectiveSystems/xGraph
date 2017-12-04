(function NeDB() {
	class NeDB {
		Start(com, fun) {
			console.assert(typeof this.Par.Filename != 'string');
			
			log.v('nedb loaded');
			fun(null, com);
		}

		Insert(com, fun) {

			fun(null, com);
		}
	}
	return { dispatch: NeDB.prototype };
})();