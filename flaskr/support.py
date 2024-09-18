import functools
from flask import Blueprint, redirect, render_template, request, session, url_for
from flaskr.db import get_db

bp = Blueprint('support', __name__, url_prefix='/support')

# Route for bug reporting page
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

# Route for when user submits bug report
@bp.route("/thank-you-page")
def thankYou():
    return render_template('support/thank.html', logged_in=inSession())

def inSession():
    return "user" in session