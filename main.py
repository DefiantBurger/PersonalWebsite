import logging
import os

from dotenv import load_dotenv
from flask import request
from waitress import serve

from app import create_app
from flask import g

load_dotenv()

# logging.basicConfig(
# 	level=logging.DEBUG,
# 	format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
# )

app = create_app()


@app.before_request
def log_request_info():
	app.logger.info(f'{request.remote_addr} - {request.method} {request.path}')


if __name__ == '__main__':
	# TODO:
	#  consider https://stackoverflow.com/a/12269934 (nginx asset serving & rate limiting)
	#  try to add a message while web server is down
	#  fix wrong ip

	if os.getenv("FLASK_ENV", "").lower() == "production":
		serve(app, host='0.0.0.0', port=5000)
	else:
		app.run(port=5000, debug=True)
