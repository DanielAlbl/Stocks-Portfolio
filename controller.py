from functions import *

app = Flask(__name__)

@app.route("/")
def home():
    return render_template('home.html')

@app.route("/StockGrowth", methods=['GET', 'POST'])
def stocks():
    f = open("error.txt", "w")
    try:
        database = mysql.connector.connect(host='localhost', user='pi', passwd='password', database='Stocks')
        cursor = database.cursor()
        exists = 1
        if request.method == 'POST':
            Ticker = request.form['Ticker']
            Ticker = Ticker.upper()
            inc = fromDatabase(cursor, Ticker)
            Interval = request.form['Interval']
            Bins = request.form['Bins']
            if inc:
                JSON = dumps(inc)
            else:
                NpArray = makeNpArray(Ticker)
                if NpArray.size:
                    JSON = dumps(NpArray.tolist())
                    store(database, cursor, Ticker, NpArray)
                else:
                    exists = 0
                    Ticker = ''
                    JSON = []
                    Interval = 365
                    Bins = 500
        else:
            JSON = initial(cursor)
            Ticker = 'SPY'
            Interval = 365
            Bins = 500

        cursor.close()
        database.close()

        return render_template('stocks.html', historical=JSON, Ticker=Ticker, interval=Interval, bins=Bins, exists=exists)
    except Exception as e:
        f.write(str(e))
    finally:
        f.close()
        

@app.route("/StockGrowth/Questions", methods=['GET', 'POST'])
def questions():
    return render_template('questions.html')

@app.route("/RubiksCube")
def rubix():
    return render_template('rubix.html')
 
@app.route("/Chess")
def chess():
    return render_template('chess.html')

if __name__ == "__main__":
  app.run(host='0.0.0.0', debug=False)
