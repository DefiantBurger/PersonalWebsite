import ipaddress

import httpagentparser
from flask import Blueprint, render_template, send_from_directory, redirect, request
import requests

views = Blueprint('views', __name__)


@views.route("/assets/<path:path>")
def static_dir(path):
	return send_from_directory("assets", path)


@views.route('/sitemap.xml')
@views.route('/robots.txt')
def sitemap_and_robots():
	return send_from_directory("assets", request.path[1:])


@views.route("/<path:path>.html/")
def html_redirect(path):
	return redirect(f"/{path}/")


@views.route('/')
def index():
	return render_template("index.html")


@views.route('/contact/')
@views.route('/me-rn/')
@views.route('/chat/')
def unfinished_pages():
	return render_template("unfinished.html")


@views.route('/about-me/')
def about_me():
	return render_template("about-me.html")


@views.route('/about-you/')
def about_you():
	user_agent = httpagentparser.detect(str(request.user_agent))

	os_string = user_agent['os']['name']
	try:
		if user_agent['os']['name'].lower() == "windows":
			os_string += f" {user_agent['os']['version']}"
		elif user_agent['os']['name'].lower() == "linux":
			os_string += f" {user_agent['dist']['name']}"
	except KeyError:
		pass

	browser_string = f"{user_agent['browser']['name']} {user_agent['browser']['version']}"

	ip_string = f"{request.remote_addr}"
	if ipaddress.ip_address(ip_string).is_private:
		ip_string = requests.get("https://api.ipify.org?format=json").json()['ip']

	loc_data = requests.get(f"http://ip-api.com/json/{ip_string}").json()
	if loc_data['status'] == "success":
		loc_string = f"{loc_data['city']}, {loc_data['regionName']}, {loc_data['country']}"
	else:
		loc_string = None

	return render_template("about-you.html",
	                       os=os_string,
	                       browser=browser_string,
	                       ip=ip_string,
	                       loc=loc_string)

