/* client functions */
'use strict';

window.chartColors = {
	red: 'rgba(255, 99, 132, 0.5)',
	orange: 'rgba(255, 159, 64, 0.5)',
	yellow: 'rgba(255, 205, 86, 0.5)',
	green: 'rgba(75, 192, 192, 0.5)',
	blue: 'rgba(54, 162, 235, 0.5)',
	purple: 'rgba(153, 102, 255, 0.5)',
	grey: 'rgba(201, 203, 207, 0.2)'
};

window.greyColors = {
	grey1: 'rgb(104, 104, 104)',
	grey2: 'rgb(125, 125, 125)',
	grey3: 'rgb(143, 143, 143)',
	grey4: 'rgb(165, 165, 165)',
	grey5: 'rgb(181, 181, 181)',
	grey6: 'rgb(198, 198, 198)',
	grey7: 'rgb(213, 213, 213)',
	grey8: 'rgb(227, 227, 227)'
};

window.randomScalingFactor = function() {
	return (Math.random() > 0.5 ? 1.0 : 1.0) * Math.round(Math.random() * 1600);
};

function showNasties(nasties) {
  var howLong = 6000; //milliseconds
  var transitionTime = 1500;
  var showClass = 'show';
  var nastyText = document.getElementById('nasty');
  var nastyIndex = 0;
  var nastyCount = nasties.length;

	function getLabel(index) {
		return '…and no longer adding ' + nasties[nastyIndex] + ' annually to our air and water.';
	}

	nastyText.innerHTML = getLabel(nastyIndex);
  nastyText.className = showClass;
  nastyIndex++;

  setInterval(function() {
    nastyText.className = '';

    setTimeout(function() {
      nastyText.innerHTML = getLabel(nastyIndex);
      nastyText.className = showClass;
      nastyIndex++;
      if (nastyIndex === nastyCount) {
        nastyIndex = 0;
      }
    }, transitionTime);
  }, howLong);
}

function setupChart() {
  var chartData = {
    labels: [],
    datasets: [
      {label: 'Unit 1', data: [], borderColor: window.greyColors.grey1, backgroundColor: window.greyColors.grey1},
      {label: 'Unit 2', data: [], borderColor: window.greyColors.grey2, backgroundColor: window.greyColors.grey2},
      {label: 'Unit 3', data: [], borderColor: window.greyColors.grey3, backgroundColor: window.greyColors.grey3},
      {label: 'Unit 4', data: [], borderColor: window.greyColors.grey4, backgroundColor: window.greyColors.grey4},
      {label: 'Unit 5', data: [], borderColor: window.greyColors.grey5, backgroundColor: window.greyColors.grey5},
      {label: 'Unit 6', data: [], borderColor: window.greyColors.grey6, backgroundColor: window.greyColors.grey6},
      {label: 'Unit 7', data: [], borderColor: window.greyColors.grey7, backgroundColor: window.greyColors.grey7},
      {label: 'Unit 8', data: [], borderColor: window.greyColors.grey8, backgroundColor: window.greyColors.grey8},
    ]
  };

  var s = moment('2017-03-26 00:00').valueOf();
  var e = moment('2017-03-30 00:00').valueOf();

  while (s <= e) {
    chartData.labels.push(moment(s).valueOf());
    chartData.datasets.forEach(function(dataset) {
      dataset.data.push(0);
    });
    s = s + 300000; // add 5 mins
  }
  chartData.labels.push(moment(e));

  return chartData;
}

// get dispatch
function getDispatchData(url, successCB) {
	nanoajax.ajax({
		url: url},
		function (code, responseText) {
			var j = JSON.parse(responseText);

			j.forEach(function(row) {
				var findIndex = config.data.labels.indexOf(moment(row[0]).valueOf());
				for (var i = 0; i<8; i++) {
					config.data.datasets[i].data[findIndex] = row[i+1];
				}
			});

			// for last row, sum it up
			var total = 0;
			var lastJ = j[j.length-1];
			for (var i = 0; i<8; i++) {
				total += parseFloat(lastJ[i+1]);
			}

			successCB(total);

			window.chart.update();
			console.log('chart updated.');
		}
	);
}

function updateStats(output, emissions) {
	var $heroDiv = document.getElementById('hero-text');
	var $loading = document.getElementById('loading');
	var $output = document.getElementById('output');
	var $emissions = document.getElementById('emissions');

	// $output.innerHTML = Math.round(output * 100 / 1600);
	// $emissions.innerHTML = 0;

	$heroDiv.className = 'main show';
	$loading.className = 'hide';
}
