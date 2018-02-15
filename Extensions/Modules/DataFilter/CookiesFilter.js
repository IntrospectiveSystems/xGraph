//# sourceURL=DataFilter.js
(function CookiesFilter() {
	class CookiesFilter {
		async GetData(com, fun) {
			let data = await new Promise((resolve, reject) => {
				this.send({ Cmd: 'GetData' }, this.Par.Source, (err, cmd) => {
					let arr = []; // assuuming its a list in data
					for(let item of cmd.Data) {
						//if its a match, add it
						if ('Equals' in this.Par && item[this.Par.DataKey] == this.Par.Equals) {
							arr.push(item);
						}
						else if ('DoesNotEqual' in this.Par && item[this.Par.DataKey] != this.Par.DoesNotEqual) {
							arr.push(item);
						}
					}
					//replace the data with our new data
					com.Data = arr;
					fun(null, com);
				});
			});
		}
	}

	CookiesFilter.prototype['*'] = async function(com, fun) {
		this.send(com, this.Par.Source, fun);
	}

	return {dispatch:CookiesFilter.prototype}
})();