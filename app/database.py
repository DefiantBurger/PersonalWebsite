from pymongo.errors import DuplicateKeyError
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv
import os

load_dotenv()


class SiteDatabase:
	def __init__(self):
		uri = os.environ.get("MONGODB_URI")
		if not uri:
			raise ValueError("MONGODB_URI environment variable not set")

		self.client = MongoClient(uri, server_api=ServerApi('1'))
		self.site_data_db = self.client.get_database("site-data")
		self.shortlinks_cl = self.site_data_db.get_collection("shortlinks")

		self.shortlinks_cl.create_index("shortcode", unique=True)

	def add_shortlink(self, shortcode, url):
		try:
			self.shortlinks_cl.insert_one({"shortcode": shortcode, "url": url})
			return True
		except DuplicateKeyError:
			return False

	def get_shortlink(self, shortcode):
		result = self.shortlinks_cl.find_one({"shortcode": shortcode})
		if result:
			return result["url"]
		return None

	def close(self):
		self.client.close()

db = None

def init_db():
	global db
	db = SiteDatabase()
	db.add_shortlink("example", "https://example.com")

def get_db():
	return db