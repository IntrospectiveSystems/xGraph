//# sourceURL=Viewify

/// check if ?debug is in the URL. if so, turn on debug mode.
/// this will enable more complex logging
let debug = ((new URL(location.href)).searchParams.get('debug')) != null
if (debug) console.warn('Debug is turned on!!');

// minified md5 implemetation
window.md5 = function () {
	var k = [], i = 0;
	for (; i < 64;) k[i] = 0 | (Math.abs(Math.sin(++i)) * 4294967296);
	function calcMD5(str) {
		var b, c, d, j, x = [], str2 = unescape(encodeURI(str)),
			a = str2.length, h = [b = 1732584193, c = -271733879, ~b, ~c], i = 0;
		for (; i <= a;) x[i >> 2] |= (str2.charCodeAt(i) || 128) << 8 * (i++ % 4);
		x[str = (a + 8 >> 6) * 16 + 14] = a * 8; i = 0; for (; i < str; i += 16) {
			a = h; j = 0; for (; j < 64;) a = [d = a[3], ((b = a[1] | 0) + ((d = ((a[0] +
				[b & (c = a[2]) | ~b & d, d & b | ~d & c, b ^ c ^ d, c ^ (b | ~d)][a = j >> 4])
				+ (k[j] + (x[[j, 5 * j + 1, 3 * j + 5, 7 * j][a] % 16 + i] | 0)))) << (a = [
					7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21][4 * a + j++ % 4
				]) | d >>> 32 - a)), b, c]; for (j = 4; j;) h[--j] = h[j] + a[j];
		} str = '';
		for (; j < 32;) str += ((h[j >> 3] >> ((1 ^ j++ & 7) * 4)) & 15).toString(16);
		return str;
	} return calcMD5;
}();

// DIV, IMG, and STYLE are shorthand for making elements, wrapped in jquery

