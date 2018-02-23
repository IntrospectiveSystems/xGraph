//# sourceURL=TicketView
(function TicketView() {
	class TicketView {
		async Setup(com, fun) {
			com = await this.asuper(com);
			this.Vlt.panel = 1;

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
				if(ms < 0) {
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
      <h2 style="padding: 0px; margin: 0px;">${data.Summary}</h2>
			<span title="${data.AuthorEmail}">${data.Author}</span> - <span style="font-size:13px;opacity:.7">${formatDate(new Date(data.CreatedOn))}</span><br>
    </div>
		<hr />
    <div style="flex-grow: 1;overflow:auto">
      <div thisone>
        <i class="mega-octicon octicon-repo" style="line-height: 56px; font-size: 24px; padding-left: 26px; float: left"></i>
        <div style="margin-left: 72px;
          height: 56px;
          line-height: 54px;
          font-size: 15px;
          padding-top: 2px;">${data.Component || "Component Unspecified"} <span style="font-size: 13px; opacity: 0.7;">${data.Version || ""}</span><hr></div>

        <i class="mega-octicon octicon-clock" style="line-height: 56px; font-size: 24px; padding-left: 26px; float: left"></i>
        <div style="
          margin-left: 72px;
          height: 56px;
          line-height: 54px;
          font-size: 15px;
					padding-top: 2px;">
					
					<span title="${data.AssignedTo}">${data.AssignedToDisplayName || "Not Assigned"}</span> - ${formatDate(new Date(data.DueBy))}
					
					<hr>
				</div>

        <i class="mega-octicon octicon-issue-opened" style="line-height: 56px; font-size: 24px; padding-left: 26px; float: left"></i>
        <div style="
          margin-left: 72px;
          min-height: 56px;
          font-size: 15px;
          padding-top: 0px;">
          <table style="
					width:100%;
					padding-top: 6px;">
					<tr>
						<td><span>Priority</span><br><div style="padding-top: 2px; padding-bottom: 4px; color: ${data.Priority < 3 ? '#0ed473' : (data.Priority < 5 ? '#f3d900' : '#ef0b0b')}">${'<i class="big dot octicon octicon-primitive-dot" style=""></i>'.repeat(data.Priority)}${'<i class="dot octicon octicon-primitive-dot" style=""></i>'.repeat(5 - data.Priority)}<span class="post-icons">${["Lowest", "Low", "Normal", "High", "Highest"][data.Priority - 1]}</span></div></td>
						<td><span>Severity</span><br><div style="padding-top: 2px; color: ${data.Severity < 3 ? '#0ed473' : (data.Severity < 5 ? '#f3d900' : '#ef0b0b')}">${'<i class="big dot octicon octicon-primitive-dot" style=""></i>'.repeat(data.Severity)}${'<i class="dot octicon octicon-primitive-dot" style=""></i>'.repeat(5 - data.Severity)}<span class="post-icons">${["Feature Request", "Mild", "Moderate", "Severe", "Critical"][data.Severity - 1]}</span></div></td>
					</tr>
				</table>
        </div>
        <hr>
				${data.Details ? `<div style="padding: 8px 16px;">${(function () {
					let converter = new showdown.Converter();
					converter.setFlavor('github');
					converter.setOption('headerLevelStart', 4);
					return converter.makeHtml(data.Details);
				})()}</div><hr>` : ''}
      </div>
      <div highlights id="${this.id('historyButton')}">
        <i class="mega-octicon octicon-link-external" style="
          line-height: 50px;
          font-size: 24px;
          padding-left: 26px;
          padding-right: 16px;
          float: right;
          padding-top: 6px;"></i>
        <div style="
          margin-right: 72px;
          padding-left: 16px;
          height: 56px;
          line-height: 54px;
          font-size: 15px;
          padding-top: 2px;">History</div>
      </div>
      <hr>
      <div highlights id="commentsButton">
        <i class="mega-octicon octicon-link-external" style="
          line-height: 50px;
          font-size: 24px;
          padding-left: 26px;
          padding-right: 16px;
          float: right;
          padding-top: 6px;"></i>
        <div style="
          margin-right: 72px;
          padding-left: 16px;
          height: 56px;
          line-height: 54px;
          font-size: 15px;
					padding-top: 2px;">Comments</div>
					<hr />
      </div>
    </div>
		<hr />
    <div style="padding:16px;text-align:right">
      <div button class="${this.id("backButton")}">CANCEL</div>
			${(function (that) {
					// let assignment = `<span title="${data.AssignedTo}">${data.AssignedToDisplayName}</span>`;
					let str = "";
					if(data.Status != 'Closed') {
						if(data.Status == 'New')
							str += `<div button raised $ id="${that.id('editButton')}">EDIT</div>\r\n`;
						else {
							if(data.Status == 'Assigned' || data.Status == 'Re-Assigned') {
								if (Cookies('xGraph-Email') == data.AssignedTo) {
									//assigned to me
									str += `<div button $ id="${that.id('editButton')}">EDIT</div>\r\n`;
									str += `<div button raised id="${that.id('acceptButton')}">ACCEPT</div>\r\n`;
								} else {
									// assigned, but not to me
									str += `<div button raised $ id="${that.id('editButton')}">EDIT</div>\r\n`;
								}
							} else if (data.Status == 'Accepted') {
								if (Cookies('xGraph-Email') == data.AssignedTo) {
									//accepted by me
									str += `<div button $ id="${that.id('editButton')}">EDIT</div>\r\n`;
									str += `<div button raised id="${that.id('resolveButton')}">RESOLVE</div>\r\n`;
								} else {
									//accepted but i cant resolve it
									str += `<div button raised $ id="${that.id('editButton')}">EDIT</div>\r\n`;
								}
							} else if (data.Status == 'Resolved') {
								if (Cookies('xGraph-Email') == data.AssignedTo) {
									//accepted by me
									str += `<div button $ id="${that.id('editButton')}">EDIT</div>\r\n`;
									str += `<div button raised id="${that.id('closeTicketButton')}">CLOSE</div>\r\n`;
								} else {
									//accepted but i cant resolve it
									str += `<div button raised $ id="${that.id('editButton')}">EDIT</div>\r\n`;
								}
							}
						}
					}
					return str;

				})(this)}

    </div>
  </div>
<!--
	<div id="${this.id('panel1')}" panel style="position: absolute; width: 100%;">
		<div style="padding-top: 8px;padding-bottom: 12px;clear: both;box-shadow: 0px 2px 5px rgba(0,0,0,.3);/* margin-left: 72px; *//* PADDING-LEFT:  0PX; */ background-color: white;">
			<i class="mega-octicon octicon-chevron-left ${this.id('backButton')}" style="line-height: 52px;font-size: 32px;padding-left: 27px;float: left;padding-top: 0px;display: inline; cursor: pointer;"></i>
			<i class="mega-octicon octicon-pencil" id="${this.id('editButton')}" style="cursor: pointer; line-height: 52px;font-size: 24px;padding-right: 18px;padding-left: 12px;float: right;padding-top: 0px;display: inline;"></i>
			<div style="margin-left:  72px;">
				<h3 style="margin: 0px;">${data.Summary}</h3>
				<span style="font-size:13px;">${data.Author} - <span style="opacity: 0.7">${formatDate(new Date(data.CreatedOn))}</span></span>
			</div>
		</div>	
		<hr>
		<div thisone>
			<i class="mega-octicon octicon-repo" style="line-height: 56px; font-size: 24px; padding-left: 26px; float: left"></i>
			<div style="margin-left: 72px;
				height: 56px;
				line-height: 54px;
				font-size: 15px;
				padding-top: 2px;">${data.Component || "Component Unspecified"} <span style="font-size: 13px; opacity: 0.7;">${data.Version || ""}</span><hr></div>
				
			<i class="mega-octicon octicon-clock" style="line-height: 56px; font-size: 24px; padding-left: 26px; float: left"></i>
			<div style="
				margin-left: 72px;
				height: 56px;
				line-height: 54px;
				font-size: 15px;
				padding-top: 2px;">${(function(that) {
					let assignment = `<span title="${data.AssignedTo}">${ data.AssignedToDisplayName }</span>`;
					switch(data.Status) {
						case "New": {
							return "Unassigned";
							break;
						}
						case "Assigned": {
							return `${assignment} ${Cookies('xGraph-Email') == data.AssignedTo ? `<span style="opacity: 0.7">&lt;<a href="#" id="${that.id('acceptButton')}">accept</a>&gt;</span>` : `<span style="opacity: 0.7">Assigned</span>`}`;
							break;
						}
						case "Accepted": {
							return `${assignment} ${Cookies('xGraph-Email') == data.AssignedTo ? `<span style="opacity: 0.7">&lt;<a href="#" id="${that.id('resolveButton')}">resolve</a>&gt;</span>` : `<span style="opacity: 0.7">In Progress</span>`}`;
							break;
						}
						case "Resolved": {
							return `${assignment} ${Cookies('xGraph-Email') == data.AssignedTo ? `<span style="opacity: 0.7">&lt;<a href="#" id="${that.id('closeTicketButton')}">close</a>&gt;</span>` : `<span style="opacity: 0.7">Resolved</span>`}`;
							break;
						}
						case "Closed": {
							return 'Closed';
							break;
						}
					}
					if (typeof data.AssignedTo == 'string')
						return data.AssignedTo;

					else  {}

				})(this)}<hr></div>
				
			<i class="mega-octicon octicon-issue-opened" style="line-height: 56px; font-size: 24px; padding-left: 26px; float: left"></i>
			<div style="
				margin-left: 72px;
				min-height: 56px;
				font-size: 15px;
				padding-top: 0px;">

				<table style="
					width:100%;
					padding-top: 6px;">
					<tr>
						<td><span>Priority</span><br><div style="padding-top: 2px; padding-bottom: 4px; color: ${data.Priority < 3 ? '#0ed473' : (data.Priority < 5 ? '#f3d900' : '#ef0b0b')}">${'<i class="big dot octicon octicon-primitive-dot" style=""></i>'.repeat(data.Priority)}${'<i class="dot octicon octicon-primitive-dot" style=""></i>'.repeat(5 - data.Priority)}<span class="post-icons">${["Lowest", "Low", "Normal", "High", "Highest"][data.Priority - 1]}</span></div></td>
						<td><span>Severity</span><br><div style="padding-top: 2px; color: ${data.Severity < 3 ? '#0ed473' : (data.Severity < 5 ? '#f3d900' : '#ef0b0b')}">${'<i class="big dot octicon octicon-primitive-dot" style=""></i>'.repeat(data.Severity)}${'<i class="dot octicon octicon-primitive-dot" style=""></i>'.repeat(5 - data.Severity)}<span class="post-icons">${["Feature Request", "Mild", "Moderate", "Severe", "Critical"][data.Severity - 1]}</span></div></td>
					</tr>
				</table>
			</div>
			<hr>
			${data.Details ? `<div style="padding: 8px 16px;">${(function () {
				let converter = new showdown.Converter();
				converter.setFlavor('github');
				converter.setOption('headerLevelStart', 4);
				return converter.makeHtml(data.Details);
			})()}</div><hr>` : ''}
		</div>

		<div id="${this.id('HistoryButton')}" button>
			<i class="mega-octicon octicon-chevron-right" style="
				line-height: 50px;
				font-size: 24px;
				padding-left: 26px;
				float: right;
				padding-top: 6px;"></i>
			<div style="
				margin-right: 72px;
				padding-left: 16px;
				height: 56px;
				line-height: 54px;
				font-size: 15px;
				padding-top: 2px;">History</div>
		</div>
		<hr>
		<div id="commentsButton" button>
			<i class="mega-octicon octicon-chevron-right" style="
				line-height: 50px;
				font-size: 24px;
				padding-left: 26px;
				float: right;
				padding-top: 6px;"></i>
			<div style="
				margin-right: 72px;
				padding-left: 16px;
				height: 56px;
				line-height: 54px;
				font-size: 15px;
				padding-top: 2px;">Comments</div>
		</div>
		<hr>
	</div>
	<div id="${this.id('historyPanel')}" class="${this.id('panel2')}" panel style="position: absolute; width: 100%; opacity: ${this.Vlt.historyPanel ? 1 : 0};">
		<div style="
			background-color: white;
			margin-bottom: 16px;
			box-shadow: 0px 0px 5px rgba(0,0,0,.3);">
			<i id="historyBack" class="mega-octicon octicon-chevron-left ${this.id('backButton')}" style="float: left; line-height: 46px; padding-top: 6px; padding-left: 24px; font-size:24px; cursor: pointer"></i>
							<div style=" padding-top: 2px; padding-bottom: 2px;
							margin-left: 72px;">
								<span style="line-height: 56px;padding-top:0px; font-size:18px">History</span>
							</div>
						</div>

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
											return `<div style="padding-left: 16px;">&#x2014; Moved to ${formatDate(new Date(changeset.DueBy.after))}</div>`;
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

					<div id="${this.id('commentsPanel')}" class="${this.id('panel2')}" panel style="position: absolute; height: 100%; width: 100%; opacity: ${this.Vlt.commentsPanel ? 1 : 0};">
						
						<div style="height: 162px;">
							<div style="
							background-color: white;
							/* margin-bottom: 16px; */
							box-shadow: 0px 0px 5px rgba(0,0,0,.3);
							">
								<i class="mega-octicon octicon-chevron-left ${this.id('backButton')}" style="float: left; line-height: 46px; padding-top: 6px; padding-left: 24px; font-size:24px; cursor: pointer"></i>
								<div style=" padding-top: 2px; padding-bottom: 2px;
								margin-left: 72px;">
									<span style="line-height: 56px;padding-top:0px; font-size:18px">Comments</span>
								</div>
							</div>
							
							
							<div style="
								background-color: white;
								box-shadow: 0px 1px 2px rgba(0,0,0,.1);
								border-bottom: 1px solid rgba(0,0,0,.15);
								/* margin-bottom: 16px; */
								text-align: right;
								padding: 8px 16px;
								">
								<div style="padding-bottom:0px">
									<textarea id="${this.id('comment')}" style="
										width: calc(100% - 6px);
										resize: none;
										height: 50px;
										margin-bottom: 4px;
										"></textarea>
									<button id="${this.id('commentButton')}" style="">COMMENT</button>
								</div>
							</div>
						</div>

						${/*
						yes im aware this code looks terrible.
						*/''}
						<div style="height: calc(100% - 162px);display: block;overflow-x: auto;">
						${data.Comments.reverse().map(comment => `
						<div class="historyItem">
							<div style="padding-bottom:8px"><span style="font-size:13px;">${comment.Author} - <span style="opacity: 0.7">${formatDate(new Date(comment.Created)) + ' ' + formatTime(new Date(comment.Created))}</span></span></div><span class="comment">${comment.Comment}</span></div>
						`).join('')}
						</div>
					</div>
					
				</div> -->
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
				this.evoke(this.Par.Ticket, {Type: 'Edit'});
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
			$(`div#${this.id('historyButton')}`).on('click', _ => {
				this.evoke(this.Par.Ticket, {
					Type: 'History'
				});
			});
			$('div#commentsButton').on('click', _ => {
				this.evoke(this.Par.Ticket, {
					Type: 'Comments'
				});
			});
			$(`.${this.id('backButton')}`).on('click', _ => {
				if(this.Vlt.panel == 2) {
					$(`div#${this.id('panels')}`).attr('panel', '1');
					this.Vlt.panel = 1;
				} else {
					this.ascend('Destroy');
				}
			});
			$(`#${this.id('commentButton')}`).on('click', async _ => {
				comment();
			});

			com = await this.asuper(com);
			fun(null, com);
		}

	}

	return Viewify(TicketView, '3.5');
})();