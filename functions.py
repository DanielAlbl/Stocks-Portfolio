import math
import re
import numpy as np
import pandas as pd
import yfinance as yf
import datetime
import mysql.connector
from json import dumps
from flask import Flask, render_template, request, url_for
from logging import FileHandler, WARNING

def makeNpArray(name):
    P = yf.Ticker(name).history(period='max')
    N = P.to_numpy()
    N = N[:, 3]
    size = N.size
    idx = 0
    for i in range(size-1):
        date = P['Close'].keys()[i]
        next = P['Close'].keys()[i+1]
        date += datetime.timedelta(days=1)
        days = 0
        while date != next:
            N = np.insert(N, idx+1, N[idx])
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

def initial(cursor):
    cursor.execute("SELECT Inc FROM TickerInc WHERE Ticker = 'SPY';")
    inc = cursor.fetchall()
    return dumps(inc)

def fromDatabase(cursor, ticker):
    select = "SELECT Inc FROM TickerInc WHERE Ticker = '{0}';"
    cursor.execute(select.format(ticker))
    return cursor.fetchall()

def store(database, cursor, ticker, inc):
    insert = "INSERT INTO TickerInc ( Ticker, Inc ) VALUES ( %s, %s );"
    for i in inc:
        cursor.execute(insert, (ticker, float(i)))
    database.commit()
 