if (window.DIV == undefined)
	/**
	 * @param {String?} selectorish the classes and ID to apply to the generated
	 * div; in the format of a css selector. passing a string without . or # will
	 * set the class attribute to the string, unprocessed. this behavior is deprecated
	 * and will throw a warning
	 * 
	 */
	window.DIV = function DIV(selectorish) {
		let elem = $(document.createElement('div'));
		// debugger;
		if (selectorish) {
			if (selectorish.search(/[#\.]/) == -1) {
				log.w('calling DIV with a non selector string is deprecated.');
				log.w(`use DIV(.${selectorish}) instead`);
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
	emptyImage = IMG('https://placehold.it/1x1');
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
		src = `https://placehold.it/${width}x${height}`;
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
			if (!str) {
				console.warn('View version not specified, assuming 3.0 for compatibility.');
				str = '3.0.0';
			}
			let parts = str.split('.');
			let version = [];
			if (parts.length > 0 && parts.length < 4);
			for (let i = 0; i < parts.length; i++) {
				let thing = parseInt(parts[i]);
				if (thing === thing) {
					version.push(thing);
				}
			}
			while (version.length < 3) {
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
		/**
		 * @description Creates the basic things
		 * a view needs, like its div, internal
		 * stylesheet and other elements.
		 * 
		 * Overridable
		 * @param {any} com 
		 * @param {any} fun 
		 * @memberof View
		 */
		Setup(com, fun) {
			let vlt = this.Vlt;
			vlt.type = this.Par.Module.split(/[\.:\/]/g).pop();
			vlt.rootID = '#' + this.Par.Pid.substr(24) + "-Root";
			vlt.views = [];
			vlt.viewDivs = [];
			vlt.root = DIV(vlt.rootID);
			vlt.root.attr('viewPid', this.Par.Pid);
			vlt.styletag = STYLE();

			vlt.root.css('height', '100%');
			vlt.root.css('display', 'block');
			vlt.root.css('box-sizing', 'border-box');
			vlt.root.css('overflow', 'hidden');

			vlt.div = $(`<div class="${version >= new SemVer("3.1") ? vlt.type : ''}" 
				id="${('ID' in this.Par && version >= new SemVer("3.1") ? this.Par.ID : `XGRAPH-${this.Par.Pid}`)}"
				style="
				height: 100%;
				display: block;
				position: relative;
				box-sizing: border-box;
				overflow: hidden;
			"></div>`);

			vlt.name = com.Name || this.Par.Name || "Untitled View";
			vlt.root.append(vlt.styletag);
			vlt.root.append(vlt.div);

			console.time('View');

			fun(null, com);
		}

		/**
		 * @description Returns back (in com.Root) the root
		 * of the view.
		 * 
		 * Note: the root is different than this.Vlt.div.
		 * com.Root is the highest node in your View's 
		 * DOM hierarchy.
		 * 
		 * Not part of the public API. this
		 * command should stay internal
		 * @param {any} com 
		 * @param {any} fun 
		 * @memberof View
		 */
		GetViewRoot(com, fun) {
			// debugger;
			if (!this.Vlt.root) console.error(`ERR: trying to access root of ${this.Par.Module} before it is setup!`);
			com.Div = this.Vlt.root;
			// debugger;
			fun(new ViewNotInitializedError(), com);
		}

		/**
		 * @description Returns this.Vlt.div
		 * 
		 * Not part of the public API. this
		 * command should stay internal
		 * @param {any} com 
		 * @param {any} fun 
		 * @memberof View
		 */
		GetViewDiv(com, fun) {
			com.Div = this.Vlt.div;
			fun(null, com);
		}

		/**
		 * @description used to add styles to this View
		 * @param {object} com 
		 * @param {string} com.Selector The css selector to apply rules to
		 * @param {Object=} com.Rules Associative array where keys are rules and values are css values
		 * @param {any} fun 
		 * @returns 
		 * @memberof View
		 */
		Style(com, fun) {
			let that = this;
			let vlt = this.Vlt
			let selector = com.Selector;
			if (selector.indexOf(':root') > -1) { // if we have :root in our thing, just replace it with the id thing.
				selector = selector.replace(/:root/g, '');
			} else if (selector == "" || selector == ":root") {
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
				vlt.styletag.html(vlt.styletag.html() + str);
			}
			fun(null, com);
		}

		/**
		 * @description Used to be used to disable a title bar,  which no longer exists.
		 * 
		 * @deprecated
		 * @memberof View
		 */
		DisableTitleBar() {
			log.w('deprecated DisableTitleBar call');
			log.w(new Error().stack);
			this.Vlt.titleBar.detach();
			this.Vlt.disableTitleBar = true;
		}

		/**
		 * @description Reset the DOM hierarchy of your View
		 * 
		 * @deprecated
		 * @param {any} com 
		 * @param {any} fun 
		 * @memberof View
		 */
		Clear(com, fun) {
			log.w('deprecated clear call');
			log.w(new Error().stack);
			this.Vlt.div.children().detach();
			this.Vlt.root.children().detach();
			this.Vlt.root.append(this.Vlt.styletag);
			if (!this.Vlt.disableTitleBar) this.Vlt.root.append(this.titleBar);
			this.Vlt.root.append(this.Vlt.div);
			fun(null, com);
		}
		
		/**
		 * @description Set the color of the View
		 * 
		 * @deprecated
		 * @param {any} com 
		 * @param {any} fun 
		 * @memberof View
		 */
		SetColor(com, fun) {
			log.w('deprecated SetColor call');
			log.w(new Error().stack);
			let value = com.Value || com.Color;
			let border = com.Border || value;
			this.Vlt._color = value;
			this.Vlt.root.css('background-color', value);
			fun(null, com);
		}

		/**
		 * @description Called when a child of this View has been destroyed. Overriding this command is not supported.
		 * @param {any} com 
		 * @param {any} fun 
		 * @memberof View
		 */
		async ChildDestroyed(com, fun) {
			this.Vlt.views.splice(this.Vlt.views.indexOf(com.Pid), 1);
			let views = this.Vlt.views.slice(0);

			this.Vlt.viewDivs = [];
			this.Vlt.views = [];
			for (let pid of views)
				await this.ascend('AddView', { View: pid }, this.Par.Pid);


			await this.ascend('Render', {}, this.Par.Pid);

			fun(null, com);

		}

		/**
		 * @description Add com.View as a Child View this forces a render after the child gives us its div.
		 * @param {any} com
		 * @param {string} com.View view pid
		 * @param {any} fun 
		 * @memberof View
		 */
		AddView(com, fun) {
			let that = this;
			let vlt = this.Vlt;
			if (!('views' in vlt)) vlt.views = [];
			if(this.Vlt.views.indexOf(com.View) > -1) return fun(null, com);
			vlt.views.push(com.View);
			this.send({ Cmd: 'GetViewRoot' }, com.View, (err, cmd) => {
				vlt.viewDivs.push(cmd.Div);
				this.dispatch({ Cmd: 'Render' }, (err, cmd) => { fun(null, com) });
				this.send({ Cmd: 'RegisterDestroyListener' }, com.View, _ => _);
			});
		}

		/**
		 * @description Render the View. This is only called
		 * when something about the view has changed.
		 * typically, this means that your children
		 * have changed.
		 * 
		 * Overridable
		 * @param {any} com 
		 * @param {any} fun 
		 * @memberof View
		 */
		async Render(com, fun) {
			let that = this;
			for (let pid of this.Vlt.views) {
				await new Promise((resolve, reject) => {
					that.send({ Cmd: 'Render' }, pid, () => {
						resolve();
					});
				});
			}
			fun(null, com);
		}

		/**
		 * @description returns the Type of view this is.
		 * View type is defined by the last token in the
		 * dot separated array this.Par.Module
		 * 
		 * @deprecated
		 * @param {any} com
		 * @param {string} com.Type return value
		 * @param {any} fun 
		 * @memberof View
		 */
		GetType(com, fun) {
			log.w('deprecated GetType call');
			log.w(new Error().stack);
			com.Type = this.Vlt.type;
			fun(null, com);
		}

		/**
		 * @description Event Command; fired when this view
		 * received focus.
		 * 
		 * @deprecated
		 * @param {any} com 
		 * @param {any} fun 
		 * @memberof View
		 */
		Focus(com, fun) {
			log.w('deprecated Focus call');
			log.w(new Error().stack);
			this.Vlt.root.addClass('Focus');
			if (!this.Vlt.disableTitleBar) this.Vlt.titleBar.css('border-bottom', '1px solid var(--accent-color)');
			fun(null, com);
		}

		/**
		 * @description Event command; fired when
		 * this viw lost focus
		 * 
		 * @deprecated
		 * @param {any} com 
		 * @param {any} fun 
		 * @memberof View
		 */
		Blur(com, fun) {
			this.Vlt.root.removeClass('Focus');
			if (!this.Vlt.disableTitleBar) this.Vlt.titleBar.css('border-bottom', '1px solid var(--view-border-color)');
			fun(null, com);
		}

		/**
		 * @description Event Command;  Fired after the
		 * first Render cascade in a new View hierarchy
		 * 
		 * Overridable
		 * @param {any} com 
		 * @param {any} fun 
		 * @memberof View
		 */
		async DOMLoaded(com, fun) {
			//console.log('DOMLoaded - ' + this.Vlt.type);

			let that = this;
			for (let pid of this.Vlt.views) {
				await new Promise((resolve, reject) => {
					that.send({ Cmd: 'DOMLoaded' }, pid, () => {
						resolve();
					});
				});
			}
			fun(null, com);
		}

		/**
		 * @description Event Commend; Called when your drawable area
		 * has been changed.
		 * 
		 * Note: This is dispatched by a root view, so if you are
		 * creatin a root view, you need to manually start the
		 * Resize cascaded.
		 * 
		 * Overridable
		 * @param {object} com
		 * @param {number} com.width
		 * @param {number} com.height
		 * @param {number} com.aspect
		 * @param {any} fun 
		 * @memberof View
		 */
		async Resize(com, fun) {
			com.width = this.Vlt.div.width();
			com.height = this.Vlt.div.height();
			com.aspect = 1 / (this.Vlt.div.height() / this.Vlt.div.width());
			let that = this;
			for (let pid of this.Vlt.views) {
				await new Promise((resolve, reject) => {
					that.send({ Cmd: 'Resize' }, pid, () => {
						resolve();
					});
				});
			}
			fun(null, com);
		}

		/**
		 * @description ShowHierarchy creates a tree in the console
		 * @param {any} com 
		 * @param {any} fun 
		 * @memberof View
		 */
		async ShowHierarchy(com, fun) {

			var that = this;
			console.group(this.Vlt.rootID);
			for (let pid of this.Vlt.views) {
				await new Promise((resolve, reject) => {
					that.send({ Cmd: 'ShowHierarchy' }, pid, () => {
						resolve();
					});
				});
			}
			console.groupEnd(that.Vlt.rootID);
			fun(null, com);
		}

		/**
		 * @description Event Command; Fires when Something is
		 * dropped in this View.
		 * 
		 * See Also: [Drag and Drop API](https://github.com/IntrospectiveSystems/xGraph/wiki/Viewify-Docs---Version-Info#drag-and-drop)
		 * @param {object} com 
		 * @param {any} com.Data
		 * @param {string} com.Datatype
		 * @param {HTMLElement} com.DropArea
		 * @param {number} com.PageX
		 * @param {number} com.PageY
		 * @param {number} com.DivX
		 * @param {number} com.DivX
		 * @param {any} fun 
		 * @memberof View
		 */
		Drop(com, fun) {
			console.log('DROPPED', com);
			fun(null, com);
		}

		/**
		 * @description make an element drag & droppable.
		 * 
		 * com.Data and com.Datatype is the information
		 * and type of information that is tied to the element.
		 * i.e., if the element is dragged, when it is dropped,
		 * that data will be passed to the drop event.
		 * 
		 * com.To is the Native Element to attach the listener to.
		 * 
		 * com.CreateDragDom is an optional function to create what
		 * the drag handler will dragg around. for example, if you 
		 * had a custom image you would like to drag, you could return
		 * and img element, with its src attribute set.
		 * @param {object} com
		 * @param {HTMLElement} com.To
		 * @param {function=} com.CreateDragDom
		 * @param {object} com.Data
		 * @param {string} com.Datatype
		 * @param {any} fun
		 * @returns 
		 * @memberof View
		 */
		AttachDragListener(com, fun) {
			let that = this;
			let root = com.To || (console.log('com.To: <Native HTMLElement> is required!'));
			if (!com.To) return fun('com.To: <Native HTMLElement> is required!', com);
			let data = com.Data || {};
			let datatype = com.Datatype || "HTMLElement";
			// debugger;
			$(root).attr('draggable', 'true');
			let createDragDom;
			if (version > new SemVer('3.1')) createDragDom = com.CreateDragDom || null;
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
				if (createDragDom) {
					console.log(evt.dataTransfer.setDragImage(emptyImage(), 0, 0));
					div = createDragDom();

					event = evt;
					div.css('pointer-events', 'none');
					div.css('opacity', '.6');
					div.css('position', 'fixed');
					div.css('top', (evt.pageY + 20) + 'px');
					div.css('left', (evt.pageX - (div.width() / 2)) + 'px');
					$(document.body).append(div);
				}
			});
			root.addEventListener('drag', function (evt) {
				if (evt.pageX == 0 && evt.pageY == 0) {
					return;
				}
				if (div) {
					let pivotX = (div.width() / 2);
					let pivotY = 20;
					div.css('top', (evt.pageY + pivotY) + 'px');
					div.css('left', (evt.pageX - pivotX) + 'px');
				}
			});
			root.addEventListener('dragend', function (evt) {
				if (div) {
					div.remove();
				}
				let elem = $(document.elementFromPoint(evt.pageX, evt.pageY));
				if (version >= new SemVer('3.2')) {
					while (elem.hasClass('dropArea') == null) {
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

		/**
		 * @description Destroy will force a View to gracefully
		 * shut down. Sending itself a cleanup before garbage
		 * collection, if anything needs to be done.
		 * @param {any} com 
		 * @param {any} fun 
		 * @returns 
		 * @memberof View
		 */
		async Destroy(com, fun) {
			console.log(` ${this.emoji(0x1F4A3)} ${this.Vlt.type}::Destroy`);
			if (this.Par.Destroying) return (console.log('This is a duplicate destroy, no action taken.'), fun(null, com));
			this.Par.Destroying = true;
			for (let item of this.Vlt.views)
				await this.ascend('Destroy', {}, item);
			await this.ascend('Cleanup');
			this.deleteEntity((err) => fun(null, com));
		}

		/**
		 * @description Event Command; sent right before a View will be garbage collected.
		 * 
		 * Overridable
		 * @param {any} com 
		 * @param {any} fun 
		 * @memberof View
		 */
		Cleanup(com, fun) {
			// debugger;
			console.log("SUPER CLEANUP");
			if ('DestroyListeners' in this.Par && version >= new SemVer('3.3'))
				for (let pid of this.Par.DestroyListeners)
					this.send({ Cmd: 'ChildDestroyed', Pid: this.Par.Pid }, pid, _ => _);
			this.Vlt.root.remove();
			fun(null, com);
		}

		/**
		 * @description Internal Private Command
		 * 
		 * Subscribe to the event for when this View is destroyed.
		 * @param {any} com 
		 * @param {any} fun 
		 * @memberof View
		 */
		RegisterDestroyListener(com, fun) {
			let pid = com.Passport.From;
			if ('DestroyListeners' in this.Par) this.Par.DestroyListeners.push(pid);
			else this.Par.DestroyListeners = [pid];
			fun(null, com);
		}

	}

	function injections() {
		let that = this;

		this.emoji = (char) => eval('\"\\u' + (0b1101100000000000 + (char - 0x10000 >>> 10)).toString(16) + '\\u' + (0b1101110000000000 + (char & 0b1111111111)).toString(16) + "\"");

		if (version >= new SemVer('3.0')) {
			this.super = function (com, fun) {
				if (com.Cmd in View.prototype) {
					View.prototype[com.Cmd].call(this, com, fun);
				} else {
					fun('Command <' + com.Cmd + '> not in base class', com);
				}
			};

			this.ascend = (name, opts = {}, pid = this.Par.Pid) => new Promise((resolve, reject) => {
				this.send(Object.assign({ Cmd: name }, opts), pid, (err, cmd) => {
					if (err) reject(err);
					else resolve(cmd);
				});
			});
		} else return;

		if (version >= new SemVer('3.3')) {
			this.ascend = (name, opts = {}, pid = this.Par.Pid) => new Promise((resolve, reject) => {
				this.send(Object.assign({ Cmd: name }, opts), pid, (err, cmd) => {
					if (err) reject([err, cmd]);
					else resolve(cmd);
				});
			});
		} else return;

		if (version >= new SemVer('3.4')) {
			this.asuper = function (com) {
				return new Promise((resolve, reject) => {
					this.super(com, (err, cmd) => {
						if (err) reject([err, cmd])
						else resolve(cmd);
					});
				});
			};
			this.genModuleAsync = (modDef) => new Promise((resolve, reject) => {
				this.genModule(modDef, (err, apx) => {
					if (err) reject(err);
					else resolve(apx);
				});
			});
			this.evoke = async (pid) => {
				this.send({
					Cmd: 'Evoke'
				}, pid, async (err, cmd) => {
					if (cmd.Type == 'View') {
						let newPar = {
							View: cmd.View,
							Par: cmd.Par || {},
							Width: 500
						};
						let popup = await this.genModuleAsync({
							Module: cmd.Container || 'xGraph:Widgets/Popup',
							Par: newPar
						});
					}
				});
			};
			this.cdnImportCss = (url) => {
				$(document.head).append($(`<link href="${url}" rel="stylesheet">`));
			};
			this.id = str => `XGRAPH-${this.Vlt.type}-${md5(this.Par.Pid + str)}-${str}`;
		}
		if (version >= new SemVer('3.5')) {
			this.authenticate = async (cmd) => {
				return (await this.ascend('Authenticate', {Command: cmd}, window.CommandAuthenticator)).Command;
			}

			this.evoke = async (pid, options) => {
				this.send(Object.assign({
					Cmd: 'Evoke'
				}, options), pid, async (err, cmd) => {
					if (cmd.Type == 'View') {
						let newPar = {
							View: cmd.View,
							Par: cmd.Par || {},
							Width: 500
						};
						let popup = await this.genModuleAsync({
							Module: cmd.Container || 'xGraph:Widgets/Popup',
							Par: newPar
						});
						this.ascend('AddView', {View: popup}, this.Par.Pid);
					}
				});
			};
			//options no longer overrides Cmd param if it has a Cmd Key
			this.ascend = (name, opts = {}, pid = this.Par.Pid) => new Promise((resolve, reject) => {
				this.send(Object.assign(opts, { Cmd: name }), pid, (err, cmd) => {
					if (err) reject([err, cmd]);
					else resolve(cmd);
				});
			});
		}
	}

	function Command(com, fun) {
		fun = fun || (() => { });
		if (com.Cmd == 'Setup' || !('super' in this)) {
			injections.call(this);
		}

		let timeTag, color, id;
		if (debug) {
			timeTag = (this.Vlt.type || this.Par.Module.substr(this.Par.Module.lastIndexOf('/') + 1));
			color = md5(timeTag).substr(0, 6);
			id = ("000000" + (new Date().getTime() % 100000)).substr(-5, 5) + ' ' + timeTag + ' ' + com.Cmd;
		}


		if (debug) console.group(id);
		if (debug) console.log(`%c${timeTag} ${com.Cmd}`,
			`color: #${color};
		text-shadow: rgba(255, 255, 255, .4) 0px 0px 5px;
		padding: 2px 6px;`);

		if (com.Cmd in child) {
			// console.time(timeTag);
			child[com.Cmd].call(this, com, () => {
				if (debug) console.groupEnd(id);
				fun(null, com);
			});
		} else if (com.Cmd in View.prototype) {
			View.prototype[com.Cmd].call(this, com, () => {
				if (debug) console.groupEnd(id);
				fun(null, com);
			});
		} else if ("*" in child) {
			child["*"].call(this, com, () => {
				if (debug) console.groupEnd(id);
				fun(null, com);
			});
		} else {
			console.warn('Command <' + com.Cmd + '> not Found');
			if (debug) console.groupEnd(id);
			fun('Command <' + com.Cmd + '> not Found', com);
		}
	}

	return {
		dispatch: {
			'*': Command
		}
	}
};