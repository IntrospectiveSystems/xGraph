//# sourceURL=Hedgehog.js
(function Hedgehog() {
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
		Instantiate: Instantiate
	};

	return {
		dispatch: dispatch
	};

	function Instantiate(com, fun){
		//this function is called when a hedgehog module is invoked
		console.log("Instantiated with com ",com);

		let that = this;
		let Vlt = this.Vlt;

		//static data
		Vlt.Initial = com.Data;
		Vlt.Host = com.Host;
		Vlt.EvalName = com.EvalName;
		Vlt.Mode = com.Mode;


		//current/updating data
		Vlt.State = Vlt.Initial.State;
		Vlt.StepSize = Vlt.Initial.StepSize;
		Vlt.Value = [];
		Vlt.Test = undefined;


		this.send({Cmd:Vlt.EvalName, State: Vlt.State}, Vlt.Host, beginSearch);


		function beginSearch(err, cm){
			console.log("Beginning the search ...");
			let iteration = 0;

			if (err){
				err = "There was an error getting the initial value of the predefined action"+ err;
				console.log(err);
			}

			Vlt.Initial.Value = cm.Value;
			Vlt.Value.push(cm.Value);
			console.log("Initial state is ", Vlt.State);
			console.log("initial value is ", cm.Value);

			Onward();

			function Onward() {
				iteration ++;
				//console.log("Starting iteration number ", iteration);
				///find a step
				Vlt.Test = nextStep();

				//console.log("We will now test value ", Vlt.Test);
				///get the value from a step
				that.send({Cmd: Vlt.EvalName, State: Vlt.Test}, Vlt.Host, processTestResults);

				function processTestResults(err, c){
					if (err){
						err = "There was an error getting the value of the action"+ err;
						console.log(err);
					}
					//console.log("Returned value is ", c.Value);

					///determine if we should take that step
					if (Vlt.Mode == "Max" && c.Value < Vlt.Value[Vlt.Value.length-1]){
						if (iteration < Vlt.Initial.Iterations){
							setTimeout(Onward,0);
							return;
						}else{
							done();
							return;
						}
					}
					if (Vlt.Mode == "Min" && c.Value > Vlt.Value[Vlt.Value.length-1]){
						if (iteration < Vlt.Initial.Iterations){
							setTimeout(Onward,0);
							return;
						}else{
							done();
							return;
						}
					}

					//console.log("We've found a better state ", Vlt.Test, " Value ", c.Value);

					Vlt.State = Vlt.Test;
					Vlt.Value.push(c.Value);

					if (Vlt.Value.length>10) {
						Vlt.Value.shift();
					}

					///determine if we should take another step or finish
					//console.log("are we under the number of max iterations? ", iteration <= Vlt.Initial.Iterations );
					if (iteration < Vlt.Initial.Iterations && DeltaCheck()){
						Onward();
					}else{
						done();
					}
				}
			}

			function done(){
				console.log("Finished after ", iteration, " iterations");
				com.State = Vlt.State;
				fun(err, com);
			}

			function DeltaCheck(){
				let bool = true;

				if (Vlt.Value.length ==10){
					let diffArr = Vlt.Value.map((v,i)=>{
						return (((v-Vlt.Value[i-1])/Vlt.Value[i-1])<0?(-1*(v-Vlt.Value[i-1]))/Vlt.Value[i-1]:(v-Vlt.Value[i-1])/Vlt.Value[i-1]);
					});
					diffArr.shift();
					let avg = diffArr.reduce((x,y)=>{return x+y});
					avg = avg/diffArr.length;
					//console.log("The average change ", avg);
					if (avg < Vlt.Initial.Delta && (Vlt.Value[Vlt.Value.length-1]-Vlt.Value[Vlt.Value.length-2])/Vlt.Value[Vlt.Value.length-2]<Vlt.Initial.Delta)
						bool = false;
				}
				//console.log("DeltaCheck returned ", bool);
				return bool;
			}

			function nextStep(){


				let step = [];
				for (let k=0;k<Vlt.State.length;k++){
					step[k]=Vlt.State[k];
				}

				//console.log("Previous state is ", ...step);


				let increment = 0;
				let scale = 1;
				for (let i = 0 ; i <step.length ; i++){

					scale = 0.5*(1+Math.cos(Math.PI*(iteration/Vlt.Initial.Iterations)));
					//console.log("I is ", i, " Scale is ", scale);
					stepsize = Vlt.StepSize[i]*(Vlt.Initial.Max[i]-Vlt.Initial.Min[i])*(scale);
					//console.log("Step size is ", stepsize);
					increment = (Math.random()<0.5?-1:1)*stepsize +norm(0, stepsize*0.1);
					//console.log("Increment is ", increment);

					step[i] = step[i]+ increment;
					if (step[i]>Vlt.Initial.Max[i]) {
						increment = norm(0, stepsize*0.1);
						step[i] = Vlt.Initial.Max[i] -(increment<0?(-1*increment):increment);
					}
					if (step[i]<Vlt.Initial.Min[i]) {
						increment = norm(0, stepsize*0.1);
						step[i] = Vlt.Initial.Min[i] +(increment<0?(-1*increment):increment);
					}
				}

				return step
			}

			function norm(avg, std){
				let fac, rsq, v1, v2, x;

				do {
					v1= 2*Math.random()-1;
					v2 = 2* Math.random() -1;
					rsq = v1*v1 +v2*v2;
				}while (rsq>=1.0)

				fac = Math.sqrt(-2.0 * Math.log(rsq) / rsq);
				x=std * fac * v1 + avg;
				return x;
			}

		}
	}

})();
