from flask import Flask


def create_app():
	app = Flask(__name__)

	# app.config.from_pyfile('settings.py')

	with app.app_context():
		from .views import views
		app.register_blueprint(views, url_prefix='/')

		from .projects import projects
		app.register_blueprint(projects, url_prefix='/projects/')

	return app
