from datetime import datetime
import json
import pymongo
from bson import json_util
import ConfigParser

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

# need to grab the variables form the front end

# hierarchy: site > plot > quadrant
# let's see how many sites there are
t_all = obs.find({'collection_type':'tree'}).distinct('site')
print t_all
#sites = t_all.distinct('site')
print json.dumps(t_all)

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

# try experiment with sending some data
t_in_p1 = obs.find({'collection_type':'tree','plot':1, 'site': 'Knoll', 'quadrant': 1})

n = t_in_p1.count()
json_data = [0]*n
print 'Content-Type: application/json\n'
for i in range(0,n):
    json_data[i] = t_in_p1[i]

ser_data = json.dumps(json_data,default=json_util.default, separators=(',', ':'))
print ser_data
