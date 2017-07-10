//# sourceURL=Viewify.js
// debugger;
if (!window.Viewify) window.Viewify = function Viewify(_class) {

	// will scan either a prototype of dispatch table
	let child = typeof _class == 'function' ? _class.prototype : _class;

	class View {
		Setup(com, fun) {
			// debugger;
			console.time('View');
			let vlt = this.Vlt;
			vlt.titleBarHeight = 20;
			// vlt.type = this.Par.Module.substr(this.Par.Module.lastIndexOf('/') + 1).replace(".js", "");
			vlt.type = "view";
			vlt.rootID = '#' + this.Par.Pid.substr(24) + "-Root";
			vlt.views = [];
			vlt.div = DIV("#" + this.Par.Pid.substr(24));
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
			vlt.div.css('box-sizing', 'border-box');
			vlt.div.css('overflow', 'hidden');

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

			if (vlt.disableTitleBar) {
				//oh okay, thats cool. i guess.
				vlt.div.css('height', '100%');
				vlt.titleBar.detach();
			}

			if (vlt.type == "Panel") {
				// debugger;
			}

			// com.dispatch({ Cmd: 'Style', Selector: '#' });

			console.timeEnd('View');
			// debugger;
			fun(null, com);
		}

		GetViewRoot(com, fun) {
			// debugger;
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
				selector = this.Vlt.rootID;
			} else {
				selector = this.Vlt.rootID + " " + selector;
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
			this.send({ Cmd: 'GetViewRoot' }, com.View, (err, cmd) => {
				that.Vlt.viewDivs = [cmd.Div];
				// debugger;
				com.dispatch({ Cmd: 'UpdateUI' }, (err, cmd) => { fun(null, com) });
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
				this.dispatch({ Cmd: 'UpdateUI' }, (err, cmd) => { fun(null, com) });
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
				this.dispatch({ Cmd: 'UpdateUI' }, (err, cmd) => { fun(null, com) });
			});
		}
		SetviewDivs(com, fun) {
			let that = this;
			let vlt = this.Vlt;
			vlt.views = com.viewDivs;
			this.dispatch({ Cmd: 'Clear' }, (err, cmd) => {
				async.eachSeries(com.viewDivs, function (item, next) {
					this.send({ Cmd: 'GetViewRoot' }, com.View, (err, cmd) => {
						vlt.viewDivs.push(cmd.Div);
					});
					next();
				}, () => {
					// debugger;
					this.dispatch({ Cmd: 'UpdateUI' }, (err, cmd) => { fun(null, com) });
				});
			});
		}
		UpdateUI(com, fun) {
			let vlt = this.Vlt;
			for (let index in this.Vlt.viewDivs) {
				let view = this.Vlt.viewDivs[index];
				this.Vlt.div.append(view);
			}
			fun(null, com);
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
			async.eachSeries(this.Vlt.views, function (item, next) {
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
			async.each(this.Vlt.views, function (item, next) {
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
			async.forEach(this.Vlt.views, function (item, next) {
				that.send({ Cmd: "ShowHierarchy" }, item, (err, cmd) => {
					next();
				});
			}, function () {
				console.groupEnd(that.Vlt.rootID);
				fun(null, com);
			});
		}

		Drop(com, fun) {
			debugger;
		}
	}

	function Command(com, fun) {
		console.log(' >> ', com.Cmd);
		if (com.Cmd == 'Setup' || !('super' in this)) {
			let that = this;
			this.super = function (com, fun) {
				if (com.Cmd in View.prototype) {
					View.prototype[com.Cmd].call(this, com, fun);
				}else {
					fun('Command <' + com.Cmd + '> not in base class', com)
				}

			}
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
}