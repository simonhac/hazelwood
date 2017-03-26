Chart.defaults.global.defaultFontFamily = 'Source Code Pro';
Chart.defaults.global.elements.point.radius = 0;
Chart.defaults.global.elements.line.borderWidth = 1;
Chart.defaults.global.legend.position = 'bottom';
Chart.defaults.global.legend.display = false;

var config = {
  type: 'line',
  data: {},
  options: {
    responsive: true,
    title: {
      display: false,
      text: 'Mega Boilers.'
    },
    tooltips: {
      mode: 'index',
    },
    hover: {
      mode: 'index'
    },
    scales: {
      xAxes: [{
				type: 'time',
				time: {
          unit: 'day',
					displayFormats: {
            day: 'D MMM',
            minute: 'h:mma'
					}
				},
        scaleLabel: {
          display: false,
          labelString: 'Date'
        }
      }],
      yAxes: [{
        stacked: true,
				ticks: {
          beginAtZero: true,
					max: 1600
				},
        scaleLabel: {
          display: true,
          labelString: 'megawatts'
        }
      }]
    }
  }
};
