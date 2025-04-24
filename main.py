# import os
#
# from flask import Flask
#
# app = Flask(__name__)
#
#
# @app.route("/")
# def home():
#     return "Hello World!"
#
#
# if __name__ == "__main__":
#     app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))

from app import create_app

app = create_app()

if __name__ == '__main__':
	app.run(debug=True, host="0.0.0.0", port=80, load_dotenv=True)
