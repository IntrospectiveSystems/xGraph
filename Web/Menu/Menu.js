//# sourceURL=Mouse
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
		var css = {};
		css.position = 'absolute';
		css.backgroundColor = "white";
		css.fontWeight = 'bold';
		css.width = '160px';
		css.height = '210px';
		css.zIndex = 100001;
		css.visibility = 'visible';
		var q = {};
		q.Cmd = 'Menu';
		q.CSS = css;
		q.Size = [100, 66];
		q.Loc = [400, 100];
		q.Title = 'Action';
		q.Items = [];
		q.Items.push('Export');
		q.Items.push('Delete');
		Menu.call(this, q, fun);
	//	if (fun)
	//		fun(null, com);
	}

	function Menu(com, fun) {
		console.log('--Menu/Menu');
		var that = this;
		let div = document.createElement('div');
		let wid = __Nexus.genPid().substr(24);
		console.log('wid', wid);
		div.id = wid;
		if('CSS' in com) {
			let css = com.CSS;
			for (let key in css) {
				div.style[key] = css[key];
			}
		}
		let wmenu = 120;
		let hmenu = 200;
		if('Size' in com) {
			wmenu = com.Size[0];
			hmenu = com.Size[1];
		}
		div.style.width = wmenu + 'px';
		div.style.height = hmenu + 'px';
		if('Loc' in com) {
			div.style.left = com.Loc[0] + 'px';
			div.style.top = com.Loc[1] + 'px';
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
			Nxs.delEntity(that.Par.Pid);
			ev.stopPropagation();
		};
		exitDiv.appendChild(exitLabel);

		let titleDiv = document.createElement('div');
		let hex = exitLabel.offsetHeight;
		let wex = exitLabel.offsetWidth;
		titleDiv.style.top = 0;
		titleDiv.style.left = 0;
		titleDiv.style.position = 'absolute';
		titleDiv.style.backgroundColor = '#bcffd8';
		titleDiv.innerText = com.Title;
		titleDiv.style.width = wmenu - wex + 'px';
		titleDiv.style.height = hex + 'px';
		div.appendChild(titleDiv);

		var list = document.createElement('ul');
		list.className = 'list-group';
		list.style.margin = '0';
		list.style.listStyle='none';
		var item;
		for (var i = 0; i < com.Items.length; i++) {
			item = com.Items[i];
			var listItem = document.createElement('li');
			listItem.className = 'list-group-item btn btn-default';
			listItem.style.border = '0px solid';
			listItem.innerText = item;
			listItem.onclick = function (ev) {
				console.log('..onClink');
				console.log(ev);
				var slct = ev.target.innerHTML;
				console.log('slct', slct);
			};
			console.log('adding', item);
			list.appendChild(listItem);
		}
		list.style.position = 'absolute';
		list.style.top = hex + 'px';
		list.style.fontSize = '16px';
		div.appendChild(list);
		if(fun)
			fun(null, com);
	}

})();

