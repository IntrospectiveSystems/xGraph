(function Suite() {
	class Suite{
		SendEntity(com, fun) {
			this.send({Cmd: 'Ping'}, this.Par.B, (err, cmd) => {
				fun(err, com);
			})
		}

		SendModule(com, fun) {
			this.send({Cmd: 'Ping'}, this.Par.PingLink, (err, cmd) => {
				fun(err, com);
			})
		}

		SendEntitySleeping(com, fun) {
			this.send({Cmd: 'Ping'}, this.Par.C, (err, cmd) => {
				fun(err, com);
			})
		}

		SendModuleSleeping(com, fun) {
			this.send({Cmd: 'Ping'}, this.Par.Asleep, (err, cmd) => {
				fun(err, com);
			})
		}

		Ping(com, fun) {
			fun(null, com);
		}

		StartCommand(com, fun) {
			this.Vlt.StartCalled = true;
			log.v('Verbose log');
			log.d('Debug log');
			log.i('Information log');
			log.w('Warning log');
			log.e('Error log');

			if (this.Par.Pid == this.Par.Apex)
				this.send(com, this.Par.B, fun);
			else 
				fun(null, com);
		}

		SetupCommand(com, fun) {
			this.Vlt.SetupCalled = true;
			fun(null, com);
		}

		SetupCalled(com, fun) {
			com.Started = this.Vlt.SetupCalled;
			fun(null, com);
		}

		StartCalled(com, fun) {
			com.Started = this.Vlt.StartCalled;
			fun(null, com);
		}

		GenModuleTest(com, fun) {
			this.genModule({
				Module: 'Suite'
			}, (err, apx) => {
				this.Vlt.gennedModule = com.Pid = apx;
				fun(null, com);
			});
		}

		GenEntityTest(com, fun) {
			let entity = {
				"Entity": "Suite.js",
				"$Setup": "SetupCommand",
				"$Start": "StartCommand"
			};

			let callback = ((err, apx) => {
				this.Vlt.gennedEntity = com.Pid = apx;
				fun(null, com);
			});

			this.genEntity(entity, callback);

		}

		TestGennedModule(com, fun) {
			this.send({
				Cmd: 'Ping'
			}, this.Vlt.gennedModule, (err, cmd) => {
				if(!!err) return fun(err, com);
				this.send({
					Cmd: 'SetupCalled'
				}, this.Vlt.gennedModule, (err, cmd) => {
					if(!!err || !cmd.Started) return fun(err, com);
					this.send({
						Cmd: 'StartCalled'
					}, this.Vlt.gennedModule, (err, cmd) => {
						if(!!err || !cmd.Started) return fun(err, com);
						com.Passed = true;
						fun(null, com);
					});
				});
			});
		}

		TestGennedEntity(com, fun) {
			this.send({
				Cmd: 'Ping'
			}, this.Vlt.gennedEntity, (err, cmd) => {
				if(!!err) return fun(err, com);
				com.Passed = true;
				fun(null, com);
			});
		}

		Require(com, fun) {
			try {
				let async = this.require('async');
				com.ModuleLoaded = true;
				fun(null, com);
			}catch(e) {
				fun(e, com);
			}
		}
	}

	return {dispatch: Suite.prototype};
})();