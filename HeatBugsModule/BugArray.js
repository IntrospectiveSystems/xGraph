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

		Vlt.material = new THREE.PointsMaterial({size:0.2,vertexColors: true});
		Vlt.material.name = "BugMaterial";

		let range = Par.CubeDimension;
		let color,relativeTemp;
		for (let i=0; i<Par.BugCount; i++) {
			//Set a random location for each bug
			let particle = new THREE.Vector3(
				Math.floor(Math.random() * range),
				Math.floor(Math.random() * range),
				Math.floor(Math.random() * range)
			);
			Vlt.geometry.vertices.push(particle);

			//Set the base color to be different lightness' of red based on eac
			//bugs personal temperature
			color = new THREE.Color();
			relativeTemp = Math.random();
			color.setHSL(0, 1, (relativeTemp * .75 + .25));
			Vlt.geometry.colors.push(color);
			if ('desiredTemps' in Vlt.geometry) {
				Vlt.geometry.desiredTemps.push(Par.DesiredTemp.Minimum+
					Math.random()*(Par.DesiredTemp.Maximum-Par.DesiredTemp.Minimum));
			}
			else{
				Vlt.geometry.desiredTemps = [];
				Vlt.geometry.desiredTemps.push(Par.DesiredTemp.Minimum+
					Math.random()*(Par.DesiredTemp.Maximum-Par.DesiredTemp.Minimum));
			}if ('outputTemps' in Vlt.geometry) {
				Vlt.geometry.outputTemps.push(Par.BugTemp.Minimum+
					relativeTemp*(Par.BugTemp.Maximum-Par.BugTemp.Minimum));
			}
			else{
				Vlt.geometry.outputTemps = [];
				Vlt.geometry.outputTemps.push(Par.BugTemp.Minimum+
					relativeTemp*(Par.BugTemp.Maximum-Par.BugTemp.Minimum));
			}
		}


		if (fun)
			fun();

	}

	function MoveBugs(com, fun){
		console.log("--BugArray/MoveBugs");
		let Vlt=this.Vlt;
		let Par=this.Par;

		if (!com.heatField){
			console.log("No heat field we return the unedited bug system");
			com.System = {"geometry" :Vlt.geometry,"material":Vlt.material};
			fun(null,com);
			return;
		}

		//we here will move the bugs according to the most desired location
		let vertex, diffArr,wantTemp, vector, idx=-1;
		let nbhd= Par.Nbhd;
		let range = __HeatField.length;

		for (let i=0; i<Par.BugCount; i++) {
			//get its location
			vertex = Vlt.geometry.vertices[i];
			wantTemp = Vlt.geometry.desiredTemps[i];
			diffArr = [];

			for (let j=0;j<nbhd.x.length;j++){

				if (vertex.x+nbhd.x[j]<0 ||vertex.x+nbhd.x[j]>=range) {
					diffArr.push(10000);
					continue;
				}
				if (vertex.y+nbhd.y[j]<0 ||vertex.y+nbhd.y[j]>=range) {
					diffArr.push(10000);
					continue;
				}
				if (vertex.z+nbhd.z[j]<0 ||vertex.z+nbhd.z[j]>=range) {
					diffArr.push(10000);
					continue;
				}

				diffArr.push(.01*Math.random()
						+Math.abs(__HeatField[vertex.x+nbhd.x[j]][vertex.y+nbhd.y[j]][vertex.z+nbhd.z[j]])-wantTemp);

			}
			idx = diffArr.indexOf(Math.min(...diffArr));
			vector = new THREE.Vector3(Number(vertex.x+nbhd.x[idx]),
						Number(vertex.y+nbhd.y[idx]),
						Number(vertex.z+nbhd.z[idx]));

			Vlt.geometry.vertices[i] = vector;
		}


		com.System = {"geometry": Vlt.geometry, "material":Vlt.material};


		if(fun){
			fun(null,com);
		}
	}

})();