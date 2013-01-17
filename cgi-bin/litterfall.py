#! /usr/bin/python
from datetime import datetime
from pymongo import MongoClient
from bson import json_util
import json
import cgi
import os
import ConfigParser
# for debug purpose
import cgitb; cgitb.enable()


#############################################################################
# this is python script that takes in query parameters from					#
# js, queries database for data and returns to js in JSON format			#
# in addition, it can validate the data before saving it to the database	#
#############################################################################

# some global variables
sites_predef = ["beech","floodplains","Knoll","norway","Oaks","swamp","TBNO","TOH"]
plots_predef = [1, 2]

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
		data = obs.find(findQuery).sort("tree_id", 1)
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

####
# tree id, int
# sub tree id, int, 0 by default
# collection type = tree
# site, part of the predefined existing site, str
# plot, part of the predefined plots, int
# angle, float, check limits
# dist, float, >0
# diameter, value = float, >0, date = str, yr>2000, mth >0 <=12, day > 0 <=31
# comment, str, <1kb
# dead, True or False 
# dbh marked, True or False
####
def validate(obs, data):
	# data is dictionary, with unicode
	# e.g. {u'sub_tree_id': 0, u'plot': 1, u'full_tree_id': 1, u'angle': 86,...}
	#print isinstance(str(data['site']), str)
	
	fields = {'collection_type':{'type': str, 'value': ['tree'], 'high':0, 'low':0}, 
			  'site':{'type': str, 'value': sites_predef, 'high':0, 'low':0}, 
			  'plot':{'type': int, 'value': plots_predef, 'high':999, 'low':0},
			  'tree_id':{'type': int, 'value': range(999), 'high':0, 'low':0},
			  'sub_tree_id':{'type': int, 'value': range(-1, 999), 'high':0, 'low':0},
			  'angle':{'type': float, 'value': '', 'high':360, 'low':-0.1}, 
			  'distance':{'type': float, 'value': '','high':999, 'low':0}, 
			  'diameter':{'type': dict, 'value': '', 'high':0, 'low':0},
			  'dead':{'type': bool, 'value': [True, False], 'high':0, 'low':0}, 
			  'dbh_marked':{'type': bool, 'value': [True, False], 'high':0, 'low':0}}
	
	keys = fields.keys()		  
	
	for i in range(len(keys)):
		key = keys[i]
		
		# need to check this against the right criteria
		tocheck = data[key]
		print tocheck 
		
		# the correct criteria
		crit = fields[key]
		type = crit['type']
		value = crit['value']
		high = crit['high']
		low = crit['low']
		
		if isinstance(tocheck, float):
			checkfloat()
		elif isinstance(tocheck, dict):
			checkdict()
		else:
			checkregular()
			'''
			if not isinstance(tocheck, type):
				return False
			elif tocheck[key] not in value:
				return False
			elif tocheck[key] < low:
				return False
			elif tocheck[key] > high
				return False
			else: 
				return True
			'''
	#data_val = obs.find(data)
	# check if it returns multiple documents
	#if data_val.count() > 1:
	#	return False
	#else:
	#	return True
	
def checkfloat(tocheck, type, high, low):
	if not isinstance(tocheck, type):
		return False
	elif tocheck > high or tocheck < low:
		return False
	else:
		return True

def checkregular(tocheck, type, value):
	if not isinstance(tocheck, type):
		return False
	elif not tocheck in value:
		return False
	else:
		return True
		
def checkdict(diameter_dict, type):
	# check type first
	if not isinstance(diamter_dict, type):
		return False
	
	# check all the dates
	times = diameter_dict.keys()
	for time in times:
		year = int(time[0:4])
		month = int(time[5:7])
		day = int(time[7:9])
		if year
		
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
		flag = validate(obs, data)
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
