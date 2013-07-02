#! /usr/bin/python
from datetime import datetime
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

# TODO: what kind of feedback would it give if validation fails?

# some global variables
sites_predef = ["beech","floodplains","Knoll","norway","Oaks","swamp","TBNO","TOH"]

# Tree is an object that mediates between MongoDB and the script. it makes sure the data--
# both the input data and the data to be stored in the database--is formatted in the correct
# way.
class Tree:

	# __init__(tree, obs):
	# 	> tree is a json containing elementary data of the tree
	#		- the only two fields that tree has to have are plot and site
	#		- tree_id and sub_tree_id do not have to be specified. however, if they are not
	#		  specified, it means that the tree is new
	#		- if tree_id is specified and sub_tree_id is not, there are two possibilities
	#		  depending on whether there is already subtree(s) under the specified tree_id.
	#		  if there is, then the new Tree would be assumed to be the latest new sub_tree.
	#		  if there isn't, then the new Tree would become the new tree.
	#	> obs is the mongodb collection
	def __init__(self, tree, obs):
		
		# if they are specified, domesticate them
		self.plot = int(tree['plot'])
		self.site = tree['site']
		
		# collection	
		self.obs = obs
		
		# tree and formatted data
		self.tree = tree
		self.tree['collection_type'] = 'tree'
		self.tree['plot'] = int(self.tree['plot'])
		
		# tree_id and sub_tree_id
		# these ids do not have to be specified, yet
		# if the ids are not specified, that means it is new!
		# the default would be False, which means that it is not new
		
		# tree_id
		if not 'tree_id' in self.tree:
			self.tree['tree_id'] = -1
			self.tree['sub_tree_id'] = -1
		else:
			self.tree['tree_id'] = int(tree['tree_id'])
			
			# sub_tree_id	
			if not 'tree_id' in self.tree:
				self.tree['sub_tree_id'] = 0
			else:
				self.tree['sub_tree_id'] = int(tree['sub_tree_id'])
	
	def initValidate(self):
		if tree['plot'] == None or tree['site'] == None:
			raise RuntimeError("Cannot instantiate Tree, since plot and/or site are illegal")
			
	def printJSON(self):
		data = json.dumps(self.tree, default=json_util.default, separators=(',', ':'))
		print 'Content-Type: application/json\n'
		print data
			
	def updateData(self, data):
		self.tree = data
		
	def getData(self):
		return self.tree
	
	# save(data = self.tree)
	def save(self, data = None):
	
		# if user does not update the data
		if data != None:
			self.updateData(data)
			
		# format the data
		result = self.format()
		if type(result) is StringType:
			self.printError(result)
			return
		
		# ---- dealing with a possible new tree ----
		
		# do we need a new tree_id?
		if self.tree['tree_id'] == -1:
			# get the highest tree_id
			maxIdQuery = {
				'collection_type':'tree',
				'plot': self.tree['plot'],
				'site': self.tree['site']
			}
			
			maxIdTree = self.obs.find(maxIdQuery).sort([('tree_id',pymongo.DESCENDING)]).limit(1)
			if maxIdTree.count() == 0:
				maxId = 0
			else:
				maxId = maxIdTree[0]['tree_id']
			
			self.tree['tree_id'] = maxId + 1
			self.tree['sub_tree_id'] = 0
			
			self.tree['_id'] = ObjectId()
			
		else:
			# check sub_tree_id
			findQueryAllSubTrees = {
				'collection_type':'tree',
				'plot': self.tree['plot'],
				'site': self.tree['site'],
				'tree_id': self.tree['tree_id']
			}
			
			allSubTrees = self.obs.find(findQueryAllSubTrees)
			numSubTrees = allSubTrees.count()
			
			# if there is no tree existing
			if numSubTrees < 1:
				# create a new tree
				self.tree['sub_tree_id'] = 0
				self.tree['_id'] = ObjectId()
				
			# if there are trees existing already under the specified tree_id
			else:
				# find the subtree
				
				numThisSubTree = 0
				
				if self.tree['sub_tree_id'] >= 0:
				
					findQueryThisSubTree = {
						'collection_type':'tree',
						'plot': self.tree['plot'],
						'site': self.tree['site'],
						'tree_id': self.tree['tree_id'],
						'sub_tree_id': self.tree['sub_tree_id']
					}
					
					thisSubTree = self.obs.find(findQueryThisSubTree)
					numThisSubTree = thisSubTree.count()
				
				# if this subtree does not already exist
				if numThisSubTree == 0:
					# only one tree
					if allSubTrees.count() == 1:
						self.obs.update(findQueryAllSubTrees, {'$set': {'sub_tree_id': 1}})
						# then, add a new subtree
						self.tree['sub_tree_id'] = 2
					else:
						# sorted(allSubTrees, key=lambda subTree: subTree['sub_tree_id'], reverse=True)
						maxSubTreeId = allSubTrees.count()
						self.tree['sub_tree_id'] = maxSubTreeId + 1
						
					self.tree['_id'] = ObjectId()
		
		self.obs.save(self.tree)
		self.updateTreeUniversal()
		return self.tree
		
	def printError(self, msg):
		print 'Status:406\n'
		print msg
	
	def format(self):
		
		if not 'tree_id' in self.tree:
			msg = "No tree ID specified"
		else:
			if self.tree['tree_id'] <= 0 or self.tree['tree_id'] != -1:
				msg = "Tree ID is invalid"
		
		if not 'sub_tree_id' in self.tree:
			return "No sub-tree ID specified"
		else:
			if self.tree['sub_tree_id'] < 0 or self.tree['sub_tree_id'] != -1:
				msg = "Sub-tree ID is invalid"
				
		
		if not 'plot' in self.tree:
			return "No plot specified"
		if not 'site' in self.tree:
			return "No site specified"
			
		
		if not 'collection_type' in self.tree or self.tree['collection_type'] != 'tree':
			self.tree['collection_type'] = 'tree'
		
		if not 'species' in self.tree:
			return "No species specified"
		elif self.tree['species'] == '':
			return "No species specified"
		
		
		if not 'angle' in self.tree:
			return "No angle specified"
		else:
			if type(self.tree['angle']) is not IntType:
				return "Invalid angle"
			else:
				self.tree['angle'] = self.tree['angle'] % 360
		
		
		if not 'distance' in self.tree:
			return "No distance specified"
		else:
			if type(self.tree['distance']) is not IntType:
				return "Invalid distance"
			elif self.tree['distance'] < 0:
				self.tree['distance'] = -1 * self.tree['distance']
				self.tree['angle'] = (self.tree['angle'] + 180) % 360
		
		if 'full_tree_id' in self.tree:
			del self.tree['full_tree_id']
			
		# check the observation data
		if not 'diameter' in self.tree:
			self.tree['diameter'] = []
		elif type(self.tree['diameter']) is not ListType:
			return "Invalid diameter"
		else:
			i = -1
			for observationEntry in self.tree['diameter']:
				i = i+1
				# check date
				if not 'date' in observationEntry:
					return "Observation date unspecified"
				
				
				elif not 'y' in observationEntry['date'] or not 'm' in observationEntry['date'] or not 'd' in observationEntry['date']:
					return "Invalid date"
				elif type(observationEntry['date']['y']) is not IntType or type(observationEntry['date']['m']) is not IntType or type(observationEntry['date']['d']) is not IntType:
					return "Invalid date"
				else:
					if observationEntry['date']['m'] > 12 or observationEntry['date']['m'] < 1:
						return "Invalid date"
					elif observationEntry['date']['d'] > 31 or observationEntry['date']['d'] < 1:
						return "Invalid date"
					elif observationEntry['date']['m'] in [4, 6, 9, 11]:
						if observationEntry['date']['d'] == 31:
							return "Invalid date"
					elif observationEntry['date']['m'] == 2:
						if observationEntry['date']['d'] > 29:
							return "Invalid date"
						elif observationEntry['date']['d'] == 29:
							# check if leap year
							if observationEntry['date']['y'] % 400 != 0: # if divisible by 400, it is a leap year
								if observationEntry['date']['y'] % 100 == 0: # if divisible by 100, it is NOT a leap year
									return "Invalid date"
								elif observationEntry['date']['y'] % 4 != 0:
									return "Invalid date"
				
				# check observers
				if not 'observers' in observationEntry:
					self.tree['diameter'][i]['observers'] = []
				elif type(observationEntry['observers']) is not ListType:
					return "Invalid observers"
				else:
					for observer in observationEntry['observers']:
						if type(observer) is not StringType:
							return "Invalid observers"
				
				# check value
				if not 'value' in observationEntry:
					return "Value not specified in observation entry"
				elif type(observationEntry['value']) is not IntType and type(observationEntry['value']) is not FloatType and type(observationEntry['value']) is not LongType:
					return "Invalid value in observation entry"
				
				# check notes
				if not 'notes' in observationEntry:
					return "Notes not specified in observation entry"
				elif type(observationEntry['notes']) is not StringType:
					return "Invalid notes in observation entry"
				
		return True
	
	def updateTreeUniversal(self):
	
		findQueryAllSubTrees = {
			'collection_type':'tree',
			'plot': self.tree['plot'],
			'site': self.tree['site'],
			'tree_id': self.tree['tree_id']
		}
		
		self.obs.update(findQueryAllSubTrees, {'$set' : {'species': self.tree['species']} }, **{'multi':True})
		
	def delete(self):
		
		if not '_id' in self.tree:
		
			findQueryThisSubTree = {
				'collection_type':'tree',
				'plot': self.tree['plot'],
				'site': self.tree['site'],
				'tree_id': self.tree['tree_id'],
				'sub_tree_id': self.tree['sub_tree_id']
			}
			
			self.obs.remove(findQueryThisSubTree)
			
		else:
		
			self.obs.remove({'_id': self.tree['_id']})
			
		# update the ordering of the remaining subtrees
		findQueryAllSubTrees = {
			'collection_type':'tree',
			'plot': self.tree['plot'],
			'site': self.tree['site'],
			'tree_id': self.tree['tree_id']
		}
		
		allSubTrees = [] 
		
		allSubTrees = self.obs.find(findQueryAllSubTrees)
		
		if allSubTrees.count() == 1:
			self.obs.update({'_id': allSubTrees[0]['_id']}, {'$set': {'sub_tree_id': 0} })
		
		else:
			
			allSubTrees = sorted(allSubTrees, key = lambda SubTree: SubTree['sub_tree_id'])
			
			i = 0
			for SubTree in allSubTrees:
				self.obs.update({'_id': SubTree['_id']}, {'$set': {'sub_tree_id': i + 1} })
				#self.tree['error'][i] = SubTree['sub_tree_id']
				i = i + 1
						
