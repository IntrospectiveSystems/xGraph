(function() {
	return {dispatch: {GetData: function(com, fun) {
		this.send(com, this.Par.From, (err, cmd) => {
			if(!('Key' in this.Par && (('!=' in this.Par) || ('==' in this.Par)))) {
				fun(null, cmd);
				return;
			}
			let op = "";
			if ('!=' in this.Par) op = '!=';
			if ('==' in this.Par) op = '==';
			let filter = this.Par[op]
			let where = this.Par.Where || 'Data';
			let arr = []
			for(let item in cmd[where]) {
				let val = item[this.Par.Key]
				switch (op) {
					case '==': {
						if(val == filter)
							arr.push(item)
						break;
					}
					case '!=': {
						if (val != filter)
							arr.push(item)
						break;
					}
				}
			}
		})
	}}};
})();


/*
{
	"Where": "Data"
	"From": "Tickets",
	"Key": "Status",
	"!=": "Closed"
}
*/