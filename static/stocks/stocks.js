"use strict";

function Round(x, n) {
    const mult = Math.pow(10, n);
    return Math.round(mult * x) / mult
}

function GetInc(data, interval) {
    const s = data.length;
    const t = Math.round(interval);
    const inc = []

    for(let i=0; i<s-t; i++)
        inc.push(data[i+t] / data[i]);
    
    return inc;
}

function Mean(data) {
    let sum = 0;

    for(let i = 0; i < data.length; i++)
        sum += data[i];
    sum /= data.length;
    
    return sum;
}

function Std(data, mean) {
    let ss = 0;

    for(let i = 0; i < data.length; i++)
        ss += (data[i]-mean) * (data[i]-mean);
    ss /= data.length;

    return Math.sqrt(ss);
}

function GetLogInc() {
    let log_inc = [];

    for(let i = 0; i < INC.length; i++)
        log_inc[i] = Math.log(INC[i]);

    return log_inc;
}

function LogMean() {
    return Mean(LOG_INC);
}

function Volatility() {
    const mean = Mean(LOG_INC);
    let ss = 0;

    for(let i = 0; i < LOG_INC.length; i++)
        ss += (LOG_INC[i]-mean) * (LOG_INC[i]-mean);
    ss /= LOG_INC.length;

    return Math.sqrt(ss);
}

function Logslider(pos,min,max) {
    pos = Number(pos);
    const minVal = Math.log(min);
    const maxVal = Math.log(max);

    const scale = (maxVal-minVal) / (MAX_POS-MIN_POS);
    const val = Math.exp(minVal + scale*(pos-MIN_POS));
    
    // make nearest value to a year be exactly a year
    let nearestYear = Math.floor(val/365.25);
    if(365.25*(nearestYear+1)-val < val-365.25*nearestYear)
        nearestYear++;
    if(nearestYear === 0)
        return Math.round(val);

    const last = Math.exp(minVal + scale*(pos-1 - MIN_POS));
    const next = Math.exp(minVal + scale*(pos+1 - MIN_POS));
    const lastDist = Math.abs(last - 365.25*nearestYear);
    const nextDist = Math.abs(next - 365.25*nearestYear);
    const dist = Math.abs(val - 365.25*nearestYear);

    if(dist < lastDist && dist < nextDist)
        return 365.25*nearestYear;
    return Math.round(val);
}

function LogsliderInverse(val, min, max) {
    val = Number(val);
    const minVal = Math.log(min);
    const maxVal = Math.log(max);

    const scale = (maxVal-minVal) / (MAX_POS-MIN_POS);
    const pos = (Math.log(val) - minVal)/scale + MIN_POS;

    if(pos > max)
        return max;
    return Math.round(pos);
}
function Graph(bins) {
    const trace = {
        x: INC,
        type: 'histogram',
        xbins: {
            end: MEAN + 3*STD,
            size: 6*STD / bins,
            start: MEAN - 3*STD
        }
    };
    const data = [trace];
    const layout = {
        xaxis: { 
	    title: 'Times growth per time interval',
            tickfont: { size: 14 }
	},
        yaxis: {
            showticklabels: false,
            showgrid: false
        },
	paper_bgcolor: "#222",
	plot_bgcolor: "#222",
	font: { color: "white" },
    };

    $('#title').text(`${TICKER}:`);
    
    Plotly.newPlot('graph', data, layout, {displayModeBar: false});
}

const ChangeBins = function(param) {
    if(param.data.initial !== 'false')
        $('#bins').val(BINS_POS);

    let bins = Logslider($('#bins').val(), 10, 1000);
    bins = Math.round(bins)

    $('#binVal').text(bins);
    $('#binsHidden').val($('#bins').val());
    Graph(bins);
};
const ChangeInterval = function (param) {
    if (param.data.initial !== 'false')
        $('#interval').val(INTERVAL_POS);

    let interval = Logslider($('#interval').val(), 1, HIST.length);

    INC = GetInc(HIST, interval);
    MEAN = Mean(INC);
    STD = Std(INC, MEAN);
    LOG_INC = GetLogInc();
    LOG_MEAN = LogMean();
    VOLATILITY = Volatility();

    const years = Math.floor(interval / 365.25);
    const days = Math.round(interval - 365.25 * years);

    $('#intervalVal').text(years + ' y ' + days + ' d');
    $('#intervalHidden').val(interval);

    $('#mean').text(Round(MEAN, 4));
    $('#std').text(Round(STD, 4));
    $('#rar').text(Round(LOG_MEAN / VOLATILITY, 4));
    $('#logMean').text(Round(Math.exp(LOG_MEAN), 4));
    $('#volatility').text(Round(VOLATILITY, 4));

    ChangeBins({data: {initial: 'false'}});
};
