(function HeatField() {



	var dispatch ={
		Setup : Setup,
		UpdateField: UpdateField
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		console.log('--HeatField/Setup');

		let Par = this.Par;
		let Vlt = this.Vlt;

		//Build the BugArray

		let geometry = Threejs.Geometry();

		let material = Threejs.ParticleBasicMaterial({vertexColors: true});

		let range = Par.FieldDimension;


		for (let i=Math.ceil(0-range/2); i<((range/2)+1); i++) {
			for (let j = Math.ceil(0 - range / 2); j < ((range / 2) + 1); j++) {
				for (let k = Math.ceil(0 - range / 2); k < ((range / 2) + 1); k++) {

					//Set a random location for each bug
					let particle = new Threejs.Vector3(i, j, k);
					geometry.vertices.push(particle);

					//Set the base color to be different lightness' of red based on eac
					//bugs personal temperature
					let color = new Threejs.Color(0xffff00);

					color.setHSL(color.getHSL().h,
						color.getHSL().s,
						0);
					geometry.colors.push(color);

				}
			}
		}

		Vlt.heatField = new Threejs.ParticleSystem(geometry,material);
		Vlt.heatField.name="heatField";
		Vlt.heatField.sortParticles=true;


		if(fun)
			fun();
	}



	function UpdateField(com,fun){
		console.log("--HeatField/UpdateField",com);

		if (!com.bugSystem){
			com.System = Vlt.heatField;
			fun(null,com);
			return;
		}

		//here we update the field based on the location of bugs






		if (fun)
			fun(null,com);
	}

})();