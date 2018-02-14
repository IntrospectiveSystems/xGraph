//# sourceURL=TableView.js
(function TableView() {

	class TableView {

		/**
		 * @description create the table in DOM and apply a number of styles
		 * @param {any} com 
		 * @param {any} fun 
		 * @override
		 * @memberof TableView
		 */
		async Setup(com, fun) {
			
			this.super(com, (err, cmd) => {


				this.formatDate = (date) => `${('Sun Mon Tue Wed Thu Fri Sat'.split(' '))[date.getDay()]}, ${('Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' '))[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;

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

					superStyle('table.sortable th:not(.sorttable_sorted):not(.sorttable_sorted_reverse):not(.sorttable_nosort):after', {
						"content": "\" \\25B4\\25BE\"" 
					});

					superStyle('table.table > thead, table.table > thead span', {
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
					
					superStyle('table.table > tbody > tr:hover ', {
						'background-color': '#efefef',
						'cursor': 'pointer'
					});
					
					superStyle('span.notAvailable', {
						'color': 'rgba(0,0,0,.5)'
					});

				}

				if (fun)
					fun(err, com);
			});

		}

		async DataUpdate(com, fun) {
			let data = await this.ascend("GetData", {}, this.Par.Source);
			// add rows
			this.ascend("SetRows", {
				Rows: data.Data
				// Evoke: evoke
			});
			fun(null, com);
		}

		/**
		 * @description 
		 * 1) Set Headers to `Par.Columns`
		 * 
		 * 2) send `Source` GetData, and add its Rows.
		 * @override
		 * @param {any} com 
		 * @param {any} fun 
		 * @memberof TableView
		 */
		async Start(com, fun) {

			if('Source' in this.Par && 'Columns' in this.Par) {

				// set this to undefined for the time being so we can implement
				// row wide clicking and no extra row
				let evoke = /*'Evoke' in this.Par ? this.Par.Evoke :*/ undefined;

				//get headers from source
				this.ascend("SetDataHeaders", {
					Headers: this.Par.Columns,
					Evoke: evoke
				});

				// see: DataUpdate
				// debugger;
				await this.ascend('Subscribe', {Pid: this.Par.Pid}, this.Par.Source);
	
				let data = await this.ascend("GetData", {}, this.Par.Source);
				// add rows
				this.ascend("AddRows", {
					Rows: data.Data,
					Evoke: evoke
				});

			}



			if (fun)
				fun(null, com);
		}

		/**
		 * @description Create the thead and load the
		 * column information into Vlt
		 * 
		 * if Evoke is present, add a column for that.
		 * 
		 * internal use only
		 * @param {object} com 
		 * @param {object[]} com.Headers
		 * @param {string} com.Headers.Name
		 * @param {string} com.Headers.Key
		 * @param {string=} com.Evoke
		 * @param {any} fun 
		 * @memberof TableView
		 */
		async SetDataHeaders(com, fun) {

			let headers = com.Headers;
			this.Vlt.headers = headers;
			this.Vlt.enums = {};
			let evoke = com.Evoke;
			let str = `<tr>`;

			for (let colIdx = 0; colIdx < this.Vlt.headers.length; colIdx++) {
				str += `<th>${this.Vlt.headers[colIdx].Name}</th>`;
				if('Enum' in this.Vlt.headers[colIdx]) {
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

		async SetRows(com, fun) {

			this.Vlt.rows = [];
			this.Vlt.tablebody.children().remove();
			await this.ascend('AddRows', com);


			fun(null, com);

		}

		/**
		 * @description Create the tbody, trs, and tds and
		 * append them to the table.
		 * 
		 * internal use only
		 * @param {object} com 
		 * @param {object[]} com.Rows
		 * @param {any} fun 
		 * @memberof TableView
		 */
		async AddRows(com, fun) {
			if (!(this.Vlt.rows))
				this.Vlt.rows = [];

			this.Vlt.rows = this.Vlt.rows.concat(com.Rows);

			let row, str, key;
			for (let rowIdx = 0; rowIdx < com.Rows.length; rowIdx++) {

				row = com.Rows[rowIdx];
				// debugger;
				str = `<tr pid="${row.Pid}" class=${this.id('EvokeButton')}>`;
				for (let colIdx = 0; colIdx < this.Vlt.headers.length; colIdx++) {
					key = this.Vlt.headers[colIdx].Key;
					let format = this.Vlt.headers[colIdx].Format || "";
					if(typeof row[key] == 'object' && 'Value' in row[key]) {
						row[key] = row[key].Value;
					}
					if (key == 'id')
						str += `<th>${(row[key] || 'NA')}</th>`;
					else {
						switch(format) {
							case "Date": {
								str += `<td>${(this.formatDate(new Date(row[key])) || '<span class="notAvailable">NA</span>')}</td>`;
								break;
							}
							default: {
								str += `<td>${(row[key] || '<span class="notAvailable">NA</span>')}</td>`;
								break;
							}
						}

					}
				}
				// debugger;
				if(typeof com.Evoke == 'string' && 'Pid' in row) {
					str += `<td><a href='#' pid="${row.Pid}">${com.Evoke}</a></td>`;
				}

				str += `</tr>`;

				this.Vlt.tablebody.append($(str));
			}

			//do the sort thing
			sorttable.makeSortable(this.Vlt.table[0]);
			
			let that = this;
			$(`.${this.id('EvokeButton')}`).on('click', function() {
				that.evoke($(this).attr('pid'));
			});

			if (fun)
				fun(null, com);
		}

		/**
		 * @description if our View DOM is not appended yet, do so.
		 * otherwise, do nothing.
		 * 
		 * @override
		 * @param {any} com 
		 * @param {any} fun 
		 * @memberof TableView
		 */
		async Render(com, fun) {
			if(this.Vlt.div.children().length == 0) {
				this.Vlt.table.append(this.Vlt.tablehead);
				this.Vlt.table.append(this.Vlt.tablebody);
				this.Vlt.div.append(this.Vlt.table);
			}
			this.super(com, fun);
		}
	}

	return Viewify(TableView, '3.5');
})();