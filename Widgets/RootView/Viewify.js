//# sourceURL=Viewify.js
// debugger;

md5 = function(){
		var k = [], i = 0;
		for(; i < 64; ) k[i] = 0|(Math.abs(Math.sin(++i)) * 4294967296);
		function calcMD5(str){ var b, c, d, j, x = [], str2 = unescape(encodeURI(str)),
			a = str2.length, h = [b = 1732584193, c = -271733879, ~b, ~c], i = 0;
			for(; i <= a; ) x[i >> 2] |= (str2.charCodeAt(i)||128) << 8 * (i++ % 4);
			x[str = (a + 8 >> 6) * 16 + 14] = a * 8; i = 0; for(; i < str; i += 16){
				a = h; j = 0; for(; j < 64; ) a = [ d = a[3], ((b = a[1]|0) + ((d = ((a[0] +
					[b & (c = a[2]) | ~b&d,d & b | ~d & c,b ^ c ^ d,c ^ (b | ~d)][a = j >> 4])
					+ (k[j] + (x[[j, 5 * j + 1, 3 * j + 5, 7 * j][a] % 16 + i]|0)))) << (a = [
					7, 12, 17, 22, 5,  9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21][4 * a + j++ % 4
					]) | d >>> 32 - a)), b, c]; for(j = 4; j; ) h[--j] = h[j] + a[j]; } str = '';
			for(; j < 32; ) str += ((h[j >> 3] >> ((1 ^ j++ & 7) * 4)) & 15).toString(16);
			return str;} return calcMD5; }();

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

class ViewNotInitializedError extends Error {
	
}

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

		valueOf() {
			return (this.major * 1e6) + (this.minor * 1e3) + (this.patch);
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
			// debugger;
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
			vlt.div.addClass(vlt.type);
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
			// debugger;
			if(!this.Vlt.root) console.error(`ERR: trying to access root of ${this.Par.Module} before its setup!`);
			com.Div = this.Vlt.root;
			// debugger;
			fun(new ViewNotInitializedError(), com);
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
			let root = com.To || (console.log('com.To: <Native HTMLElement> is required!'));
			if(!com.To) return fun('com.To: <Native HTMLElement> is required!', com);
			let data = com.Data || {};
			let datatype = com.Datatype || "HTMLElement";
			// debugger;
			$(root).attr('draggable', 'true');
			let createDragDom;
			if(version > new SemVer('3.1')) createDragDom = com.CreateDragDom || null;
			else createDragDom = com.CreateDragDom || function () {
				div = $(document.createElement('div'));
				div.css('width', '200px');
				div.css('height', '200px');
				div.css('background-color', 'teal');
				return div;
			};

			let div;
			root.addEventListener('dragstart', function (evt) {
				// debugger;
				if(createDragDom) {
					console.log(evt.dataTransfer.setDragImage(emptyImage(), 0, 0));
					div = createDragDom();

					event = evt;
					// debugger;
					div.css('pointer-events', 'none');
					div.css('opacity', '.6');
					div.css('position', 'fixed');
					div.css('top', (evt.pageY + 20) + 'px');
					div.css('left', (evt.pageX - (div.width() / 2)) + 'px');
					$(document.body).append(div);
				}
			});
			root.addEventListener('drag', function (evt) {
				console.log("DRAG!", evt.pageX, evt.pageY);
				if(evt.pageX == 0 && evt.pageY == 0) {
					// console.log('RIDICULOUS');
					return;
				}
				if(div) {
					let pivotX = (div.width() / 2);
					let pivotY = 20;
					div.css('top', (evt.pageY + pivotY) + 'px');
					div.css('left', (evt.pageX - pivotX) + 'px');
				}
			});
			root.addEventListener('dragend', function (evt) {
				if(div)
					div.remove();
				// console.log('LOOKING FOR ');

				let elem = $(document.elementFromPoint(evt.pageX, evt.pageY));
				if(version > new SemVer('3.1')) {
					// console.log('new thing');
					while(elem.hasClass('dropArea') == null) {
						elem = elem.parent();
					}

					let dropArea = elem;

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
						DropArea: dropArea,
						DivX: evt.pageX - elem.position().left,
						DivY: evt.pageY - elem.position().top
					}, viewpid, () => { });

				} else {
					// console.log('old thing');
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
				}
				


			});

			fun(null, com);

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

		PrepareBuffer(com, fun) {
			if(!('onScreenBuffer' in this.Vlt) || this.Vlt.onScreenBuffer == undefined) this.Vlt.onScreenBuffer = this.Vlt.div;
			
			//either way, we should reset the div to our last saved on screen buffer
			this.Vlt.div = this.Vlt.buffer.onScreenBuffer.clone();
		}

		SwapBuffer(com, fun) {

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

		// let timeTag = (this.Vlt.type || this.Par.Module.substr(this.Par.Module.lastIndexOf('/') + 1));
		// let color = md5(timeTag).substr(0, 6);
		// let color = 'C0FFEE';
		// let id = ("000000" + (new Date().getTime() % 100000)).substr(-5, 5) + ' ' + timeTag + ' ' + com.Cmd;


		// console.group(id);
		// console.log(`%c${timeTag} ${com.Cmd}`, `
		// background-color: #${color};
		// text-shadow: 
		// 	rgba(0, 0, 0, 1) 0px 0px 1px, 
		// 	rgba(0, 0, 0, 1) 0px 0px 1px, 
		// 	rgba(0, 0, 0, 1) 0px 0px 4px,  
		// 	rgba(0, 0, 0, 1) 0px 0px 4px; 
		// padding: 2px 6px; color: white;`);
		if (com.Cmd in child) {
			// console.time(timeTag);
			child[com.Cmd].call(this, com, () => {
				
				// console.groupEnd(id);
				fun(null, com);
			});
		} else if (com.Cmd in View.prototype) {
			View.prototype[com.Cmd].call(this, com, () => {
				
				// console.groupEnd(id);
				fun(null, com);
			});
		} else {
			console.warn('Command <' + com.Cmd + '> not Found');
			console.groupEnd(id);
			fun('Command <' + com.Cmd + '> not Found', com);
		}
	}

	return {
		dispatch: {
			'*': Command
		}
	}
};