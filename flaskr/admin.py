import functools
from flask import Blueprint, flash, g, redirect, render_template, request, session, url_for, jsonify
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash
from flaskr.db import get_db
import os, uuid, glob


bp = Blueprint('admin', __name__, url_prefix='/admin')