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

		__HeatField = [];// = new Array(range).fill(0);
		//Vlt.HeatObj = {};

		// for (let i=0;i<range;i++){
		// 	__HeatField[i] = new Array(range).fill(0);
		//
		// 	for (let j=0;j<range;j++){
		// 		__HeatField[i][j] = new Array(range).fill(0);
		//
		// 	}
		// }

		//Build the BugArray

		//Vlt.geometry = new THREE.Geometry();
		//Vlt.geometry.name = "FieldGeometry";

		Vlt.material = new THREE.PointsMaterial({size:2.5,vertexColors: true});
		Vlt.material.name = "FieldMaterial";
		Vlt.material.transparent = true;
		Vlt.material.depthWrite = false;
		Vlt.material.opacity = 0.01;
		Vlt.material.alpha = 0.01;

		Vlt.material.blending = THREE.CustomBlending;
		Vlt.material.blendEquation = THREE.MaxEquation; //default
		Vlt.material.blendSrc = THREE.SrcAlphaFactor; //default
		Vlt.material.blendDst = THREE.DstAlphaFactor; //default

		Vlt.MaxFieldTemp=1;
		Vlt.MinFieldTemp=0;

		// for (let i=0; i<range; i++) {
		// 	for (let j = 0; j < range; j++) {
		// 		for (let k = 0; k < range; k++) {
		//
		// 			//Set a random location for each bug
		// 			let particle = new THREE.Vector3(i, j, k);
		// 			Vlt.geometry.vertices.push(particle);
		//
		// 			//Set the base color to be different lightness' of red based on eac
		// 			//bugs personal temperature
		// 			let color = new THREE.Color();
		// 			Vlt.geometry.colors.push(color);
		//
		// 		}
		// 	}
		// }
		//console.log("There are colors",Vlt.geometry.colors.length);

		if(fun)
			fun();
	}

	function xyzToIdx (x,y,z,range){
		return (range*range*x+range*y+z);
	}

	function idxToXyz (idx, range){
		return ({	"x": Math.floor(idx / (range*range)),
					"y": Math.floor((idx % (range*range))/range),
					"z": idx%range})
	}

	function UpdateField(com,fun){
		//console.log("--HeatField/UpdateField");
		let Vlt=this.Vlt;
		let Par=this.Par;
		//we need to update the field
		let range = Par.FieldDimension;

		let bugvertices = com.vertices;
		let bugoutput = com.outputTemps;
		let vertex, updatedTemp, idx;





//console.log("***Update Bug location temps");
		for (let i =0;i<bugvertices.length;i++){
			vertex =  bugvertices[i];
			idx = xyzToIdx(vertex.x,vertex.y,vertex.z,range);
			//console.log("index is ",idx);
			//console.log("Previous temp is ", __HeatField[idx]);
			updatedTemp =__HeatField[idx]+bugoutput[i]||bugoutput[i];
			__HeatField[idx] = updatedTemp;
			//console.log("Updated temp is ", __HeatField[idx]);

		}
		let TempField = []; //new Array(range).fill(0);

		for (let idx in __HeatField){
			TempField[idx] = __HeatField[idx]*(1-Par.Diffusion);
		}




		// for (let i=0;i<range;i++){
		// 	TempField[i] = new Array(range).fill(0);
		//
		// 	for (let j=0;j<range;j++){
		// 		TempField[i][j] = new Array(range).fill(0);
		//
		// 	}
		// }


		let nbhd = Par.Nbhd;


		// // for (let i=0;i<range;i++){
		// //
		// // 	for (let j=0;j<range;j++){
		// //
		// // 		for (let k = 0 ;k<range;k++){
		//
		// 			for(let n=0;n<nbhd.x.length;n++){
		//
		// 				if (i+nbhd.x[n]<0 ||i+nbhd.x[n]>=range)
		// 					continue;
		//
		// 				if (j+nbhd.y[n]<0 ||j+nbhd.y[n]>=range)
		// 					continue;
		//
		// 				if (k+nbhd.z[n]<0 ||k+nbhd.z[n]>=range)
		// 					continue;
		// 				//
		// 				// TempField[i+nbhd.x[n]][j+nbhd.y[n]][k+nbhd.z[n]]
		// 				// 		+=__HeatField[i+nbhd.x[n]][j+nbhd.y[n]][k+nbhd.z[n]]*Par.Diffusion;
		//
		//
		// 			}
		//
		// // 		}
		// // 	}
		// // }
//console.log("***begin diffusion");
		for (let key in __HeatField){
			// if(TempField[key]) {
			// 	TempField[key] += __HeatField[key];
			// }else{
			// 	TempField[key] = __HeatField[key];
			// }

			//console.log("diffuse from", key);

			vertex = idxToXyz(key,range);

			for(let n=0; n<nbhd.x.length; n++) {

				if (vertex.x + nbhd.x[n] < 0 || vertex.x + nbhd.x[n] >= range) {
					continue;
				}
				if (vertex.y + nbhd.y[n] < 0 || vertex.y + nbhd.y[n] >= range) {
					continue;
				}
				if (vertex.z + nbhd.z[n] < 0 || vertex.z + nbhd.z[n] >= range) {
					continue;
				}
				idx = xyzToIdx(vertex.x + nbhd.x[n], vertex.y + nbhd.y[n], vertex.z + nbhd.z[n],range);

				if (isNaN(idx))
					debugger;
				//console.log("diffuse to ", idx);
				//let startingtemp = TempField[idx];
				//console.log("starting temp",startingtemp );
				//console.log("adding ",__HeatField[key] * Par.Diffusion );

				if (TempField[idx]){
					//console.log("adding to existing idx");
					TempField[idx] += __HeatField[key] * (Par.Diffusion/nbhd.x.length);
				}
				else{
					//console.log("new idx");
					TempField[idx] = __HeatField[key] * (Par.Diffusion/nbhd.x.length);
				}
				//console.log("ending temp", TempField[idx]);

			}
		}

		let newtemp;
		Vlt.MinFieldTemp = 100000;
		Vlt.MaxFieldTemp =0;

//console.log("***begin cooling");
		for (let key in TempField){
			//console.log("starting temp", TempField[key]);
			newtemp = TempField[key]*(1-Par.Cooling);
			if (newtemp > Vlt.MaxFieldTemp)
				Vlt.MaxFieldTemp = newtemp;
			if (newtemp<Vlt.MinFieldTemp)
				Vlt.MinFieldTemp = newtemp;

			TempField[key] = newtemp;
			//console.log("ending temp", TempField[key]);

		}

		// for (let i=0;i<range;i++){
		//
		// 	for (let j=0;j<range;j++){
		//
		// 		for (let k = 0 ;k<range;k++){
		//
		// 			newtemp = TempField[i][j][k]*(1-Par.Cooling);
		// 			if (newtemp > Vlt.MaxFieldTemp)
		// 				Vlt.MaxFieldTemp = newtemp;
		// 			__HeatField[i][j][k] = newtemp;
		// 			if (newtemp<Vlt.MinFieldTemp)
		// 				Vlt.MinFieldTemp = newtemp;
		//
		// 		}
		// 	}
		// }

		let color, l;
		__HeatField = [];
//console.log("***edit colors");
		Vlt.geometry = new THREE.Geometry();
		Vlt.geometry.name = "FieldGeometry";

		for (let key in TempField) {
			//console.log("key is ",key);

			vertex = idxToXyz(key, range);

			l = ((TempField[key] - Vlt.MinFieldTemp)
			/ (Vlt.MaxFieldTemp - Vlt.MinFieldTemp));


			if (l < 0.01) {
				l = 0;
			}

			let particle = new THREE.Vector3(vertex.x, vertex.y, vertex.z);

			//console.log("l is ", l);
			color = new THREE.Color();
			color.setHSL(.17, 1, l);

			// if (key in Vlt.HeatObj) {
			// 	console.log("We've already logged it just update..");
			// 	Vlt.HeatObj[key].color = color;
			//
			// }else{
				if (l==0){
					continue;
				}
				//Vlt.HeatObj[key]= {"particle":particle, "color":color};
				Vlt.geometry.vertices.push(particle);
				Vlt.geometry.colors.push(color);
				//__HeatGeometry = Vlt.geometry;
				//console.log(idx, color);
		//	}




			__HeatField[key]= TempField[key];

		}

		//console.log(Vlt.MaxFieldTemp, Vlt.MinFieldTemp);

		com.System = {"geometry":Vlt.geometry,"material":Vlt.material};
		//console.log("MAX at ", TempField.indexOf(Vlt.MaxFieldTemp));
		//debugger;
		if (fun)
			fun(null,com);
	}

})();