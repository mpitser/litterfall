#! /usr/bin/python
from datetime import datetime
from pymongo import MongoClient
from bson import json_util
import json
import cgi
import cgitb; cgitb.enable()
import os
import ConfigParser
	

def getdata(obs, site, plot, treeid, subtreeid):
	if site == 'all':
		data = obs.find({'collection_type':'tree'}).distinct('site')
		for j in range(0,len(data)):
			data[j] = data[j].encode('ascii','ignore')
		data.sort(key=str.lower)
		n = len(data)
	else:
		findQuery = {
			'collection_type':'tree',
			'plot': int(plot),
			'site': site
		}
		if treeid != None:
			findQuery['tree_id'] = int(treeid)
			if subtreeid != None:
				findQuery['sub_tree_id'] = int(subtreeid)
		data = obs.find(findQuery).sort("tree_id", 1)
		n = data.count()

	if  treeid != None:
		# return a single model
		json_data = data[0]
	else:
		# copy it over to another empty array
		json_data = [0]*n
		for i in range(0,n):
			json_data[i] = data[i]
	
	ser_data = json.dumps(json_data, default=json_util.default, separators=(',', ':'))
	print ser_data
<<<<<<< HEAD

def postdata(obs, data):
	data = json.loads(data)
	print data
	obs.save(data)
=======
>>>>>>> 5278c2e8b4eb861ed493bfb366c62bc043b735db
	
def main():
	# Load config (for database info, etc)
	Config = ConfigParser.ConfigParser()
	Config.read("litterfall_translate.conf")
	MongoDB_host = Config.get('MongoDB', "host")
	MongoDB_db = Config.get('MongoDB', "db")
	
	# Connect to MongoDB
	mongo = MongoClient(MongoDB_host, 27017)
	mongo_db = mongo[MongoDB_db]	
	
	# Use MongoDB observation collection
	obs = mongo_db.observations
	
	method = os.environ['REQUEST_METHOD']
			
	form = cgi.FieldStorage()
	
	print 'Content-Type: application/json\n'
	
<<<<<<< HEAD
	if method == 'GET':
		plot = form.getvalue('plot')
		site = form.getvalue('site')
		getdata(obs, site, plot)
	elif method == 'POST':
		data = form.file.read()
		postdata(obs, data)
=======
	
	if method == 'POST' or method == 'PUT':
		form = cgi.FieldStorage()
		data = json.loads(form.file.read(), object_hook=json_util.object_hook)
		if len(data):
			obs.save(data)
	elif method == 'GET':
		query = cgi.FieldStorage()
		plot = query.getvalue('plot')
		site = query.getvalue('site')
		treeid = query.getvalue('treeid')
		subtreeid = query.getvalue('subtreeid')
		getdata(obs, site, plot, treeid, subtreeid)
>>>>>>> 5278c2e8b4eb861ed493bfb366c62bc043b735db

		
if __name__ == "__main__":
    main()
