//# sourceURL=ConsoleView.js
//jshint esversion: 6
(function ConsoleView() {

	let VM = 1;

	window.onerror = function (messageOrEvent, source, line, col, error) {
		console.error(messageOrEvent, source, line, col);
	};

	if (!window.createLog) window.createLog = function createLog(message, file, line, send) {
		let root = DIV('.log');
		let text = DIV('.message');
		text.css('white-space', 'pre');
		let source = DIV('.source');
		root.css('font-size', '12px');
		source.css('float', 'right');
		source.css('opacity', '0.7');
		source.css('text-decoration', 'underline');
		source.css('cursor', 'pointer');
		source.on('click', function (event) {

		});
		// source.css('border-bottom', '1px solid white');
		root.css('padding', '1px 8px');
		root.css('border-bottom', '1px solid var(--view-border-divider)');
		// TODO make this a link
		source.html(file + ':' + line);
		text.html(message);
		root.append(source);
		root.append(text);
		root.css('clear', 'both');

		return {
			root: root,
			text: text
		}
	}

	class ConsoleView {
		Setup(com, fun) {
			com.titleBarText = "Console";
			// console.log(com);
			window.ent = this;
			this.super(com, (err, cmd) => {
				var that = this;
				// debugger;

				this.Vlt.console = $(document.createElement('div'));
				this.Vlt.div.css('overflow-x','hidden');
				this.Vlt.div.css('overflow-y','scroll');
				this.Vlt.console.css('font-family', 'monospace');
				this.Vlt.input = $(document.createElement('input'));
				this.Vlt.input.css('width', '100%');
				this.Vlt.input.css('background-color', 'rgba(0,0,0,0)');
				this.Vlt.input.css('border', 'none');
				this.Vlt.input.css('outline', 'none');
				this.Vlt.input.css('margin-left', '8px');
				this.Vlt.input.css('color', 'var(--text)');
				this.Vlt.input.css('-webkit-text-fill-color', 'var(--text)');
				this.Vlt.input.css('font-family', 'monospace');
				this.Vlt.root.on('click', function () {
					$(that.Vlt.input).focus()
				});
				this.Vlt.input.on('keypress', function (event) {
					if (event.keyCode == 13) {
						let str = that.Vlt.input.val();
						that.Vlt.input.val("");
						console.log('' + str);
						eval("//# sourceURL=VM" + ("00000" + VM++).substr(-5, 5) + "\n" + str);
					}
				});

				that.Vlt.debug = 'logInConsole' in that.Par && that.Par.logInConsole;

				var log = console.log;
				var logerr = console.error;

				console.log = function () {
					if (that.Vlt.debug) log.apply(this, Array.prototype.slice.call(arguments));

					// derive the source
					let e = new Error().stack.toString().split('\n')[2];
					// debugger;
					e = e.substr(e.indexOf('(') + 1, e.indexOf(')') - e.indexOf('(') - 1).split(':');
					let source = e[0], line = e[1], column = e[2];
					// log.apply(this, ["SOURCE: " + source]);
					// log.apply(this, ["LINE:   " + line]);
					// log.apply(this, ["COLUMN: " + column]);

					//dispatch the internal logging event
					that.dispatch({
						Cmd: 'Log',
						Item: Array.prototype.slice.call(arguments),
						Source: source,
						Line: line
					}, (err, cmd) => { });
				};
				console.error = function (message, source, line, col) {
					// log.apply(this, Array.prototype.slice.call(arguments));

					//derive the source
					// debugger;
					// console.log(new Error().stack.toString());
					// let e = new Error().stack.toString().split('\n')[3];
					// debugger;
					// e = e.substr(e.indexOf('(') + 1, e.indexOf(')') - e.indexOf('(') - 1).split(':');
					// let source = e[0], line = e[1], column = e[2];
					// console.log("SOURCE: " + source);
					// console.log("LINE:   " + line);
					// console.log("COLUMN: " + column);

					// dispatch the internal logging event
					that.dispatch({
						Cmd: 'Error',
						Item: message,
						Source: source,
						Line: line
					}, (err, cmd) => { });
				};

				that.Vlt.console.append(that.Vlt.input);
				// ($($.parseHTML('<i class="fa fa-angle-double-right" aria-hidden="true"></i>'))).insertBefore(this.Vlt.input);

				fun(null, com);
			});
		}

		// timestamping in the future:
		// str = 'white:[' + new Date().toTimeString().split(' ')[0].replace(/:/g, '\\:') + ']\: ' + str;

		StringToHtmlEffects(com, fun) {
			let str = com.StrIn;
			let colors = {
				'white': '--white-text',
				'green': '--neon-6',
				'yellow': '--neon-7',
				'blue': '--neon-8',
				'pink': '--neon-9'
			};
			// let regex = new RegExp('(?=(' + Object.keys(colors).join('|') + '):)', 'g');
			let regex = new RegExp('(?=' + Object.keys(colors).join('|') + ')', 'g');
			let colorSplits = str.split(regex);
			let output = ''
			// debugger;
			for (let i in colorSplits) {
				let part = colorSplits[i];
				let color = part.lastIndexOf(':') < part.length - 1 ? null : part.substr(0, part.indexOf(':'));
				if (color != null) {
					part = '<span style="color: var(' + colors[color] + ')">' + part.substr(part.indexOf(':') + 1) + "</span>";
				}
				output += part;
			}
			// debugger;
			output = output.replace(/\\:/g, ':');
			com.StrOut = output;

			fun(null, com);
		}

		Log(com, fun) {
			let that = this;
			let str = com.Item.toString();

			that.dispatch({ Cmd: 'StringToHtmlEffects', StrIn: str }, (err, cmd) => {
				let message = cmd.StrOut;
				let logElement = createLog(message, com.Source, com.Line, that.send);
				// debugger;
				// com.Vlt.console.append(logElement.root);
				logElement.root.insertBefore(that.Vlt.input);
				that.Vlt.div[0].scrollTop = that.Vlt.div[0].scrollHeight;

				fun(null, com);
			});
		}

		Error(com, fun) {
			// debugger;
			let that = this;
			let str = com.Item.toString();


			this.dispatch({ Cmd: 'StringToHtmlEffects', StrIn: str }, (err, cmd) => {
				let message = cmd.StrOut;
				let logElement = createLog(message, com.Source, com.Line, that.send);

				logElement.root.insertBefore(this.Vlt.input);

				logElement.root.css('background-color', 'var(--error-background)');
				logElement.root.css('border-bottom', '1px solid var(--accent-error)');
				logElement.root.prev().css('border-bottom', '1px solid var(--accent-error)');

				logElement.text.css('color', 'var(--text-error)');
				this.Vlt.div[0].scrollTop = this.Vlt.div[0].scrollHeight;

				fun(null, com);
			});
		}

		Render(com, fun) {
			
			this.Vlt.div.append(this.Vlt.console);
			fun(null, com);
		}
	}

	return Viewify(ConsoleView);

})();