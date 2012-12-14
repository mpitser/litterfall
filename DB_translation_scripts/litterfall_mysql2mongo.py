# Import data from Litterfall database and send to MongoDB

import pymysql
import ConfigParser

# Need to start with SSH tunnel to Moodle host
# e.g. ssh -n -N -f -L 3306:localhost:3306 aruethe2@acadweb.swarthmore.edu

# Load config (for database info, etc)
Config = ConfigParser.ConfigParser()
Config.read("litterfall_translate.conf")
MySQL_host = Config.get('MySQL', "host")
MySQL_user = Config.get('MySQL', 'user')
MySQL_pw = Config.get('MySQL', 'pw')
MySQL_db = Config.get('MySQL', 'db')

print MySQL_db

conn = pymysql.connect(host=MySQL_host, port=3306, user=MySQL_user, passwd=MySQL_pw, db=MySQL_db)
cur = conn.cursor()

# Get all the sites
cur.execute("SELECT distinct location from jlm_litterfall_observation")

for r in cur.fetchall():
   print r[0]



# Get all the observations
observations_missing_data = []

cur.execute("SELECT o.sample_id, o.row_id, o.location, o.plot, o.colltype, o.observerA, o.observerB, o.observerC, o.notes, o.collection_date, o.sky_condition, o.precipitation_condition from jlm_litterfall_observation as o where o.row_id")

for r in cur.fetchall():

	print r

	# Get each datapoint for this observation
	# There are two tables -- if we can't find observations in one, try the second
	d = conn.cursor()
	d.execute("SELECT d.trap, d.sample_type, d.value from jlm_litterfall_data as d where d.sample_id = %d" % r[1])
	
	if d.rowcount==0:
		# Try alternate table
		d.execute("SELECT d.trap, d.sample_type, d.value from jlm_litterfall_data3 as d where d.sample_id = '%s'" % r[0])
		
	if d.rowcount!=0:
		print "\tNumber of obserbations: %d" % d.rowcount
		#for datapoint in d.fetchall():
			#print datapoint
	else:
		print "**** NO DATAPOINTS ***"
		# Keep track of observations that don't have datapoints
		observations_missing_data.append(r[0])

print "Sample ID's missing observations:"
print observations_missing_data

#cur.execute("SELECT o.location, o.plot, o.colltype, o.observerA, o.observerB, o.observerC, o.notes, o.collection_date from jlm_litterfall_observation as o and  jlm_litterfall_data3 as d where jlm_litterfall_observation.sample_id = jlm_litterfall_data3.sample_id")

d.close()
cur.close()
conn.close()