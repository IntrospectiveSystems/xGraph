//# sourceURL=Ticket
(
    /**
	 * The Ticket entity is the ticket object for the xTickets system. Ticket handles getting and setting ticket data.
     * @returns {{dispatch}}
     */
	function Ticket(){
	class Tickets {
		async Setup(com, fun) {
			log.i('Ticket Created!');

			if (!('SetupComplete' in this.Par)) {
				this.Par.SetupComplete = false;
				this.Par.Status = 'New';
				this.Par.Comments = [];
				this.Par.Changes = [];
			}

			if(!('CreatedOn' in this.Par)){
				this.Par.CreatedOn = new Date().getTime();
			}

			fun(null, com);
		}

		AddComment(com, fun) {
			if(!('Authentication' in com.Passport)) return fun('Command needs Authentication', com);
			if(!com.Passport.Authentication.Valid) return fun('invalid credentials', com);

			let author = com.Passport.Authentication.DisplayName;
			let comment = com.Comment;
			let created = new Date().getTime();

			this.Par.Comments.push({
				Author: author,
				Comment: comment,
				Created: created
			});

			fun(null, com);
		}

		async GetData(com, fun) {
			log.i(`Getting Ticket Data, "${this.Par.Summary}"`);
			com.Summary = this.Par.Summary || "Untitled#" + this.Par.Pid.substr(0, 8);
			com.Details = this.Par.Details;
			com.Component = this.Par.Component;
			com.Version = this.Par.Version;
			com.Severity = this.Par.Severity;
			com.Priority = this.Par.Priority;

			com.DueBy = this.Par.DueBy;
			com.AssignedTo = this.Par.AssignedTo;
			com.Pid = pidInterchange(this.Par.Pid);
			com.CreatedOn = this.Par.CreatedOn;
			com.CreatedBy = this.Par.CreatedBy;
			com.PidInterchange = true;
			com.Status = this.Par.Status;
			com.Comments = this.Par.Comments;
			com.Changes = this.Par.Changes;
			com.Author = this.Par.Author;
			com.AuthorEmail = this.Par.AuthorEmail;
			com.AssignedToDisplayName = this.Par.AssignedToDisplayName;
			com.SetupComplete = this.Par.SetupComplete;

			fun(null, com);
		}

		async Accept(com, fun) {
			function nope(str) { log.w(str); fun(str, com)};
			if (!('Authentication' in com.Passport)) return nope('Must be logged in to accept ticket');
			if (com.Passport.Authentication.Valid != true) return nope('Invalid credentials');
			if (com.Passport.Authentication.Email != this.Par.AssignedTo) return nope(`${com.Passport.Authentication.DisplayName} cannot Accept this ticket, it is assigned to ${this.Par.AssignedTo}`);

			this.Par.Status = 'Accepted';
			this.Par.Changes.push({
				Message: `${com.Passport.Authentication.DisplayName} has accepted the ticket.`,
				Author: com.Passport.Authentication.DisplayName,
				Timestamp: new Date().getTime()
			});

			await new Promise((resolve, reject) => {
				this.send({
					Cmd: 'Broadcast',
					Command: {
						Cmd: 'DataUpdate'
					}
				}, this.Par.Broadcast, (err, cmd) => {
					resolve();
				});
			});

			this.save(_ => fun(null, com));
		}

		async Resolve(com, fun) {
			let nope = str => { log.w(str); fun(str, com) }
			if (!('Authentication' in com.Passport)) return nope('Must be logged in to resolve ticket');
			if (com.Passport.Authentication.Valid != true) return nope('Invalid credentials');
			if (com.Passport.Authentication.Email != this.Par.AssignedTo) return nope(`${com.Passport.Authentication.DisplayName} cannot Resolve this ticket, it is assigned to ${this.Par.AssignedTo}`);

			//reassign the ticket to the author for closing.
			this.Par.AssignedTo = this.Par.AuthorEmail;
			this.Par.AssignedToDisplayName = (await new Promise(res => {
				this.send({
					Cmd: 'GetUserDetails',
					Email: this.Par.AssignedTo
				}, this.Par.AuthServer, (err, cmd) => res(cmd));
			})).Name;
			
			this.Par.Status = "Resolved";

			await new Promise((resolve, reject) => {
				this.send({
					Cmd: 'Broadcast',
					Command: {
						Cmd: 'DataUpdate'
					}
				}, this.Par.Broadcast, (err, cmd) => {
					resolve();
				});
			});

			this.save(_ => fun(null, com));
		}

		async Close(com, fun) {
			function nope(str) { log.w(str); fun(str, com) }
			if (!('Authentication' in com.Passport)) return nope('Must be logged in to close ticket');
			if (com.Passport.Authentication.Valid != true) return nope('Invalid credentials');
			if (com.Passport.Authentication.Email != this.Par.AssignedTo) return nope(`${com.Passport.Authentication.DisplayName} cannot Close this ticket, it is assigned to ${this.Par.AssignedTo}`);

			this.Par.Status = "Closed";

			await new Promise((resolve, reject) => {
				this.send({
					Cmd: 'Broadcast',
					Command: {
						Cmd: 'DataUpdate'
					}
				}, this.Par.Broadcast, (err, cmd) => {
					resolve();
				});
			});


			this.save(_ => fun(null, com));
		}
		
		async SetMetaData(com, fun) {
			log.i('Setting Ticket Data');
			if (!('Authentication' in com.Passport)) return (log.w('Must be logged in to Set Ticket Data'), fun(null, com));
			if (com.Passport.Authentication.Valid != true) return (log.w('Invalid credentials'), fun(null, com));

			await new Promise((resolve, reject) => {
				this.send({
					Cmd: "AddItem",
					Item: this.Par.Broadcast || this.Par.Pid
				}, this.Par.List, (err, cmd) => {
					resolve();
				});
			});

			await new Promise((resolve, reject) => {
				this.send({
					Cmd: 'Broadcast',
					Command: {
						Cmd: 'DataUpdate'
					}
				}, this.Par.Broadcast, (err, cmd) => {
					resolve();
				});
			});

			let changes = {};

			if(!this.Par.SetupComplete) {
				this.Par.SetupComplete = true;
				this.Par.Changes.push({
					Message: `${com.Passport.Authentication.DisplayName} Created the ticket.`,
					Author: com.Passport.Authentication.DisplayName,
					Timestamp: new Date().getTime()
				});
				this.Par.Author = com.Passport.Authentication.DisplayName;
				this.Par.AuthorEmail = com.Passport.Authentication.Email;
			}
			// let diffs = JsDiff.diffChars("aasdfasdfasdfsdffdadsfasfdsfasaasfasfdfasdfassdf", "asdasfasdfdfasdssasdfsdfsdfdfssaasdasfasdfdffdag"), diffString = "";


			// for (let diff of diffs)
			// diffString += `<span style="color:${diff.added ? 'green' : (diff.removed ? 'red' : 'black')}">${diff.value}</span>`;

			// this.Par.CreatedOn = com.CreatedOn;
			if ((this.Par.Summary || "") != com.Summary) {
				changes.Summary = {
					before: (this.Par.Summary || "").substr(0),
					after: com.Summary.substr(0)
				}
				this.Par.Summary = com.Summary;
			}

			if ((this.Par.Details || "") != com.Details) {
				changes.Details = {
					before: (this.Par.Details || "").substr(0),
					after: com.Details.substr(0)
				}
				this.Par.Details = com.Details;
			}

			if ((this.Par.Component || "") != com.Component) {
				changes.Component = {
					before: (this.Par.Component || "").substr(0),
					after: com.Component.substr(0)
				}
				this.Par.Component = com.Component;
			}

			if ((this.Par.Version || "") != com.Version) {
				changes.Version = {
					before: (this.Par.Version || "").substr(0),
					after: com.Version.substr(0)
				}
				this.Par.Version = com.Version;
			}

			if ((this.Par.Severity || 0) != com.Severity) {
				changes.Severity = {
					before: (this.Par.Severity || 0),
					after: com.Severity
				}
				this.Par.Severity = com.Severity;
			}

			if ((this.Par.Priority || 0) != com.Priority) {
				changes.Priority = {
					before: (this.Par.Priority || 0),
					after: com.Priority
				}
				this.Par.Priority = com.Priority;
			}

			if ((this.Par.DueBy || "") != com.DueBy) {
				changes.DueBy = {
					before: (this.Par.DueBy || ""),
					after: com.DueBy
				}
				this.Par.DueBy = com.DueBy;
			}

			if ((this.Par.AssignedTo || "") != com.AssignedTo) {
				changes.AssignedTo = {
					before: (this.Par.AssignedTo || "").substr(0),
					after: com.AssignedTo.substr(0)
				}
				if(this.Par.Status == 'New') this.Par.Status = 'Assigned';
				else this.Par.Status = 'Re-Assigned';
				this.Par.AssignedTo = com.AssignedTo;
				// figure out their name
				this.Par.AssignedToDisplayName = (await 
					
					
					new Promise(res => this.send({ Cmd: 'GetUserDetails', Email: com.AssignedTo }, this.Par.AuthServer, (err, cmd) => res(cmd)))
				
				
				
				
				).Name;
				log.v(`assigned to ${this.Par.AssignedTo}`);
				log.v(`assigned to ${this.Par.AssignedToDisplayName}`);
			}




			if(Object.keys(changes).length > 0) {
				//changes were made
				let timestamp = new Date().getTime();
				let author = com.Passport.Authentication.DisplayName;
				changes.Author = author;
				changes.Timestamp = timestamp;
				this.Par.Changes.push(changes);
			}

			this.save(_ => fun(null, com));
		}

		async Evoke(com, fun) {
			if(!this.Par.SetupComplete || com.Type == 'Edit') {
				com.View = "Views.TicketEditView";
			} else if (com.Type == 'History') {
				com.View = "Views.TicketHistoryView";
			} else if (com.Type == 'Comments') {
				com.View = "Views.TicketCommentsView";
			} else {
				com.View = "Views.TicketView";
			}
			com.Type = "View";
			com.Container = "Views.Paper.BottomSheet" || this.Par.BottomSheet;
			com.Par = {
				Ticket: pidInterchange(this.Par.Pid),
				AuthenticationServer: pidInterchange(this.Par.AuthServer)
			};
			com.PidInterchange = true;
			fun(null, com);
		}
	}

	return {dispatch: Tickets.prototype};
})();