(function HeatField() {



	var dispatch ={
		Setup : Setup,
		UpdateField: UpdateField,

	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		console.log('--HeatField/Setup');

		let Par = this.Par;
		let Vlt = this.Vlt;

		let range = Par.FieldDimension;
		console.log("from", 0, "to", range);

		__HeatField = new Array(range).fill(0);

		for (let i=0;i<range;i++){
			__HeatField[i] = new Array(range).fill(0);

			for (let j=0;j<range;j++){
				__HeatField[i][j] = new Array(range).fill(0);

			}
		}

		//Build the BugArray

		Vlt.geometry = new THREE.Geometry();
		Vlt.geometry.name = "FieldGeometry";

		Vlt.material = new THREE.PointsMaterial({size:2,vertexColors: true});
		Vlt.material.name = "FieldMaterial";
		Vlt.material.transparent = true;
		Vlt.material.depthWrite = false;
		 Vlt.material.opacity = 0.01;
		//Vlt.material.alpha = 0;

		Vlt.material.blending = THREE.CustomBlending;
		Vlt.material.blendEquation = THREE.MaxEquation; //default
		Vlt.material.blendSrc = THREE.SrcColorFactor; //default
		Vlt.material.blendDst = THREE.OneMinusDstColorFactor; //default

		Vlt.MaxFieldTemp=1;
		Vlt.MinFieldTemp=0;

		for (let i=0; i<range; i++) {
			for (let j = 0; j < range; j++) {
				for (let k = 0; k < range; k++) {

					//Set a random location for each bug
					let particle = new THREE.Vector3(i, j, k);
					Vlt.geometry.vertices.push(particle);

					//Set the base color to be different lightness' of red based on eac
					//bugs personal temperature
					let color = new THREE.Color();
					Vlt.geometry.colors.push(color);

				}
			}
		}
		//console.log("There are colors",Vlt.geometry.colors.length);

		if(fun)
			fun();
	}



	function UpdateField(com,fun){
		console.log("--HeatField/UpdateField",com);
		let Vlt=this.Vlt;
		let Par=this.Par;
		//we need to update the field

		let bugvertices = com.vertices;
		let bugoutput = com.outputTemps;
		let vertex, updatedTemp;
		for (let i =0;i<bugvertices.length;i++){
			vertex =  bugvertices[i];
			updatedTemp =__HeatField[vertex.x][vertex.y][vertex.z]+bugoutput[i];
			__HeatField[vertex.x][vertex.y][vertex.z] = updatedTemp;
		}



		let range = Par.FieldDimension;

		let TempField = new Array(range).fill(0);

		for (let i=0;i<range;i++){
			TempField[i] = new Array(range).fill(0);

			for (let j=0;j<range;j++){
				TempField[i][j] = new Array(range).fill(0);

			}
		}


		let nbhd = Par.Nbhd;


		for (let i=0;i<range;i++){

			for (let j=0;j<range;j++){

				for (let k = 0 ;k<range;k++){

					for(let n=0;n<nbhd.x.length;n++){

						if (i+nbhd.x[n]<0 ||i+nbhd.x[n]>=range)
							continue;

						if (j+nbhd.y[n]<0 ||j+nbhd.y[n]>=range)
							continue;

						if (k+nbhd.z[n]<0 ||k+nbhd.z[n]>=range)
							continue;

						TempField[i+nbhd.x[n]][j+nbhd.y[n]][k+nbhd.z[n]]
								+=__HeatField[i+nbhd.x[n]][j+nbhd.y[n]][k+nbhd.z[n]]*Par.Diffusion;


					}

				}
			}
		}

		let newtemp;
		Vlt.MinFieldTemp = Vlt.MaxFieldTemp;

		for (let i=0;i<range;i++){

			for (let j=0;j<range;j++){

				for (let k = 0 ;k<range;k++){

					newtemp = TempField[i][j][k]*(1-Par.Cooling);
					if (newtemp > Vlt.MaxFieldTemp)
						Vlt.MaxFieldTemp = newtemp;
					__HeatField[i][j][k] = newtemp;
					if (newtemp<Vlt.MinFieldTemp)
						Vlt.MinFieldTemp = newtemp;

				}
			}
		}

		let color, l, idx;
		for (let i=0;i<range;i++){

			for (let j=0;j<range;j++){

				for (let k = 0 ;k<range;k++){

					l=((__HeatField[i][j][k]-Vlt.MinFieldTemp)
						/(Vlt.MaxFieldTemp-Vlt.MinFieldTemp));


					if (l<0.01 ) {
						l=0;
					}



					color = new THREE.Color();
					color.setHSL(.17, 1, l);
					idx=range*range * i + range * j + k;
					Vlt.geometry.colors[idx] = color;
					//console.log(idx, color);

				}
			}
		}

		console.log(Vlt.MaxFieldTemp, Vlt.MinFieldTemp);

		com.System = {"geometry":Vlt.geometry,"material":Vlt.material};

		if (fun)
			fun(null,com);
	}

})();