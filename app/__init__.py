import logging
import os

from flask import Flask, render_template, current_app, request
from flask_sqlalchemy import SQLAlchemy
from werkzeug.middleware.proxy_fix import ProxyFix
from wsgi_cloudflare_proxy_fix import CloudflareProxyFix

from . import database

db = SQLAlchemy()


# class CustomProxyFix:
# 	def __init__(self, app, logger):
# 		self.app = app
# 		self.logger = logger
#
# 	def __call__(self, environ, start_response):
# 		request.remote_addr = request.headers.get("Cf-Connecting-Ip", default="127.0.0.1")
# 		return self.app(environ, start_response)


def create_app():
	app = Flask(__name__)

	app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET')

	if os.getenv("FLASK_ENV", "").lower() == "production":
		app.logger.debug("Using ProxyFix (not actually though because it's broken)")

		# app.wsgi_app = CustomProxyFix(app.wsgi_app, app.logger)

		# app.wsgi_app = CloudflareProxyFix(app.wsgi_app, log_level=logging.INFO)
		# app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

	else:
		app.logger.debug("Not using ProxyFix")

	app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite'
	db.init_app(app)

	database.init_db()

	@app.errorhandler(404)
	def page_not_found(error):
		return render_template("base_templates/info_text.html", text=error, link_href="/", link_text="Go Home"), 404

	with app.app_context():
		from .auth import auth
		app.register_blueprint(auth)

		from .views import views
		app.register_blueprint(views, url_prefix="/")

		from .projects import projects
		app.register_blueprint(projects, url_prefix='/projects/')

		from .utilities import utilities
		app.register_blueprint(utilities, url_prefix='/')

	return app
