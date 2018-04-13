//# sourceURL=TicketEditView
(function TicketEditView() {
	class TicketEditView {
		async Setup(com, fun) {
			// debugger;
			com = await this.asuper(com);

			

			this.cdnImportCss('//fonts.googleapis.com/icon?family=Material+Icons');

			// this.Vlt.div.css('overflow-y', 'scroll');

			// ----------------------------------------- input: text, date Styling
			this.asuper({
				Cmd: "Style",
				Selector: 'input',
				Rules: {
					'margin-top': '32px',
					'background': 'none',
					'border': 'none',
					'padding-bottom': '8px',
					'padding-top': '8px',
					'border-bottom': '2px solid rgba(var(--atext), 0.42)',
					'caret-color': 'var(--accent-700)',
					// 'margin-bottom': '1px',
					'font-size': '16px',
					'outline': 'none !important',
					'display': 'block',
					'width': '100%'
				}
			});
			this.asuper({
				Cmd: "Style",
				Selector: 'input:hover',
				Rules: {
					'border-bottom': '2px solid var(--text)',
				}
			});
			this.asuper({
				Cmd: "Style",
				Selector: 'input:focus',
				Rules: {
					'border-bottom': '2px solid var(--accent-700)',
					'margin-bottom': '0px'
				}
			});
			this.asuper({
				Cmd: "Style",
				Selector: 'input + label',
				Rules: {
					'display': 'block',
					'height': '0px',
					'font-size': '15px',
					'position': 'relative',
					'transition': 'bottom 200ms, font-size 200ms',
					'bottom': '28px',
					'cursor': 'text',
					'color': 'rgba(var(--atext), .54)'
				}
			});
			this.asuper({
				Cmd: "Style",
				Selector: 'input:focus + label',
				Rules: {
					'color': 'var(--accent-700)',
					'bottom': '50px',
					'font-size': '12px'
				}
			});
			this.asuper({
				Cmd: "Style",
				Selector: 'input:valid + label',
				Rules: {
					'bottom': '50px',
					'font-size': '12px'
				}
			});



			// ----------------------------------------- Textarea Styling
			this.asuper({
				Cmd: "Style",
				Selector: 'textarea',
				Rules: {
					'margin-top': '32px',
					'caret-color': 'var(--accent-700)',
					'background': 'none',
					'border': 'none',
					'padding-bottom': '8px',
					'padding-top': '8px',
					'border-bottom': '2px solid rgba(var(--atext), 0.42)',
					// 'margin-bottom': '1px',
					'font-size': '15px',
					'outline': 'none !important',
					'display': 'block',
					'width': '100%',
					'display': 'block',
					'font-family': 'Roboto',
					'height': '150px',
					'margin-bottom': '1px',
					'resize': 'none',
					'color': 'var(--text)'
				}
			});
			this.asuper({
				Cmd: "Style",
				Selector: 'textarea:hover',
				Rules: {
					'border-bottom': '2px solid var(--text)',
				}
			});
			this.asuper({
				Cmd: "Style",
				Selector: 'textarea::-webkit-input-placeholder',
				Rules: {
					'color': 'rgba(var(--atext), .54)'
				}
			});
			this.asuper({
				Cmd: "Style",
				Selector: 'textarea:focus',
				Rules: {
					'border-bottom': '2px solid var(--accent-700)'
					// 'padding-bottom': '7px'
				}
			});
			this.asuper({
				Cmd: 'Style',
				Selector: ':root::-webkit-scrollbar',
				Rules: {
					'background-color': 'rgba(var(--atext), 0.0)',
					'width': '3px',
					'height': '3px'
				}
			});
			this.asuper({
				Cmd: 'Style',
				Selector: ':root::-webkit-scrollbar-thumb',
				Rules: {
					'background-color': 'rgba(var(--atext), .7)',
				}
			});
			this.asuper({
				Cmd: 'Style',
				Selector: '::-webkit-input-placeholder',
				Rules: {
					'color': 'var(--text)'
				}
			});



			// ------------------------------------------------------
			this.asuper({
				Cmd: 'Style',
				Selector: '.section',
				Rules: {
					'padding': '8px 16px',
					'border-bottom': '1px solid rgba(0, 0, 0, .2)'
				}
			});
			this.asuper({
				Cmd: 'Style',
				Selector: '.bottomPadding',
				Rules: {
					'padding-bottom': '24px'
				}
			});
			this.asuper({
				Cmd: 'Style',
				Selector: '.bottomMargin',
				Rules: {
					'margin-bottom': '24px'
				}
			});
			

			this.asuper({
				Cmd: "Style",
				Selector: "div[button]:hover",
				Rules: {
					"cursor": "pointer",
					"background-color": "#EEE"
				}
			});

			this.asuper({
				Cmd: "Style",
				Selector: "div[button]",
				Rules: {
					"padding": "8px 16px",
					"display": "inline",
					"cursor": "pointer",
					"border-radius": "3px",
					"min-width": "64px"
				}
			});

			this.asuper({
				Cmd: "Style",
				Selector: "div[button][raised]",
				Rules: {
					"background-color": "var(--accent-color)",
					"color": "var(--accent-text)"
				}
			});

			fun(null, com);
		}

		async Render(com, fun) {
			// log.i('Edit/Render');
			// debugger;
			this.Vlt.div.children().remove();

			// debugger;
			// log.i('getting data sync');
			let data = await this.ascend('GetData', {}, this.Par.Ticket);
			let that = this;
			log.i('obtained data');

			let users = (await this.ascend('SearchUsers', {Search: ""}, this.Par.AuthenticationServer)).Users;
			// debugger;

			// debugger;
			this.Vlt.div.css('display', 'flex');
			this.Vlt.div.css('flex-direction', 'column');

			this.Vlt.div.append($(`
			<h3 class="section" style="
					margin-top: 0px;
			">Edit Ticket</h3>
			<div style="
				flex-grow: 1;
				overflow: auto;
			" class="section bottomPadding">
			
				<!-- <h5>General</h5> -->
				<input type="text" ${'Summary' in data ? `value="${data.Summary}"` : ''} pattern=".{1,}" id="${this.id('Name')}" required/>
				<label for="${this.id('Name')}">Ticket Summary</label>

				<table cellspacing="0px" style="width: 100%">
					<tr>
						<td style="padding-right: 16px">
							<input type="text" pattern=".{1,}" ${data.Component ? `value="${data.Component}"` : ''} id="${this.id('Component')}" required/>
							<label for="${this.id('Component')}">Component</label>
						</td>
						<td>
							<input type="text" pattern=".{1,}" ${data.Version ? `value="${data.Version}"` : ''} id="${this.id('Version')}" required/>
							<label for="${this.id('Version')}">Version</label>
						</td>
					</tr>
				</table>


				<div style="display: flex;">
					<div style="flex-grow: 1;">
						<input type="date" pattern=".{1,}" id="${this.id('DueBy')}" value="${(function () {
							let date = data.DueBy ? new Date(data.DueBy) : new Date(new Date().getTime() + 2.628e9);
							return (`${date.getFullYear()}-${('0' + (date.getMonth() + 1)).slice(-2)}-${('0' + date.getDate()).slice(-2)}`);
						})()}" required style="padding-bottom: 5px;"/>
						<label for="${this.id('DueBy')}">Due On</label>
					</div>

					<div style="
					padding-left: 8px;
						vertical-align: bottom;
						display: inline-block;">
						<div style="vertical-align: bottom;
							display: inline-block;">
							<label>Severity</label><br>
							<select id="${this.id('Severity')}">
								<option value="1" ${data.Severity == 1 ? 'selected' : ''}>Feature Request</option>
								<option value="2" ${data.Severity == 2 ? 'selected' : ''}>Mild</option>
								<option value="3" ${data.Severity == 3 ? 'selected' : ''}>Moderate</option>
								<option value="4" ${data.Severity == 4 ? 'selected' : ''}>Severe</option>
								<option value="5" ${data.Severity == 5 ? 'selected' : ''}>Critical</option>
							</select>
						</div>
						<div style="
							display: inline-block;
							height: calc(100% - 6px);
						"></div>
					</div>
					<div style="
						vertical-align: bottom;
						display: inline-block;">
						<div style="vertical-align: bottom;
							display: inline-block;">
							<label>Priority</label><br>
							<select id="${this.id('Priority')}" value="${data.Priority}">
								<option value="1" ${data.Priority == 1 ? 'selected' : ''}>Lowest</option>
								<option value="2" ${data.Priority == 2 ? 'selected' : ''}>Low</option>
								<option value="3" ${data.Priority == 3 ? 'selected' : ''}>Normal</option>
								<option value="4" ${data.Priority == 4 ? 'selected' : ''}>High</option>
								<option value="5" ${data.Priority == 5 ? 'selected' : ''}>Highest</option>
							</select>
						</div>
						<div style="
							display: inline-block;
							height: calc(100% - 6px);
						"></div>
					</div>
				</div>

				<input list="${this.id('users')}" style="/*
					padding: 8px 16px;
					border: none;
					border-bottom: 1px solid black;
					outline: none !important;
					width: 100%;
					box-sizing: border-box;*/" id="${this.id('AssignedTo')}" value="${data.AssignedTo || ""}" required pattern=".{1,}"/>
				<label for="${this.id('AssignedTo')}">Assigned To</label>
				<datalist id="${this.id('users')}">
					${(function () {
						let str = "";
						// debugger;
						let i = 1;
						for(let user of users) {
							str += `<option value="${user.Name}">${user.Email}</option>`
							i ++;
						}
						return str;
					})()}
				</datalist>

				<textarea type="text" pattern=".{1,}" id="${this.id('Details')}"
				 required placeholder="Details">${data.Details || ''}</textarea>

			</div>

			<div buttons style="padding:16px;text-align:right;">
				<div id="${this.id('close')}" button style="">CANCEL</div>
				<div id="${this.id('Done')}" button raised style="">${data.SetupComplete ? "SAVE" : "CREATE"}</div>
			</div>
			`));


			$(`#${this.id('AssignedTo')}`).on('input', evt => {
				let option = $(`#${this.id('users')}`).find(`option[value="${$(`#${this.id('AssignedTo')}`).val()}"]`);
				if (option.length != 0) $(`#${this.id('AssignedTo')}`).val(option.html());
			});

			let doneButton = $(`#${this.id('Done')}`);

			doneButton.on('click', async (evt) => {
				// debugger;
				let summary = $(`#${this.id('Name')}`).val();
				let details = $(`#${this.id('Details')}`).val();
				let component = $(`#${this.id('Component')}`).val();
				let version = $(`#${this.id('Version')}`).val();
				let severity = parseInt($(`#${this.id('Severity')}`).val());
				let priority = parseInt($(`#${this.id('Priority')}`).val());
				let dueBy = $(`#${this.id('DueBy')}`).val();
				let assignedTo = $(`#${this.id('AssignedTo')}`).val();
				dueBy = (new Date(dueBy).getTime() + new Date().getTimezoneOffset() * 60000 + 18 * 60 * 60 * 1000)
				// debugger;
				await this.ascend("SetMetaData", await this.authenticate({
					Summary: summary,
					Details: details,
					Component: component,
					Version: version,
					Severity: severity,
					Priority: priority,
					DueBy: dueBy,
					AssignedTo: assignedTo
				}), this.Par.Ticket.Value);

				this.super({Cmd: "Destroy"}, _ => _);

			});

			$(`#${this.id('close')}`).on('click', _ => {
				this.super({Cmd: 'Destroy'}, _ => _);
			})



			com = await this.asuper(com);
			fun(null, com);
		}
	}

	return Viewify(TicketEditView, '3.5');
})();