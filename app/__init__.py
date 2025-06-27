import os

from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def create_app():
	app = Flask(__name__)

	app.config['secret_key'] = os.environ.get('FLASK_SECRET')
	app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite'

	db.init_app(app)

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
		app.register_blueprint(utilities, url_prefix='/utilities/')

	return app
