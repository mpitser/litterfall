# Import data from Litterfall database and send to MongoDB

import pymysql

# Need to start with SSH tunnel to Moodle host
# e.g. ssh -n -N -f -L 3306:localhost:3306 swarthmo@moodle.swarthmore.edu

conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', passwd='', db='moonwatch')
cur = conn.cursor()

# Get all the sites
cur.execute("SELECT distinct location from jlm_litterfall_observation")

for r in cur.fetchall():
   print r[0]


# Get all the observations
cur.execute("SELECT o.sample_id, o.location, o.plot, o.colltype, o.observerA, o.observerB, o.observerC, o.notes, o.collection_date, o.sky_condition, o.precipitation_condition from jlm_litterfall_observation as o")

for r in cur.fetchall():

	print r

	# Get each datapoint for this observation
	d = conn.cursor()
	d.execute("SELECT d.trap, d.sample_type, d.value from jlm_litterfall_observation as o ,  jlm_litterfall_data3 as d where d.sample_id = '%s'" % r[0])

	for datapoint in d.fetchall():
		print datapoint



#cur.execute("SELECT o.location, o.plot, o.colltype, o.observerA, o.observerB, o.observerC, o.notes, o.collection_date from jlm_litterfall_observation as o and  jlm_litterfall_data3 as d where jlm_litterfall_observation.sample_id = jlm_litterfall_data3.sample_id")
