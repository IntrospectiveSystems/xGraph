//# sourceURL=Viewify.js
// debugger;
// DIV, IMG, and STYLE are shorthand for making elements, wrapped in jquery

/* ********************************************************************************
	Setup core Viewify functionality. The following functions are attached to the
	window so that they can be used by the View modules.
	These functions are:
		window.DIV
		window.STYLE
		window.EmptyImage
		window.IMG
		window.Viewify

 */

/*  window.DIV creates and returns a <div> element. window.DIV accepts a selector parameter. selector
	may	be a single class as a String, or an array of classes and Ids, with the proper
	selector symbols (.forClass or #forId)
*/
if (window.DIV == undefined) window.DIV = function DIV(selector) {
	let elem = $(document.createElement('div'));

	if (selector) {
		if (selectorish.search(/[#\.]/) == -1) {
			elem.addClass(selector);
			return elem;
		}
		let params = selector.split(/(?=\.)/g);
		for (let i in params) {
			if (params[i].startsWith('#')) elem.attr('id', params[i].substr(1));
			else if (params[i].startsWith('.')) elem.addClass(params[i].substr(1));
		}
	}
	return elem;
};


/*
	window.STYLE creates and returns a <style> element.
 */
if (window.STYLE == undefined) window.STYLE = function STYLE() {
	return $(document.createElement('style'));
};


/*
	window.emptyImage creates an returns an empty <img> element. Used to set a
	placeholder image for empty images.
 */
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


/*
	window.IMG creates and returns an <img> element. window.IMG accepts a
	width, height, and src parameter.
 */
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

/*
	$Obj.cssVar takes a CSS Variable String and converts it to an integer representation. This is necessary
	 for applications that use three.js or pixi.js, and may be useful for other graphical libraries.
 */
$.fn.extend({
	cssVar: function (name) {

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

/*
	window.Viewify holds the main Viewify function. window.Viewify accepts a parameter
	_class. _class can either be a JavaScript Class Prototype or a dispatch table representing
	the View module subclass.
 */
if (!window.Viewify) window.Viewify = function Viewify(_class) {

	// set the child or subclass View, by setting it's dispatch table or prototype
	let child = typeof _class == 'function' ? _class.prototype : _class;

	// The View base class
	class View {

        //-----------------------------------------------------Setup
		/*
			Setup the new View. Pass base class context to the child class.
			Creates a new <div> to hold the View, with a titlebar <div>.
			Set base styles.
			Save everything to this.Vlt.

		 */
		Setup(com, fun) {
			console.time('View');

			// build view
			let vlt = this.Vlt;
			vlt.titleBarHeight = 20;
			vlt.type = "view";
			vlt.rootID = '#' + this.Par.Pid.substr(24) + "-Root";
			vlt.views = [];
			vlt.div = DIV("#Z" + this.Par.Pid.substr(24));
			vlt.root = DIV(vlt.rootID);
			vlt.root.data('ent', this);
			vlt.root.attr('viewPid', this.Par.Pid);
			vlt.styletag = STYLE();
			vlt.titleBar = DIV('.titlebar');
			this.Vlt.disableTitleBar = this.Vlt.disableTitleBar || true;
			vlt.titleBar.text(this.titleBarText);

			// set base styles
			vlt.root.css('height', '100%');
			vlt.root.css('display', 'block');
			vlt.root.css('box-sizing', 'border-box');
			vlt.root.css('overflow', 'hidden');

			vlt.div.css('height', 'calc(100% - ' + (vlt.titleBarHeight + 1) + 'px)');
			vlt.div.css('display', 'block');
			vlt.div.css('position', 'relative');
			vlt.div.css('box-sizing', 'border-box');
			vlt.div.css('overflow', 'hidden');

			// setup title bar
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

			// set the view color from CSS Variables
			this.dispatch({
				Cmd: 'SetColor',
				Value: "var(--view-color)"
			}, () => { });

			// set view name and append everything to the root
			vlt.name = com.Name || this.Par.Name || "Untitled View";
			vlt.root.append(vlt.styletag);
			vlt.root.append(vlt.titleBar);
			vlt.root.append(vlt.div);

			vlt.viewDivs = [];

			// check to see if title bar should be disabled and do so
			if (vlt.disableTitleBar) {
				vlt.div.css('height', '100%');
				vlt.titleBar.detach();
			}

			console.timeEnd('View');

			fun(null, com);
		}

		//-----------------------------------------------------GetViewRoot
		/*
			GetViewRoot saves the Root <div> of the View in com.Div.
		 */
		GetViewRoot(com, fun) {
			com.Div = this.Vlt.root;
			fun(null, com);
		}

		//-----------------------------------------------------GetViewDiv
		/*
			GetViewDiv saves the View's main <div> in com.Div.
		 */
		GetViewDiv(com, fun) {
			com.Div = this.Vlt.div;
			fun(null, com);
		}


        //-----------------------------------------------------Style
		/*
			Style adds styles to this View and it's children (by cascade).
			Style expects a command with the following parameters:
				com.Selector: A string CSS selector for the styles.
				- for one style only -
				com.Rule: A CSS property
				com.Value: A CSS value for the defined property
				- for multiple styles -
				com.Rules: An object with CSS properties as keys and CSS values as values.
		 */
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

        //-----------------------------------------------------DisableTitleBar
		/*
			DisableTitleBar detaches the View's title bar and sets disableTitleBar flag to true.
		 */
		DisableTitleBar(com, fun) {
			this.Vlt.titleBar.detach();
			this.Vlt.disableTitleBar = true;
            fun(null, com);
		}

        //-----------------------------------------------------Clear
		/*
			Clear detaches all children from the View's <div>, then detach the View's <div>
			from it's root, then re-attach the View's title bar and the View's <div>.
		 */
		Clear(com, fun) {
			this.Vlt.div.children().detach();
			this.Vlt.root.children().detach();
			this.Vlt.root.append(this.Vlt.styletag);
			if (!this.Vlt.disableTitleBar) this.Vlt.root.append(this.titleBar);
			this.Vlt.root.append(this.Vlt.div);
			fun(null, com);
		}

        //-----------------------------------------------------SetColor
		/*
			SetColor sets border color and background color. SetColor expects a command with
			 parameters com.Border for the border color, and com.Value or com.Color for the
			 background color. If a border color is not provided, SetColor sets the border to
			 the same color as the background. SetColor saves the background color to this.Vlt._color.
		 */
		SetColor(com, fun) {
			let value = com.Value || com.Color;
			let border = com.Border || value;
			this.Vlt._color = value;
			this.Vlt.root.css('background-color', value);
			// this.Vlt.root.css('border', '1px solid ' + border);
			fun(null, com);
		}

        //-----------------------------------------------------SetView
		/*
			SetView expects a command with the parameter com.View as a View's PID. SetView
			 adds com.View to this.Vlt.views as an array. Then SetView Renders the views.
		 */
		SetView(com, fun) {
			let that = this;
			this.Vlt.views = [com.View];
			this.send({ Cmd: 'GetViewRoot' }, com.View, (err, cmd) => {
				that.Vlt.viewDivs = [cmd.Div];
				// debugger;
				com.dispatch({ Cmd: 'Render' }, (err, cmd) => { fun(null, com) });
			});
		}

        //-----------------------------------------------------AddView
		/*
			AddView expects a command with the parameter this.View as a View's PID.
			 AddView adds com.View to the this.Vlt.views array. Then the View's root is added
			 to the this.Vlt.viewDivs array. Then Render the views.
		 */
		AddView(com, fun) {

			let that = this;
			let vlt = this.Vlt;
			if (!('views' in vlt)) vlt.views = [];
			vlt.views.push(com.View);
			this.send({ Cmd: 'GetViewRoot' }, com.View, (err, cmd) => {
				vlt.viewDivs.push(cmd.Div);
				this.dispatch({ Cmd: 'Render' }, (err, cmd) => { fun(null, com) });
			});
		}

        //-----------------------------------------------------InsertView
		/*
			InsertView expects a command with the parameters com.Index as the current
			 index of the View and com.View as the PID of the view to insert. The View
			 is removed from this.Vlt.views at the index. Then View's root is retrieved,
			 and the View is inserted into this.Vlt.viewDivs at the index, and then the
			 views are Rendered.

		 */
		InsertView(com, fun) {
			let that = this;
			let vlt = this.Vlt;
			this.Vlt.views.splice(com.Index, 0, com.View);
			this.send({ Cmd: 'GetViewRoot' }, com.View, (err, cmd) => {
				vlt.viewDivs.splice(com.Index, 0, cmd.Div);
				this.dispatch({ Cmd: 'Render' }, (err, cmd) => { fun(null, com) });
			});
		}

        //-----------------------------------------------------SetviewDivs
		/*
			SetviewDivs expects a command with the parameter com.viewDivs. SetviewDivs is
			 saved in this.Vlt.views. This View is then cleared, and each View in this.Vlt.views
			 is added to this.Vlt.viewDivs. When all the Views have been added, the Views are Rendered.
		 */
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
					this.dispatch({ Cmd: 'Render' }, (err, cmd) => { fun(null, com) });
				});
			});
		}

        //-----------------------------------------------------Render
		/*
			Render sends the Render command to each view in this.Vlt.views.
		 */
		Render(com, fun) {
			let that = this;
			async.each(this.Vlt.views, function(pid, next) {
				that.send({Cmd: 'Render'}, pid, () => {
					next();
				});
			}, function() {
				fun(null, com);
			})
		}

		//-----------------------------------------------------GetType
		/*
			GetType saves this.Vlt.type to the command parameter com.Type.
		 */
		GetType(com, fun) {
			com.Type = this.Vlt.type;
			fun(null, com);
		}

		//-----------------------------------------------------Focus
		/*
            Focus adds the 'Focus' class to this View's root.
		 */
		Focus(com, fun) {
			this.Vlt.root.addClass('Focus');
			if (!this.Vlt.disableTitleBar) this.Vlt.titleBar.css('border-bottom', '1px solid var(--accent-color)');
			fun(null, com);
		}

        //-----------------------------------------------------Blur
        /*
            Blur removes the 'Focus' class from the View's root.
         */
		Blur(com, fun) {
			this.Vlt.root.removeClass('Focus');
			if (!this.Vlt.disableTitleBar) this.Vlt.titleBar.css('border-bottom', '1px solid var(--view-border-color)');
			fun(null, com);
		}

        //-----------------------------------------------------DOMLoaded
        /*
            DOMLoaded sends the DOMLoaded command to the Views stored in this.Vlt.views.
         */
		DOMLoaded(com, fun) {
			let that = this;
			async.eachSeries(this.Vlt.views, function (item, next) {
				that.send({ Cmd: 'DOMLoaded' }, item, () => {
					next();
				});
			}, () => {
				fun(null, com);
			});
		}

		//-----------------------------------------------------Resize
        /*
            Resize sets the command parameters com.width to this.Vlt.div.width(), com.height to this.Vlt.div.height(),
             com.aspect to the ratio between this.Vlt.div.width() and this.Vlt.div.height(). Then Resize sends the
             Resize command to all the Views in this.Vlt.views.
         */
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

        //-----------------------------------------------------ShowHierarchy
        /*
            ShowHierarchy displays the rootID for this View and for all child Views.
         */
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

        //-----------------------------------------------------Drop
        /*
            Drop can be overridden for the purpose of creating drag and drop functionality.
         */
		Drop(com, fun) {
			console.log('DROPPED', com);
            fun(null, com);
		}

        //-----------------------------------------------------AttachDragListener
        /*
            AttachDragListener enables drag functionality on a View. AttachDragListener expects a command with
             parameters com.To as the element to be dragged, com.Data and com.Datatype as data required for the
             drag event. First, AttachDragListener adds the 'draggable' tag to the View's root div. Next, create a
             temporary <div> to hold the item to be dragged. Finally, the drag event listeners dragstart, drag, and
             dragend are attached to the View's root.
         */
		AttachDragListener(com, fun) {
			let that = this;
			let root = com.To;
			let data = com.Data;
			let datatype = com.Datatype;

			$(root).attr('draggable', 'true');

			let createDragDom = com.CreateDragDom || function () {
				div = $(document.createElement('div'));
				div.css('width', '200px');
				div.css('height', '200px');
				div.css('background-color', 'teal');
				return div;
			};

			/*
			    Add the 'dragstart' listener to the View's root.
			    When the 'dragstart' event is triggered, a placeholder <div>
			    is created and fixed to the cursor position. This provides a
			    visual signifier for users.
			 */
			let div;
			root.addEventListener('dragstart', function (evt) {

				console.log(evt.dataTransfer.setDragImage(emptyImage(), 0, 0));
				event = evt;

				div = createDragDom();

				div.css('pointer-events', 'none');
				div.css('opacity', '.6');
				div.css('position', 'fixed');
				div.css('top', (evt.pageY + 20) + 'px');
				div.css('left', (evt.pageX - (div.width() / 2)) + 'px');
				$(document.body).append(div);

			});

            /*
                Add the 'drag' listener to the View's root.
                When the 'drag' event is triggered, the placeholder <div>
                is repositioned to follow the cursor.
             */
			root.addEventListener('drag', function (evt) {
				console.log("DRAG!");
				let pivotX = (div.width() / 2);
				let pivotY = 20;
				div.css('top', (evt.pageY + pivotY) + 'px');
				div.css('left', (evt.pageX - pivotX) + 'px');
			});

            /*
                 Add the 'dragend' listener to the View's root.
                 When the 'dragend' event is triggered, the placeholder <div>
                 is removed, the View's root is found, and the 'Drop' command
                 is sent to the View sub-class.
             */
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
	}

    //-----------------------------------------------------Command
	/*
		Takes all commands and routes commands to subclasses when necessary.
	 */
	function Command(com, fun) {


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
};