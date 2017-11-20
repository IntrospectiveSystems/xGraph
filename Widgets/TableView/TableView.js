//# sourceURL=TableView.js
(function TableView() {

	class TableView {
		Setup(com, fun) {

			this.super(com, (err, cmd) => {

				this.Vlt.table = $(document.createElement('table'));
				this.Vlt.table.addClass('table');
				this.Vlt.table.css('width', '100%')
				this.Vlt.tablehead = $(document.createElement('thead'));
				this.Vlt.tablebody = $(document.createElement('tbody'));

				//set some css styles
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

					superStyle('table.table', {
						'border-collapse': 'collapse',
						'color': '#292b2c'
					});

					superStyle('table.table > thead', {
						'background-color': ' #292b2c',
						'color': 'white',
						'height': '43px'
					});

					superStyle('table.table th, table.table td', {
						'padding': '.75rem',
						'border-top': '1px solid #eceeef'
					});

					superStyle('table.table th', {
						'font-weight': 'bold',
						'text-align': 'left',
						'vertical-align': 'top'
					});

					superStyle('table.table > tbody', {
						'height': '120px'
					});

					superStyle('table.table > tbody > tr:nth-child(odd) ', {
						'background-color': 'white'
					});

					superStyle('table.table > tbody > tr:nth-child(even) ', {
						'background-color': '#f8f8f8'
					});
					
					superStyle('span.notAvailable', {
						'color': 'rgba(0,0,0,.5)'
					});

				}

				if (fun)
					fun(err, com);
			});

		}

		Start(com, fun) {


			//set some example headers
			this.ascend("SetDataHeaders", {
				Headers: [
					{ Name: '#', Key: "id" },
					{ Name: 'Ticket', Key: 'ticketName' },
					{ Name: 'Status', Key: 'status' },
					{ Name: 'Priority', Key: 'priority' },
					{ Name: 'Severity', Key: 'severity' }
				]
			});


			//set some example content
			this.ascend("SetRows", {
				Rows: [
					{
						id: 1,
						ticketName: 'Finalize ModuleCache in Nexus',
						status: "Assigned",
						priority: "Assigned",
						severity: "Assigned"
					},{
						id: 1,
						ticketName: 'Finalize ModuleCache in Nexus',
						status: "Assigned",
						priority: "Assigned",
						severity: "Assigned"
					},{
						id: 1,
						ticketName: 'Finalize ModuleCache in Nexus',
						status: "Assigned",
						priority: "Assigned",
						severity: "Assigned"
					},{
						id: 1,
						ticketName: 'Finalize ModuleCache in Nexus',
						status: "Assigned",
						priority: "Assigned",
						severity: "Assigned"
					},{
						id: 1,
						ticketName: 'Finalize ModuleCache in Nexus',
						status: "Assigned",
						priority: "Assigned",
						severity: "Assigned"
					},{
						id: 1,
						ticketName: 'Finalize ModuleCache in Nexus',
						status: "Assigned",
						priority: "Assigned",
						severity: "Assigned"
					},{
						id: 1,
						ticketName: 'Finalize ModuleCache in Nexus',
						status: "Assigned",
						priority: "Assigned",
						severity: "Assigned"
					},
					{
						id: 2,
						ticketName: 'just another ticket',
						priority: "HIGHEST!!!!",
						severity: "lowest111111"
					}
				]
			});



			if (fun)
				fun(null, com);
		}


		SetDataHeaders(com, fun) {

			let headers = com.Headers;
			this.Vlt.headers = headers;
			let str = `<tr>`;

			for (let colIdx = 0; colIdx < this.Vlt.headers.length; colIdx++) {
				str += `<th>${this.Vlt.headers[colIdx].Name}</th>`;
			}

			str += `</tr>`;

			this.Vlt.tablehead.append($(str));

			if (fun)
				fun(null, com);
		}

		SetRows(com, fun) {
			if (!(this.Vlt.rows))
				this.Vlt.rows = [];

			this.Vlt.rows = this.Vlt.rows.concat(com.Rows);

			let row, str, key;
			for (let rowIdx = 0; rowIdx < com.Rows.length; rowIdx++) {

				row = com.Rows[rowIdx];

				str = `<tr>`;
				for (let colIdx = 0; colIdx < this.Vlt.headers.length; colIdx++) {
					key = this.Vlt.headers[colIdx].Key;
					if (key == 'id')
						str += `<th>${(row[key] || 'NA')}</th>`;
					else
						str += `<td>${(row[key] || '<span class="notAvailable">NA</span>')}</td>`;
				}
				str += `</tr>`;

				this.Vlt.tablebody.append($(str));
			}

			if (fun)
				fun(null, com);
		}

		Render(com, fun) {
			let oldThings = this.Vlt.div.children();

			this.Vlt.table.append(this.Vlt.tablehead);
			this.Vlt.table.append(this.Vlt.tablebody);
			this.Vlt.div.append(this.Vlt.table);

			oldThings.remove();

			this.super(com, fun);
		}

		DOMLoaded(com, fun) {
			this.super(com, fun);
		}
	}

	return Viewify(TableView, '3.3');
})();