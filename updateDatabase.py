from functions import makeNpArray, store

database = mysql.connector.connect(host='localhost', user='pi', passwd='password', database='Stocks')
cursor = database.cursor()

select = "SELECT DISTINCT Ticker FROM TickerInc;"
delete = "DELETE FROM TickerInc WHERE Ticker = %s;"
insert = "INSERT INTO TickerInc ( Ticker, Inc ) VALUES ( %s, %s );"

cursor.execute(select);
Tickers = cursor.fetchall()

for ticker in Tickers:
    cursor.execute(delete, ticker)
    database.commit()
    NpArray = makeNpArray(ticker[0])
    store(database, cursor, ticker[0], i)

cursor.close()
database.close()
