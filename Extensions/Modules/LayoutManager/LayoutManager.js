//# sourceURL=LayoutManager.js
//jshint esversion: 6
(function LayoutManager() {

	let emptyImage;

	class LayoutManager {

		Start(com, fun) {
			// debugger;
			this.Vlt.selected = "";
			let emptyImage;
			emptyImage = IMG('http://placehold.it/1x1');
			emptyImage.css('position', 'fixed');
			emptyImage.css('left', '-100px');
			emptyImage.css('top', '-100px');
			$(document.body).append(emptyImage);
			emptyImage = emptyImage[0];

			
			console.log('Layout:Start:');
			let that = this;
			// this.Vlt.ipcRenderer = require('electron').ipcRenderer;
			// debugger;
			let StartArray = [];

			console.log('SERVER PID: ', this.Par);

			$(document.body).on('keydown', function (event) {
				if (event.keyCode == 116) location.href = location.href;
				if (event.keyCode == 112) location.href = 'http://localhost:8081/ProjectSelect';
				if (event.keyCode == 113) location.href = 'http://localhost:8081/Main';
				if (event.keyCode == 114) that.send({ Cmd: 'SetLayout', Layout: 'Default' }, '$Manager', () => { });
				if (event.keyCode == 115) that.send({ Cmd: 'SetLayout', Layout: 'System' }, '$Manager', () => { });
				if (event.keyCode == 123) that.Vlt.ipcRenderer.send('asynchronous-message', "devtools");
				// if (event.keyCode == 123) console.log('AHHHHHHHHHH');


			});

			// debugger;
			// if (that.Par.Children) {
			// 	this.dispatch({ Cmd: 'changeLayout', Layout: that.Par.Children}, (err, cmd) => {
			// 		fun(null, com);
			// 	});
			// }
			// debugger;
			if (that.Par.Manager) {
				that.genEntity({
					Entity: that.Par.Manager,
					$Browser: "Manager",
					$Start: "Start"
				}, () => { });
			}

			if (that.Par.Window) {
				let layout = fs.readFileSync(path.join(__Config.Work, 'Windows', that.Par.Window));
				// debugger;
				that.dispatch({
					Cmd: "SetLayout",
					Layout: JSON.parse(layout.toString())
				}, (err, cmd) => {
					// fun(err, com);
				});
			}
			this.Vlt.currentFocus = null;

			$(document.body).on('click', 'div', function (event) {
				let elem = $(this);
				while (elem.attr('viewpid') == null && elem[0].nodeName != "BODY") {
					elem = elem.parent();
					//debugger;
				}

				if (elem.attr('viewpid') == undefined) {
					// error????
					return;
				}

				let pid = elem.attr('viewpid');

				if (pid !== that.Vlt.currentFocus) {
					blurOld();
				}

				function blurOld() {
					that.send({ Cmd: 'Blur' }, that.Vlt.currentFocus, focusNew);
				}

				function focusNew() {
					that.send({ Cmd: 'Focus' }, pid, getFocusedType);
				}

				function getFocusedType() {
					that.Vlt.currentFocus = pid;
					// debugger;
					that.send({ Cmd: 'GetType' }, pid, logFocusChange);
				}

				function logFocusChange(err, com) {
					console.log('focused on ' + pid.substr(24) + ": " + com.Type);
				}

				//TODO send blur to previous focus, send focus to current focus

				// alert();
				//event.bubbles = false;
				event.stopPropagation();
			});



			// debugger;
			fun(null, com);
		}

		/// com.Data
		/// com.Datatype
		Select(com, fun) {
			this.Vlt.selected = com.Data;
			this.Vlt.type = com.Datatype;
			// debugger;
			this.dispatch({ Cmd: 'DispatchSelectionChanged', Src: com.Passport.From }, this.Par.Pid, () => { });
			fun(null, com);
		}

		/// com.Pid - who to subscribe
		/// * Defaults to passport from pid
		/// com.Cmd - Cmd to send to Pid
		/// * Defaults to SelectionChanged
		SubscribeToSelection(com, fun) {
			if (!('SelectionChangedSubscribers' in this.Vlt))
				this.Vlt.SelectionChangedSubscribers = {};
			this.Vlt.SelectionChangedSubscribers[com.Pid || com.Passport.From] = com.Command || "SelectionChanged";
			fun(null, com);
		}

		DispatchSelectionChanged(com, fun) {
			let that = this;


			async.forEachOf(this.Vlt.SelectionChangedSubscribers, function (val, key, next) {
				// debugger;
				that.send({
					Cmd: val,
					Datatype: that.Vlt.type,
					Data: that.Vlt.selected,
					Src: com.Src
				}, key, (err, cmd) => {
					next();
				});
			}, (err) => {
				fun(err, com);
			});


		}



		AttachDragListener(com, fun) {
			let that = this;
			let root = com.To;
			let data = com.Data;
			let datatype = com.Datatype;
			// debugger;
			$(root).attr('draggable', 'true');
			let createDragDom = com.CreateDragDom || function() {
				div = $(document.createElement('div'));
				div.css('width', '200px');
				div.css('height', '200px');
				div.css('background-color', 'teal');
				return div;
			};

			let div;
			root.addEventListener('dragstart', function (evt) {
				// debugger;
				console.log(evt.dataTransfer.setDragImage(emptyImage, 0, 0));
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

		Popup(com, fun) {
			__Nexus.genModule(com.Layout, (err, pid) => {
				let popup = DIV();
				popup.draggable();
				//popup.css('width', (com.Width || 800) + 'px');
				//popup.css('height', (com.Height || 600) + 'px');
				popup.css('background-color', 'white');
				popup.css('position', 'fixed');
				popup.css('border-radius', '3px');
				popup.css('box-shadow', 'rgba(0, 0, 0, 0.698039) 0px 5px 17px');
				popup.css('top', (($(document.body).height() / 2) - 150) + 'px');
				popup.css('left', (($(document.body).width() / 2) - 200) + 'px');

				if('Resizable' in com && com.Resizable) {
					//make it Resizable somehow idk
					// TODO - - - - - - - - - - - - -
				}

				document.body.appendChild(popup[0]);

				this.send({
					Cmd: 'Start'
				}, pid, (err, cmd) => {
					this.send({
						Cmd: 'UpdateUI'
					}, pid, (err, cmd) => {
						this.send({
							Cmd: 'DOMLoaded'
						}, pid, (err, cmd) => {
							this.send({
								Cmd: 'GetViewRoot'
							}, pid, (err, cmd) => {
								// debugger;
								popup.append(cmd.Div);
							});
						});
					});
				});

			});
		}

	}

	return {
		dispatch: LayoutManager.prototype
	}

})();