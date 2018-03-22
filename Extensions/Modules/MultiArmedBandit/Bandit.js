//# sourceURL=Bandit.js
(function Bandit() {
	//a general purpose multi-dimensional searching algorithm that interrogates
	//the dispatching function
	// com.Data = {
	//  State : [] //the current action that was chosen
	// 	Min: [],
	// 	Max: [],
	// 	StepSize: [], //percent
	// 	Iterations: 5, //number
	// 	Delta: 0.03 //percent
	// };
	//
	// com.Host= pid; //id of a host of value function
	// com.EvalName= "Evaluate";
	// com.Mode= "Max"; //or "Min"

	//-----------------------------------------------------dispatch
	let dispatch = {
		Start: Start
	};

	return {
		dispatch: dispatch
	};

	function Start(com, fun){
		console.log("--Bandit/Start");
		setTimeout(()=>{
			log.d(`Terminating the current process with exit code 72`)
			process.exit(72);
		}, 4000);
		fun(com);
	}

})();
