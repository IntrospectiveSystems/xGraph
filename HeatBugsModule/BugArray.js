(function BugArray() {



	var dispatch ={
		Setup : Setup,
		MoveBugs:MoveBugs
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		console.log('--BugArray/Setup');

		let Par = this.Par;
		let Vlt = this.Vlt;

		//Build the BugArray
		Vlt.geometry = new THREE.Geometry();
		Vlt.geometry.name = "BugGeometry";

		Vlt.material = new THREE.PointsMaterial({size:4,vertexColors: true});
		Vlt.material.name = "BugMaterial";
		Vlt.material.depthWrite = false;



		let range = Par.CubeDimension;
		let color,relativeTemp;
		for (let i=0; i<Par.BugCount; i++) {
			//Set a random location for each bug
			let particle = new THREE.Vector3(
				Math.floor(Math.random() * range),
				Math.floor(Math.random() * range),
				Math.floor(Math.random() * range)
			);
			if (Par.SeedSite){
				particle = new THREE.Vector3(
					Math.floor(range/2),
					Math.floor(range/2),
					Math.floor(range/2)
				);
			}
			Vlt.geometry.vertices.push(particle);

			//Set the base color to be different lightness' of red based on eac
			//bugs personal temperature
			color = new THREE.Color();
			relativeTemp = Math.random();
			color.setHSL(0, 1, (relativeTemp));
			Vlt.geometry.colors.push(color);
			if ('desiredTemps' in Vlt.geometry) {
				Vlt.geometry.desiredTemps.push(Par.DesiredTemp.Minimum+
					relativeTemp*(Par.DesiredTemp.Maximum-Par.DesiredTemp.Minimum));
			}
			else{
				Vlt.geometry.desiredTemps = [];
				Vlt.geometry.desiredTemps.push(Par.DesiredTemp.Minimum+
					relativeTemp*(Par.DesiredTemp.Maximum-Par.DesiredTemp.Minimum));
			}if ('outputTemps' in Vlt.geometry) {
				Vlt.geometry.outputTemps.push(Par.BugTemp.Minimum+
					Math.random()*(Par.BugTemp.Maximum-Par.BugTemp.Minimum));
			}
			else{
				Vlt.geometry.outputTemps = [];
				Vlt.geometry.outputTemps.push(Par.BugTemp.Minimum+
					Math.random()*(Par.BugTemp.Maximum-Par.BugTemp.Minimum));
			}
		}


		if (fun)
			fun();

	}

	function xyzToIdx (x,y,z,range){
		let output = range*range*x+range*y+z;
		//console.log(x,y,z, output);
		if (x==0 && y==0 &&z==0)
			debugger;
		return output;
	}

	function idxToXyz (idx, range){
		return ({	"x": Math.floor(idx / (range*range)),
			"y": Math.floor((idx % (range*range))/range),
			"z": idx%range})
	}

	function MoveBugs(com, fun){
		//console.log("--BugArray/MoveBugs");
		let Vlt=this.Vlt;
		let Par=this.Par;

		if (!com.heatField){
			console.log("No heat field we return the unedited bug system");
			com.System = {"geometry" :Vlt.geometry,"material":Vlt.material};
			fun(null,com);
			return;
		}



		//we here will move the bugs according to the most desired location
		let vertex, diffArr,wantTemp, vector,diff, heatIdx, idx=-1;
		let nbhd= Par.Nbhd;
		let range = Par.CubeDimension;

		for (let i=0; i<Par.BugCount; i++) {
			//get its location
			vertex = Vlt.geometry.vertices[i];
			wantTemp = Vlt.geometry.desiredTemps[i];
			diffArr = [];

			for (let j=0;j<nbhd.x.length;j++){

				if (vertex.x+nbhd.x[j]<0 ||vertex.x+nbhd.x[j]>=range) {
					//console.log("out of range");
					diffArr.push(10000000);
					continue;
				}
				if (vertex.y+nbhd.y[j]<0 ||vertex.y+nbhd.y[j]>=range) {
					diffArr.push(10000000);
					//console.log("out of range");
					continue;
				}
				if (vertex.z+nbhd.z[j]<0 ||vertex.z+nbhd.z[j]>=range) {
					diffArr.push(10000000);
					//console.log("out of range");
					continue;
				}

				heatIdx = xyzToIdx(vertex.x+nbhd.x[j],vertex.y+nbhd.y[j],vertex.z+nbhd.z[j], range);
				diff = .01*Math.random() + Math.abs(__HeatField[heatIdx]-wantTemp);
				if (isNaN(diff)) {
					//debugger;
					diff = (.01*Math.random() + wantTemp);
				}
				diffArr.push(diff);

			}

			idx = diffArr.indexOf(Math.min(...diffArr));

			if (Math.random()<Par.PRandMove) {

				idx = Math.floor(Math.random() * nbhd.x.length);
				while (diffArr[idx] == 10000000){
					//console.log("while", diffArr);
					idx = Math.floor(Math.random() * nbhd.x.length);
				}
				//console.log("*******************idx is ", idx);
			}else {
				console.log("choose", diffArr[idx]);
			}
			vector = new THREE.Vector3((vertex.x+nbhd.x[idx]),
						(vertex.y+nbhd.y[idx]),
						(vertex.z+nbhd.z[idx]));

			Vlt.geometry.vertices[i] = vector;
		}


		com.System = {"geometry": Vlt.geometry, "material":Vlt.material};


		if(fun){
			fun(null,com);
		}
	}

})();