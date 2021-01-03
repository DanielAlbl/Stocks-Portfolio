import pandas as pd
import numpy as np
import math
import datetime
import yfinance as yf
import mysql.connector
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
    caret = yf.Ticker('^'+name).history(period='1d')
    # day trading etfs have historical data for 1 day, with 7 catagories (thus size 7)
    if not caret.empty and caret.size > 7: 
        return '^' + name
    original = yf.Ticker(name).history(period='1d')
    if not original.empty:
        return name
    return False

def initial(cursor):
    cursor.execute("SELECT * FROM GSPC;")
    inc = cursor.fetchall()
    return '^GSPC',dumps(inc)

def fromDatabase(cursor,ticker):
    select = "SELECT * FROM {0};"
    show = "SHOW TABLES LIKE %s;"
    selectCaret = "SELECT Caret FROM Carets WHERE Name=%s;"
    inc = ''
    name = ''
    ticker = ticker.replace('^','')
    cursor.execute(show, (ticker,))
    if cursor.fetchone():
        cursor.execute(select.format(ticker))
        inc = cursor.fetchall()
    if inc:
        cursor.execute(selectCaret,(ticker,))
        caret = cursor.fetchall()
        if caret == 'T':
            name = '^' + ticker
        else:
            name = ticker
    return name,inc

def store(database,cursor,ticker,inc):
    noCaret = ticker.replace('^','')
    create = "CREATE TABLE {0} ( Inc float );"
    cursor.execute(create.format(noCaret))
    insertCaret = "INSERT INTO Carets (Name,Caret) VALUES (%s,%s);"
    if ticker.find('^') == -1:
        caret = 'F'
    else:
        caret = 'T'
    cursor.execute(insertCaret,(noCaret,caret))
    insert = "INSERT INTO {0} ( Inc ) VALUES ( %s );"
    for i in inc:
        cursor.execute(insert.format(noCaret),(str(i),))
    database.commit()
     
##################################################################

app = Flask(__name__)

handler = FileHandler('errors.txt')
handler.setLevel(WARNING)
app.logger.addHandler(handler)

##################################################################

@app.route("/")
def home():
    return render_template('home.html')

@app.route("/StockGrowth", methods=['GET','POST'])
def stocks():
    database = mysql.connector.connect(host='localhost',user='root',passwd='9atatime',database='Stocks')
    cursor = database.cursor()
    exists = 1
    if request.method == 'POST':
        Ticker = request.form['Ticker']
        Ticker = Ticker.upper()
        name,inc = fromDatabase(cursor,Ticker)
        Interval = request.form['Interval']
        Bins = request.form['Bins']
        if inc:
            JSON = dumps(inc)
            Ticker = name
        else:
            Ticker = addCaret(Ticker)
            if Ticker:
                NpArray = makeNpArray(Ticker)
                JSON = dumps(NpArray.tolist())
                store(database,cursor,Ticker,NpArray)
            else:
                exists = 0
                Ticker = ''
                JSON = []
                Interval = 365
                Bins = 500
    else:
        Ticker,JSON = initial(cursor)
        Interval = 365
        Bins = 500

    cursor.close()
    database.close()

    return render_template('stocks.html',historical=JSON,Ticker=Ticker,interval=Interval,bins=Bins,exists=exists)

@app.route("/StockGrowth/Questions", methods=['GET','POST'])
def questions():
    return render_template('questions.html')

@app.route("/RubiksCube")
def rubix():
    return render_template('rubix.html')
   
if __name__ == "__main__":
    app.run(host='0.0.0.0',debug=True) 
 
