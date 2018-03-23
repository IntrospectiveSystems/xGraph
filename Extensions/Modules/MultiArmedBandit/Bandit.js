//# sourceURL=Bandit.js
(function Bandit() {

	//-----------------------------------------------------dispatch
	let dispatch = {
		Start: Start
	};

	return {
		dispatch: dispatch
	};

	function Start(com, fun){
		console.log("--Bandit/Start");
		this.Vlt.pd = this.require("probability-distributions");

		


		// setTimeout(()=>{
		// 	log.d(`Terminating the current process with exit code 72`)
		// 	process.exit(72);
		// }, 4000);
		fun(com);
	}

})();
