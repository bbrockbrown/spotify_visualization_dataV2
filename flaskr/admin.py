from functools import wraps
from flask import Blueprint, flash, g, redirect, render_template, request, session, url_for, jsonify, make_response
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash
from flaskr.db import get_db
import os, uuid, glob

bp = Blueprint('admin', __name__, url_prefix='/admin')

# function for checking if user has permission to view databases
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
                
        # Check if the user is logged in
        if "user" not in session:
            return redirect(url_for('auth.login'))
                    
        # Check if the logged-in user is an admin
        if not session["isAdmin"]:
            return render_template("admin/error.html", logged_in=inSession())
                    
        # If the user is logged in and is an admin, proceed to the requested page
        return f(*args, **kwargs)
            
    return decorated_function

# Prevents users from experiencing cache issues when logging out then hitting back, etc.
def no_cache_headers(view):
    """Decorator to set Cache-Control headers to prevent caching"""
    @wraps(view)
    def no_cache(*args, **kwargs):
        response = make_response(view(*args, **kwargs))
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response
    return no_cache


# Page displaying all bug reports from DB
@bp.route('/bug-reports')
@admin_required
@no_cache_headers
def reports():
    # get database
    db = get_db()

    # Fetch all bug reports from the database
    reports = db.execute('SELECT * FROM bug_report').fetchall()
    return render_template('admin/reports.html', reports=reports, logged_in=inSession())

# Page displaying all users from DB
@bp.route('/users')
@admin_required
@no_cache_headers
def users():
    # get database
    db = get_db()

    # Fetch all users from database
    users = db.execute('SELECT * FROM user').fetchall()
    return render_template('admin/users.html', users=users, logged_in=inSession())

def inSession():
    return "user" in session

