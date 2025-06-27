import os
from typing import Any

import firebase_admin
from firebase_admin import firestore
from google.auth.exceptions import DefaultCredentialsError

try:  # If this is running on Google Compute Engine the credentials are initialized automatically
	raise DefaultCredentialsError  # TODO: Remove in prod
	app = firebase_admin.initialize_app()
	db = firestore.client()
except DefaultCredentialsError:  # Otherwise load from
	from firebase_admin import credentials

	# Use a service account.
	cred = credentials.Certificate(os.path.join('..', '.env_json', 'personal-website-453120-2f74cbc7d810.json'))

	app = firebase_admin.initialize_app(cred)

	db = firestore.client(database_id='database')


def write(collection_id: str, document_id: str, fields: dict[str, Any]):
	doc = db.collection(collection_id).document(document_id)
	doc.set(fields)


def read(collection_id: str, document_id: str, fields: list[str] = None):
	doc = db.collection(collection_id).document(document_id)
	if fields:
		return doc.get(fields)
	else:
		return doc.get()
