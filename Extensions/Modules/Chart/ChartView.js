//# sourceURL=Chart
(function ChartView() {
	class ChartView {

		async Setup(com, fun) {
			com = await this.asuper(com);
			this.Vlt.Colors = ['rgba(255, 0,0, 0.8)', 'rgba(0, 0,255, 0.8)', 'rgba(0, 255, 9, 0.8'];
			fun(null, com);
		}

		async Start(com, fun) {
			log.i(`Chart/Start`);

			//subscribe to the server via the webproxy
			this.send({ Cmd: "Subscribe", Link: "Chart", Pid: this.Par.Pid }, this.Par.Server);

			com = await this.asuper(com);

			await this.cdnImportJs("https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.7.2/Chart.bundle.js");


			// var ctx = this.Par.$.myChart;
			// let exampleData = [1, 2, 3];
			// let indexArray = [];
			// exampleData.map((v, i, a) => { indexArray[i] = i; });

			// this.Vlt.Chart = new Chart(ctx, {
			// 	type: 'bar',
			// 	data: {
			// 		labels: indexArray,
			// 		datasets: [{
			// 			data: exampleData,
			// 			label: "example",
			// 			backgroundColor: 'rgba(255, 0,0, 0.2)'
			// 		}]
			// 	},
			// 	options: {
			// 		scales: {
			// 			yAxes: [{
			// 				ticks: {
			// 					beginAtZero: true
			// 				}
			// 			}]
			// 		}
			// 	}
			// });

			fun(null, com);

			// setInterval(()=>{
			// 	myChart.data.datasets.forEach((dataset) => {
			// 		dataset.data=[Math.floor(10*Math.random()),Math.floor(10*Math.random()),Math.floor(10*Math.random()),Math.floor(10*Math.random()),Math.floor(10*Math.random()),Math.floor(10*Math.random())] ;
			// 	});
			// 	myChart.update();
			// }, 1000);
		}

		AddData(com, fun) {
			// log.d(`ChartView/AddData ${JSON.stringify(com, null, 2)}`);

			if (!("Directory" in this.Vlt)) {
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
			this.Vlt.Chart.resize();
			fun(null, com);
		}
	}

	return Viewify(ChartView, "4.0");
})();