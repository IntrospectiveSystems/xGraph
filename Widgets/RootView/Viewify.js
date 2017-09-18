//# sourceURL=Viewify.js
// debugger;

// DIV, IMG, and STYLE are shorthand for making elements, wrapped in jquery
if (window.DIV == undefined) window.DIV = function DIV(selectorish) {
	let elem = $(document.createElement('div'));
	// debugger;
	if (selectorish) {
		if (selectorish.search(/[#\.]/) == -1) {
			elem.addClass(selectorish);
			return elem;
		}
		let params = selectorish.split(/(?=\.)/g);
		for (let i in params) {
			if (params[i].startsWith('#')) elem.attr('id', params[i].substr(1));
			else if (params[i].startsWith('.')) elem.addClass(params[i].substr(1));
		}
	}
	return elem;
};

if (window.STYLE == undefined) window.STYLE = function STYLE() {
	return $(document.createElement('style'));
};

if (window.emptyImage == undefined) window.emptyImage = function emptyImage() {
	let emptyImage;
	emptyImage = $('#THISISANEMPTYIMAGEANDAUNIQUEIDPLSNOREUSE');
	if (emptyImage.length == 1) return emptyImage[0];
	emptyImage = IMG('http://placehold.it/1x1');
	emptyImage.css('position', 'fixed');
	emptyImage.css('left', '-100px');
	emptyImage.css('top', '-100px');
	emptyImage.attr('id', 'THISISANEMPTYIMAGEANDAUNIQUEIDPLSNOREUSE');
	$(document.body).append(emptyImage);
	return emptyImage[0];
};



if (window.IMG == undefined) window.IMG = function IMG(width, height, src) {

	let elem = $(document.createElement('img'));

	if (!height && !src) {
		src = width;
	} else if (!src) {
		elem.css('width', width);
		elem.css('height', height);
		src = `http://placehold.it/${width}x${height}`;
	}

	elem.attr('src', src);


	return elem;
};

// get root level cssVars
$.fn.extend({
	cssVar: function (name) {
		// debugger;

		let color = com.Vlt.div.css('--text').trim().replace('#', '');
		// color = 'C0FFEE';
		if (color.length == 3) color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
		color = color.split("").reverse().join("");
		let valueTable = "0123456789ABCDEF"
		let result = 0;
		for (let i = 0, digitValue = 1; i < color.length; i++ , digitValue *= 16) {
			let onesValue = valueTable.indexOf(color[i]); // find the hex digits decimal value, using the above string.
			let value = onesValue * digitValue; // find the value of this digit in its place.
			result |= value; // value is effectively digit masked, and adding would involve sign errors...
		}

		return result;
	}
});

//Viewify
if (!window.Viewify) window.Viewify = function Viewify(_class, versionString) {
	class SemVer {
		constructor(str) {
			if(!str) {
				console.warn('View version not specified, assuming 3.0 for compatibility.');
				str = '3.0.0';
			}
			let parts = str.split('.');
			let version = [];
			if(parts.length > 0 && parts.length < 4);
			for(let i = 0; i < parts.length; i ++) {
				let thing = parseInt(parts[i]);
				if(thing === thing) {
					version.push(thing);
				}
			}
			while(version.length < 3) {
				version.push(0);
			}

			[this.major, this.minor, this.patch] = version;
			// debugger;
			
		}
	}

	const version = new SemVer(versionString);
	// will scan either a prototype of dispatch table
	let child = typeof _class == 'function' ? _class.prototype : _class;

	class View {
		Setup(com, fun) {
			// debugger;
			// console.time('View');
			let vlt = this.Vlt;
			vlt.titleBarHeight = 20;
			// vlt.type = this.Par.Module.substr(this.Par.Module.lastIndexOf('/') + 1).replace(".js", "");
			vlt.type = this.Par.Module.split(/[\.:\/]/g).pop();
			vlt.rootID = '#' + this.Par.Pid.substr(24) + "-Root";
			vlt.views = [];
			vlt.div = DIV();
			// debugger;
			vlt.root = DIV(vlt.rootID);
			vlt.root.data('ent', this);
			vlt.root.attr('viewPid', this.Par.Pid);
			vlt.styletag = STYLE();
			vlt.titleBar = DIV('.titlebar');
			this.Vlt.disableTitleBar = this.Vlt.disableTitleBar || true;
			vlt.titleBar.text(this.titleBarText);

			vlt.root.css('height', '100%');
			vlt.root.css('display', 'block');
			vlt.root.css('box-sizing', 'border-box');
			vlt.root.css('overflow', 'hidden');
			// vlt.root.css('padding', '2px');

			vlt.div.css('height', 'calc(100% - ' + (vlt.titleBarHeight + 1) + 'px)');
			vlt.div.css('display', 'block');
			vlt.div.css('position', 'relative');
			vlt.div.css('box-sizing', 'border-box');
			vlt.div.css('overflow', 'hidden');
			vlt.div.addClass(this.type);
			if('ID' in this.Par) vlt.ID = this.Par.ID;
			else vlt.ID = `Z${this.Par.Pid}`;
			vlt.div.attr('id', this.Vlt.ID);
			// debugger;

			vlt.titleBar.css('display', 'inline-block');
			vlt.titleBar.css('width', '100%');
			vlt.titleBar.css('height', '' + vlt.titleBarHeight + 'px');
			vlt.titleBar.css('border-bottom', '1px solid var(--view-border-color)');
			vlt.titleBar.css('background-color', 'var(--view-lighter)');
			vlt.titleBar.css('padding-left', '12px');
			vlt.titleBar.css('font-size', '11px');
			vlt.titleBar.css('line-height', '' + vlt.titleBarHeight + 'px');
			vlt.titleBar.css('overflow', 'hidden');
			vlt.titleBar.css('vertical-align', 'top');
			vlt.titleBar.css('word-break', 'break-all');

			// vlt.div.css('padding', '2px');
			this.dispatch({
				Cmd: 'SetColor',
				Value: "var(--view-color)"
				// Border: "var(--view-border-color)"
			}, () => { });
			vlt.name = com.Name || this.Par.Name || "Untitled View";
			vlt.root.append(vlt.styletag);
			vlt.root.append(vlt.titleBar);
			vlt.root.append(vlt.div);
			// debugger;
			vlt.viewDivs = [];

			console.time('View');
			
			if (vlt.disableTitleBar) {
				//oh okay, thats cool. i guess.
				vlt.div.css('height', '100%');
				vlt.titleBar.detach();
			}

			if (vlt.type == "Panel") {
				// debugger;
			}

			// com.dispatch({ Cmd: 'Style', Selector: '#' });

			// console.timeEnd('View');
			// debugger;
			fun(null, com);
		}

		GetViewRoot(com, fun) {
			//debugger;
			com.Div = this.Vlt.root;
			// debugger;
			fun(null, com);
		}

		GetViewDiv(com, fun) {
			com.Div = this.Vlt.div;
			fun(null, com);
		}

		/// used to add styles to this View & children
		/// com format: 
		/// com.Selector = The css selector to apply rules to
		/// com.Rules = Associative array where keys are rules and values are css values.
		/// OR for only one rule
		/// com.Selector = same
		/// com.Rule = CSS rule name
		/// com.Value = CSS rule value
		Style(com, fun) {
			let that = this;
			let vlt = this.Vlt
			let selector = com.Selector;
			if (selector == "" || selector == ":root") {
				selector = '#' + this.Vlt.div.attr('id');
			} else {
				selector = '#' + this.Vlt.div.attr('id') + " " + selector;
			}
			if ('Rules' in com) {
				let rules = com.Rules;
				append(selector + " {\r\n");
				for (let key in rules) {
					append('\t' + key + ': ' + rules[key] + ';\r\n');
				}
				append('}\r\n');
			} else if ('Rule' in com && 'Value' in com) {
				let rule = com.Rule;
				let value = com.Value;
				append(selector + " { " + rule + ": " + value + "; } \r\n");
			} else {
				fun('invalid com', com);
				return;
			}
			function append(str) {
				// debugger;
				vlt.styletag.html(vlt.styletag.html() + str);
			}
			fun(null, com);
		}

		DisableTitleBar() {
			this.Vlt.titleBar.detach();
			this.Vlt.disableTitleBar = true;
		}

		Clear(com, fun) {
			this.Vlt.div.children().detach();
			this.Vlt.root.children().detach();
			this.Vlt.root.append(this.Vlt.styletag);
			if (!this.Vlt.disableTitleBar) this.Vlt.root.append(this.titleBar);
			this.Vlt.root.append(this.Vlt.div);
			fun(null, com);
		}
		/// com.Value = CSS parsable color as string
		SetColor(com, fun) {
			let value = com.Value || com.Color;
			let border = com.Border || value;
			this.Vlt._color = value;
			this.Vlt.root.css('background-color', value);
			// this.Vlt.root.css('border', '1px solid ' + border);
			fun(null, com);
		}
		/// com.View = View PID
		SetView(com, fun) {
			let that = this;
			this.Vlt.views = [com.View];
			//debugger;
			this.send({ Cmd: 'GetViewRoot' }, com.View, (err, cmd) => {
				that.Vlt.viewDivs = [cmd.Div];
				//debugger;
				this.dispatch({ Cmd: 'Render' }, (err, cmd) => { fun(null, com) });
			});
		}
		// test change
		/// com.View = PID of view
		AddView(com, fun) { // this.div.css(rule, value);
			// debugger;
			let that = this;
			let vlt = this.Vlt;
			if (!('views' in vlt)) vlt.views = [];
			vlt.views.push(com.View);
			this.send({ Cmd: 'GetViewRoot' }, com.View, (err, cmd) => {
				vlt.viewDivs.push(cmd.Div);
				// debugger;
				this.dispatch({ Cmd: 'Render' }, (err, cmd) => { fun(null, com) });
			});
		}
		/// com.View = PID of view
		/// com.Index
		InsertView(com, fun) { // this.div.css(rule, value);
			// debugger;
			let that = this;
			let vlt = this.Vlt;
			this.Vlt.views.splice(com.Index, 0, com.View);
			this.send({ Cmd: 'GetViewRoot' }, com.View, (err, cmd) => {
				// that.Vlt.viewDivs.push(com.View);
				vlt.viewDivs.splice(com.Index, 0, cmd.Div);
				// debugger;
				this.dispatch({ Cmd: 'Render' }, (err, cmd) => { fun(null, com) });
			});
		}
		SetviewDivs(com, fun) {
			let that = this;
			let vlt = this.Vlt;
			vlt.views = com.viewDivs;
			this.dispatch({ Cmd: 'Clear' }, (err, cmd) => {
				async.eachSeries(com.viewDivs,  (item, next)=> {
					this.send({ Cmd: 'GetViewRoot' }, com.View, (err, cmd) => {
						vlt.viewDivs.push(cmd.Div);
					});
					next();
				}, () => {
					// debugger;
					this.dispatch({ Cmd: 'Render' }, (err, cmd) => { fun(null, com) });
				});
			});
		}
		Render(com, fun) {
			let that = this;
			async.each(this.Vlt.views, (pid, next)=> {
				that.send({Cmd: 'Render'}, pid, () => {
					next();
				});
			}, function() {
				fun(null, com);
			})
		}

		GetType(com, fun) {
			com.Type = this.Vlt.type;
			fun(null, com);
		}

		Focus(com, fun) {
			this.Vlt.root.addClass('Focus');
			if (!this.Vlt.disableTitleBar) this.Vlt.titleBar.css('border-bottom', '1px solid var(--accent-color)');
			fun(null, com);
		}

		Blur(com, fun) {
			this.Vlt.root.removeClass('Focus');
			if (!this.Vlt.disableTitleBar) this.Vlt.titleBar.css('border-bottom', '1px solid var(--view-border-color)');
			fun(null, com);
		}

		DOMLoaded(com, fun) {
			// debugger;
			//console.log('DOMLoaded - ' + this.Vlt.type);
			let that = this;
			async.eachSeries(this.Vlt.views,  (item, next)=> {
				that.send({ Cmd: 'DOMLoaded' }, item, () => {
					next();
				});
			}, () => {
				fun(null, com);
			});
		}

		Resize(com, fun) {
			com.width = this.Vlt.div.width();
			com.height = this.Vlt.div.height();
			com.aspect = 1 / (this.Vlt.div.height() / this.Vlt.div.width());
			var that = this;
			async.each(this.Vlt.views,  (item, next)=>{
				that.send({
					Cmd: 'Resize'
				}, item, (err, cmd) => {
					if (err) debugger;
					next();
				});
			}, () => {
				fun(null, com);
			});
		}

		ShowHierarchy(com, fun) {
			var that = this;
			console.group(this.Vlt.rootID);
			async.forEach(this.Vlt.views,  (item, next)=>{
				that.send({ Cmd: "ShowHierarchy" }, item, (err, cmd) => {
					next();
				});
			}, function () {
				console.groupEnd(that.Vlt.rootID);
				fun(null, com);
			});
		}

		Drop(com, fun) {
			console.log('DROPPED', com);
		}

		AttachDragListener(com, fun) {
			let that = this;
			let root = com.To;
			let data = com.Data;
			let datatype = com.Datatype;
			// debugger;
			$(root).attr('draggable', 'true');
			let createDragDom = com.CreateDragDom || function () {
				div = $(document.createElement('div'));
				div.css('width', '200px');
				div.css('height', '200px');
				div.css('background-color', 'teal');
				return div;
			};

			let div;
			root.addEventListener('dragstart', function (evt) {
				// debugger;
				console.log(evt.dataTransfer.setDragImage(emptyImage(), 0, 0));
				event = evt;
				// debugger;
				div = createDragDom();

				div.css('pointer-events', 'none');
				div.css('opacity', '.6');
				div.css('position', 'fixed');
				div.css('top', (evt.pageY + 20) + 'px');
				div.css('left', (evt.pageX - (div.width() / 2)) + 'px');
				$(document.body).append(div);

			});
			root.addEventListener('drag', function (evt) {
				console.log("DRAG!");
				let pivotX = (div.width() / 2);
				let pivotY = 20;
				div.css('top', (evt.pageY + pivotY) + 'px');
				div.css('left', (evt.pageX - pivotX) + 'px');
			});
			root.addEventListener('dragend', function (evt) {
				div.remove();
				console.log('LOOKING FOR ');

				let elem = $(document.elementFromPoint(evt.pageX, evt.pageY));
				while (elem.attr('viewpid') == null && elem[0].nodeName != "BODY") {
					elem = elem.parent();
				}

				if (elem.attr('viewpid') == undefined) return;
				let viewpid = elem.attr('viewpid');

				that.send({
					Cmd: "Drop",
					Data: data,
					Datatype: datatype,
					PageX: evt.pageX,
					PageY: evt.pageY,
					DivX: evt.pageX - elem.position().left,
					DivY: evt.pageY - elem.position().top
				}, viewpid, () => { });

			});

		}

		Destroy(com, fun) {
			// debugger;
			async.eachSeries(this.Vlt.views, (item, next) =>{
				this.send({ Cmd: 'Destroy' }, item, () => {
					next();
				});
			}, () => {
				this.send({ Cmd: 'Cleanup' }, this.Par.Pid, () => {
					this.deleteEntity((err) => {
						if(err) console.error(err);
						setTimeout(() => {
							fun(null, com);
						}, 0)
					});
				});
			});

		}

		Cleanup(com, fun) {
			fun(null, com);
		}
	}

	function Command(com, fun) {
		// console.log(' >> ', com.Cmd);
		fun = fun || (()=>{});
		if (com.Cmd == 'Setup' || !('super' in this)) {
			let that = this;
			this.super = function (com, fun) {
				if (com.Cmd in View.prototype) {
					View.prototype[com.Cmd].call(this, com, fun);
				}else {
					fun('Command <' + com.Cmd + '> not in base class', com)
				}

			}
			this.ascend = (name, opts = {}, pid = this.Par.Pid) => new Promise((resolve, reject) => { this.send(Object.assign({Cmd: name}, opts), pid, (err, cmd) => { if(err) reject(err); else resolve(cmd); }); });
		}
		if (com.Cmd in child) {
			child[com.Cmd].call(this, com, fun);
		} else if (com.Cmd in View.prototype) {
			View.prototype[com.Cmd].call(this, com, fun);
		} else {
			fun('Command <' + com.Cmd + '> not Found', com);
		}
	}

	return {
		dispatch: {
			'*': Command
		}
	}
};