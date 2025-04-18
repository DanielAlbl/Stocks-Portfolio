from json import dumps
from flask import render_template, Flask, request
from functions import *
from werkzeug.middleware.proxy_fix import ProxyFix

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

@app.route("/")
def home():
    return render_template('home.html')

@app.route("/StockGrowth", methods=['GET', 'POST'])
def stocks():
    f = open("error.txt", "w")
    try:
        if request.method == 'POST':
            Ticker = request.form['Ticker']
            Ticker = Ticker.upper()
            Interval = request.form['Interval']
            Bins = request.form['Bins']
        else:
            Ticker = 'SPY'
            Interval = 365
            Bins = 500
        NpArray = makeNpArray(Ticker)
        JSON = dumps(NpArray.tolist())
        return render_template('stocks.html', historical=JSON, Ticker=Ticker, interval=Interval, bins=Bins)
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
 
if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=False)
