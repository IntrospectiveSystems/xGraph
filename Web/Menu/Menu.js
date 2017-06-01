//# sourceURL=Menu
(function Menu() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start,
		Menu: Menu
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		console.log('--Menu/Setup');
		if (fun)
			fun(null, com);
	}

	function Start(com, fun) {
		console.log('--Menu/Start');
		genMenu.call(this);
		if (fun)
			fun(null, com);
	}

	//-----------------------------------------------------Menu
	// Display ephemeral menu
	// {
	//	Cmd: 'Menu'
	//	Pid: <pid to send response>
	//	CSS: { css styls objects }
	//  Size: [w, h]
	//	Loc: [x, y],
	//	Title: <string>
	//	Itemm [<list of items>]
	// }
	//
	// Sends 'MenuSelect' message to Pid entity with
	// 'Item' attribute set to selected text.
	function Menu(com, fun) {
		var Par = this.Par;
		if('CSS' in com)
			Par.CSS = com.CSS;
		if('pidSelect' in com)
			Par.pidSelect = com.pidSelect;
		if('Size' in com)
			Par.Size = com.Size;
		if('Loc' in com)
			Par.Loc = com.Loc;
		if('Title' in com)
			Par.Title = com.Title;
		else
			Par.Title = '';
		Par.Items = com.Items;
		genMenu.call(this);
		if(fun)
			fun(null, com);
	}

	function genMenu() {
		var that = this;
		var Par = this.Par;
		if(!('pidSelect' in Par)) {
			if(fun)
				fun(null, com);
			return;
		}
		let div = document.createElement('div');
		let wid = __Nexus.genPid().substr(24);
		console.log('wid', wid);
		div.id = wid;
		if('CSS' in Par) {
			let css = Par.CSS;
			for (let key in css) {
				div.style[key] = css[key];
			}
		}
		if('Loc' in Par) {
			div.style.left = Par.Loc[0] + 'px';
			div.style.top = Par.Loc[1] + 'px';
		} else {
			div.style.left = '300px';
			div.style.top = '400px';
		}
		document.getElementById('Body').appendChild(div);
		console.log('$', $('#'+ wid));
		$('#'+ wid).draggable();

		let exitDiv = document.createElement('div');
		exitDiv.style.top = 0;
		exitDiv.style.right = 0;
		exitDiv.style.position = 'absolute';
		div.appendChild(exitDiv);
		let exitLabel = document.createElement('button');
		exitLabel.style.padding = '4px';
		exitLabel.innerText = 'X';
		exitLabel.onclick = function (ev) {
			div.parentNode.removeChild(div);
			if(Par.Ephemeral)
				Nxs.delEntity(that.Par.Pid);
			ev.stopPropagation();
		};
		exitDiv.appendChild(exitLabel);

		var list = document.createElement('ul');
		list.className = 'list-group';
		list.style.margin = '0';
		list.style.listStyle='none';
		var item;
		var items = Par.Items;
		for (var i = 0; i < items.length; i++) {
			item = items[i];
			var listItem = document.createElement('li');
			listItem.className = 'list-group-item btn btn-default';
			listItem.style.border = '0px solid';
			listItem.innerText = item;
			listItem.onclick = function (ev) {
				console.log('..onClink');
				console.log(ev);
				var slct = ev.target.innerHTML;
				console.log('slct', slct);
				var q = {};
				q.Cmd = 'MenuSelect';
				q.Item = slct;
				if('pidSelect' in Par)
					that.send(q, Par.pidSelect);
				div.parentNode.removeChild(div);
				if(Par.Ephemeral)
					Nxs.delEntity(that.Par.Pid);
				ev.stopPropagation();
			};
			console.log('adding', item);
			list.appendChild(listItem);
		}
		let hexit = exitLabel.offsetHeight;
		let wexit = exitLabel.offsetWidth;
		list.style.position = 'absolute';
		list.style.top = hexit + 'px';
		list.style.fontSize = '16px';
		div.appendChild(list);

		let wlist = list.offsetWidth;
		let hlist = list.offsetHeight;
		console.log('wlist, hlist', wlist, hlist);
		let wmenu = wlist + 32;
		let hmenu = hexit + hlist + 4;
		div.style.width = wmenu + 'px';
		div.style.height = hmenu + 'px';

		let titleDiv = document.createElement('div');
		titleDiv.style.top = 0;
		titleDiv.style.left = 0;
		titleDiv.style.position = 'absolute';
		titleDiv.style.backgroundColor = '#bcffd8';
		titleDiv.innerText = Par.Title;
		titleDiv.style.width = wmenu - wexit + 'px';
		titleDiv.style.height = wexit + 'px';
		div.appendChild(titleDiv);
	}

})();

