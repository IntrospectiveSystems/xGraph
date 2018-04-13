//# sourceURL=TicketCommentsView
(function TicketCommentsView() {
	class TicketCommentsView {
		async Setup(com, fun) {
			com = await this.asuper(com);
			this.Vlt.panel = 2;
			this.Vlt.historyPanel = false;
			this.Vlt.commentsPanel = true;

			{

				this.asuper({
					Cmd: "Style",
					Selector: ".dot",
					Rules: {
						"font-size": "14px",
						"width": "24px",
						"padding-top": "6px",
						"padding-left": "6px",
						"vertical-align": "bottom",
						"height": "24px",
						"box-sizing": "border-box"
					}
				});

				this.asuper({
					Cmd: "Style",
					Selector: ".post-icons",
					Rules: {
						"display": "inline-block",
						"height": "24px",
						"line-height": "24px",
						"padding-left": "4px"
					}
				});

				this.asuper({
					Cmd: "Style",
					Selector: ".big.dot",
					Rules: {
						"padding-top": "0px",
						"font-size": "24px",
						"width": "24px",
						"padding-left": "5px",
						"vertical-align": "bottom",
						"height": "24px"
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
					Selector: `#${this.id('panels')}[panel=\"1\"] > .${this.id('panel2')}`,
					Rules: {
						"left": "100%"
					}
				});

				this.asuper({
					Cmd: "Style",
					Selector: `#${this.id('panels')}[panel=\"2\"] > .${this.id('panel2')}`,
					Rules: {
						"left": "0%"
					}
				});

				this.asuper({
					Cmd: "Style",
					Selector: `#${this.id('panels')}[panel=\"1\"] > #${this.id('panel1')}`,
					Rules: {
						"left": "0%"
					}
				});

				this.asuper({
					Cmd: "Style",
					Selector: `#${this.id('panels')}[panel=\"2\"] > #${this.id('panel1')}`,
					Rules: {
						"left": "-100%"
					}
				});

				this.asuper({
					Cmd: "Style",
					Selector: "div[panel]",
					Rules: {
						"transition": "left 300ms"
					}
				});

				this.asuper({
					Cmd: "Style",
					Selector: ".historyItem",
					Rules: {
						'padding': '8px 16px',
						'padding-top': '18px'
					}
				});

				this.asuper({
					Cmd: "Style",
					Selector: ".comment",
					Rules: {
						"font-weight": "300"
					}
				});

				this.asuper({
					Cmd: "Style",
					Selector: "div[section]",
					Rules: {
						"border-bottom": "1px solid #eee"
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
					Selector: "div[button]: hover",
					Rules: {
						"background-color": "rgba(0, 0, 0, .25)"
					}
				});

				this.asuper({
					Cmd: "Style",
					Selector: "div[highlights]:hover",
					Rules: {
						"background-color": "#eee",
						"cursor": "pointer"

					}
				});




			}
			fun(null, com);
		}

		async Render(com, fun) {
			// log.i('View/Render');
			// console.log('view has created itself')
			this.Vlt.div.children().remove();
			// debugger;

			let data = await this.ascend('GetData', {}, this.Par.Ticket.Value);
			// debugger;
			this.cdnImportCss('https://cdnjs.cloudflare.com/ajax/libs/octicons/4.4.0/font/octicons.css');

			let formatDate = (date) => `${('Sun Mon Tue Wed Thu Fri Sat'.split(' '))[date.getDay()]}, ${('Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' '))[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
			let formatDuration = (ms) => {
				let pre = '';
				if (ms < 0) {
					ms = -ms;
					pre = '-';
				}
				let seconds = Math.floor(ms / 1000);
				let minutes = Math.floor(seconds / 60);
				let hours = Math.floor(minutes / 60);
				let days = Math.floor(hours / 24);
				let weeks = Math.floor(days / 7);
				let years = Math.floor(weeks / 52);

				if (years > 0) return `${pre}${years} year${years > 1 ? 's' : ''}`;
				if (weeks > 3) return `${pre}${weeks} week${weeks > 1 ? 's' : ''}`;
				if (days > 0) return `${pre}${days} day${days > 1 ? 's' : ''}`;
				if (hours > 0) return `${pre}${hours} hour${hour > 1 ? 's' : ''}`;
				if (minutes > 0) return `${pre}${minutes} minute${minute > 1 ? 's' : ''}`;
				if (seconds > 0) return `${pre}${seconds} second${second > 1 ? 's' : ''}`;
			};

			let formatTime = (date) => `${((date.getHours() + 11) % 12) + 1}:${date.getMinutes()} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;

			// debugger;
			this.Vlt.div.append($(`
<div id="${this.id('panels')}" panel="${this.Vlt.panel}" style="background-color: var(--view-color); overflow:hidden;height: 100%;position: relative;">
	<div style="display:flex;flex-direction:column;height: 100%">
    <div style="padding: 16px;">
      <span style="float:right;font-size:13px">${data.Status}</span>
      <h1 style="padding: 0px; margin: 0px;">${data.Summary}</h1>
			<span>History</span>
    </div>
		<hr />
    <div style="flex-grow: 1;overflow:auto">

	<div id="${this.id('historyPanel')}" class="${this.id('panel2')}" panel style="width1: 100%;">

		${data.Changes.reverse().map(changeset => `
			<div class="historyItem">
				<div style="padding-bottom:8px">
					<span style="font-size:13px;">${changeset.Author} - <span style="opacity: 0.7">${formatDate(new Date(changeset.Timestamp))} ${formatTime(new Date(changeset.Timestamp))}</span></span>
				</div>
				<div>
					${(function () {
		if (Object.keys(changeset).length == 0) {
			return `<div style="padding-left: 16px;">&#x2014; No changes made. Wait, what?</div>`;
		} else return "";
	})()}
					${(function () {
		if ("Summary" in changeset) {
			return `<div style="padding-left: 16px;">&#x2014; ${changeset.Summary.before == "" ? 'Named ticket ' : 'Renamed to '}"${changeset.Summary.after}"</div>`;
		} else return "";
	})()}
					${(function () {
		if ("DueBy" in changeset) {
			return `<div style="padding-left: 16px;">&#x2014; Changed Due Date to ${formatDate(new Date(changeset.DueBy.after))}</div>`;
		} else return "";
	})()}
					${(function () {
		let priorityTable = ['', 'Lowest', 'Low', 'Normal', 'High', 'Highest'];
		if ("Priority" in changeset) {
			if (changeset.Priority.before == 0)
				return `<div style="padding-left: 16px;">&#x2014; Priority set to <em>${priorityTable[changeset.Priority.after]}</em></div>`;
			else if (changeset.Priority.after > changeset.Priority.before) {
				return `<div style="padding-left: 16px;">&#x2014; Priority bumped to <em>${priorityTable[changeset.Priority.after]}</em></div>`;
			} else {
				return `<div style="padding-left: 16px;">&#x2014; Priority reduced to <em>${priorityTable[changeset.Priority.after]}</em></div>`;
			}
		} else return "";
	})()}
					${(function () {
		let severityTable = ['', 'Feature Request', 'Mild', 'Moderate', 'Severe', 'Critical'];
		if ("Severity" in changeset) {
			if (changeset.Severity.before == 0)
				return `<div style="padding-left: 16px;">&#x2014; Severity set to <em>${severityTable[changeset.Severity.after]}</em></div>`;
			else if (changeset.Severity.after > changeset.Severity.before) {
				return `<div style="padding-left: 16px;">&#x2014; Severity bumped to <em>${severityTable[changeset.Severity.after]}</em></div>`;
			} else {
				return `<div style="padding-left: 16px;">&#x2014; Severity reduced to <em>${severityTable[changeset.Severity.after]}</em></div>`;
			}
		} else return "";
	})()}
					${(function () {
		if ("Component" in changeset) {
			return `<div style="padding-left: 16px;">&#x2014; ${changeset.Component.before == "" ? 'Set Component to ' : 'Changed Compnent to '}"${changeset.Component.after}"</div>`;
		} else return "";
	})()}
					${(function () {
		if ("Version" in changeset) {
			return `<div style="padding-left: 16px;">&#x2014; ${changeset.Version.before == "" ? 'Set Version to ' : 'Changed Version to '}"${changeset.Version.after}"</div>`;
		} else return "";
	})()}
					${(function () {
		if ("Details" in changeset) {
			let diffs = JsDiff.diffChars(changeset.Details.before, changeset.Details.after), diffString = "";
			for (let diff of diffs)
				diffString += `<span style="background-color:${diff.added ? '#8ff6a7' : (diff.removed ? '#ffa9a9' : 'none')}">${diff.value}</span>`;
			return `<div style="padding-left: 16px;">&#x2014; Modified Details<br><div style="
								padding: 8px;
								background-color: #e0e0e0;
								border-radius: 5px;
								display: inline-block;
								margin: 8px 0px;
								">${diffString}</div></div>`;
		} else return "";
	})()}
			
					${(function () {
		if ("Message" in changeset) {
			return `<div style="padding-left: 16px;">&#x2014; ${changeset.Message}</div>`;
		} else return "";
	})()}
					${(function () {
		if ("AssignedTo" in changeset) {
			return `<div style="padding-left: 16px;">&#x2014; ${changeset.AssignedTo.before == "" ? 'Assigned to ' : 'Reassigned to '}${changeset.AssignedTo.after}</div>`;
		} else return "";
	})()}
				</div>
			</div>
		`).join('')}
	</div>
			

	</div>
	<div style="padding:16px;text-align:right">
		<div button class="${this.id('backButton')}">BACK</div>
		</div>
		<hr />
  </div>
</div>
			`));

			// ----------------------------------------------------------- [ Events ]
			let comment = async () => {
				let text = $(`#${this.id(`comment`)}`).val();
				let command = await this.authenticate({
					Cmd: 'AddComment',
					Comment: text
				});
				await this.ascend('AddComment', command, this.Par.Ticket);
				await this.ascend('Render');
				$(`#${this.id(`comment`)}`).focus();
			}

			$(`#${this.id('editButton')}`).on('click', _ => {
				// debugger;
				this.evoke(this.Par.Ticket, { Type: 'Edit' });
			});
			$(`#${this.id('acceptButton')}`).on('click', async _ => {
				// debugger;
				await this.ascend('Accept', await this.authenticate({}), this.Par.Ticket);
				this.ascend('Render');
			});
			$(`#${this.id('resolveButton')}`).on('click', async _ => {
				// debugger;
				await this.ascend('Resolve', await this.authenticate({}), this.Par.Ticket);
				this.ascend('Render');
			});
			$(`#${this.id('closeTicketButton')}`).on('click', async _ => {
				// debugger;
				await this.ascend('Close', await this.authenticate({}), this.Par.Ticket);
				this.ascend('Render');
			});
			$(`#${this.id('comment')}`).keydown(function (e) {
				if (e.ctrlKey && e.keyCode == 13) {
					comment();
				}
			});
			$(`div#${this.id('HistoryButton')}`).on('click', _ => {
				$(`div#${this.id('panels')}`).attr('panel', '2');
				this.Vlt.panel = 2
				// debugger;
				$(`#${this.id('commentsPanel')}`).css('opacity', '0.0');
				$(`#${this.id('historyPanel')}`).css('opacity', '1.0');
				this.Vlt.historyPanel = true;
				this.Vlt.commentsPanel = false;
			});
			$('div#commentsButton').on('click', _ => {
				$(`div#${this.id('panels')}`).attr('panel', '2');
				this.Vlt.panel = 2
				// debugger;
				$(`#${this.id('commentsPanel')}`).css('opacity', '1.0');
				$(`#${this.id('historyPanel')}`).css('opacity', '0.0');
				this.Vlt.historyPanel = false;
				this.Vlt.commentsPanel = true;
			});
			$(`.${this.id('backButton')}`).on('click', _ => {
				// if (this.Vlt.panel == 2) {
				// 	$(`div#${this.id('panels')}`).attr('panel', '1');
				// 	this.Vlt.panel = 1;
				// } else {
				this.ascend('Destroy');
				// }
			});
			$(`#${this.id('commentButton')}`).on('click', async _ => {
				comment();
			});

			com = await this.asuper(com);
			fun(null, com);
		}

	}

	return Viewify(TicketCommentsView, '3.5');
})();