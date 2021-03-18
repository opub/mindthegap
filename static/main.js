var socket = io();

socket.on('priceUpdate', function (data) {
    var now = Date.now();
    for (var item of data) {
        console.log(item.symbol, item);
        var chart = getChart(item.symbol);
        console.log('chart', chart);
        chart.appendData([{
            data: [[now, item.spreadPercent.best]]
        }, {
            data: [[now, item.spreadPercent.short]]
        }]);
    }
});

var charts = new Map();

function getChart(symbol) {
    if (!charts.has(symbol)) {
        var id = symbol.replace('/', '').toLowerCase();
        var wrapper = document.getElementById('wrapper');
        var target = document.createElement('div');
        target.id = 'target-' + id;
        wrapper.appendChild(target);

        var loader = document.getElementById('loader');
        if(loader) {
            loader.remove();
        }

        var options = {
            series: [{ name: 'best', data: [] }, { name: 'short', data: [] }],
            chart: {
                id: 'chart-' + id,
                height: 250,
                type: 'line',
                animations: {
                    enabled: true,
                    easing: 'linear',
                    dynamicAnimation: {
                        speed: 1000
                    }
                },
                toolbar: {
                    show: false
                },
                zoom: {
                    enabled: false
                }
            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth'
            },
            title: {
                text: symbol,
                align: 'left'
            },
            markers: {
                size: 1
            },
            xaxis: {
                type: 'datetime'
            },
            legend: {
                show: false
            },
        };

        var chart = new ApexCharts(document.querySelector('#' + target.id), options);
        chart.render();

        charts.set(symbol, chart);
    }
    return charts.get(symbol);
}

window.Apex = {
    chart: {
      foreColor: '#fff',
      toolbar: {
        show: false
      },
    },
    colors: ['#FCCF31', '#17ead9', '#f02fc2'],
    stroke: {
      width: 3
    },
    dataLabels: {
      enabled: false
    },
    grid: {
      borderColor: "#40475D",
    },
    xaxis: {
      axisTicks: {
        color: '#333'
      },
      axisBorder: {
        color: "#333"
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        gradientToColors: ['#F55555', '#6078ea', '#6094ea']
      },
    },
    tooltip: {
      theme: 'dark',
      x: {
        formatter: function (val) {
          return moment(new Date(val)).format("HH:mm:ss")
        }
      }
    },
    yaxis: {
      decimalsInFloat: 2,
      opposite: true,
      labels: {
        offsetX: -10
      }
    }
  }