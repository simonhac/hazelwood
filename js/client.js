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
	grey1: 'rgb(227, 227, 227)',
	grey2: 'rgb(213, 213, 213)',
	grey3: 'rgb(198, 198, 198)',
	grey4: 'rgb(181, 181, 181)',
	grey5: 'rgb(165, 165, 165)',
	grey6: 'rgb(143, 143, 143)',
	grey7: 'rgb(125, 125, 125)',
	grey8: 'rgb(104, 104, 104)'
};

window.randomScalingFactor = function() {
	// return (Math.random() > 0.5 ? 1.0 : -1.0) * Math.round(Math.random() * 1600);
	return (Math.random() > 0.5 ? 1.0 : 1.0) * Math.round(Math.random() * 1600);
};

// var csv is the CSV file with headers
function csvJSON(csv) {
  var lines = csv.split("\n");
  var result = [];
  var headers=lines[0].split(",");
  for(var i=1;i<lines.length;i++){
      var obj = {};
      var currentline=lines[i].split(",");
      for(var j=0;j<headers.length;j++){
        obj[j] = currentline[j];
      }
      result.push(obj);
  }
  return result; //JavaScript object
  // return JSON.stringify(result); //JSON
}

function showNasties() {
  var nasties = [
    '<h1>534 kg CO<sub>2</sub></h1><h4>per second</h4>',
    '<h1>123 kg CO<sub>2</sub></h1><h4>per second</h4>',
    '<h1>456 kg CO<sub>2</sub></h1><h4>per second</h4>',
    '<h1>789 kg CO<sub>2</sub></h1><h4>per second</h4>',
    '<h1>999 kg CO<sub>2</sub></h1><h4>per second</h4>',
    '<h1>1234 kg CO<sub>2</sub></h1><h4>per second</h4>',
    '<h1>986 kg CO<sub>2</sub></h1><h4>per second</h4>',
    '<h1>3526 kg CO<sub>2</sub></h1><h4>per second</h4>'
  ];
  var howLong = 6000; //milliseconds
  var transitionTime = 1500;
  var showClass = 'show';
  var nastyText = document.getElementById('nasty');
  var nastyIndex = 0;
  var nastyCount = nasties.length;

  nastyText.innerHTML = nasties[nastyIndex];
  nastyText.className = showClass;
  nastyIndex++;

  setInterval(function() {
    nastyText.className = '';

    setTimeout(function() {
      nastyText.innerHTML = nasties[nastyIndex];
      nastyText.className = showClass;
      nastyIndex++;
      if (nastyIndex === nastyCount) {
        nastyIndex = 0;
      }
    }, transitionTime)
  }, howLong);
}

function setupChart() {
  var chartData = {
    labels: [],
    datasets: [
      {label: 'Boiler 1', data: [], borderColor: window.greyColors.grey1, backgroundColor: window.greyColors.grey1},
      {label: 'Boiler 2', data: [], borderColor: window.greyColors.grey2, backgroundColor: window.greyColors.grey2},
      {label: 'Boiler 3', data: [], borderColor: window.greyColors.grey3, backgroundColor: window.greyColors.grey3},
      {label: 'Boiler 4', data: [], borderColor: window.greyColors.grey4, backgroundColor: window.greyColors.grey4},
      {label: 'Boiler 5', data: [], borderColor: window.greyColors.grey5, backgroundColor: window.greyColors.grey5},
      {label: 'Boiler 6', data: [], borderColor: window.greyColors.grey6, backgroundColor: window.greyColors.grey6},
      {label: 'Boiler 7', data: [], borderColor: window.greyColors.grey7, backgroundColor: window.greyColors.grey7},
      {label: 'Boiler 8', data: [], borderColor: window.greyColors.grey8, backgroundColor: window.greyColors.grey8},
    ]
  };
  var s = moment('2017-03-25 00:00').valueOf();
  var e = moment('2017-04-01 24:00').valueOf();

  while (s <= e) {
    chartData.labels.push(moment(s).valueOf());
    chartData.datasets.forEach(function(dataset) {
      dataset.data.push(0);
    })
    s = s + 300000; // add 5 mins
  }
  chartData.labels.push(moment(e));

  return chartData;
}

function getDispatchData() {
  nanoajax.ajax({
    url:'/data/dispatch.csv'},
    function (code, responseText) {
      var j = csvJSON(responseText);
      j.pop();
      j.forEach(function(row) {
        var findIndex = config.data.labels.indexOf(moment(row[0]).valueOf());
        for (var i = 0; i<8; i++) {
          config.data.datasets[i].data[findIndex] = row[i+1];
        }
      });
      window.myLine.update();
    }
  );
}