def getdatafromoid(obs, oid):
	objectId = ObjectId(oid)
	data = obs.find({'_id': objectId})
	json_data = data[0]
	ser_data = json.dumps(json_data, default=json_util.default, separators=(',', ':'))
	print ser_data

def getdata(obs, site, plot, treeid, subtreeid):
	if site == 'all':
		# then return an array of distinct sites
		data = obs.find({'collection_type':'tree'}).distinct('site')
		for j in range(0,len(data)):
			data[j] = data[j].encode('ascii','ignore')
		data.sort(key=str.lower)
		n = len(data)
	elif site == 'allSpecies':
		# Get a list of all the unique species of trees in the database
		data = obs.find({'collection_type':'tree'}, {'fields':'species'}).distinct('species')
		data.sort()	# Use Python's built-in sort to alphabetize the species listing
		n = len(data)
	elif site == 'allDiameters':
		# get all diameter fields from database
		# from each diam field, get all observers (within date range eventually)
		
		data = obs.find({'collection_type':'tree'}, {'fields':'diameter'}).distinct('diameter')
		data.sort()
		n = 0 # n is not important, just helps up in decigin which data to assign to json_data
	elif site == 'allObservers':
		data = obs.find({'collection_type':'tree'}, {'fields':'diameter.observers'}).distinct('diameter.observers')
		data.sort()
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
			if subtreeid != None and subtreeid != 'all':
				# if there is a sub tree id, then append
				findQuery['sub_tree_id'] = int(subtreeid)			
		# get the data 
		data = obs.find(findQuery).sort([("angle",1)])
		n = data.count()

	# validate the return data
	# if only a treeid is given and
	# that particular tree has subtrees
	# then return nothing
	if  treeid != None and n > 1 and subtreeid != 'all':
		json_data = None
	elif n == 0:
		#return diameter objects
		json_data = data
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
	
