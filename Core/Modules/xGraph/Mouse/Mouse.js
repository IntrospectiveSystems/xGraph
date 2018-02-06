//# sourceURL=Mouse
(
	/**
	 * The Mouse entity is the Apex and only entity of the Mouse Module.

	 * The main capability of this entity is to add a mouse (&keydown) listener to the canvas that is provided
	 * when the SetDomElement command is called. Currently MouseEnter, MouseLeave, Wheel, LeftMouseDown, 
	 * RightMouseDown, LeftMouseUp, RightMouseUp, and KeyDown events are captured.
	 */
	function Mouse() {

		let dispatch = {
			SetDomElement
		};

		return {
			dispatch
		};


		/**
		 * The only received command of the mouse module. SetDomElement provides the canvas (domElement) to 
		 * the mouse module. On this element it appends its event listeners.
		 * @param {Object} com 
		 * @param {Object} com.DomElement  	the canvas that the listeners should be appended to
		 * @param {Function=} fun 
		 */
		function SetDomElement(com, fun = _=>log.e(_)) {
			log.v('--Mouse/SetDomElement');
			if (!com.DomElement) {
				fun("No DOM Element provided in com (com.DomElement)", com);
				return;
			}

			let Vlt = this.Vlt;
			Vlt.domElement = ("length" in com.DomElement) ? com.DomElement : $(com.DomElement);

			//needed these to get the focus to work for keydown events
			Vlt.domElement.focus();
			Vlt.domElement.attr('tabindex', 0);

			//these are used to define action sequences in the Handler (generating) Modules.
			Vlt.Mouse = {};
			Vlt.Mouse.Mode = 'Idle';
			Vlt.Mouse.inPanel = true;
			domElement = Vlt.domElement

			domElement.on("mouseenter", "canvas", (evt) => {
				let info = {};
				info.Action = 'MouseEnter';
				this.send({ Cmd: "DispatchEvent", info: info, mouse: Vlt.Mouse }, this.Par.Handler);
				evt.preventDefault();
			});

			domElement.on("mouseleave", "canvas", (evt) => {
				let info = {};
				info.Action = 'MouseLeave';
				this.send({ Cmd: "DispatchEvent", info: info, mouse: Vlt.Mouse }, this.Par.Handler);
				evt.preventDefault();
			});

			domElement.on("wheel", "canvas", (evt) => {
				log.v("Handler ", this.Par.Handler.substr(30));
				let info = {};
				evt = evt.originalEvent;
				let fac = (evt.detail < 0 || evt.wheelDelta > 0) ? 1 : -1;
				info.Action = 'Wheel';
				info.Factor = fac;
				this.send({ Cmd: "DispatchEvent", info: info, mouse: Vlt.Mouse }, this.Par.Handler);
				evt.preventDefault();
			});

			domElement.on("mousedown", "canvas", (evt) => {
				log.v("Handler ", this.Par.Handler.substr(30));
				info = {};
				info.Mouse = {};
				info.Mouse.x = evt.clientX;
				info.Mouse.y = evt.clientY;
				switch (evt.which) {
					case 1:	// Left mouse
						info.Action = 'LeftMouseDown';
						break;
					case 3: // Right mouse
						info.Action = 'RightMouseDown';
						break;
					default:
						return;
				}
				this.send({ Cmd: "DispatchEvent", info: info, mouse: Vlt.Mouse }, this.Par.Handler);
				evt.preventDefault();
			});

			domElement.on("mousemove", "canvas", (evt) => {
				let info = {};
				info.Action = 'Move';
				info.Mouse = {};
				info.Mouse.x = evt.clientX;
				info.Mouse.y = evt.clientY;
				this.send({ Cmd: "DispatchEvent", info: info, mouse: Vlt.Mouse }, this.Par.Handler);
				evt.preventDefault();
			});
			
			domElement.on("mouseup", "canvas", (evt) => {
				let info = {};
				switch (evt.which) {
					case 1:	// Left mouse
						info.Action = 'LeftMouseUp';
						break;
					case 3: // Right mouse
						info.Action = 'RightMouseUp';
						break;
					default:
						return;
				}
				this.send({ Cmd: "DispatchEvent", info: info, mouse: Vlt.Mouse }, this.Par.Handler);
				evt.preventDefault();
			});

			domElement.on("keydown", (evt) => {
				let info = {};
				info.Action = 'KeyDown';
				info.CharKey = evt.key;
				this.send({ Cmd: "DispatchEvent", info: info, mouse: Vlt.Mouse }, this.Par.Handler);
				evt.preventDefault();
			});

			fun(null, com);
		}
	})();