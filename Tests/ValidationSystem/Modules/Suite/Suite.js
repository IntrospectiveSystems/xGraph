
class Suite{
	SendEntity(com, fun) {
		try{
			this.send({Cmd: 'Ping'}, this.Par.B, (err, cmd) => {
				fun(err, com);
			});
		} catch(e) {}
	}

	Dispatch(com, fun) {
		try{
			this.dispatch({Cmd: 'Ping'}, (err, cmd) => {
				if(err) return;
				fun(err, com);
			});
		} catch(e) {}
	}

	SendModule(com, fun) {
		try{
			this.send({Cmd: 'Ping'}, this.Par.PingLink, (err, cmd) => {
				fun(err, com);
			});
		} catch(e) {}
		
	}

	SendEntitySleeping(com, fun) {
		try{
			this.send({Cmd: 'Ping'}, this.Par.C, (err, cmd) => {
				fun(err, com);
			});
		} catch(e) {}
	}

	SendModuleSleeping(com, fun) {
		try{
			this.send({Cmd: 'Ping'}, this.Par.Asleep, (err, cmd) => {
				fun(err, com);
			});
		} catch(e) {}
	}

	Ping(com, fun) {
		try{
			fun(null, com);
		} catch(e) {}
	}

	StartCommand(com, fun) {
		try{
			this.Vlt.StartCalled = true;
			log.d('Debug log');
			log.v('Verbose log');
			log.x('xGraph log');
			log.i('Information log');
			log.w('Warning log');
			log.e('Error log');

			if (this.Par.Pid == this.Par.Apex) {
				this.send(com, this.Par.B, fun);
			}
			else 
				fun(null, com);
		} catch(e) {}
	}

	SetupCommand(com, fun) {
		
		// Promise.reject();

		try{
			this.Vlt.SetupCalled = true;
			fun(null, com);
		} catch(e) {}
	}

	SetupCalled(com, fun) {
		try{
			com.Started = this.Vlt.SetupCalled;
			fun(null, com);
		} catch(e) {}
	}

	StartCalled(com, fun) {
		try{
			com.Started = this.Vlt.StartCalled;
			fun(null, com);
		} catch(e) {}
	}

	GenModuleTest(com, fun) {
		try{
			this.genModule({
				Module: 'Suite'
			}, (err, apx) => {
				this.Vlt.gennedModule = com.Pid = apx;
				fun(null, com);
			});
		} catch(e) {}
	}

	GenEntityTest(com, fun) {
		try{
			let entity = {
				'Entity': 'Suite.js',
				'$Setup': 'SetupCommand',
				'$Start': 'StartCommand'
			};

			let callback = ((err, apx) => {
				this.Vlt.gennedEntity = com.Pid = apx;
				fun(null, com);
			});

			this.genEntity(entity, callback);
		} catch(e) {}

	}

	TestGennedModule(com, fun) {
		try{
			this.send({
				Cmd: 'Ping'
			}, this.Vlt.gennedModule, (err, cmd) => {
				if(err) return fun(err, com);
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
		} catch(e) {}
	}

	TestGennedEntity(com, fun) {
		try{
			this.send({
				Cmd: 'Ping'
			}, this.Vlt.gennedEntity, (err, cmd) => {
				if(err) return fun(err, com);
				com.Passed = true;
				fun(null, com);
			});
		} catch(e) {}
	}

	Require(com, fun) {
		try{
			try {
				let async = require('async');
				com.ModuleLoaded = true;
				fun(null, com);
			}catch(e) {
				fun(e, com);
			}
		} catch(e) {}
	}

	async TestGetFile(com, fun) {
		await new Promise(resolve => {
			this.getFile("TestFile.txt", (err, dat) => {
				if (err) return fun(null, com);
				if(dat == 'TestData') com.Passed = true;
				resolve();
			});
		});
		fun(null, com);
	}
}