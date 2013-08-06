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
	
	object_to_match["date.y"] = {"$lte": 3000, "$gte": 2000}
	object_to_match["date.m"] = {"$lte": 12, "$gte": 1}
	object_to_match["date.d"] = {"$lte": 31, "$gte": 0}
	object_to_match["$and"] = []
	if query.getvalue('date-begin') != None and query.getvalue('date-begin') != []:
		dcomp = query.getvalue('date-begin').split("/")
		y = int(dcomp[2])
		m = int(dcomp[0])
		d = int(dcomp[1])
		object_to_match["$and"].append({"$or": [{"date.y": {"$gt": y}}, {"date.y": y, "date.m": {"$gt": m}}, {"date.y": y, "date.m": m, "date.d": {"$gte": d}}]})
	if query.getvalue('date-end') != None and query.getvalue('date-end') != []:
		dcomp = query.getvalue('date-end').split("/")
		y = int(dcomp[2])
		m = int(dcomp[0])
		d = int(dcomp[1])
		object_to_match["$and"].append({"$or": [{"date.y": {"$lt": y}}, {"date.y": y, "date.m": {"$lt": m}}, {"date.y": y, "date.m": m, "date.d": {"$lte": d}}]})

	if query.getlist('observer') != 'all' and query.getlist('observer') != []:
		#print query.getlist('observer')
		object_to_match['observers'] = {"$all": query.getlist('observer')}
	
	options = ['site', 'collection_type']
	for opt in options: 
		ls = query.getlist(opt)
		if ls != ['all'] and ls != None and ls != []:
			#newls = ls
			#for s in ls:
				#newls.append(s.lower());
			object_to_match[opt] = {"$in": ls}
	
	plots = query.getlist('plot')
	if plots != None and plots != ['all'] and plots != []:
		for i in range(len(plots)):
			plots[i] = int(plots[i])
		object_to_match['plot'] = {"$in": plots}
	weather = ['sky', 'precipitation']
	for opt in weather: 
		ls = query.getlist(opt)
		if ls != ['all'] and ls != None and ls != []:			
			object_to_match['weather.' + opt] = {"$in": ls}
	
	# query on data
	# get the values requested
	trap_data = ['material', 'trap']
	traplist = [1,2,3,4,5]
	if query.getlist('trap') != None and query.getlist('trap') != ['all'] and query.getlist('trap') != []:
		traplist = []
		for i in query.getlist('trap'):
			traplist.append(int(i))
		
	types = query.getlist('type')
	if types != ['all'] and types != None and types != []:	
		for i in types:
			i = i.replace("%20"," ");
		object_to_match['trap_data'] = {"$elemMatch": {'trap': {"$in": traplist}, "$or": [{'type': {"$in": types}}, {'species': {"$in": types}}]}}
	elif traplist != [1,2,3,4,5]:
		object_to_match['trap_data'] = {"$elemMatch": {'trap': {"$in": traplist}}}
	
	#pretty sure this section was screwing up the whole script from running.. need to figure out what wrong but it's friday afternoon and I need to do other things more urgently. :D
	"""
	else:
		# something else (materials, traps, types of data, or all) was specified
		if type != [] and trap != []:
			where_query = type+".indexOf(this.type) != -1 && "+trap+".indexOf(this.trap) != -1"
		elif type != []:
			where_query = type+".indexOf(this.type) != -1"
		elif:
			where_query = trap+".indexOf(this.trap) != -1"
		
		# set up matching object
		if material == None:
			object_to_match['trap_data'] = {'$elemMatch': { '$where': where_query } }
		else:
			object_to_match['trap_data'] = {'$elemMatch': { 'material': material, '$where': where_query } }
	
	# find matching documents to return as array
	#print object_to_match
	"""
	#print object_to_match
	data = db.find(object_to_match)
	#data = [str(object_to_match)]
	return data


def getObserversList(db, x):
	# get all observers from last X years
	num_years = x  #change if you want to constrict the number of observers that are in autocomplete
	data = db.find({'date.y' : {'$gte': date.today().year - num_years}}, {'fields':'observers'}).distinct('observers')
	data.sort()
	n = len(data)
	
	return data
	
def getSitesList(db):
	#return an array of distinct sites
	data = obs.distinct('site')
	for j in range(0,len(data)):
		data[j] = data[j].encode('ascii','ignore')
	data.sort(key=str.lower)

	return data
	
#def getDataTypesList(db):
	
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
		
		"""
		Mal's comments: 
		I'm assuming we could do one of a few things: specify that we want a list of _ (observers, species, etc)
		to populate a dropdown, or else we're querying for data to report
		"""
				
		query = cgi.FieldStorage()

		# get the list of observers that have been entered in database 
		# (note: this may mean that new observers have to be somehow added since they won't show up in typeahead and validation is based on what's already in db)
		if query.getvalue("observers") == "getList":
			data = getObserversList(db, 10)
			print 'Content-Type: application/json\n'
			print json.dumps(data, default=json_util.default, separators=(',', ':'))
		
		# get list of sites
		elif query.getvalue("site") == "getList":
			data = getSitesList(db)
			print 'Content-Type: application/json\n'
			print json.dumps(data, default=json_util.default, separators=(',', ':'))
		
		# get data based on a bunch of parameters passed into the url
		else:
			
			# get data associated with specifications entered
			data = getdata(db, query)
			print 'Content-Type: application/json\n\n'
			json_data = [0]*data.count()
			for i in range(0, data.count()):
				json_data[i] = data[i]
			print json.dumps(json_data, default=json_util.default, separators=(',', ':'))
			#print json.dumps(data, default=json_util.default, separators=(',', ':'))
			#if data.count() > 0:
				#for i in range(0,data.count()):
					#print 'Content-Type: application/json\n'
					#print json.dumps(data[i], default=json_util.default, separators=(',', ':'))
					#print ""

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
