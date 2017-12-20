(function NeDB() {
	class NeDB {

		/**
		 * @description Starts NeDB by either creating or
		 * loading in to memory, the database file
		 * specified in `Par.Filename`
		 * @param {any} com 
		 * @param {any} fun 
		 * @memberof NeDB
		 */
		Start(com, fun) {
			console.assert(typeof this.Par.Filename === 'string');

			if(this.Par.Reset) {
				try {
					this.require('fs').unlinkSync('Test.nedb');
				}catch (e) {}
			}

			const Datastore = this.require('nedb');
			this.Vlt.data = new Datastore({ filename: this.Par.Filename, autoload: true });

			this.Vlt.data.count({}, (err, records) => {
				log.v(`nedb loaded (${records} records)`);
				fun(null, com);
			});
		}

		/**
		 * @description com.Document will be inserted in to
		 * the database and be given an _id: string. in the database.
		 * the id will be added to com.Document 
		 * @param {object} com
		 * @param {object} com.Document
		 * @param {any} fun 
		 * @memberof NeDB
		 */
		Insert(com, fun) {
			console.assert(typeof com.Document === 'object');
			this.Vlt.data.insert(com.Document, (err, doc) => {
				com.Document = doc;
				fun(null, com);
			});
		}

		/**
		 * @description count how many records are in
		 * the database. If Filter object is present
		 * it will only count records matching it.
		 * @param {object} com 
		 * @param {object} com.Filter
		 * @param {number} com.Count
		 * @param {any} fun
		 * @memberof NeDB
		 */
		Count(com, fun) {
			com.Filter = com.Filter || {};
			this.Vlt.data.count(com.Filter, (err, count) => {
				com.Count = count;
				fun(null, com);
			});
		}

		/**
		 * @description Finds and returns all documents matched by
		 * the com.Where object. If com.Projection is present, only
		 * keys listed in that object will be present in the returned
		 * documents.
		 * resulting document array is returned in com.Documents.
		 * @param {object} com 
		 * @param {object} com.Where
		 * @param {object} com.Projection
		 * @param {object[]} com.Documents out
		 * @param {any} fun 
		 * @memberof NeDB
		 */
		Find(com, fun) {
			let q = this.Vlt.data.find(com.Where || {_id: null});
			if(com.Projection) q = q.projection(com.Projection);
			q.exec((err, data) => {
				com.Documents = data;
				fun(null, com);
			});
		}

		/**
		 * @description Updates All documents matching com.Where 
		 * with the values inside com.Set
		 * @param {any} com 
		 * @param {any} fun 
		 * @memberof NeDB
		 */
		Update(com, fun) {
			if(!com.Where){
				log.w('Update: no com.Where present');
				fun(null, com);
				return;
			}
			if(!com.Set) {
				log.w('Update: no com.Set present');
				fun(null, com);
				return;
			}
			this.Vlt.data.update(com.Where, { $set: com.Set }, { Multi: true }, (err, num) => {
				com.ReplacedCount = num;
				fun(err, com);
			});
		}
		
		/**
		 * @description Delete all documents matching com.Where from the database
		 * number of records deleted is returned in com.DeletedCount.
		 * @param {object} com 
		 * @param {object} com.Where
		 * @param {number} com.DeletedCount out
		 * @param {any} fun 
		 * @memberof NeDB
		 */
		Remove(com, fun) {
			this.Vlt.data.remove(com.Where || {_id: null}, {Multi: true}, (err, num) => {
				com.DeletedCount = num;
				fun(null, com);
			});
		}
	}
	return { dispatch: NeDB.prototype };
})();