(function Set() {

	class Set {
		Setup(com, fun) {
			this.Par.List = this.Par.List || [];
			this.postUpdate = async () => {
				return new Promise((res) => {
					log.v('post update helper')
					if('Broadcast' in this.Par) {
						log.i('Set sending data update');
						this.send({
							Cmd: 'Broadcast',
							Command: {
								Cmd: 'DataUpdate'
							}
						}, this.Par.Broadcast, (err, cmd) => {
							log.v(`error`, err);
							log.v('cmd', cmd);
							res();
						});
					}
				});
				
			}
			this.save(_ => fun(null, com));
		}

		AddItem(com, fun) {
			log.i('item added to set');
			let key = com.Pid || com.Item;
			if(this.Par.List.indexOf(key) < 0) {
				this.Par.List.push(key);
				this.postUpdate();
			}
			// try to subscribe to them, for funzies
			this.send({Cmd: 'Subscribe', Pid: this.Par.Pid}, key, (err, cmd) => {
				if(!err) log.i(`Set subscribed to ${key}`);
				this.save(_ => fun(null, com));
			});
		}

		DataUpdate(com, fun) {

			this.postUpdate();
			fun(null, com);
		}

		RemoveItem(com, fum) {
			var index = -1; // while indexOf finds an occurence of com.Pid or com.Item
			while((index = this.Par.List.indexOf(com.Pid || com.Item)) != -1) {
				this.Par.List.splice(index, 1); // delete it
			}
			this.save(_ => fun(null, com));
		}

		async GetData(com, fun) {
			log.i('get set data');
			switch(com.Type || 'Data') {
				case 'Items': {
					break;
				}
				case 'Data': {
					com.Data = [];
					for(let i = 0; i < this.Par.List.length; i++) {
						com.Data.push(await new Promise(async (resolve) => {
							log.i(`getting data from ${this.Par.List[i]}`);
							this.send({
								Cmd: 'GetData',
								Type: com.DataType || undefined
							}, this.Par.List[i], (err, cmd) => {

								// if anyone needs a pid interchange, we signal that
								com.PidInterchange = com.PidInterchange || cmd.PidInterchange;
								cmd.Passport = undefined;
								cmd.Cmd = undefined;

								resolve(cmd);
							});
						}));

					}
					break;
				}
			}
			fun(null, com);
		}
	}

	return {dispatch: Set.prototype}
})();