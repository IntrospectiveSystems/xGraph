//# sourceURL=XOR.js
(function XOR() {

	//-----------------------------------------------------dispatch
	let dispatch = {
		Start: Start,
		BeginLoop: BeginLoop,
		Utility: Utility
	};

	return {
		dispatch: dispatch
	};

	function Start(com, fun) {
		log.v("--XOR/Start");
		let that = this;
		let Vlt = this.Vlt;
		let Par = this.Par;
		Vlt.Iteration = 0;
		Vlt.xor =  (x, y)=>{
			if (x == y) {
				return [0];
			} else {
				return [1];
			}
		};
		setTimeout(() => { this.send({ Cmd: "BeginLoop" }, Par.Pid) }, 1000);
		fun(null, com);
	}

	function BeginLoop(com, fun) {
		log.v("--XOR/BeginLoop");
		let Par = this.Par;
		let Vlt = this.Vlt;
		let that = this;
		let q = { Cmd: "Train" };
		let r = { Cmd: "Evaluate" };

		Iterate();

		function Iterate() {
			// determine a new state of two random values, 0 and 1
			q.Input = [Math.round(Math.random()), Math.round(Math.random())];
			q.Output = Vlt.xor(...q.Input);

			log.v("\nInput", q.Input, "\nOutput", q.Output);
			that.send(q, Par.Brain, (err, cm) => {
				log.v(Vlt.Iteration);
				Vlt.Iteration++;
				if (Vlt.Iteration < 20) {
					setTimeout(Iterate, 100);
				} else {
					setTimeout(Evaluate, 100);
				}
			});
		}

		function Evaluate() {
			r.Input = [Math.round(Math.random()), Math.round(Math.random())];
			log.v("\nInput", r.Input);
			that.send(r, Par.Brain, (err, cm) => {
				log.v(Vlt.Iteration, " Returned: Output ", cm.Output);
				Vlt.Iteration++;
				if (Vlt.Iteration < 30) {
					setTimeout(Evaluate, 100);
				} else {
					log.v("Done!!");
				}
			});
		}

		if (fun)
			fun(null, com);
	}

	function Utility(com, fun) {
		//log.v("--XOR/Utility", com.State, com.Action);
		com.Output = (1 - Math.abs(this.Vlt.function(...com.State)[0] - com.Action));
		fun(null, com);
	}

})();
