import numpy as np
import pandas as pd
import yfinance as yf

def makeNpArray(name):
    P = yf.Ticker(name).history(period='max')['Close']
    if P.empty:
        return np.array([])
    date_range = pd.date_range(start=P.index.min(), end=P.index.max())
    P_reindexed = P.reindex(date_range, fill_value=np.nan)
    P_interpolated = P_reindexed.interpolate(method='linear')
    N = P_interpolated.to_numpy()
    return N[~np.isnan(N)]

def fromDatabase(cursor, ticker):
    select = "SELECT Price FROM TickerPrice WHERE Ticker = '{0}';"
    cursor.execute(select.format(ticker))
    return cursor.fetchall()

def store(database, cursor, ticker, prices):
    insert = "INSERT INTO TickerPrice ( Ticker, Price ) VALUES ( %s, %s );"
    for price in prices:
        cursor.execute(insert, (ticker, float(price)))
    database.commit()
