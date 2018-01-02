// #sourcsURL='Model.js'
(function Model() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start,
		GetGraph: GetGraph,
		GetModel: GetModel,
		Move: Move,
		Evoke: Evoke,
		MenuSelect: MenuSelect,
		Save: Save
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		console.log('--Model/Setup');
		this.Vlt.Graph = [];
		if(fun)
			fun();
	}

	function Start(com, fun) {
		console.log('--Model/Start');
		if(fun)
			fun();
	}

	//-----------------------------------------------------AddInstance
	function GetGraph(com, fun) {
		var that = this;
		var Par = this.Par;
		var Vlt = this.Vlt;
		
		var inst = {};
		inst.Model = Par.Model;
		if('Role' in Par)
			inst.Role = Par.Role;
		else
			inst.Role = 'Artifact';
		inst.Instance = Par.Pid;
		inst.Model = Par.Pid;
		inst.Position = Par.Position;
		inst.Axis = Par.Axis;
		inst.Angle = Par.Angle;
		if('Inst' in com) {
			com.Inst.push(inst);
		} else {
			com.Inst = [];
			com.Inst.push(inst);
		}
		fun(null, com);

	}

	//-----------------------------------------------------GetModel
	function GetModel(com, fun) {
		console.log('..Model/GetModel');
		var Par = this.Par;
		if(!'Name' in Par) {
			var err = 'No model provided';
			console.log(' ** ERR:' + err);
			if(fun)
				fun(err);
			return;
		}
		console.log('model', Par.Model);
		this.getFile(Par.Model, (err, data) => {
			if(err) {
				console.log(' ** ERR:' + err);
				if(fun)
					fun(err);
				return;
			}
			com.Role = 'Artifact';
			com.Model = {};
			com.Model.Type = 'X3D';
			com.Model.X3D = data.toString();

			var gen = {};
			gen.Cmd = 'GenModel';
			gen.Model = com.Model.X3D;
			this.send(gen, Par.Translator, (err, cmd)=>{
				com.Obj3D = cmd.Obj3D;
				fun(null, com);
			});
			
		});
	}

	//-----------------------------------------------------Move
	// Process move request (includes rotations)
	function Move(com, fun) {
		console.log('--Model/Move', com);
		var Par = this.Par;
		var Vlt = this.Vlt;
		if('Loc' in com) {
			Par.Position = com.Loc;
		}
		if('Spin' in com)
			Par.Angle += com.Spin;
		var q = {};
		q.Cmd = 'SetPosition';
		q.Instance = Par.Pid;
		q.Position = Par.Position;
		q.Axis = Par.Axis;
		q.Angle = Par.Angle;
		q.Publish = true;
		this.send(q, Vlt.Scene);
		if(fun)
			fun(null, com);
	}

	//-----------------------------------------------------Evoke
	function Evoke(com, fun) {
		var Par = this.Par;
		com.Module = {};
		com.Module.Module = 'xGraph:Web/Menu';
		var par = {};
		var css = {};
		css.position = 'absolute';
		css.backgroundColor = "white";
		css.fontWeight = 'bold';
		css.width = '160px';
		css.height = '210px';
		css.zIndex = 100001;
		css.visibility = 'visible';
		par.CSS = css;
		par.pidSelect = Par.Pid;
		par.Loc = [400, 100];
		par.Title = 'Action';
		par.Ephemeral = true;
		par.Items = [];
		par.Items.push('Export', 'Delete');
		com.Module.Par = par;
		fun(null, com);
	}

	//-----------------------------------------------------MenuSelect
	function MenuSelect(com, fun) {
		// console.log('--Model/MenuSelect');
		// console.log('com', JSON.stringify(com, null, 2));
		// console.log('Par', this.Par);
		// var that = this;
		// var pidExport = this.Nxs.getGlobal('Export');
		// console.log('Export', pidExport);
		// var Par = this.Par;
		// var path = 'models/' + Par.Name;
		// fs.readFile(path, function(err, data) {
		// 	if(err) {
		// 		console.log(' ** MenuSelect:' + err);
		// 		if(fun)
		// 			fun(err);
		// 		return;
		// 	}
		// 	var q = {};
		// 	q.Cmd = 'AddModel';
		// 	q.Name = Par.Name;
		// 	q.Position = [0, 0, 0];
		// 	q.Model = data.toString();
		// 	that.send(q, pidExport);
		// 	if(fun)
		// 		fun(null, com);
		// });
	}

	//-----------------------------------------------------Save
	// Save module
	function Save(com, fun) {
		console.log('--ModelSave', com);
		this.save(pau);

		function pau(err) {
			if(err) {
				console.log(' ** ERR:Save failed');
			}
			if(fun)
				fun(err, com);
		}
	}

})();
