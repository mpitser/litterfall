#! /usr/bin/python
from datetime import datetime
from pymongo import MongoClient
from bson import json_util
import json
import cgi
# for debug purpose
import cgitb; cgitb.enable()
import os
import ConfigParser
	
def getdata(obs, site, plot, treeid, subtreeid):
	if site == 'all':
		# then return an array of distince sites
		data = obs.find({'collection_type':'tree'}).distinct('site')
		for j in range(0,len(data)):
			data[j] = data[j].encode('ascii','ignore')
		data.sort(key=str.lower)
		n = len(data)
	else:
		# then the query is about a particular site and plot
		findQuery = {
			'collection_type':'tree',
			'plot': int(plot),
			'site': site
		}
		if treeid != None:
			# if there is a tree id, then append
			findQuery['tree_id'] = int(treeid)
			if subtreeid != None:
				# if there is a sub tree id, then append
				findQuery['sub_tree_id'] = int(subtreeid)			
		# get the data
		data = obs.find(findQuery).sort({"angle":1})
		n = data.count()

	# validate the return data
	# if only a treeid is given and
	# that particular tree has subtrees
	# then return nothing
	if  treeid != None and n > 1:
		json_data = None
	elif n == 1:
		# return one single tree
		json_data = data[0]
	else:
		# then it is asking for all the trees in that plot
		# copy it over to another empty array
		json_data = [0]*n
		for i in range(0,n):
			json_data[i] = data[i]
	
	ser_data = json.dumps(json_data, default=json_util.default, separators=(',', ':'))
	print ser_data
	
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
			
	print 'Content-Type: application/json\n'
	
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
		
if __name__ == "__main__":
    main()
