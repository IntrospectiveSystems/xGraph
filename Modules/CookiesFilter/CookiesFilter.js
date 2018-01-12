//# sourceURL=CookiesFilter.js
(function CookiesFilter() {
	class CookiesFilter {
		async GetData(com, fun) {
			let data = await new Promise((resolve, reject) => {
				this.send('GetData', this.Par.Source, (err, cmd) => {
					
				});
			});
		}
	}
	return {dispatch:CookiesFilter.prototype}
})();