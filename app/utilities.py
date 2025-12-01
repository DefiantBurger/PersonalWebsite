from flask import Blueprint, render_template, abort, redirect, request

from . import database

utilities = Blueprint('utilities', __name__)


@utilities.route('/utilities/')
@utilities.route('/nutrislice/')
@utilities.route('/insomnia/')
def unfinished_pages():
	return render_template("unfinished.html")


@utilities.route('/share/')
def share():
	return render_template("utilities/share.html")


@utilities.route('/scheduler/')
def scheduler():
	return render_template("utilities/scheduler.html")


@utilities.route('/short/<shortcode>/')
def get_shortlink(shortcode):
	db = database.get_db()
	shortlink = db.get_shortlink(shortcode)

	if shortlink:
		return redirect(shortlink)
	else:
		return render_template("base_templates/info_text.html",
		                       text="Shortlink not found.",
		                       link_href="/",
		                       link_text="Go Home"), 404

# @utilities.route('/shorten/', methods=['GET', 'POST'])
# def shorten():
# 	if request.method == 'POST':
# 		shortcode = request.form.get('shortcode')
# 		url = request.form.get('url')
#
# 		if not shortcode or not url:
# 			return render_template("utilities/shorten.html", errors=["Both fields are required."])
#
# 		db = get_db()
# 		success = db.add_shortlink(shortcode, url)
#
# 		if success:
# 			shortlink_url = request.host_url + 'short/' + shortcode + '/'
# 			return render_template("utilities/shorten.html", shortlink=shortlink_url)
# 		else:
# 			return render_template("utilities/shorten.html", errors=["Shortcode already exists."])
#
# 	return render_template("utilities/shorten.html")