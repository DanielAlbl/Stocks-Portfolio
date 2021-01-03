function Round(x,n) {
    var mult = Math.pow(10,n);
    return Math.round(mult*x)/mult
}
function GetInc(data,interval) {
    var s = data.length;
    var t = Math.round(interval);
    var inc = []
    for(var i=0; i<s-t; i++) 
        inc.push(data[i+t]/data[i]);
    return inc;
}
function Mean(data) {
    var sum = 0;
    for(var i=0; i<data.length; i++) 
        sum += data[i];
    sum /= data.length;
    return sum;
}
function Std(data,mean) {
    var ss = 0;
    for(var i=0; i<data.length; i++) 
        ss += (data[i]-mean)*(data[i]-mean);
    ss /= data.length;
    return Math.sqrt(ss);
}
function GetLogInc() {
    var log_inc = [];
    for(var i=0; i<INC.length; i++) 
        log_inc[i] = Math.log(INC[i]);
    return log_inc;
}
function LogMean() {
    return Mean(LOG_INC);
}
function Volatility() {
    var mean = Mean(LOG_INC);
    var ss = 0;
    for(var i=0; i<LOG_INC.length; i++) 
        ss += (LOG_INC[i]-mean)*(LOG_INC[i]-mean);
    ss /= LOG_INC.length;
    return Math.sqrt(ss);
}
function Logslider(pos,min,max) {
    var pos = Number(pos);
    var minVal = Math.log(min);
    var maxVal = Math.log(max);

    var scale = (maxVal-minVal) / (MAX_POS-MIN_POS);

    var val = Math.exp(minVal + scale*(pos-MIN_POS));
    
    // make nearest value to a year be exactly a year
    var nearestYear = Math.floor(val/365.25);
    if(365.25*(nearestYear+1)-val < val-365.25*nearestYear)
        nearestYear++;
    if(nearestYear == 0)
        return Math.round(val);
    var last = Math.exp(minVal + scale*(pos-1-MIN_POS));
    var next = Math.exp(minVal + scale*(pos+1-MIN_POS));
    var lastDist = Math.abs(last-365.25*nearestYear);
    var nextDist = Math.abs(next-365.25*nearestYear);
    var dist = Math.abs(val-365.25*nearestYear);
    if(dist < lastDist && dist < nextDist)
        return 365.25*nearestYear;
    return Math.round(val);
}
function LogsliderInverse(val,min,max) {
    var val = Number(val);
    var minVal = Math.log(min);
    var maxVal = Math.log(max);

    var scale = (maxVal-minVal) / (MAX_POS-MIN_POS);
    
    var pos = (Math.log(val) - minVal)/scale + MIN_POS;
    if(pos > max)
        return max;
    return Math.round(pos);
}
function Graph(bins) {
    var trace = {
        x: INC,
        type: 'histogram',
        xbins: {
            end: MEAN + 3*STD,
            size: 6*STD / bins,
            start: MEAN - 3*STD
        }
    };
    var data = [trace];
    var layout = {
        xaxis: { 
		title: 'Times growth per time interval',
		tickfont: { size: 14 }
	},
        yaxis: {
            showticklabels: false,
            showgrid: false
        },
        layout: { autosize: true }
    };

    $('#title').text(TICKER);
    
    Plotly.newPlot('graph',data,layout,{displayModeBar: false});
}
var ChangeInterval = function(param) {
    if(param.data.initial != 'false') 
        $('#interval').val(INTERVAL_POS);

    interval = Logslider($('#interval').val(),1,HIST.length);	

    INC = GetInc(HIST,interval);
    MEAN = Mean(INC);
    STD = Std(INC,MEAN);
    LOG_INC = GetLogInc();
    LOG_MEAN = LogMean();
    VOLATILITY = Volatility();

    var years = Math.floor(interval / 365.25);
    var days = Math.round(interval - 365.25*years);
    
    $('#intervalVal').text(years + ' y ' + days + ' d');
    $('#intervalHidden').val(interval);
  
    $('#mean').text(Round(MEAN,4));
    $('#std').text(Round(STD,4));
    $('#rar').text(Round(LOG_MEAN/VOLATILITY,4));
    $('#logMean').text(Round(Math.exp(LOG_MEAN),4));
    $('#volatility').text(Round(VOLATILITY,4));

    Graph(bins);
}
var ChangeBins = function(param) {
    if(param.data.initial != 'false')
        $('#bins').val(BINS_POS);
    
    bins = Logslider($('#bins').val(),10,1000);		
    bins = Math.round(bins)

    $('#binVal').text(bins);
    $('#binsHidden').val($('#bins').val());
    Graph(bins);
}
