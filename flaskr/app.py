import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from flask import render_template
from flaskr import create_app

app = create_app()

# Reroute to main page upon loading
@app.route('/')
def index():
    return render_template('web/index.html')

if __name__ == '__main__':
    app.run(port=8000, debug=True)