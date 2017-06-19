//# sourceURL=Menubar.js
//jshint esversion: 6
(function Menubar() {
	class MenuBar {
		Setup(com, fun) {
			com.Vlt.groups = [];
			com.Vlt.hotkeys = {};
			//console.time("MenuBar");
			window.MenubarVlt = com.Vlt;
			// we use super here as opposed to bubble because
			// the only difference between bubble and super,
			// is that super can be passed params in its com.
			// bubble simply blindly bubbles the command up
			// the mod chain
			// ************************************************
			// future Marcus here, Past marcus was dumb. really
			// dumb. see, none of this works like that anymore.
			// bubble and super were basically the same thing,
			// so in the new marxy based system of inheritance,
			// super takes care of everything, and dispatch
			// sends a command back to the marxy, essentially
			// looping it back to here, but refreshing its com 
			// vault par, and all other atrocities to make
			// this system work.
			//
			// Have fun,
			//                         A N D   G O O D   L U C K
			com.disableTitleBar = true;

			if('Buttons' in com.Par) {
				for(let i =0; i < com.Par.Buttons.length; i ++) {
					let obj = com.Par.Buttons[i];
					com.dispatch({
						Cmd: "AddMenuItem",
						To: obj.To,
						Group: obj.Group,
						Option: obj.Option,
						OnClick: obj.Command
					}, () => {});
				}
			}

			// console.log('HEY JUST SO YOU KNOW, MENUBAR START IS A THING');
			com.super(com, (err, cmd) => {
				// console.log('AND WE CALLED ITS SUPER');
				// console.log('DO WE HAVE A VIEWDIVS? ' + ('viewDivs' in com.Vlt));
				if (!('viewDivs' in com.Vlt)) debugger;
				let that = this;
				com.Vlt.menubarHeight = 30;
				com.Vlt.bar = DIV();
				// com.Vlt.bar.css('border-bottom', '2px solid rgb(156, 156, 142)');
				// com.Vlt.bar.css('padding-top', '2px');
				com.Vlt.bar.addClass('menubar');

				{ // superstyles
					com.super({
						Cmd: "Style",
						Selector: '.menubar',
						Rules: {
							//'font-family': 'monospace',
							'height': '' + (com.Vlt.menubarHeight) + 'px',
							// 'line-height': '' + (com.Vlt.menubarHeight) + 'px',
							'border-bottom': '1px solid var(--view-border-color-light)',
							'padding-left': '5px',
							'color': 'var(--white-text)',
							'background-color': 'var(--view-lighter)',
							'box-sizing': 'border-box'
						}
					}, () => { });
					com.super({
						Cmd: "Style",
						Selector: '.groupButton',
						Rules: {
							'cursor': 'pointer',
							// 'border': '1px solid rgba(0, 0, 0, 0)',
							// 'margin-top': '1px',
							// 'margin-right': '2px',
							'transition': 'border 200ms, background-color 200ms',
							'outline': 'none',
							'display': 'inline-block',
							'padding': '0px 8px',
							'height': '100%',
							'line-height': '' + com.Vlt.menubarHeight + 'px'
							// 'padding-left': '4px'
						}
					}, () => { });
					com.super({
						Cmd: "Style",
						Selector: '.groupButton:hover',
						Rules: {
							'background-color': 'var(--view-border-color-light)'
							// 'border': '1px solid var(--view-border-color)'
						}
					}, () => { });
					com.super({
						Cmd: "Style",
						Selector: '.groupButton.focus',
						Rules: {
							'background-color': 'var(--accent-color)',
							'color': 'var(--accent-text)'
							// 'border': '1px solid var(--accent-color)'
						}
					}, () => { });
					com.super({
						Cmd: "Style",
						Selector: '.optionsPanel',
						Rules: {
							'display': 'none',
							'min-width': '150px',
							'position': 'fixed',
							//'left': '94px',
							'top': '29px',
							'padding': '5px 0px',
							'background-color': 'var(--view-color)',
							'border': '1px solid var(--view-border-color)',
							'z-index': '100',
							'color': 'var(--text)'
						}
					}, () => { });
					com.super({
						Cmd: "Style",
						Selector: '.optionButton',
						Rules: {
							'display': 'block',
							'padding': '4px 12px',
							'transition': 'padding-left 300ms'
						}
					}, () => { });
					com.super({
						Cmd: "Style",
						Selector: '.groupButton.focus > .optionsPanel',
						Rules: {
                            'display': 'block',
							'margin-left': '-9px'
                        }
					}, () => { });
					com.super({
						Cmd: "Style",
						Selector: '.optionButton:hover, .optionButton.focus',
						Rules: {
							'background-color': 'var(--accent-color)',
							'color': 'var(--accent-text)',
							'padding-left': '16px'
						}
					}, () => { });
				}

				com.Vlt.keys = "";
				let keys = com.Vlt.keys;
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
					//console.log(keys);
					if (keys in com.Vlt.hotkeys) {
						com.Vlt.hotkeys[keys]();
					}

				};
				window.onkeyup = (e) => {
					let char = String.fromCharCode(e.charCode || e.which);
					//console.log('');
					if (char.match(/[A-Za-z0-9]/) !== null) keys = keys.replace(char, '');

					keys = keys.split('').sort().join('');
					//console.log(keys);
				};

				com.Vlt.contentHolder = DIV();
				com.Vlt.contentHolder.css('height', 'calc(100% - ' + (com.Vlt.menubarHeight) + 'px)');
				com.Vlt.contentHolder.css('box-sizing', 'border-box');
				// this.super({
				// 	Cmd: "Append",
				// 	Divs: [
				// 		// com.Vlt.styles,
				// 		com.Vlt.bar,
				// 		com.Vlt.contentHolder
				// 	]
				// }, () => { });

				com.dispatch({ Cmd: 'Reconstruct' });

				com.Vlt.currentFocus = null;

				com.Vlt.div.on('click', '.groupButton', function () {
					//console.log('');
					//console.log('Menu Button Clicked');

					let clickedFocus = (com.Vlt.currentFocus != null && '0' in com.Vlt.currentFocus ? this == com.Vlt.currentFocus[0] : false);

					//console.log('Current Focus: ' + com.Vlt.currentFocus);
					//console.log('Clicked Focused? ' + clickedFocus);

					if (clickedFocus) {
						com.Vlt.currentFocus.removeClass('focus');
						com.Vlt.currentFocus = null;
						return;
					}

					if (com.Vlt.currentFocus != null)
						com.Vlt.currentFocus.removeClass('focus');

					$(this).addClass('focus');
					com.Vlt.currentFocus = $(this);

					// } else {
					// 	com.Vlt.currentFocus = null;
					// 	$(this).removeClass('focus');
					// }
				});
				com.Vlt.div.on('mouseover', '.groupButton', function () {
					if (com.Vlt.currentFocus != null) {
						//console.log('Moved');
						com.Vlt.currentFocus.removeClass('focus');
						$(this).addClass('focus');
						com.Vlt.currentFocus = $(this);
					}
				});

				//console.timeEnd("MenuBar");
				fun(null, com);

			});
		}
		/// add menu item will not iteself reconstruct the menu bar,
		/// however, if you do not continue to add more items or signal
		/// you are finished, a timeout will be called after 2 seconds
		/// and automatically reconstruct the bar.
		AddMenuItem(com, fun) {
			let vlt = com.Vlt;
			let group = com.Group;
			let option = com.Option;
			let onclick;
			// debugger;
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
			if('Hotkey' in com) com.Vlt.hotkeys[com.Hotkey] = onclick;

			if (!!vlt.updateCallback && vlt.updateCallback !== null) clearTimeout(vlt.updateCallback);
			vlt.updateCallback = setTimeout(() => {
				com.dispatch({
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
		Reconstruct(com, fun) {
			if (!!com.Vlt.updateCallback && com.Vlt.updateCallback !== null) clearTimeout(com.Vlt.updateCallback);
			com.Vlt.bar.html('');
			let groupButtons = $();
			for (let i = 0; i < com.Vlt.groups.length; i++) {
				let group = com.Vlt.groups[i];
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
				com.Vlt.bar.append(groupButton);
			}

		}
		UpdateUI(com, fun) {
			com.Vlt.div.append(com.Vlt.bar);
			if (com.Vlt.viewDivs.length > 0) {
				com.Vlt.contentHolder.children().detach();
				com.Vlt.contentHolder.append(com.Vlt.viewDivs[0])
				com.Vlt.div.append(com.Vlt.contentHolder);
			}
			fun(null, com);
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

	return {
		extends: "Home:Views/View",
		dispatch: MenuBar.prototype
	};

})();