def checknum(tocheck, dtype, high, low):
	if tocheck > high or tocheck < low:
		return {'flag': False, 'msg': 'check boundary!'}
	else:
		return {'flag': True, 'msg': 'passed number check'}

def checkstring(tocheck, dtype, value):	
	# need to take care of the stupid unicode stuff
	tocheck = unicodedata.normalize('NFKD', tocheck).encode('ascii','ignore')
		
	if not isinstance(tocheck, dtype):
		return {'flag': False, 'msg': 'wrong data type!'}	
	elif not tocheck in value:
		return {'flag': False, 'msg': 'wrong value!'}	
	else:
		return {'flag': True, 'msg': 'passed string check'}
		
def checkdict(diameter_dict, dtype):
	# check type first
	if not isinstance(diameter_dict, dtype):
		return {'flag': False, 'msg': 'wrong data type!'}
	
	# check all the dates
	times = diameter_dict.keys()
	for time in times:
		year = int(time[0:4])
		month = int(time[5:7])
		day = int(time[7:9])
		if year < 2000:
			return {'flag': False, 'msg': 'wrong year!'}	
		elif month > 12 or month < 1:
			return {'flag': False, 'msg': 'wrong month!'}	
		elif day > 31 or day < 1:
			return {'flag': False, 'msg': 'wrong day!'}	
		else:
			# check the note and value
			content = diameter_dict[time]
			note = content['notes']
			value = content['value']
						
			# need to take care of the stupid unicode stuff
			note = unicodedata.normalize('NFKD', note).encode('ascii','ignore')

			if not isinstance(note, str):
				return {'flag': False, 'msg': 'wrong notes type!'}	
			elif not (isinstance(value, float) or isinstance(value, int)) or not value > 0:
				return {'flag': False, 'msg': 'wrong diameter type or value!'}	
			else:
				return {'flag': True, 'msg': 'passed dictionary check'}
	
