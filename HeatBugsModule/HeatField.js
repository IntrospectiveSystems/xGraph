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
		__HeatField = new Array();
		//Build the BugArray

		Vlt.geometry = new THREE.Geometry();
		Vlt.geometry.name = "FieldGeometry";

		Vlt.material = new THREE.PointsMaterial({size:2,vertexColors: true});
		Vlt.material.name = "FieldMaterial";
		Vlt.material.transparent = true;
		Vlt.material.opacity = 0.05;

		let range = Par.FieldDimension;
		console.log("from", 0, "to", range);

		for (let i=0; i<range; i++) {
			for (let j = 0; j < range; j++) {
				for (let k = 0; k < range; k++) {

					//Set a random location for each bug
					let particle = new THREE.Vector3(i, j, k);
					Vlt.geometry.vertices.push(particle);

					//Set the base color to be different lightness' of red based on eac
					//bugs personal temperature
					let color = new THREE.Color("hsl(60,100%,50%)");

					color = color.getHSL(color);
					color.l = 0;
					//console.log("color is ",color);
					Vlt.geometry.colors.push(color);

				}
			}
		}


		if(fun)
			fun();
	}



	function UpdateField(com,fun){
		console.log("--HeatField/UpdateField",com);
		let Vlt=this.Vlt;
		//we need to update the field





		com.System = {"geometry":Vlt.geometry,"material":Vlt.material};

		if (fun)
			fun(null,com);
	}

})();