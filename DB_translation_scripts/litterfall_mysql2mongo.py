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



# Connect to MySQL
mysql_db = pymysql.connect(host=MySQL_host, port=3306, user=MySQL_user, passwd=MySQL_pw, db=MySQL_db)

# Cnnect to MongoDB
mongo = MongoClient('ec2-107-22-11-44.compute-1.amazonaws.com', 27017)
mongo_db = mongo.machado_db



# Get all the sites from MySQL and put them into MongoDB
cur = mysql_db.cursor()
cur.execute("SELECT distinct location from jlm_litterfall_observation")
sites = mongo_db.sites

for r in cur.fetchall():
   	print r[0]
	site_id = sites.save({"_id": r[0]})

exit()

# Get all the observations
observations_missing_data = []

cur.execute("SELECT o.sample_id, o.row_id, o.location, o.plot, o.colltype, o.observerA, o.observerB, o.observerC, o.notes, o.collection_date, o.sky_condition, o.precipitation_condition from jlm_litterfall_observation as o where o.row_id")

for r in cur.fetchall():

	print r

	# Get each datapoint for this observation
	# There are two tables -- if we can't find observations in one, try the second
	d = mysql_db.cursor()
	d.execute("SELECT d.trap, d.sample_type, d.value from jlm_litterfall_data as d where d.sample_id = %d" % r[1])
	
	if d.rowcount==0:
		# Try alternate table
		d.execute("SELECT d.trap, d.sample_type, d.value from jlm_litterfall_data3 as d where d.sample_id = '%s'" % r[0])
		
	if d.rowcount!=0:
		print "\tNumber of observations: %d" % d.rowcount
		for datapoint in d.fetchall():
			print datapoint
	else:
		print "**** NO DATAPOINTS ***"
		# Keep track of observations that don't have datapoints
		observations_missing_data.append(r[0])

print "Sample ID's missing observations:"
print observations_missing_data


d.close()
cur.close()
mysql_db.close()


