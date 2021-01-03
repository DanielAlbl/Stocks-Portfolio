import pandas as pd
import numpy as np
import math
import datetime
import yfinance as yf
import mysql.connector

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

database = mysql.connector.connect(host='localhost',user='root',passwd='9atatime',database='Stocks')
cursor = database.cursor()

cursor.execute("SHOW TABLES;")
Tables = cursor.fetchall()

getCaret = "SELECT Caret FROM Carets WHERE Name=%s;"
delete = "DELETE FROM {0};"
Insert = "INSERT INTO {0} VALUES (%s);"

for tpl in Tables:
    if tpl[0] == 'Carets':
        continue;
    cursor.execute(getCaret,tpl)
    caret = cursor.fetchone()
    ticker = tpl[0]
    if caret[0] == 'T':
        ticker = '^' + ticker
    cursor.execute(delete.format(tpl[0]))
    nparray = makeNpArray(ticker)
    insert = Insert.format(tpl[0])
    for inc in nparray:
        cursor.execute(insert,(str(inc),))

cursor.close()
database.close()
