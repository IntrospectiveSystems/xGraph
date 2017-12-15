//# sourceURL=TableView.js
(function TableView() {

	class TableView {
		Setup(com, fun) {

			this.super(com, (err, cmd) => {

				this.Vlt.table = $(document.createElement('table'));
				this.Vlt.table.addClass('sortable');
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
						'border-bottom': '1px solid #eceeef'
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

		async Start(com, fun) {

			if('Source' in this.Par && 'Columns' in this.Par) {

				let evoke = 'Evoke' in this.Par ? this.Par.Evoke : undefined;

				//get headers from source
				this.ascend("SetDataHeaders", {
					Headers: this.Par.Columns,
					Evoke: evoke
				});
	
				let data = await this.ascend("GetData", {}, this.Par.Source);
				// debugger;
				// add rows
				this.ascend("SetRows", {
					Rows: data.Data,
					Evoke: evoke
				});

			}



			if (fun)
				fun(null, com);
		}


		SetDataHeaders(com, fun) {

			let headers = com.Headers;
			this.Vlt.headers = headers;
			this.Vlt.enums = {};
			let evoke = com.Evoke;
			let str = `<tr>`;

			for (let colIdx = 0; colIdx < this.Vlt.headers.length; colIdx++) {
				str += `<th>${this.Vlt.headers[colIdx].Name}</th>`;
				if('Enum' in this.Vlt.headers[colIdx]) {
					// debugger;
					this.Vlt.enums[colIdx] = this.Vlt.headers[colIdx].Enum;
				}
			}

			if(evoke) {
				str += `<th></th>`;
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
					// log.d(key, row[key]);
					if(typeof row[key] == 'object' && 'Value' in row[key]) {
						row[key] = row[key].Value;
					}
					if (key == 'id')
						str += `<th>${(row[key] || 'NA')}</th>`;
					else
						str += `<td>${(row[key] || '<span class="notAvailable">NA</span>')}</td>`;
				}
				// debugger;
				if(typeof com.Evoke == 'string' && 'Pid' in row) {
					str += `<td><a href='#' class=${this.id('EvokeButton')} pid="${row.Pid}">${com.Evoke}</a></td>`;
				}

				str += `</tr>`;

				this.Vlt.tablebody.append($(str));
			}
			
			let that = this;
			$(`.${this.id('EvokeButton')}`).on('click', function() {
				// debugger;
				that.evoke($(this).attr('pid'));
			});

			if (fun)
				fun(null, com);
		}

		Render(com, fun) {
			if(this.Vlt.div.children().length == 0) {
				this.Vlt.table.append(this.Vlt.tablehead);
				this.Vlt.table.append(this.Vlt.tablebody);
				this.Vlt.div.append(this.Vlt.table);
			}
			this.super(com, fun);
		}

		DOMLoaded(com, fun) {
			this.super(com, fun);
		}
	}

	return Viewify(TableView, '3.4');
})();