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
		console.log("Geom is ",Vlt.geometry);
		Vlt.material = new THREE.PointsMaterial({size:0.2,vertexColors: true});
		Vlt.material.name = "BugMaterial";

		let range = Par.CubeDimension;

		for (let i=0; i<Par.BugCount; i++) {
			//Set a random location for each bug
			let particle = new THREE.Vector3(
				Math.round(Math.random() * range),
				Math.round(Math.random() * range),
				Math.round(Math.random() * range)
			);
			Vlt.geometry.vertices.push(particle);

			//Set the base color to be different lightness' of red based on eac
			//bugs personal temperature
			let color = new THREE.Color(0xff0000);
			let relativeTemp = Math.random();
			color.setHSL(color.getHSL().h,
				color.getHSL().s,
				relativeTemp * 75 + 25);
				Vlt.geometry.colors.push(color);
			if ('desiredTemps' in Vlt.geometry) {
				Vlt.geometry.desiredTemps.push(Math.random());
			}
			else{
				Vlt.geometry.desiredTemps = [];
				Vlt.geometry.desiredTemps.push(Math.random());
			}
		}



		if(fun)
			fun();

	}

	function MoveBugs(com, fun){
		console.log("--BugArray/MoveBugs");
		let Vlt=this.Vlt;

		if (!com.heatField){
			console.log("No heat field we return the unedited bug system");
			com.System = {"geometry" :Vlt.geometry,"material":Vlt.material};
			fun(null,com);
			return;
		}

		//we here will move the bugs according to the most desired location







		if(fun){
			fun(null,com);
		}
	}

})();