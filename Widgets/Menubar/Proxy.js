//# sourceURL=Proxy.js
//jshint esversion: 6
//this is a test change! :)
(function Proxy() {

	function command(com, fun) {
		// debugger;
		// console.log('INCOMING PROXY');
		// console.log(JSON.stringify(com, null, 2));
		com.Vlt = this.Vlt;
		com.Par = this.Par;

		var that = this;

		// give the com a super function, this will
		// always call the base.
		com.super = function (com, fun) {
			// console.log('CALLING SUPER OF ' + com.Cmd);
			if (!('Vlt' in com)) com.Vlt = that.Vlt;
			if (!('Par' in com)) com.Par = that.Par;
			that.send(com, that.Par.Base, fun);
		}

		// this is needed in case a base class calls
		// a function that child has overridden
		com.dispatch = function (com, fun) {
			// console.log('DISPATCHING TO SELF ' + com.Cmd);
			if (!('Vlt' in com)) com.Vlt = that.Vlt;
			if (!('Par' in com)) com.Par = that.Par;

			that.dispatch(com, fun);
		}

		// console.log('FUNCTIONS SAT UP');
		// console.log('SENDING TO CHILD');

		// debugger;
		// send the command to the child
		this.send(com, this.Par.Child, (err, cmd) => {
			// console.log('CHILD SAID', err, cmd);
			// if the command didnt exist, send it to the base
			if (err) {
				if (err == com.Cmd + ' unknown') {
					// console.log('SENDING TO PARENT');
					//the command should be passed to base
					this.send(com, this.Par.Base, (err, cmd) => {
						// no matter what happens, at this point, we're
						// out of things to do so....
						// console.log('PARENT SAID', err, cmd);
						fun(null, com);
					});
				}
				else {
					// console.log('THERE WAS AN ERROR IN PROXY ', err);
				}
			}

			// if it did exist, it will take care of calling super
			// so we should be done
			else if (fun)
				fun(null, com);
		});
	}

	return {
		dispatch: {
			'*': command
		}
	};

})();