//# sourceURL=XOR.js
(function XOR() {


	//-----------------------------------------------------dispatch
	let dispatch = {
		Start: Start,
		BeginLoop:BeginLoop,
		Utility:Utility
	};

	return {
		dispatch: dispatch
	};

	function Start(com, fun){
		console.log("--XOR/Start");
		let that = this;
		let Vlt = this.Vlt;
		let Par = this.Par;
		Vlt.Iteration = 0;
		Vlt.function  = (function (x,y){
			if (x == y)
				return [0];
			else return [1];
		});
		setTimeout(()=>{this.send({Cmd:"BeginLoop"},Par.Pid)},1500);
		fun(null, com);
	}


	function BeginLoop(com, fun){
		console.log("--XOR/BeginLoop");
		let Par= this.Par;
		let Vlt= this.Vlt;
		let that=this;
		let q={Cmd:"Evaluate"};

		Iterate();

		function Iterate(){
			// determine a new state of two random values, 0 and 1
			q.State = [Math.round(Math.random()), Math.round(Math.random())];
			console.log("\nState", q.State);
			that.send(q, Par.Brain, (err,cm) => {
				console.log(Vlt.Iteration, " Returned: Action ",cm.Action);
				Vlt.Iteration++;
				if (Vlt.Iteration <300){
					setTimeout(Iterate,100);
				}
			});
		}
		
		if (fun)
			fun(null, com);
	}

	function Utility(com, fun){
		//console.log("--XOR/Utility", com.State, com.Action);
		com.Output = (1- Math.abs(this.Vlt.function(...com.State)[0] - com.Action));
		fun(null, com);
	}

})();
