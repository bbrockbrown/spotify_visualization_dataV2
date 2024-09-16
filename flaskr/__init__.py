from flask import Flask, redirect, url_for, render_template, request, jsonify, send_from_directory, flash, session
from flask_session import Session
import os
from datetime import timedelta

def create_app(test_config=None):
    # create app instance
    # SET DEBUG TO FALSE WHEN DEPLOYING APP!!!!!!!!!!!!!!!!
    app = Flask(__name__, instance_relative_config=True)
    
    # same as 'app.config[SESSION_TYPE] = ...'
    app.config.from_mapping(
        SESSION_TYPE='filesystem',
        SECRET_KEY='hello',
        DATABASE=os.path.join(app.instance_path, 'flaskr.sqlite'),
    )
    
    if test_config is None:
        # load the instance config, if it exists, when not testing
        app.config.from_pyfile('config.py', silent=True)
    else:
        # load the test config if passed in
        app.config.from_mapping(test_config)
        
    # ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass
    
    # Initialize session with app & max time per session for users
    Session(app)
    app.permanent_session_lifetime = timedelta(minutes=30)
    
    # Initialize database with app
    from . import db
    db.init_app(app)
    
    # Connect blueprints within app
    from . import web, auth, support, admin
    app.register_blueprint(web.bp)
    app.register_blueprint(auth.bp)
    app.register_blueprint(support.bp)
    app.register_blueprint(admin.bp)
    
    return app