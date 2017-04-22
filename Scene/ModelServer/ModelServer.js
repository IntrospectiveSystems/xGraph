(function ModelServer() {
	var Dir;	// Directory containing model (ephemeral)

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start,
		GetModel: GetModel
	};

	return {
		dispatch: dispatch
	};

	//-----------------------------------------------------Start
	function Setup(com, fun) {
		console.log('--ModelServer/Setup');
		var that = this;
		var async = require('async');
		var fs = require('fs');
		var Par = this.Par;
		if(!('Archive' in Par)){
			var err = 'No Archive provided';
			console.log(' ** ERR:' + err);
			if(fun)
				fun(err);
			return;
		}
		var Models = Par.Archive;
		var Stack = [];
		var Pars = [];
		var Cvt = {};
		var Name;
		var rig = {};
		rig.Name = '';
		Stack.push(rig);
		var Vlt = this.Vlt;
		if (!('ModelIndex' in Par))
			Par.ModelIndex = {};
		var ModelIndex = Par.ModelIndex;
		Par.ModelIndex = ModelIndex;
		var that = this;		
		trav('', 0, done);

		function done() {
			generate();
		}

		function trav(dir, lev, func) {
			var path;
			path = Models;
			if(dir.length > 0)
				path += '/' + dir;
			var rigfile = path + '/' + 'Rig.json';
			console.log(rigfile);
			fs.exists(rigfile, function (yes) {
				if (yes) {
					console.log(rigfile);
					fs.readFile(rigfile, readrig);
				} else {
					Stack.push(Stack[Stack.length - 1]);
					scandir();
				}
			});

			function readrig(err, data) {
				if (err) {
					console.log(' ** ERR:Cannot read rig file:' + rigfile);
					func('Cannot read rig file');
					return;
				}
				var str = data.toString();
				var jsn = JSON.parse(str);
				var top = Stack[Stack.length - 1];
				var rig = {};
				var name = top.Name;
				for (key in top)
					rig[key] = top[key];
				for (key in jsn) {
					switch (key) {
						case 'Name':
							if (name.length > 0)
								rig[key] = name + '.' + jsn[key];
							else
								rig[key] = jsn[key];
							break;
						default:
							rig[key] = jsn[key];
							break;
					}
				}
				Stack.push(rig);
				scandir();
			}

			function scandir() {
				fs.readdir(path, function (err, files) {
					if (err) {
						console.log(' ** ERR:Project file err:' + err);
						func(err);
						return;
					}
					async.eachSeries(files, scan, fini);

					function fini(err) {
						Stack.pop();
						func();
					}
				});
			}

			function scan(file, funq) {
				var sub;
				if (dir.length > 0)
					sub = dir + '/' + file;
				else
					sub = file;
				var path = Models + '/' + sub;
				fs.stat(path, function (err, stats) {
					if (stats == null) {
						console.log(' ** ERR:', lev, sub, 'does not exist');
						funq('Nada');
						return;
					}
					var old = Stack[Stack.length - 1];
					if (stats.isDirectory()) {
						Name = file;
						var rig = {};
						for (key in old) {
							rig[key] = old[key];
						}
						trav(sub, lev+1, funq);
					} else {
						var parts = file.split('.');
						var nparts = parts.length;
						var type;
						if (nparts > 1) {
							switch (parts[nparts - 1]) {
							case '3ds':
								type = '3DS';
								break;
							case 'obj':
								type = 'Obj';
								break;
							}
						}
						// If type set, then file is viable model format
						if (type != null) {
							var par = {};
							par.Entity = 'xGraph:Scene/Cvt' + type;
							par.Rig = {};
							var rig = Stack[Stack.length - 1];
							for (key in rig)
								par.Rig[key] = rig[key];
							par.Path = Models + '/' + sub;
							var name = old['Name'] + '.' + Name;
							if (name in ModelIndex) {
								console.log('    ' + name);
								console.log(ModelIndex[name] + ' ' + name);
								funq();
								return;
							}
							par.Name = name;
							console.log('New ' + name);
							for (key in old) {
								switch (key) {
								case 'Name':
									par[key] = name;
									break;
								default:
									par[key] = old[key];
									break;
								}
							}
							Pars.push(par);
						}
						funq();
					}
				});
			}
		}

		//-------------------------------------------------generate
		function generate() {
			console.log('..generate');
			console.log('Pars', Pars);
			console.log('Par', Par);
			async.eachSeries(Pars, genx3d, pau);

			function pau(err) {
				if(fun)
					fun(err);
			}

			function genx3d(par, func) {
				console.log('..gen3d');
				var path = par.Path;
				var nclip = path.lastIndexOf('/');
				var dir = path.substr(0, nclip);
				console.log('dir', dir);
				var file = path.substr(nclip + 1);
				console.log('file', file);
				var parts = file.split('.');
				console.log('parts', parts);
				var suffix = parts[[parts.length - 1]].toLowerCase();
				console.log('suffix', suffix);
				if (suffix in Par.Cvt) {
					var q = {};
					q.Cmd = 'Convert';
					q.Path = path;
					q.Name = par.Name;
					that.send(q, Par.Cvt[suffix], rigger);
				} else {
					var err = 'Unknown model type <' + suffix + '>';
					console.log(' ** ERR:' + err);
					func(err);
				}

				//.........................................rigger
				// Apply scaling, orientation and animation
				function rigger(err, q) {
					console.log('..rigger');
					if (err) {
						console.log(' ** ERR:' + err);
						func(err);
						return;
					}
					var Scale;
					var Process;
					var rig = par.Rig;
					if (err) {
						console.log(' ** ERR:' + err);
						func(err);
						return;
					}
					if (!('X3D' in q)) {
						console.log(' ** ERR:No model returned for', q.Name);
						func();
						return;
					}
					var x3d = q.X3D;
					if ('Units' in rig) {
						Scale = null;
						var units = rig.Units;
						switch (units) {
							case 'Inch':
								Scale = 0.0254;
								break;
							case 'Cm':
								Scale = 0.01;
								break;
							case 'Mm':
								Scale = 0.001;
								break;
							default:
								break;
						}
						if (Scale == null) {
							console.log(' ** ERR:Invalid units <' + units + '>');
							funz(err);
							return;
						} else {
							Process = scale;
							traverse();
						}
					}
					if ('Scale' in rig) {
						Scale = rig.Scale;
						Process = scale;
						traverse();
					}
					if ("FlipYZ" in rig && rig.FlipYZ == true) {
						Process = flipyz;
						traverse();
					}
					if('Ground' in rig && rig.Ground == true)
						ground(1);
					if ('Base' in rig && rig.Base == true)
						ground(2);
					console.log(' ** Rigging complete');
					textures(par, x3d);

					//.....................................scale
					// Scale model
					function scale(comp, arr) {
						switch (comp) {
							case 'Pivot':
							case 'Vertex':
								for (var i = 0; i < arr.length; i++)
									arr[i] *= Scale;
								break;
						}
					}

					//.....................................flipyz
					// Reverse y and z coordinates with
					// handedness correction
					function flipyz(comp, arr) {
						var tmp;
						switch (comp) {
							case 'Pivot':
								tmp = arr[2];
								arr[2] = arr[1];
								arr[1] = -tmp;
								break;
							case 'Vertex':
							case 'Normal':
								for (var i = 0; i < arr.length; i+=3) {
									tmp = arr[i + 2];
									arr[i + 2] = arr[i + 1];
									arr[i + 1] = -tmp;
								}
								break;
						}
					}

					//.....................................ground
					// Shift model so lowest z is 0.0
					// mode=1 - Shift model z=0
					// mode=2 - Same as 1 but center xy
					function ground(mode) {
						var xyz = [100000.0, -100000.0, 100000.0,
							-100000.0, 100000.0, -100000.0];
						Process = range;
						traverse();
						var cntr = [0, 0, 0];
						for (var i = 0; i < 3; i++)
							cntr[i] = 0.5 * (xyz[2 * i] + xyz[2 * i + 1]);
						console.log('xyz', xyz);
						console.log('cntr', cntr);
						Process = shift;
						traverse();

						function range(comp, arr) {
							if(comp == 'Vertex') {
								var nvrt = arr.length;
								var iarr;
								var ixyz;
								for (var ivrt = 0; ivrt < nvrt; ivrt += 3) {
									for (var i = 0; i < 3; i++) {
										iarr = 3 * ivrt + i;
										ixyz = 2 * i;
										if (arr[iarr] < xyz[ixyz])
											xyz[ixyz] = arr[iarr];
										if (arr[iarr] > xyz[ixyz + 1])
											xyz[ixyz + 1] = arr[iarr];
									}
								}
							}
						}

						function shift(comp, arr) {
							var zmin = 10000.0;
							if (comp == 'Vertex') {
								switch (mode) {
									case 1: // Make base level with ground
										for (var i = 2; i < arr.length; i += 3)
											arr[i] -= xyz[4];
										break;
									case 2: // Center as well as mode 1
										var n = arr.length;
										for (var i = 0; i < n; i += 3) {
											arr[i] -= cntr[0];
											arr[i+1] -= cntr[1];
											arr[i+2] -= xyz[4];
										}
										break;
								}
							}
						}
					}

					function traverse() {
						var arr = x3d.Root;
						for (var i = 0; i < arr.length; i++)
							trv(arr[i], 0);

						function trv(obj, lev) {
							if ('Pivot' in obj)
								Process('Pivot', obj.Pivot);
							if ('Parts' in obj) {
								var arr = obj.Parts;
								for (var i = 0; i < arr.length; i++) {
									var part = arr[i];
									if ('Vrt' in part)
										Process('Vertex', part.Vrt);
									if ('Nrm' in part)
										Process('Normal', part.Nrm);
								}
							}
							if ('Nodes' in obj) {
								var arr = obj.Nodes;
								for (var i = 0; i < arr.length; i++)
									trv(arr[i], lev + 1);
							}
						}
					}

				}

				//.........................................textures
				// Load textures from filenames stored by
				// conversion loaders (CvtXXX)
				function textures(par, x3d) {
					console.log('..textures==============================================');
					console.log('par', par);
					save(par, x3d);
				}

				function save(par, x3d) {
					console.log('..save');
					console.log('par', JSON.stringify(par, null, 2));
					if(err) {
						console.log(' ** ERR:' + err);
						func(err);
						return;
					}
					func();
				}
			}
		}
	}

	//-----------------------------------------------------Start
	function Start(com, fun) {
		console.log('--ModelServer/Start')
		if(fun)
			fun();
	}

	//-----------------------------------------------------GetModel
	function GetModel(com, fun) {
		console.log('--GetModel', com);
		if (!('Name' in com)) {
			console.log(' ** ERR:No Name in com');
			if (fun)
				fun('No Name in com');
			return;
		}
		var that = this;
		var fs = __Fs3;
		var mix = this.Par.ModelIndex;
		var name = com.Name;
		if (!(name in mix)) {
			var err = 'Model <' + name + '> not available';
			console.log(' ** ERR:' + err);
			if(fun)
				fun(err);
			return;
		}
		var pid8 = mix[name];
		var path = __Config.Cache + '/' + pid8 + '.x3d';
		fs.readFile(path, done);

		function done(err, data) {
			if(err) {
				console.log(' ** ERR:' + err);
				if(fun)
					fun(err);
				return;
			}
			com.Model = {};
			com.Model.Type = 'X3D';
			com.Model.X3D = JSON.parse(data.toString());
			if(fun)
				fun(null, com);
		}
	}

})();