def validate(obs, data):
	# data is dictionary, with unicode
	# e.g. {u'sub_tree_id': 0, u'plot': 1, u'full_tree_id': 1, u'angle': 86,...}
		
	# fields to check and their criteria
	# VALIDATION IS DISABLED!!!!
	'''
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
			result = checknum(tocheck, dtype, high, low)
			result['key'] = key
			if result['flag'] == False:
				print "scheme 1 flag"
				return result			
		elif isinstance(tocheck, dict):
			result = checkdict(tocheck, dtype)
			result['key'] = key
			if result['flag'] ==  False:
				print "scheme 2 flag"
				return result				
		else:
			result = checkstring(tocheck, dtype, value)
			result['key'] = key
			if result['flag'] ==  False:
				print "scheme 3 flag"
				return result
				
	# then all is good
	'''
	return {'flag': True, 'msg': 'passed all checks'}
		
def main():
	global Tree

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

	if method == 'GET':
		print 'Content-Type: application/json\n'
		query = cgi.FieldStorage()
		
		action = query.getvalue('action')
		
		if action == 'search':
			oid = query.getvalue('oid')
			getdatafromoid(obs, oid)
		else:
			oid = query.getvalue('oid')
			plot = query.getvalue('plot')
			site = query.getvalue('site')
			treeid = query.getvalue('treeid')
			subtreeid = query.getvalue('subtreeid')
			
			if oid != None:
				getdatafromoid(obs, oid)
			else:
				getdata(obs, site, plot, treeid, subtreeid)
			
	elif method == 'POST' or method == 'PUT':
		form = cgi.FieldStorage()
		data = json.loads(form.file.read(), object_hook=json_util.object_hook)	
		result = validate(obs, data)
		flag = result['flag']
		msg = result['msg']
		if flag:
			newTree = Tree(data, obs)
			if 'delete' in data:
				if data['delete'] == True:
					newTree.delete()
			else:
				newTree.save()
			newTree.printJSON()
		else:
			print 'Status:406\n'
			print result['key'] + '->' + msg
			
	elif method == 'DELETE':
		form = cgi.FieldStorage()
		data = json.loads(form.file.read(), object_hook=json_util.object_hook)
		newTree = Tree(data, obs)
		newTree.delete()
		newTree.printJSON()
		
		
if __name__ == "__main__":
    main()
