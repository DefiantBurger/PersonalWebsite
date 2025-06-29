import logging

from dotenv import load_dotenv
from waitress import serve

from app import create_app

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s %(message)s')

app = create_app()

if __name__ == '__main__':
	# TODO:
	#  consider https://stackoverflow.com/a/12269934 (nginx asset serving & rate limiting)
	#  try to add a message while web server is down

	load_dotenv()
	serve(app, host='0.0.0.0', port=5000)
