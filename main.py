import logging
import os
import socket

from dotenv import load_dotenv
from waitress import serve
from flask import request

from app import create_app
from werkzeug.middleware.proxy_fix import ProxyFix

load_dotenv()

logging.basicConfig(
	level=logging.DEBUG,
	format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)

app = create_app()

if os.getenv("FLASK_ENV", "").lower() == "production":
	app.logger.debug("Using ProxyFix")
	app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)


@app.before_request
def log_request_info():
	app.logger.info(f'{request.remote_addr} - {request.method} {request.path}')


# @app.after_request
# def log_response_info(response):
# 	app.logger.info(f'{request.remote_addr} - {request.method} {request.path} - {response.status_code}')
# 	return response


if __name__ == '__main__':
	# TODO:
	#  consider https://stackoverflow.com/a/12269934 (nginx asset serving & rate limiting)
	#  try to add a message while web server is down

	serve(app, host='0.0.0.0', port=5000)
