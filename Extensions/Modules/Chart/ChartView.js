//# sourceURL=Chart
(function ChartView() {
	class ChartView {

		/**
		 * Access the div of the view and other provisional setup.
		 * Also setup an array of colors to use for each of the sets. 
		 * @param {Object} com 
		 * @callback fun 
		 */
		async Setup(com, fun) {
			com = await this.asuper(com);
			this.Vlt.Colors = ['rgba(255, 0,0, 0.8)', 'rgba(0, 255, 0 , 0.8)', 'rgba(0, 0, 255, 0.8'];
			fun(null, com);
		}


		/**
		 * Subscribe to the server so that this module is available from the serverside.
		 * Load in the view canvas in Viewify (super)
		 * load in the cdn for chart.js
		 * @param {Object} com 
		 * @callback fun 
		 */
		async Start(com, fun) {
			log.i(`Chart/Start`);

			//subscribe to the server via the webproxy
			this.send({ Cmd: "Subscribe", Link: "Chart", Pid: this.Par.Pid }, this.Par.Server);

			com = await this.asuper(com);

			await this.cdnImportJs("https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.7.2/Chart.bundle.js");

			fun(null, com);
		}


		/**
		 * Adds new data to a chart or updates existing data
		 * @param {Object} com 
		 * @param {Array} com.Data 			the full array of data for the given channel
		 * @param {String} com.Channel	the name of the dataset to be displayed or updated
		 * @callback fun 
		 */
		AddData(com, fun) {
			// log.d(`ChartView/AddData ${JSON.stringify(com, null, 2)}`);

			if (!("Directory" in this.Vlt)) {
				this.Par.$.loader.css("display", "none");
				this.Vlt.Directory = [];

				var indexArray = [];
				com.Data.map((v, i, a) => { indexArray[i] = i; });

				var ctx = this.Par.$.myChart;
				this.Vlt.Chart = new Chart(ctx, {
					type: 'bar',
					data: {
						labels: indexArray,
						datasets: []
					},
					options: {
						scales: {
							yAxes: [{
								ticks: {
									beginAtZero: true
								}
							}]
						}
					}
				});
			}

			if (this.Vlt.Directory.indexOf(com.Channel) == -1) {
				this.Vlt.Directory.push(com.Channel);
			}
			let dataSetIndex = this.Vlt.Directory.indexOf(com.Channel);
			this.Vlt.Chart.labels = indexArray;
			if (this.Vlt.Chart.data.datasets.length == dataSetIndex)
				this.Vlt.Chart.data.datasets[dataSetIndex] = {};
			this.Vlt.Chart.data.datasets[dataSetIndex].data = com.Data;
			this.Vlt.Chart.data.datasets[dataSetIndex].label = com.Channel;
			this.Vlt.Chart.data.datasets[dataSetIndex].backgroundColor = this.Vlt.Colors[dataSetIndex];

			this.Vlt.Chart.update();
			fun(null, com);
		}

		Resize(com, fun) {
			if ("Chart" in this.Vlt)
				this.Vlt.Chart.resize();
			fun(null, com);
		}
	}

	return Viewify(ChartView, "4.0");
})();