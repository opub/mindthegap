var socket = io();

socket.on('priceUpdate', function (data) {
    var now = Date.now();
    for (var item of data) {
        console.log(item.symbol, item);
        var chart = getChart(item.symbol);
        console.log('chart', chart);
        chart.best.append(now, item.spreadPercent.best);
        chart.short.append(now, item.spreadPercent.short);
    }
});

var charts = new Map();

function getChart(symbol) {
    if (!charts.has(symbol)) {
        var parent = document.getElementById('wrapper');
        var wrapper = document.createElement('div');
        wrapper.className = 'chart-wrapper';
        parent.appendChild(wrapper);
        var title = document.createElement('div');
        title.className = 'chart-title';
        title.innerText = symbol;
        wrapper.appendChild(title);
        var canvas = document.createElement('canvas');
        canvas.id = 'chart-' + symbol.replace('/', '');
        canvas.width = 1600;
        canvas.height = 300;
        canvas.setAttribute('style', 'z-index: 1; position:relative;');
        wrapper.appendChild(canvas);

        var chart = new SmoothieChart({ grid: { strokeStyle: 'rgba(119,119,119,0.48)', millisPerLine: 20000, verticalSections: 6 }, tooltip: true, millisPerPixel: 500, minValueScale: 1.05, maxValueScale: 1.05 });
        var best = new TimeSeries(), short = new TimeSeries();
        chart.addTimeSeries(best, { lineWidth: 3, strokeStyle: '#00ff88' });
        chart.addTimeSeries(short, { lineWidth: 3, strokeStyle: '#0088ff' });
        chart.streamTo(canvas, 976);
        charts.set(symbol, { chart, best, short });
    }
    return charts.get(symbol);
}
