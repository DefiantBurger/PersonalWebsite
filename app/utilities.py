from flask import Blueprint, render_template, abort

utilities = Blueprint('utilities', __name__)


@utilities.route('/', methods=['GET'])
def utilities_home():
	abort(404)


@utilities.route('/nutrislice/', methods=['GET'])
@utilities.route('/insomnia/', methods=['GET'])
def unfinished_pages():
	return render_template("unfinished.html")


@utilities.route('/share/')
def share():
	return render_template("utilities/share.html")


@utilities.route('/scheduler/')
def scheduler():
	return render_template("utilities/scheduler.html")
