import logging

from dotenv import load_dotenv
from waitress import serve
from flask import request

from app import create_app

logging.basicConfig(
	level=logging.DEBUG,
	format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)

# Ensure Waitress logs requests
logger = logging.getLogger('waitress')
logger.setLevel(logging.DEBUG)

# Ensure Flask app logs
app_logger = logging.getLogger('werkzeug')
app_logger.setLevel(logging.DEBUG)

app = create_app()

app.logger.setLevel(logging.DEBUG)

@app.before_request
def log_request_info():
	app.logger.info(f'{request.remote_addr} - {request.method} {request.path}')

@app.after_request
def log_response_info(response):
	app.logger.info(f'{request.remote_addr} - {request.method} {request.path} - {response.status_code}')
	return response

if __name__ == '__main__':
	# TODO:
	#  consider https://stackoverflow.com/a/12269934 (nginx asset serving & rate limiting)
	#  try to add a message while web server is down

	load_dotenv()
	serve(app, host='0.0.0.0', port=5000)
