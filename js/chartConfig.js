Chart.defaults.global.defaultFontFamily = 'Source Code Pro';
Chart.defaults.global.elements.point.radius = 0;
Chart.defaults.global.elements.line.borderWidth = 1;
Chart.defaults.global.legend.position = 'bottom';
Chart.defaults.global.legend.display = false;
Chart.defaults.global.animation.duration = 500;
Chart.defaults.global.hover.mode = 'point';
Chart.defaults.global.hover.intersect = false;

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
var width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
if (width <= 414) {
  Chart.defaults.global.defaultFontSize = 10;
}
