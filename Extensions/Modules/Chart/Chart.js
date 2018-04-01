//# sourceURL=Chart
(function Chart() {
	class Test {

		async Setup(com, fun){
			com = await this.asuper(com);
			fun(null, com);
		}
		async Start(com, fun) {
			log.d(`Start>??1`)

			com = await this.asuper(com);
			log.d(`Start>??2`)

			var ctx = document.getElementById("myChart");
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

		}

		async RunSystem(com, fun) {
			this.Par.$.root.attr('running', '');
			fun(null, com);
		}

		async StopSystem(com, fun) {
			this.Par.$.root.attr('running', null)
			fun(null, com);
		}
	}

	return Viewify(Test, "4.0");
})();