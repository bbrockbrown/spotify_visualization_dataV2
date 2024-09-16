from flask import session
def inSession():
    return "user" in session