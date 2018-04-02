//# sourceURL=Chart
(function ChartView() {
	class ChartView {

		async Setup(com, fun){
			com = await this.asuper(com);
			fun(null, com);
		}

		async Start(com, fun) {
			log.d(`Chart/Start`)

			com = await this.asuper(com);

			await this.cdnImportJs("https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.7.2/Chart.bundle.js");

			var ctx = this.Par.$.myChart;
			var myChart = new Chart(ctx, {
				type: 'bar',
				data: {
					labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
					datasets: [{
						label: '# of Votes',
						data: [12, 19, 3, 5, 2, 3],
						backgroundColor: [
							'rgba(255, 99, 132, 0.2)',
							'rgba(54, 162, 235, 0.2)',
							'rgba(255, 206, 86, 0.2)',
							'rgba(75, 192, 192, 0.2)',
							'rgba(153, 102, 255, 0.2)',
							'rgba(255, 159, 64, 0.2)'
						],
						borderColor: [
							'rgba(255,99,132,1)',
							'rgba(54, 162, 235, 1)',
							'rgba(255, 206, 86, 1)',
							'rgba(75, 192, 192, 1)',
							'rgba(153, 102, 255, 1)',
							'rgba(255, 159, 64, 1)'
						],
						borderWidth: 1
					}]
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

			fun(null, com);

			setInterval(()=>{
				myChart.data.datasets.forEach((dataset) => {
					dataset.data=[Math.floor(10*Math.random()),Math.floor(10*Math.random()),Math.floor(10*Math.random()),Math.floor(10*Math.random()),Math.floor(10*Math.random()),Math.floor(10*Math.random())] ;
				});
				myChart.update();
			}, 1000);
		}
	}

	return Viewify(ChartView, "4.0");
})();