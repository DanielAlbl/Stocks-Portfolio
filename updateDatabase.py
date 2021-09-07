from functions import *

database = mysql.connector.connect(host='localhost', user='pi', passwd='password', database='Stocks')
cursor = database.cursor()

select = "SELECT DISTINCT Ticker FROM TickerPrice;"
delete = "DELETE FROM TickerPrice WHERE Ticker = %s;"
insert = "INSERT INTO TickerPrice ( Ticker, Price ) VALUES ( %s, %s );"

cursor.execute(select);
Tickers = cursor.fetchall()

for ticker in Tickers:
    cursor.execute(delete, ticker)
    database.commit()
    NpArray = makeNpArray(ticker[0])
    store(database, cursor, ticker[0], NpArray)

cursor.close()
database.close()
