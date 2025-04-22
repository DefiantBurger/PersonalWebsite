import json
import os

from flask import Blueprint, render_template, send_from_directory, redirect, request, url_for

if os.environ.get('FLASK_ENV') == 'development':
	from dotenv import load_dotenv

	load_dotenv()

views = Blueprint('views', __name__)


@views.route("/assets/<path:path>")
def static_dir(path):
	return send_from_directory("assets", path)


@views.route('/sitemap.xml')
@views.route('/robots.txt')
def sitemap_and_robots():
	return send_from_directory("assets", request.path[1:])


@views.route("/<path:path>.html/", methods=['GET'])
def html_redirect(path):
	return redirect(f"/{path}")


@views.route('/', methods=['GET'])
def index():
	return render_template("index.html", data=request.headers.get('User-Agent'))
