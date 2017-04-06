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

		let geometry = Threejs.Geometry();
		let material = Threejs.ParticleBasicMaterial({size:0.2,vertexColors: true});

		let range = Par.CubeDimension;

		for (let i=0; i<Par.BugCount; i++) {
			//Set a random location for each bug
			let particle = new Threejs.Vector3(
				Math.round(Math.random() * range - (range / 2)),
				Math.round(Math.random() * range - (range / 2)),
				Math.round(Math.random() * range - (range / 2)),
			);
			geometry.vertices.push(particle);

			//Set the base color to be different lightness' of red based on eac
			//bugs personal temperature
			let color = new Threejs.Color(0xff0000);
			let relativeTemp = Math.random();
			color.setHSL(color.getHSL().h,
				color.getHSL().s,
				relativeTemp * 75 + 25);
			geometry.colors.push(color);
			geometry.desiredTemps.push(Math.random());
		}

		Vlt.bugSystem = new Threejs.ParticleSystem(geometry,material);
		Vlt.bugSystem.name="bugSystem";
		Vlt.bugSystem.sortParticles = true;

		if(fun)
			fun();

	}

	function MoveBugs(com, fun){
		console.log("--BugArray/MoveBugs");

		if (!com.heatField){
			console.log("No heat field we return the unedited bug system");
			com.System = Vlt.bugSystem;
			fun(null,com);
			return;
		}

		//we here will move the bugs according to the most desired location







		if(fun){
			fun(null,com);
		}
	}

})();