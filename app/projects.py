from flask import Blueprint, render_template, send_from_directory, redirect, request, url_for

projects = Blueprint('projects', __name__)

@projects.route('/', methods=['GET'])
def projects_home():
	return render_template("projects/projects.html")

@projects.route('/mlmp/', methods=['GET'])
@projects.route('/jball/', methods=['GET'])
@projects.route('/latin/', methods=['GET'])
def unfinished_pages():
	return render_template("unfinished.html")
