import sys
import os

# Add your project directory to the system path
project_home = '/home/bbrockbrown/mysite/flask_app.py'
if project_home not in sys.path:
    sys.path.append(project_home)

# Set the Flask application (replace 'flaskr' with your app package name)
from flaskr import create_app  # Assuming your Flask app is named 'flaskr'
application = create_app()
