//# sourceURL=PanelView.js
//jshint esversion: 6
(function Panel() {
	class Panel {

		/**
		 * @description Creates required DOM from the panels
		 * and divider
		 * @param {any} com 
		 * @param {any} fun 
		 * @override
		 * @memberof Panel
		 */
		Setup(com, fun) {
			let that = this;
			this.Vlt.disableTitleBar = true;
			let vlt = this.Vlt;
			this.super(com, (err, com) => {
				vlt.view1 = null;
				vlt.view2 = null;
				vlt._vertical = false;
				vlt.ratio = 0.5;
				vlt.dividerSize = 6;
				vlt.dividerHoverSize = 20;
				vlt.dividerMargin = 0;



				vlt.leftFlexPane = DIV('pane');
				vlt.leftFlexPane.attr('id', "leftPane");
				vlt.rightFlexPane = DIV('pane');
				vlt.rightFlexPane.attr('id', "rightPane");
				vlt.divider = DIV('divider');




				vlt.divider.on('mouseover', function (event) {
					vlt.hover = true;
					that.send({ Cmd: "hoverChange" }, that.Par.Pid, () => { });
					that.send({ Cmd: "correctRatioAndDirection" }, that.Par.Pid, () => { });
				});
				vlt.divider.on('mouseout', function (event) {
					if (!vlt.dragging) {
						vlt.hover = false;
						that.send({ Cmd: "hoverChange" }, that.Par.Pid, () => { });
					}
					that.send({ Cmd: "correctRatioAndDirection" }, that.Par.Pid, () => { });
				});
				vlt.divider.on('mousedown', function (event) {
					vlt.mouseDown = true;
					that.send({ Cmd: "correctRatioAndDirection" }, that.Par.Pid, () => { });
				});
				vlt.div.on('mouseup', function (event) {
					if (!vlt.dragging && vlt.mouseDown) {
						//just a click
						vlt.horizontal = !vlt.horizontal;
					}
					vlt.dragging = false;
					vlt.mouseDown = false;
					that.send({ Cmd: "correctRatioAndDirection" }, that.Par.Pid, () => { });
				});
				vlt.div.on('mousemove', function (event) {
					if (vlt.mouseDown) vlt.dragging = true;
					if (vlt.dragging) {
						if (!vlt.horizontal) vlt.ratio = (event.clientY - vlt.div.position().top) / vlt.div.height();
						else vlt.ratio = (event.clientX - vlt.div.position().left) / vlt.div.width();
						that.send({ Cmd: "correctRatioAndDirection" }, that.Par.Pid, () => { });
					}
				});

				vlt.div.on('click', '.optionButton', function () {
					this.blur();
				});

				{
					let that = this;
					function superStyle(selector, rule, css) {
						if (!css) {
							that.super({
								Cmd: 'Style',
								Selector: selector,
								Rules: rule
							}, () => { });
						} else {
							that.super({
								Cmd: 'Style',
								Selector: selector,
								Rule: rule,
								Value: css
							}, () => { });
						}
					}

					vlt.root.css('border', 'none');
					vlt.root.css('padding', '0px');

					superStyle('.divider', {
						'box-sizing': 'border-box',
						'background-color': 'var(--view-border-color)',
						'transition': 'background-color 200ms'
					});

					superStyle('.pane.horizontal', {
						'display': 'inline-block',
						'height': '100%'
					});

					superStyle('.pane.vertical', {
						'display': 'block',
						'width': '100%'
					});

					superStyle('.divider.horizontal', {
						'width': vlt.dividerSize + 'px',
						'height': '100%',
						'margin': '0px ' + vlt.dividerMargin + 'px',
						'display': 'inline-block',
						'cursor': 'col-resize'
					});

					superStyle('.divider.vertical', {
						'height': vlt.dividerSize + 'px',
						'width': '100%',
						'margin': vlt.dividerMargin + 'px 0px',
						'display': 'block',
						'cursor': 'row-resize'
					});

				}

				let elems = $(vlt.leftFlexPane).add(vlt.rightFlexPane).add(vlt.divider);
				vlt.elems = elems;
				vlt.horizontal = this.Par.Horizontal || false;

				let panes = $(vlt.leftFlexPane).add(vlt.rightFlexPane);
				panes.css('box-sizing', 'border-box');

				vlt.div.append(vlt.leftFlexPane);
				vlt.div.append(vlt.divider);
				vlt.div.append(vlt.rightFlexPane);

				if ('Ratio' in this.Par) {
					this.Vlt.ratio = this.Par.Ratio;
				}

				this.send({ Cmd: "correctRatioAndDirectionPercents" }, this.Par.Pid, () => { });

				fun(null, com);
			});
		}

		/**
		 * @description append all the relevant DOM to the View Div
		 * @param {any} com 
		 * @param {any} fun 
		 * @override
		 * @memberof Panel
		 */
		Render(com, fun) {
			var that = this;

			let view1 = this.Vlt.viewDivs[0];
			let view2 = this.Vlt.viewDivs[1];

			this.Vlt.leftFlexPane.children().detach();
			this.Vlt.rightFlexPane.children().detach();

			this.Vlt.leftFlexPane.append(view1);
			this.Vlt.rightFlexPane.append(view2);

			this.Vlt.div.append(this.Vlt.leftFlexPane);
			this.Vlt.div.append(this.Vlt.divider);
			this.Vlt.div.append(this.Vlt.rightFlexPane);

			let elems = $(this.Vlt.leftFlexPane).add(this.Vlt.rightFlexPane).add(this.Vlt.divider);

			this.Vlt.elems = elems;

			this.Vlt.dragging = false;
			this.Vlt.hover = false;

			elems.addClass(this.Vlt.horizontal ? 'horizontal' : 'vertical');
			elems.removeClass(this.Vlt.horizontal ? 'vertical' : 'horizontal');

			this.super(com, (err, cmd) => {
				fun(null, com)
			});

		}

		/**
		 * @description re sync the CSS of the View to the Vlt state
		 * @param {any} com 
		 * @param {any} fun 
		 * @memberof Panel
		 */
		correctRatioAndDirection(com, fun) {
			let regularPanePadding = ((this.Vlt.dividerMargin * 2 + this.Vlt.dividerSize) / 2);
			this.Vlt.elems.addClass(this.Vlt.horizontal ? 'horizontal' : 'vertical');
			this.Vlt.elems.removeClass(this.Vlt.horizontal ? 'vertical' : 'horizontal');


			if (this.Vlt.horizontal) {
				let width = Math.floor((this.Vlt.leftFlexPane.parent().width() * (this.Vlt.ratio) - regularPanePadding));
				let otherWidth = this.Vlt.leftFlexPane.parent().width() - (width + regularPanePadding * 2);
				this.Vlt.leftFlexPane.css('width', '' + width + 'px');
				this.Vlt.rightFlexPane.css('width', '' + otherWidth + 'px');
				this.Vlt.leftFlexPane.css('height', '');
				this.Vlt.rightFlexPane.css('height', '');
			} else if (!this.Vlt.horizontal) {
							let height = Math.floor((this.Vlt.leftFlexPane.parent().height() * (this.Vlt.ratio) - regularPanePadding));
							let otherHeight = this.Vlt.leftFlexPane.parent().height() - (height + regularPanePadding * 2);
				if(this.Vlt.ratio == 1){
									height = Math.floor((this.Vlt.leftFlexPane.parent().height() * (this.Vlt.ratio) - (regularPanePadding+22)));
									otherHeight = this.Vlt.leftFlexPane.parent().height() - (height - 22 + (regularPanePadding * 2));
				}
				this.Vlt.leftFlexPane.css('height', '' + height + 'px');
				this.Vlt.rightFlexPane.css('height', '' + otherHeight + 'px');
				this.Vlt.leftFlexPane.css('width', '');
				this.Vlt.rightFlexPane.css('width', '');

			}

			for (let i in this.Vlt.views) {
				let pid = this.Vlt.views[i];
				this.send({ Cmd: 'Resize' }, pid, () => { });
			}
			
			fun(null, com);

		}

		/**
		 * @description re sync the CSS of the View to the Vlt state
		 * expect instead of using pixel values, percents will
		 * be used. This is helpful for before the DOM is connected.
		 * @param {any} com 
		 * @param {any} fun 
		 * @memberof Panel
		 */
		correctRatioAndDirectionPercents(com, fun) {
			let regularPanePadding = ((this.Vlt.dividerMargin * 2 + this.Vlt.dividerSize) / 2);
			this.Vlt.elems.addClass(this.Vlt.horizontal ? 'horizontal' : 'vertical');
			this.Vlt.elems.removeClass(this.Vlt.horizontal ? 'vertical' : 'horizontal');

			if (this.Vlt.horizontal) {

				this.Vlt.leftFlexPane.css('width', 'calc(' + (this.Vlt.ratio * 100) + '% - ' + regularPanePadding + 'px)');
				this.Vlt.rightFlexPane.css('width', 'calc(' + ((1 - this.Vlt.ratio) * 100) + '% - ' + regularPanePadding + 'px)');
				this.Vlt.leftFlexPane.css('height', '');
				this.Vlt.rightFlexPane.css('height', '');
			} else if (!this.Vlt.horizontal) {
				this.Vlt.leftFlexPane.css('height', 'calc(' + (this.Vlt.ratio * 100) + '% - ' + regularPanePadding + 'px)');
				this.Vlt.rightFlexPane.css('height', 'calc(' + ((1 - this.Vlt.ratio) * 100) + '% - ' + regularPanePadding + 'px)');
				this.Vlt.leftFlexPane.css('width', '');
				this.Vlt.rightFlexPane.css('width', '');
			}

			for (let i in this.Vlt.views) {
				let pid = this.Vlt.views[i];
				this.send({ Cmd: 'Resize' }, pid, () => { });
			}

			fun(null, com);
		}

		/**
		 * @description change the hover state of the divider
		 * @param {any} com 
		 * @param {any} fun 
		 * @memberof Panel
		 */
		hoverChange(com, fun) {
			if (this.Vlt.hover)
				this.Vlt.divider.css('background-color', 'var(--accent-color)');
			else
				this.Vlt.divider.css('background-color', 'var(--view-border-color)');
		}

		/**
		 * @description triggered when connected to the DOM.
		 * since we know we're attached, we can set our CSS
		 * to pixel values with correctRatioAndDirection
		 * @param {any} com 
		 * @param {any} fun 
		 * @override
		 * @memberof Panel
		 */
		DOMLoaded(com, fun) {
			this.send({ Cmd: "correctRatioAndDirection" }, this.Par.Pid, () => {});

			this.super(com, () => {
				fun(null, com);
			})
		}

		/**
		 * @description When Our size is changed, we should update
		 * our pixel CSS values by calling correctRatioAndDirection
		 * @param {any} com 
		 * @param {any} fun 
		 * @override
		 * @memberof Panel
		 */
		Resize(com, fun) {
			this.send({ Cmd: "correctRatioAndDirection" }, this.Par.Pid, () => { });
			this.super(com, (err, cmd) => {
				fun(null, com);
			});
		}
	}

	return Viewify(Panel, "3.1");

})();