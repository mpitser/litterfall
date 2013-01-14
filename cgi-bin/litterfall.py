#! /usr/bin/python
from datetime import datetime
from pymongo import MongoClient
from bson import json_util
import json
import cgi
import cgitb; cgitb.enable()
import os
import ConfigParser
		
def getdata(obs, site, plot):
	if site == 'all':
		data = obs.find({'collection_type':'tree'}).distinct('site')
		for j in range(0,len(data)):
			data[j] = data[j].encode('ascii','ignore')
		data.sort(key=str.lower)
		n = len(data)
	else:
		data = obs.find({'collection_type':'tree','plot': int(plot), 'site': site})
		data = data.sort("tree_id", 1)
		n = data.count()
	
	json_data = [0]*n
	
	# copy it over to another empty array
	for i in range(0,n):
		json_data[i] = data[i]
	
	ser_data = json.dumps(json_data, default=json_util.default, separators=(',', ':'))
	print ser_data

def postdata(obs, data):
	print json.dumps(data, default=json_util.default, separators=(',', ':'))
	#obs.save(data)
	
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
	
	#method = os.environ['REQUEST_METHOD']
	
	debug = os.environ
	debug['REQUEST_METHOD'] = 'PUT'
	method = debug['REQUEST_METHOD']
	
	#print 'Content-Type: application/json\n'
	print 'Content-Type: text/html\n'
	print method
	
	if method == 'GET':
		query = cgi.FieldStorage()
		plot = query.getvalue('plot')
		site = query.getvalue('site')
		getdata(obs, site, plot)
	elif method == 'PUT':
		data = {'_id':'13246876532135'}
		print debug
		postdata(obs, data)

		
if __name__ == "__main__":
    main()
