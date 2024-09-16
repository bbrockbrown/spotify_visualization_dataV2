import functools
from flask import Blueprint, flash, g, redirect, render_template, request, session, url_for, jsonify
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash
from flaskr.db import get_db
import os, uuid, glob

bp = Blueprint('support', __name__, url_prefix='/support')

@bp.route("/support-page", methods=["GET", "POST"])
def support():
    if request.method == 'POST':
        bug_date = request.form['bug_date']
        bug_description = request.form['bug_description']
        bug_page = request.form['bug_page']

        # Add new bug report to the database
        db = get_db()
        db.execute(
            'INSERT INTO bug_report (date_reported, description, page) VALUES (?, ?, ?)',
            (bug_date, bug_description, bug_page)
        )
        db.commit()

        return redirect(url_for('support.thankYou'))
        
    return render_template('support/support.html', logged_in=inSession())

@bp.route("/thank-you-page")
def thankYou():
    return render_template('support/thank.html', logged_in=inSession())

def inSession():
    return "user" in session