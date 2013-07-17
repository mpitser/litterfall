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
	
	object_to_match = {}	# object to send to mongoDB to find matching documents

	if query.getvalue('oid') != 'all' and query.getvalue('oid') != None:
		object_to_match['_id'] = ObjectId(query.getvalue('oid'))
	
	if query.getvalue('collection_type') != 'all' and query.getvalue('collection_type') != None:
		object_to_match['collection_type'] = query.getvalue('collection_type')
	
	# get specific date
	date = {}
	if query.getvalue('year') != None and query.getvalue('year') != 'all':
		date['y'] = int(query.getvalue('year'))
	if query.getvalue('month') != None and query.getvalue('month') != 'all':
		date['m'] = int(query.getvalue('month'))
	if query.getvalue('day') != None and query.getvalue('day') != 'all':
		date['d'] = int(query.getvalue('day'))		
	if date != {}:		
		object_to_match['date'] = date
	
	# get date in date range
	date_begin = {}
	date_end = {}
	if query.getvalue('year_begin') != None and query.getvalue('year_begin') != 'all':
		date_begin['y'] = int(query.getvalue('year_begin'))
	if query.getvalue('month_begin') != None and query.getvalue('month_begin') != 'all':
		date_begin['m'] = int(query.getvalue('month_begin'))
	if query.getvalue('day_begin') != None and query.getvalue('day_begin') != 'all':
		date_begin['d'] = int(query.getvalue('day_begin'))		
	if query.getvalue('year_end') != None and query.getvalue('year_end') != 'all':
		date_end['y'] = int(query.getvalue('year_end'))
	if query.getvalue('month_end') != None and query.getvalue('month_end') != 'all':
		date_end['m'] = int(query.getvalue('month_end'))
	if query.getvalue('day_end') != None and query.getvalue('day_end') != 'all':
		date_end['d'] = int(query.getvalue('day_end'))		
	if date_begin != {} and date_end != {}:		
		object_to_match['date'] = {"$gte": date_begin, "$lte": date_end}
	
	if query.getlist('observer') != 'all' and query.getlist('observer') != []:
		print query.getlist('observer')
		object_to_match['observers'] = {"$all": query.getlist('observer')}
	
	if query.getvalue('plot') != 'all' and query.getvalue('plot') != None:
		try:
			object_to_match['plot'] = int(query.getvalue('plot'))
		except ValueError:
			print "Invalid plot number"
	
	if query.getvalue('site') != 'all' and query.getvalue('site') != None:
		object_to_match['site'] = query.getvalue('site')
	
	if query.getvalue('sky') != 'all' and query.getvalue('sky') != None:
		object_to_match['weather.sky'] = query.getvalue('sky')
	
	if query.getvalue('precipitation') != 'all' and query.getvalue('precipitation') != None:
		object_to_match['weather.precipitation'] = query.getvalue('precipitation')
	
	# query on data
	material = None
	type = []
	trap = []
	# get the values requested	
	if query.getvalue('material') != 'all' and query.getvalue('material') != None:
		material = query.getvalue('material')
	if query.getlist('type') != 'all' and query.getlist('type') != []:
		type = "['" + "', '".join(query.getlist('type')) + "']"
	if query.getlist('trap') != 'all' and query.getlist('trap') != []:
		trap = "[" + ", ".join(query.getlist('trap')) + "]"
	
	# set up a matching structure for mongo based on values given
	if material != None and type == [] and trap == []:	
		# only material was specified (leaf or nonleaf)
		object_to_match['trap_data'] = {'$elemMatch': { 'material': material } }
	else:
		# something else (materials, traps, types of data, or all) was specified
		if type != [] and trap != []:
			where_query = type+".indexOf(this.type) != -1 && "+trap+".indexOf(this.trap) != -1"
		elif type != []:
			where_query = type+".indexOf(this.type) != -1"
		elif trap != []:
			where_query = trap+".indexOf(this.trap) != -1"
		
		# set up matching object
		if material == None:
			object_to_match['trap_data'] = {'$elemMatch': { '$where': where_query } }
		else:
			object_to_match['trap_data'] = {'$elemMatch': { 'material': material, '$where': where_query } }
	
	
	# find matching documents to return as array
	#print object_to_match
	data = db.find(object_to_match)
	
	return data
	
def getObservers(db):
	# get all observers from last X years
	num_years = 1000  #change if you want to constrict the number of observers that are in autocomplete
	data = db.find({'date.y' : {'$gte': date.today().year - num_years}}, {'fields':'observers'}).distinct('observers')
	data.sort()
	n = len(data)
	
	return data
	
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
		
		if query.getvalue("observers") == "all":
			data = getObservers(db)
			print json.dumps(data, default=json_util.default, separators=(',', ':'))
			
		else:
			# get data associated with specifications entered
			data = getdata(db, query)
			print 'Content-Type: application/json\n'
			if data.count() > 0:
				for i in range(0,data.count()):
					print json.dumps(data[i], default=json_util.default, separators=(',', ':'))
					print ""		

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
