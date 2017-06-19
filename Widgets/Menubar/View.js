//# sourceURL=View.js
//jshint esversion: 6
(function View() {
	//asdfasdf
	class View {
		constructor() { }
		Setup(com, fun) {
			console.time('View');
			let vlt = com.Vlt;
			vlt.titleBarHeight = 20;
			// vlt.type = this.Par.Module.substr(this.Par.Module.lastIndexOf('/') + 1).replace(".js", "");
			vlt.type = "view";
			vlt.rootID = '#View-' + com.Par.Pid.substr(24) + '-' + vlt.type;
			vlt.views = [];
			vlt.div = DIV();
			vlt.root = DIV(vlt.rootID);
			vlt.root.data('ent', this);
			vlt.root.attr('viewPid', com.Par.Pid);
			vlt.styletag = STYLE();
			vlt.titleBar = DIV('.titlebar');
			com.Vlt.disableTitleBar = com.disableTitleBar || false;
			vlt.titleBar.text(com.titleBarText);

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
			com.dispatch({
				Cmd: 'SetColor',
				Value: "var(--view-color)"
				// Border: "var(--view-border-color)"
			}, () => { });
			vlt.name = com.Name || this.Par.Name || "Untitled View";
			vlt.root.append(vlt.styletag);
			vlt.root.append(vlt.titleBar);
			vlt.root.append(vlt.div);
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

		/*
		"HoloView": {
			"Module": "xGraph:Widgets/HoloView",
			"Par": {
				"Scene": "$Scene"
			}
		},
		"Layout": {
			"Module": "xSDE:Modules/LayoutInitializer",
			"Par": {
				"Layout": "$HoloView"
			}
		}
		*/

		GetViewRoot(com, fun) {
			// debugger;
			com.Div = com.Vlt.root;
			// debugger;
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
			let vlt = com.Vlt
			let selector = com.Selector;
			if (selector == "" || selector == ":root") {
				selector = com.Vlt.rootID;
			} else {
				selector = com.Vlt.rootID + " " + selector;
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
			com.Vlt.titleBar.detach();
			com.Vlt.disableTitleBar = true;
		}

		Clear(com, fun) {
			com.Vlt.div.children().detach();
			com.Vlt.root.children().detach();
			com.Vlt.root.append(com.Vlt.styletag);
			if (!com.Vlt.disableTitleBar) com.Vlt.root.append(this.titleBar);
			com.Vlt.root.append(com.Vlt.div);
			fun(null, com);
		}
		/// com.Value = CSS parsable color as string
		SetColor(com, fun) {
			let value = com.Value || com.Color;
			let border = com.Border || value;
			com.Vlt._color = value;
			com.Vlt.root.css('background-color', value);
			// com.Vlt.root.css('border', '1px solid ' + border);
			fun(null, com);
		}
		/// com.View = View PID
		SetView(com, fun) {
			let that = this;
			com.Vlt.views = [com.View];
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
			let vlt = com.Vlt;
			if (!('views' in vlt)) vlt.views = [];
			vlt.views.push(com.View);
			this.send({ Cmd: 'GetViewRoot' }, com.View, (err, cmd) => {
				vlt.viewDivs.push(cmd.Div);
				// debugger;
				com.dispatch({ Cmd: 'UpdateUI' }, (err, cmd) => { fun(null, com) });
			});
		}
		/// com.View = PID of view
		/// com.Index
		InsertView(com, fun) { // this.div.css(rule, value);
			// debugger;
			let that = this;
			let vlt = com.Vlt;
			com.Vlt.views.splice(com.Index, 0, com.View);
			this.send({ Cmd: 'GetViewRoot' }, com.View, (err, cmd) => {
				// that.Vlt.viewDivs.push(com.View);
				vlt.viewDivs.splice(com.Index, 0, cmd.Div);
				// debugger;
				com.dispatch({ Cmd: 'UpdateUI' }, (err, cmd) => { fun(null, com) });
			});
		}
		SetviewDivs(com, fun) {
			let that = this;
			let vlt = com.Vlt;
			vlt.views = com.viewDivs;
			com.dispatch({ Cmd: 'Clear' }, (err, cmd) => {
				async.eachSeries(com.viewDivs, function (item, next) {
					this.send({ Cmd: 'GetViewRoot' }, com.View, (err, cmd) => {
						vlt.viewDivs.push(cmd.Div);
					});
					next();
				}, () => {
					// debugger;
					com.dispatch({ Cmd: 'UpdateUI' }, (err, cmd) => { fun(null, com) });
				});
			});
		}
		UpdateUI(com, fun) {
			let vlt = com.Vlt;
			for (let index in com.Vlt.viewDivs) {
				let view = com.Vlt.viewDivs[index];
				com.Vlt.div.append(view);
			}
			fun(null, com);
		}

		GetType(com, fun) {
			com.Type = com.Vlt.type;
			fun(null, com);
		}

		Focus(com, fun) {
			com.Vlt.root.addClass('Focus');
			if (!com.Vlt.disableTitleBar) com.Vlt.titleBar.css('border-bottom', '1px solid var(--accent-color)');
			fun(null, com);
		}

		Blur(com, fun) {
			com.Vlt.root.removeClass('Focus');
			if (!com.Vlt.disableTitleBar) com.Vlt.titleBar.css('border-bottom', '1px solid var(--view-border-color)');
			fun(null, com);
		}

		DOMLoaded(com, fun) {
			// debugger;
			//console.log('DOMLoaded - ' + com.Vlt.type);
			let that = this;
			async.eachSeries(com.Vlt.views, function (item, next) {
				that.send({ Cmd: 'DOMLoaded' }, item, () => {
					next();
				});
			}, () => {
				fun(null, com);
			});
		}

		Resize(com, fun) {
			com.width = com.Vlt.div.width();
			com.height = com.Vlt.div.height();
			com.aspect = 1 / (com.Vlt.div.height() / com.Vlt.div.width());
			var that = this;
			async.each(com.Vlt.views, function (item, next) {
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
			console.group(com.Vlt.rootID);
			async.forEach(com.Vlt.views, function (item, next) {
				that.send({ Cmd: "ShowHierarchy" }, item, (err, cmd) => {
					next();
				});
			}, function () {
				console.groupEnd(com.Vlt.rootID);
				fun(null, com);
			});
		}

		Drop(com, fun) {
			debugger;
		}
	}

	return {
		dispatch: View.prototype
	};

})();