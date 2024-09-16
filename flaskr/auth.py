import functools
from flask import Blueprint, flash, g, redirect, render_template, request, session, url_for, jsonify
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash
from flaskr.db import get_db
import os, uuid, glob
# checks if user is in session
from utils.session import inSession

bp = Blueprint('auth', __name__, url_prefix='/auth')

# get database
db = get_db()

@bp.route('/sign-up', methods=['GET', 'POST'])
def signUp():
    if request.method == 'POST':
        firstName = request.form['firstName']
        lastName = request.form['lastName']
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        
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
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        # Get user from database
        user = db.execute(
            'SELECT * FROM user WHERE email = ?LIMIT 1',
            (email)
        ).fetchone()
        
        if user and check_password_hash(user.password_hash, password):
            # Obtain username and activate session
            session.clear()
            session.permanent = True
            session["user"] = user['id']
            session["isAdmin"] = user["isAdmin"]
            flash('Login successful!', 'success')
            return redirect(url_for('web.home'))
        else:
            flash('Invalid credentials. Please try again and check to see if you have a registered account or not.', 'danger')
            return render_template('auth/login.html', logged_in=inSession())

    else:
        if inSession():
            return redirect(url_for('web.home'))
        return render_template('auth/login.html', logged_in=inSession())


@bp.route('/logout')
def logout():
    if inSession():
        username = session["user"]
        flash(f"You have been logged out, {username}!", "info")
    session.clear()
    return redirect(url_for('auth.login'))