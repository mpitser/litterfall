from bson import json_util
import json, cgi, os, ConfigParser, unicodedata
# for debug purpose
import cgitb; cgitb.enable()

#############################################################################################
# this is python script that takes in query parameters from	js, queries database for data	#
# and returns to js in JSON format. in addition, it can validate the data before saving it  #
# to the database																			#
#############################################################################################

# some global variables
sites_predef = ["beech","floodplains","Knoll","norway","Oaks","swamp","TBNO","TOH"]

def main():
	# Load config (for database info, etc)
	Config = ConfigParser.ConfigParser()
	Config.read("crum_woods_translate.conf")
	MongoDB_host = Config.get('MongoDB', "host")
	MongoDB_db = Config.get('MongoDB', "db")
	
	# Connect to MongoDB
	mongo = MongoClient(MongoDB_host, 27017)
	mongo_db = mongo[MongoDB_db]	
	
	# Use MongoDB observation collection
	obs = mongo_db.tree_observations
	
	print 'Content-Type: application/json\n'
	print {"site":"beech"}
	
	'''
	method = os.environ['REQUEST_METHOD']
	
	
	if method == 'GET':
		print 'Content-Type: application/json\n'
		query = cgi.FieldStorage()
		plot = query.getvalue('plot')
		site = query.getvalue('site')
		treeid = query.getvalue('treeid')
		subtreeid = query.getvalue('subtreeid')
		getdata(obs, site, plot, treeid, subtreeid)	
	elif method == 'POST' or method == 'PUT':
		form = cgi.FieldStorage()
		data = json.loads(form.file.read(), object_hook=json_util.object_hook)	
		result = validate(obs, data)
		flag = result['flag']
		msg = result['msg']
		if flag:
			obs.save(data)
			data = json.dumps(data, default=json_util.default, separators=(',', ':'))
			print 'Content-Type: application/json\n'
			print data
		else:
			print 'Status:406\n'
			print result['key'] + '->' + msg
	'''
		
if __name__ == "__main__":
    main()