#! /usr/bin/python
from datetime import datetime, date
from pymongo import MongoClient
from bson import json_util
from bson.objectid import ObjectId
from types import *
import json, cgi, os, ConfigParser, unicodedata, pymongo, datetime
# for debug purpose
import cgitb; cgitb.enable()

#############################################################################################
# this is python script that takes in query parameters from	js, queries database for data	#
# and returns to js in JSON format. in addition, it can validate the data before saving it  #
# to the database																			#
#############################################################################################
def getdata(db, query):
	# get data with all specifications that aren't 'all'
	object_to_match = {}
	if query.getvalue('site') != 'all' and query.getvalue('site') != None:
		object_to_match['site'] = query.getvalue('site')
	if query.getvalue('plot') != 'all' and query.getvalue('plot') != None:
		try:
			object_to_match['plot'] = int(query.getvalue('plot'))
		except ValueError:
			print "Invalid plot number"
	if query.getvalue('collection_type') != 'all' and query.getvalue('collection_type') != None:
		object_to_match['collection_type'] = query.getvalue('collection_type')
	if query.getvalue('oid') != 'all' and query.getvalue('oid') != None:
		object_to_match['_id'] = ObjectId(query.getvalue('oid'))	
		
	#print object_to_match
		
	data = db.find(object_to_match)
	
	return data
	
	
	#ser_data = json.dumps(data[0], default=json_util.default, separators=(',', ':'))
	#print ser_data
	
def main():
	# global Observation #not sure if needed

	# Load config (for database info, etc)
	Config = ConfigParser.ConfigParser()
	Config.read("crum_woods_translate.conf")
	MongoDB_host = Config.get('MongoDB', "host")
	MongoDB_db = Config.get('MongoDB', "db")
	
	# Connect to MongoDB
	mongo = MongoClient(MongoDB_host, 27017)
	mongo_db = mongo[MongoDB_db]	
	
	# Use MongoDB observation collection
	db = mongo_db.litterfall_observations
	
	method = os.environ['REQUEST_METHOD']

	if method == 'GET':
		# we want to read data from database (but not change it)
		
		print 'Content-Type: application/json\n'
		query = cgi.FieldStorage()
		
		# get data associated with specifications entered
		data = getdata(db, query)
		
		print 'Content-Type: application/json\n'
		if data.count() > 0:
			print json.dumps(data[0], default=json_util.default, separators=(',', ':'))
		
	elif method == 'POST' or method == 'PUT':
		# we want to send data to server (without url) 
		
		form = cgi.FieldStorage()
		data = json.loads(form.file.read(), object_hook=json_util.object_hook)	
		
		# if we want to delete the observation, hacked-in 'delete' key of data json object will be flagged
		if 'delete' in data:
			if data['delete'] == True:
				db.remove({'_id': data['_id']})
				print 'Content-Type: application/json\n'
				print json.dumps(data, default=json_util.default, separators=(',', ':'))
		# if we're not deleting, we're editing or saving, and mongo is smart so we just save it to the db and mongo takes care of everything woohoo!
		else:
			db.save(data)
			print 'Content-Type: application/json\n'
			print json.dumps(data, default=json_util.default, separators=(',', ':'))
		
		
if __name__ == "__main__":
    main()
