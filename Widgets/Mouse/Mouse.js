//# sourceURL=Mouse
(function Mouse() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		SetDomElement:SetDomElement
	};

	return {
		dispatch: dispatch
	};

	//-----------------------------------------------------Start
	function SetDomElement(com, fun) {
		console.log('--Mouse/SetDomElement');
		let Vlt = this.Vlt;
		Vlt.domElement = $(com.DomElement);
		
		//needed these to get the focus to work for keydown events
		Vlt.domElement.focus();
		Vlt.domElement.attr('tabindex', 0);

		Vlt.Active = false;
		Vlt.Mouse = {};
		Vlt.Mouse.Mode = 'Idle';
		Vlt.Mouse.inPanel = true;
		domElement = Vlt.domElement

		domElement.on("mouseenter",(evt) => {
		});
		domElement.on("mouseleave", (evt) => {
			let info = {};			
			info.Action = 'MouseLeave';
			this.send({Cmd:"DispatchEvent", info:info, mouse:Vlt.Mouse}, this.Par.Handler);
			evt.stopPropagation();
			evt.returnValue = false;
		});
		domElement.on("wheel", (evt) =>{
			let info = {};
			evt = evt.originalEvent;
			let fac = (evt.detail < 0 || evt.wheelDelta > 0) ? 1 : -1;
			info.Action = 'Wheel';
			info.Factor = fac;
			this.send({Cmd:"DispatchEvent", info:info, mouse:Vlt.Mouse}, this.Par.Handler);
			evt.stopPropagation();
			evt.returnValue = false;
		});
		domElement.on("mousedown", (evt) => {
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
					console.log("mousedown which");
					return;
			}
			this.send({Cmd:"DispatchEvent", info:info, mouse:Vlt.Mouse}, this.Par.Handler);
			evt.stopPropagation();
			evt.returnValue = false;
		});
		domElement.on("mousemove", (evt) =>{
			let info = {};			
			info.Action = 'Move';
			info.Mouse = {};
			info.Mouse.x = evt.clientX;
			info.Mouse.y = evt.clientY;
			this.send({Cmd:"DispatchEvent", info:info, mouse:Vlt.Mouse}, this.Par.Handler);
			evt.stopPropagation();
			evt.returnValue = false;
		});
		domElement.on("mouseup", (evt) => {
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
			this.send({Cmd:"DispatchEvent", info:info, mouse:Vlt.Mouse}, this.Par.Handler);
			evt.stopPropagation();
			evt.returnValue = false;
		});
		domElement.on("keydown", (evt) =>{
			let info = {};			
			info.Action = 'keydown';
			info.Key = evt.key;
			this.send({Cmd:"DispatchEvent", info:info, mouse:Vlt.Mouse}, this.Par.Handler);
		});
	}
})();