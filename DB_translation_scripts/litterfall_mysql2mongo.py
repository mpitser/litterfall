# Import data from Litterfall database and send to MongoDB

import pymysql
import ConfigParser
from pymongo import MongoClient


# Need to start with SSH tunnel to Moodle host
# e.g. ssh -n -N -f -L 3306:localhost:3306 aruethe2@acadweb.swarthmore.edu

# Load config (for database info, etc)
Config = ConfigParser.ConfigParser()
Config.read("litterfall_translate.conf")
MySQL_host = Config.get('MySQL', "host")
MySQL_user = Config.get('MySQL', 'user')
MySQL_pw = Config.get('MySQL', 'pw')
MySQL_db = Config.get('MySQL', 'db')
MongoDB_host = Config.get('MongoDB', "host")
MongoDB_db = Config.get('MongoDB', "db")


# Connect to MySQL
mysql_db = pymysql.connect(host=MySQL_host, port=3306, user=MySQL_user, passwd=MySQL_pw, db=MySQL_db)

# Cnnect to MongoDB
mongo = MongoClient(MongoDB_host, 27017)
mongo_db = mongo[MongoDB_db]



# Get all the sites from MySQL and put them into MongoDB
cur = mysql_db.cursor(pymysql.cursors.DictCursor)
cur.execute("SELECT distinct location from jlm_litterfall_observation")
sites = mongo_db.sites
for r in cur.fetchall():
   	print r["location"]
	site_id = sites.save({"_id": r["location"]})


# Find all observations, match them up with data, format as a document, and save to MongoDB

# Keep track of observations with missing data
observations_missing_data = []

# Use MongoDB observation collection
observations = mongo_db.observations

cur.execute("SELECT sample_id, row_id, location, plot, colltype, observerA, observerB, observerC, notes, collection_date, sky_condition, precipitation_condition from jlm_litterfall_observation")

for r in cur.fetchall():
	
	print "Now working on sample id: %s, row_id" % r["sample_id"], r["row_id"]
	
	# Create a new record to push data into.  Start with the data from the observations
	# We'll add the actual leaf data later
	document = {
		"sample_id": r["sample_id"],
		"row_id": r["row_id"],
		"site": r["location"],
		"plot": r["plot"],
		"observers":[],
		"collection_type": r["colltype"],
		"notes": r["notes"],
		"sky_condition": r["sky_condition"],
		"precipitation_condition": r["precipitation_condition"]
	}
	
	# Check to make sure the collection_date is present. If so, format it and add it to the document
	if r["collection_date"]:
		document["collection_date"] = r["collection_date"].strftime("%Y-%m-%d")
	
	# Add all non-empty observers
	if len(r["observerA"])>0:
		document["observers"].append(r["observerA"])
	if len(r["observerB"])>0:
		document["observers"].append(r["observerB"])
	if len(r["observerC"])>0:
		document["observers"].append(r["observerC"])	
	

	# Get each datapoint for this observation
	# There are two tables -- if we can't find observations in one, try the second
	d = mysql_db.cursor(pymysql.cursors.DictCursor)
	d.execute("SELECT d.trap, d.sample_type, d.value as mass from jlm_litterfall_data as d where d.sample_id = %d" % r["row_id"])
	
	if d.rowcount==0:
		# Try alternate table
		d.execute("SELECT d.trap, d.sample_type, d.value as mass from jlm_litterfall_data3 as d where d.sample_id = '%s'" % r["sample_id"])
		
	if d.rowcount!=0:
		data = []
		print "\tNumber of observations: %d" % d.rowcount
		for datapoint in d.fetchall():
			data.append(datapoint)
		document["data"] = data
		print document
		observation_id = observations.save(document)
			
			
	else:
		print "**** NO DATAPOINTS ***"
		# Keep track of observations that don't have datapoints
		observations_missing_data.append(r["sample_id"])
		
	

print "Sample ID's missing observations:"
print observations_missing_data


d.close()
cur.close()
mysql_db.close()


