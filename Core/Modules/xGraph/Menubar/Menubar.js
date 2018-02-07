(function Menubar() {
	class MenuBar {
		Setup(com, fun) {
			// Heres the run down:
			// Buttons is [] of {} with To, Group, Option, and
			// Command. in Group, <Group> there is a button
			// named <Option> that when clicked will send command
			// <Command> to Pid <To>
			// Hotkey modifiers Guide: ^shift, /alt, ~ctrl, #meta

			this.Vlt.disableTitleBar = true;
			this.super(com, (err, cmd) => {
				this.Vlt.groups = [];
				this.Vlt.hotkeys = {};

				if ('Buttons' in this.Par) {
					for (let i = 0; i < this.Par.Buttons.length; i++) {
						let obj = this.Par.Buttons[i];
						this.dispatch({
							Cmd: "AddMenuItem",
							To: obj.To,
							Group: obj.Group,
							Option: obj.Option,
							OnClick: obj.Command,
							Hotkey: 'Hotkey' in obj ? obj.Hotkey.split('').sort().join('') : undefined
						}, () => { });
					}
				}
				if (!('viewDivs' in this.Vlt)) debugger;
				let that = this;
				this.Vlt.menubarHeight = 30;
				this.Vlt.bar = DIV();
				this.Vlt.bar.addClass('menubar');

				{ // superstyles
					this.super({
						Cmd: "Style",
						Selector: '.menubar',
						Rules: {
							'height': '' + (that.Vlt.menubarHeight) + 'px',
							'border-bottom': '1px solid var(--view-border-color-light)',
							'padding-left': '5px',
							'color': 'var(--white-text)',
							'background-color': 'var(--view-lighter)',
							'box-sizing': 'border-box'
						}
					}, () => { });
					this.super({
						Cmd: "Style",
						Selector: '.groupButton',
						Rules: {
							'cursor': 'pointer',
							'transition': 'border 200ms, background-color 200ms',
							'outline': 'none',
							'display': 'inline-block',
							'padding': '0px 8px',
							'height': '100%',
							'line-height': '' + that.Vlt.menubarHeight + 'px'
						}
					}, () => { });
					this.super({
						Cmd: "Style",
						Selector: '.groupButton:hover',
						Rules: {
							'background-color': 'var(--view-border-color-light)'
						}
					}, () => { });
					this.super({
						Cmd: "Style",
						Selector: '.groupButton.focus',
						Rules: {
							'background-color': 'var(--accent-color)',
							'color': 'var(--accent-text)'
						}
					}, () => { });
					this.super({
						Cmd: "Style",
						Selector: '.optionsPanel',
						Rules: {
							'display': 'none',
							'min-width': '150px',
							'position': 'fixed',
							'top': '29px',
							'padding': '5px 0px',
							'background-color': 'var(--view-color)',
							'border': '1px solid var(--view-border-color)',
							'z-index': '100',
							'color': 'var(--text)'
						}
					}, () => { });
					this.super({
						Cmd: "Style",
						Selector: '.optionButton',
						Rules: {
							'display': 'block',
							'padding': '4px 12px',
							'transition': 'padding-left 300ms'
						}
					}, () => { });
					this.super({
						Cmd: "Style",
						Selector: '.groupButton.focus > .optionsPanel',
						Rules: {
                            'display': 'block',
							'margin-left': '-9px'
                        }
					}, () => { });
					this.super({
						Cmd: "Style",
						Selector: '.optionButton:hover, .optionButton.focus',
						Rules: {
							'background-color': 'var(--accent-color)',
							'color': 'var(--accent-text)',
							'padding-left': '16px'
						}
					}, () => { });
				}

				this.Vlt.keys = "";
				let keys = that.Vlt.keys;
				window.onkeydown = (e) => {
					if (!e) e = window.event;
					if (e.shiftKey) {if (keys.indexOf('^') == -1) keys += '^';}
					else keys = keys.replace('^', '');
					if (e.altKey) {  if (keys.indexOf('/') == -1) keys += '/';}
					else keys = keys.replace('/', '');
					if (e.ctrlKey) { if (keys.indexOf('~') == -1) keys += '~';}
					else keys = keys.replace('~', '');
					if (e.metaKey) { if (keys.indexOf('#') == -1) keys += '#';}
					else keys = keys.replace('#', '');



					let char = String.fromCharCode(e.charCode || e.which);
					if (char.match(/[A-Za-z0-9]/) !== null) if (keys.indexOf(char) == -1) keys += char;
					keys = keys.split('').sort().join('');
					if (keys in that.Vlt.hotkeys) {
						that.Vlt.hotkeys[keys]();
					}

				};
				window.onkeyup = (e) => {
					let char = String.fromCharCode(e.charCode || e.which);
					if (char.match(/[A-Za-z0-9]/) !== null) keys = keys.replace(char, '');

					keys = keys.split('').sort().join('');
				};

				that.Vlt.contentHolder = DIV();
				that.Vlt.contentHolder.css('height', 'calc(100% - ' + (that.Vlt.menubarHeight) + 'px)');
				that.Vlt.contentHolder.css('box-sizing', 'border-box');


				that.dispatch({ Cmd: 'Reconstruct' });

				that.Vlt.currentFocus = null;

				that.Vlt.div.on('click', '.groupButton', function () {

					let clickedFocus = (that.Vlt.currentFocus != null && '0' in that.Vlt.currentFocus ? this == that.Vlt.currentFocus[0] : false);

					if (clickedFocus) {
						that.Vlt.currentFocus.removeClass('focus');
						that.Vlt.currentFocus = null;
						return;
					}

					if (that.Vlt.currentFocus != null)
						that.Vlt.currentFocus.removeClass('focus');

					$(this).addClass('focus');
					that.Vlt.currentFocus = $(this);
				});
				that.Vlt.div.on('mouseover', '.groupButton', function () {
					if (that.Vlt.currentFocus != null) {
						that.Vlt.currentFocus.removeClass('focus');
						$(this).addClass('focus');
						that.Vlt.currentFocus = $(this);
					}
				});

				fun(null, com);

			});
		}
		Start(com, fun) {
			this.super(com, (err, cmd) => {
				fun(null, com);
			});
		}
		/// add menu item will not iteself reconstruct the menu bar,
		/// however, if you do not continue to add more items or signal
		/// you are finished, a timeout will be called after 2 seconds
		/// and automatically reconstruct the bar.

		/**
		 * @description Adds a button to the menubar named com.Option,
		 * in the group of buttons: com.Group. When clicked (or hotkey pressed)
		 * A message with Cmd: com.Command will be sent to the Pid: com.To
		 * 
		 * Optionally, to assign a hotkey, provide the key combination
		 * in com.Hotkey.
		 * 
		 * for example, control + N is represented as '~n'
		 * 
		 * modifiers are as follows:
		 * 
		 * ctrl: ~
		 * alt: /
		 * shift: ^
		 * meta (windows key / command key): #
		 * 
		 * @param {object} com 
		 * @param {string} com.Group
		 * @param {string} com.Option
		 * @param {string} com.Command
		 * @param {string} com.To
		 * @param {string=} com.Hotkey
		 * @param {any} fun 
		 * @memberof MenuBar
		 */
		AddMenuItem(com, fun) {
			let vlt = this.Vlt;
			let group = com.Group;
			let option = com.Option;
			let onclick;
			if (typeof com.OnClick == 'string') {
				onclick = function() {
					that.send({ Cmd: com.OnClick}, com.To, () => {});
				};
			}else {
				onclick = com.OnClick;
			}
			let that = this;
			let groupobj = getGroup(group);
			if (groupobj === null) {
				groupobj = createGroup(group);
			}
			let optionobj = getOption(groupobj, option);
			if (optionobj === null) {
				optionobj = createOption(groupobj, option);
			}
			optionobj.onclick = onclick;
			if ('Hotkey' in com) this.Vlt.hotkeys[com.Hotkey] = onclick;

			if (!!vlt.updateCallback && vlt.updateCallback !== null) clearTimeout(vlt.updateCallback);
			vlt.updateCallback = setTimeout(() => {
				this.dispatch({
					Cmd: "Reconstruct"
				}, () => { });
			}, 2000);

			fun(null, com);

			function createOption(groupobj, option) {
				let optionobj = { name: option, onclick: null };
				groupobj.options.push(optionobj);
				return optionobj;
			}
			function getOption(groupobj, option) {
				for (let i = 0; i < groupobj.options.length; i++) {
					if (groupobj.options[i].name === option) return groupobj.options[i];
				}
				return null;
			}
			function createGroup(name) {
				let groupobj = { name: name, options: [] };
				vlt.groups.push(groupobj);
				return groupobj;
			}
			function getGroup(group) {
				for (let i = 0; i < vlt.groups.length; i++) {
					if (vlt.groups[i].name === group) return vlt.groups[i];
				}
				return null;
			}
		}
		/**
		 * @description Reloads the DOM based on new Buttons. If not called
		 * manually, this will always get called 2 seconds after an
		 * add menu item call.
		 * @param {any} com 
		 * @param {any} fun 
		 * @memberof MenuBar
		 */
		Reconstruct(com, fun) {
			if (!!this.Vlt.updateCallback && this.Vlt.updateCallback !== null) clearTimeout(this.Vlt.updateCallback);
			this.Vlt.bar.html('');
			let groupButtons = $();
			for (let i = 0; i < this.Vlt.groups.length; i++) {
				let group = this.Vlt.groups[i];
				let groupButton = DIV('groupButton');
				groupButton.html(group.name);
				groupButtons = groupButtons.add(groupButton);
				groupButton.attr('tabindex', '0');
				let panel = DIV('optionsPanel');
				for (let j = 0; j < group.options.length; j++) {
					let option = group.options[j];
					let button = DIV('optionButton');
					button.html(option.name);
					button.on('click', option.onclick);
					panel.append(button);
				}
				groupButton.append(panel);
				this.Vlt.bar.append(groupButton);
			}

		}
		/**
		 * @description 
		 * @param {any} com 
		 * @param {any} fun 
		 * @memberof MenuBar
		 */
		Render(com, fun) {
			this.Vlt.div.append(this.Vlt.bar);
			if (this.Vlt.viewDivs.length > 0) {
				this.Vlt.contentHolder.children().detach();
				this.Vlt.contentHolder.append(this.Vlt.viewDivs[0])
				this.Vlt.div.append(this.Vlt.contentHolder);
			}
			this.super(com, (err, cmd) => {
				fun(null, com);
			});
		}
		Blur(com, fun) {
			com.super(com, (err, cmd) => {
				if (com.Vlt.currentFocus != null) {
					com.Vlt.currentFocus.removeClass('focus');
					com.Vlt.currentFocus = null;
				}
				fun(null, com);
			});

		}
	}

	return Viewify(MenuBar);

})();