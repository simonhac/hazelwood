var sampleData = {
  labels: [
    moment('2017-03-25T14:30:00+1000'),
    moment('2017-03-25T14:35:00+1000'),
    moment('2017-03-25T14:40:00+1000'),
    moment('2017-03-25T14:45:00+1000'),
    moment('2017-03-25T14:50:00+1000'),
    moment('2017-03-25T14:55:00+1000'),
    moment('2017-03-25T15:00:00+1000'),
    moment('2017-03-25T15:05:00+1000'),
    moment('2017-03-25T15:10:00+1000'),
    moment('2017-03-25T15:15:00+1000'),
    moment('2017-03-25T15:20:00+1000'),
    moment('2017-03-25T15:25:00+1000'),
    moment('2017-03-25T15:30:00+1000')
  ],
  series: [
    {
      name: 'Boiler 1',
      data: [149.0, 140.0, 149.0, 148.0, 148.0, 146.0, 149.0, 150.0, 149.0, 149.0, 149.0, 148.0, 149.0]
    },
    {
      name: 'Boiler 2',
      data: [151.0, 152.0, 139.0, 150.0, 149.0, 149.0, 146.0, 149.0, 151.0, 150.0, 151.0, 150.0, 149.0]
    },
    {
      name: 'Boiler 3',
      data: [170.0, 169.0, 170.0, 169.0, 169.0, 169.0, 170.0, 170.0, 170.0, 170.0, 170.0, 170.0, 170.0]
    },
    {
      name: 'Boiler 4',
      data: [156.0, 157.0, 156.0, 156.0, 156.0, 156.0, 156.0, 156.0, 157.0, 156.0, 157.0, 157.0, 156.0]
    },
    {
      name: 'Boiler 5',
      data: [149.0, 140.0, 149.0, 148.0, 148.0, 146.0, 149.0, 150.0, 149.0, 149.0, 149.0, 148.0, 149.0]
    },
    {
      name: 'Boiler 6',
      data: [151.0, 152.0, 139.0, 150.0, 149.0, 149.0, 146.0, 149.0, 151.0, 150.0, 151.0, 150.0, 149.0]
    },
    {
      name: 'Boiler 7',
      data: [170.0, 169.0, 170.0, 169.0, 169.0, 169.0, 170.0, 170.0, 170.0, 170.0, 170.0, 170.0, 170.0]
    },
    {
      name: 'Boiler 8',
      data: [156.0, 157.0, 156.0, 156.0, 156.0, 156.0, 156.0, 156.0, 157.0, 156.0, 157.0, 157.0, 156.0]
    }
  ]
}

var sampleChartData = {
  labels: sampleData.labels,
  datasets: [
    {
      label: sampleData.series[0].name,
      data: sampleData.series[0].data,
      borderColor: window.chartColors.grey,
      backgroundColor: window.chartColors.grey,
    },
    {
      label: sampleData.series[1].name,
      data: sampleData.series[1].data,
      borderColor: window.chartColors.grey,
      backgroundColor: window.chartColors.grey,
    },
    {
      label: sampleData.series[2].name,
      data: sampleData.series[2].data,
      borderColor: window.chartColors.grey,
      backgroundColor: window.chartColors.grey,
    },
    {
      label: sampleData.series[3].name,
      data: sampleData.series[3].data,
      borderColor: window.chartColors.grey,
      backgroundColor: window.chartColors.grey,
    },
    {
      label: sampleData.series[4].name,
      data: sampleData.series[4].data,
      borderColor: window.chartColors.grey,
      backgroundColor: window.chartColors.grey,
    },
    {
      label: sampleData.series[5].name,
      data: sampleData.series[5].data,
      borderColor: window.chartColors.grey,
      backgroundColor: window.chartColors.grey,
    },
    {
      label: sampleData.series[6].name,
      data: sampleData.series[6].data,
      borderColor: window.chartColors.grey,
      backgroundColor: window.chartColors.grey,
    },
    {
      label: sampleData.series[7].name,
      data: sampleData.series[7].data,
      borderColor: window.chartColors.grey,
      backgroundColor: window.chartColors.grey,
    }
  ]
}
