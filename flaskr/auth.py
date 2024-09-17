from functools import wraps
from flask import Blueprint, flash, g, redirect, render_template, request, session, url_for, make_response
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash
from flaskr.db import get_db
import os, uuid, glob

bp = Blueprint('auth', __name__, url_prefix='/auth')

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

# Route for sign up page
@bp.route('/sign-up', methods=['GET', 'POST'])
@no_cache_headers
def signUp():
    if request.method == 'POST':
        firstName = request.form['firstName']
        lastName = request.form['lastName']
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        
        # get database
        db = get_db()
        
        # Check if user already exists
        existing_user = db.execute(
            'SELECT * FROM user WHERE email = ? OR username = ? LIMIT 1',
            (email, username)
        ).fetchone()

        if existing_user:
            flash('User already exists. Please log in.', 'danger')
            return redirect(url_for('auth.login'))

        # Create new user and hash the password
        hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
        db.execute(
            'INSERT INTO user (firstName, lastName, username, email, password_hash) VALUES (?, ?, ?, ?, ?)',
            (firstName, lastName, username, email, hashed_password)
        )
        db.commit()

        flash('Registration successful! You can now log in.', 'success')
        return redirect(url_for('auth.login'))

    return render_template('auth/signup.html', logged_in=inSession())


# Route for logging in a user
@bp.route('/login', methods=["POST", "GET"])
@no_cache_headers
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        
        # get database
        db = get_db()
        
        # Get user from database
        user = db.execute('SELECT * FROM user WHERE email = ? LIMIT 1', (email,)).fetchone()
        
        if user and check_password_hash(user['password_hash'], password):
            # Obtain username and activate session
            session.clear()
            session["user"] = user['id']
            session["isAdmin"] = user["isAdmin"]
            session["username"] = user["username"]
            flash('Login successful!', 'success')
            return redirect(url_for('web.index'))
        else:
            flash('Invalid credentials. Please try again and check to see if you have a registered account or not.', 'danger')
            return render_template('auth/login.html', logged_in=inSession())
        
    else:
        if inSession():
            return redirect(url_for('web.index'))
        return render_template('auth/login.html', logged_in=inSession())

# Route for logout, no page associated
@bp.route('/logout')
def logout():
    session.clear()
    flash(f"You have been logged out!", "info")
    return redirect(url_for('auth.login'))

def inSession():
    return "user" in session
