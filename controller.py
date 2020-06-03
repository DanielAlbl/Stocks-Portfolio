import pandas as pd
import numpy as np
import time
import math
import datetime
import matplotlib.pyplot as plt
import yfinance as yf
from json import dumps
from flask import Flask, render_template, request, url_for
from logging import FileHandler, WARNING
 
def makeNpArray(name):
    P = yf.Ticker(name).history(period='max')
    N = P.to_numpy()
    N = N[:,3]
    size = N.size
    idx = 0
    for i in range(size-1):
        date = P['Close'].keys()[i]
        next = P['Close'].keys()[i+1]
        date += datetime.timedelta(days=1)
        days = 0
        while date != next:
            N = np.insert(N,idx+1,N[idx])
            date += datetime.timedelta(days=1)
            idx+=1
            days+=1
        
        if days and N[idx+1]/N[idx]:
            interp = math.exp(math.log(N[idx+1]/N[idx])/(days+1))
            for j in range(days):
                N[idx-days+1+j] = N[idx-days+j] * interp
            
        idx+=1
    N = N[np.logical_not(N==0)]
    N = N[np.logical_not(np.isnan(N))]
    return N

def addCaret(name):
    name = name.upper()
    caret = yf.Ticker('^'+name).history(period='1d')
    # day trading etfs have historical data for 1 day, with 7 catagories (thus size 7)
    if not caret.empty and caret.size > 7: 
        return '^' + name
    original = yf.Ticker(name).history(period='1d')
    if not original.empty:
        return name
    return False

##################################################################

app = Flask(__name__)

handler = FileHandler('errors.txt')
handler.setLevel(WARNING)
app.logger.addHandler(handler)

if __name__ == '__main__':
    app.run(debug=False) 

##################################################################

@app.route("/")
def home():
    return render_template('home.html')

@app.route("/StockGrowth", methods=['GET','POST'])
def stocks():
    if request.method == 'POST':
        Ticker = request.form['Ticker']
        Ticker = addCaret(Ticker)
        if not Ticker:
            Ticker = '^GSPC'
        Interval = request.form['Interval']
        Bins = request.form['Bins']
    else:
        Ticker = '^GSPC'
        Interval = 365
        Bins = 500

    NpArray = makeNpArray(Ticker)
    JSON = dumps(NpArray.tolist())

    return render_template('stocks.html',historical=JSON,Ticker=Ticker,interval=Interval,bins=Bins)

@app.route("/StockGrowth/Questions", methods=['GET','POST'])
def questions():
    return render_template('questions.html')

@app.route("/RubiksCube")
def rubix():
    return render_template('rubix.html')

   
