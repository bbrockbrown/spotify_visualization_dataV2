import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from flask import render_template
from flaskr import create_app

app = create_app()

@app.route('/')
def index():
    return render_template('web/index.html')

if __name__ == '__main__':
    with app.app_context():
        from flaskr.db import init_db  # Import the `init_db` function from `myapp.db`
        init_db()  # Run the database initialization within the app context
        
    app.run()