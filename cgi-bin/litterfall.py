#! /usr/bin/python
from datetime import datetime
import json
import cgi
from pymongo import MongoClient
from bson import json_util
import ConfigParser

# get the query string
query = cgi.FieldStorage()
plot = query.getvalue('plot')
site = query.getvalue('site')

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

if site == 'all':
    data = obs.find({'collection_type':'tree'}).distinct('site')
    n = len(data)
else:
    data = obs.find({'collection_type':'tree','plot': int(plot), 'site': site})    
    n = data.count()

json_data = [0]*n

# copy it over to another empty array
for i in range(0,n):
    json_data[i] = data[i]

ser_data = json.dumps(json_data, default=json_util.default, separators=(',', ':'))

# hierarchy: site > plot > quadrant
# let's see how many sites there are

print 'Content-Type: application/json\n'
print ser_data

#print 'List of unique sites are:'
#print json.dumps(t_all)

'''
# for each site, plots and quadrants, find out how many trees there are
for site in sites:
    print 'site:', site
    num_plots = len(obs.find({'collection_type':'tree', 'site': site}).distinct('plot'))
    print 'number of plots:', num_plots
    print
    
    # for each plot
    for plot in range(1,num_plots+1):
        num_quads = len(obs.find({'collection_type':'tree',
                                  'site': site, 'plot': plot}).distinct('quadrant'))

        # for each quadrant
        for quadrant in range(1,num_quads+1):
            num_trees = obs.find({'collection_type':'tree',
                                      'site': site, 'plot': plot, 'quadrant': quadrant}).count()
            print 'site', site, 'plot', plot, 'quadrant', quadrant
            print 'has', num_trees
            print
'''
