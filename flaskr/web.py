from functools import wraps
from flask import Blueprint, render_template, request, url_for, jsonify, session, make_response
import os, uuid, glob
import numpy as np
import matplotlib
import matplotlib.font_manager as fm
matplotlib.use('agg')
import matplotlib.pyplot as plt
import matplotlib.tri as tri

bp = Blueprint('web', __name__, url_prefix='/web')

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

# Route for home page
@bp.route('/')
@no_cache_headers
def index():
    return render_template('web/index.html', logged_in=inSession())

# Route for song reading page
@bp.route("/song-reading-page", methods=["POST", "GET"])
@no_cache_headers
def song():
    if request.method == "POST":
        if inSession():
            data = request.json
            image_name = genReading(data)  
            image_url = url_for('static', filename=f'images/song_readings/{image_name}')
            return jsonify({'reading_url': image_url})
        else:
            return render_template("web/song.html", logged_in=inSession())
    else:
        if inSession():
            return render_template("web/song.html", logged_in=inSession())
        else:
            return render_template("web/song.html", logged_in=inSession())

# Route for artist search page
@bp.route("/artist-search-page", methods=["POST", "GET"])   
@no_cache_headers 
def artist():
    return render_template("web/artist.html", logged_in=inSession())

# Route for album search page
@bp.route("/album-search-page", methods=["GET", "POST"])
@no_cache_headers
def album():
    return render_template("web/album.html", logged_in=inSession())

# Responsible for generating radar-like image for song readings
def genReading(data):
    # Make sure folder for holding user's song reading images exists
    folder = 'flaskr/static/images/song_readings'
    if not os.path.exists(folder):
        os.makedirs(folder)
            
    # Delete previous images
    delete_old_images()
        
    proportions = [
        data["acousticness"], data["danceability"], data["energy"],
        data["liveness"], data["speechiness"], data["valence"]
    ]
    labels = ['acousticness', 'danceability', 'energy', 'liveness', 'speechiness', 'valence']
    N = len(proportions)
    spotify_font_path = 'flaskr/static/fonts/circular-std-2.ttf'
    spotify_font = fm.FontProperties(fname=spotify_font_path)
    proportions = np.append(proportions, 1)
    theta = np.linspace(0, 2 * np.pi, N, endpoint=False)
    x = np.append(np.sin(theta), 0)
    y = np.append(np.cos(theta), 0)
        
    triangles = [[N, i, (i + 1) % N] for i in range(N)]
    triang_backgr = tri.Triangulation(x, y, triangles)
    triang_foregr = tri.Triangulation(x * proportions, y * proportions, triangles)
    cmap = plt.cm.rainbow_r  # or plt.cm.hsv ?
    colors = np.linspace(0, 1, N + 1)
        
    plt.tripcolor(triang_backgr, colors, cmap=cmap, shading='gouraud', alpha=0.4)
    plt.tripcolor(triang_foregr, colors, cmap=cmap, shading='gouraud', alpha=0.8)
    plt.triplot(triang_backgr, color='white', lw=2)
        
    for label, color, xi, yi in zip(labels, colors, x, y):
        plt.text(xi * 1.05, yi * 1.05, label, 
            color='white',  # Set label color to white
            fontproperties=spotify_font,
            ha='left' if xi > 0.1 else 'right' if xi < -0.1 else 'center',
            va='bottom' if yi > 0.1 else 'top' if yi < -0.1 else 'center')
            
    plt.axis('off')
    plt.gca().set_aspect('equal')
        
    # Generate a unique filename
    filename = f"reading_{uuid.uuid4().hex}.png"
    filepath = os.path.join(folder, filename)
        
    # Save the image
    plt.savefig(filepath, transparent=True)
    plt.close()  # Close the plot to free up memory
        
    # Return the name
    return filename

# Optimize memory by deleting any past song reading images
def delete_old_images():
    image_folder = 'flaskr/static/images/song_readings/*'
    old_images = glob.glob(image_folder)
            
    for image in old_images:
        try:
            os.remove(image)
        except OSError as e:
            print(f"Error deleting file {image}: {e}")

def inSession():
    return "user" in session