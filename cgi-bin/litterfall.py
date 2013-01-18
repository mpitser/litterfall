#! /usr/bin/python
from datetime import datetime
from pymongo import MongoClient
from bson import json_util
import json
import cgi
import os
import ConfigParser
import unicodedata
# for debug purpose
import cgitb; cgitb.enable()

#############################################################################
# this is python script that takes in query parameters from					#
# js, queries database for data and returns to js in JSON format			#
# in addition, it can validate the data before saving it to the database	#
#############################################################################

# some global variables
sites_predef = ["beech","floodplains","Knoll","norway","Oaks","swamp","TBNO","TOH"]

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
		data = obs.find(findQuery).sort([("angle",1)])
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

def checknum(tocheck, dtype, high, low):
	if tocheck > high or tocheck < low:
		return False
	else:
		return True

def checkstring(tocheck, dtype, value):
	#print 'true type', dtype
	#print 'object type is', type(tocheck)
	
	# need to take care of the stupid unicode stuff
	tocheck = unicodedata.normalize('NFKD', tocheck).encode('ascii','ignore')
		
	if not isinstance(tocheck, dtype):
		return False
	elif not tocheck in value:
		return False
	else:
		return True
		
def checkdict(diameter_dict, dtype):
	# check type first
	if not isinstance(diameter_dict, dtype):
		return False
	
	# check all the dates
	times = diameter_dict.keys()
	for time in times:
		year = int(time[0:4])
		month = int(time[5:7])
		day = int(time[7:9])
		if year < 2000:
			return False
		elif month > 12 or month < 1:
			return False
		elif day > 31 or day < 1:
			return False
		else:
			# check the note and value
			content = diameter_dict[time]
			note = content['notes']
			value = content['value']
						
			note = unicodedata.normalize('NFKD', note).encode('ascii','ignore')

			if not isinstance(note, str):
				return False
			elif not (isinstance(value, float) or isinstance(value, int)) or not value > 0:
				return False
			else:
				return True
	
	
def validate(obs, data):
	# data is dictionary, with unicode
	# e.g. {u'sub_tree_id': 0, u'plot': 1, u'full_tree_id': 1, u'angle': 86,...}
		
	fields = {'collection_type':{'type': str, 'value': ['tree'], 'high':0, 'low':0}, 
			  'site':{'type': str, 'value': sites_predef, 'high':0, 'low':0}, 
			  'plot':{'type': int, 'value': '', 'high':3, 'low':0},
			  'tree_id':{'type': int, 'value': '', 'high':999, 'low':0},
			  'sub_tree_id':{'type': int, 'value': '', 'high':999, 'low':0},
			  'angle':{'type': int, 'value': '', 'high':360, 'low':-0.1}, 
			  'distance':{'type': float, 'value': '','high':999, 'low':0}, 
			  'diameter':{'type': dict, 'value': '', 'high':0, 'low':0},
			  'dead':{'type': bool, 'value': [True, False], 'high':0, 'low':0}, 
			  'dbh_marked':{'type': bool, 'value': [True, False], 'high':0, 'low':0}}
	
	# get the all the keys
	keys = fields.keys()		  
	
	# loop the keys and check them against all criteria 
	for i in range(len(keys)):
		key = keys[i]
		tocheck = data[key]
		
		# the correct criteria
		crit = fields[key]
		dtype = crit['type']
		value = crit['value']
		high = crit['high']
		low = crit['low']
		
		# different schemes for checking
		if isinstance(tocheck, float) or isinstance(tocheck, int):
			if checknum(tocheck, dtype, high, low) == False:
				return False
				
		elif isinstance(tocheck, dict):
			if checkdict(tocheck, dtype) ==  False:
				return False
				
		else:
			if checkstring(tocheck, dtype, value) ==  False:
				return False
				
	# then all is good
	return True
		
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
		if flag:
			obs.save(data)
			data = json.dumps(data, default=json_util.default, separators=(',', ':'))
			print data
		else:
			print '\nStatus:406\n'
			
			
	elif method == 'GET':
		query = cgi.FieldStorage()
		plot = query.getvalue('plot')
		site = query.getvalue('site')
		treeid = query.getvalue('treeid')
		subtreeid = query.getvalue('subtreeid')
		getdata(obs, site, plot, treeid, subtreeid)
		
if __name__ == "__main__":
    main()
