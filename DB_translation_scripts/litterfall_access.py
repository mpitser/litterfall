# Interact with data from Litterfall database

import ConfigParser
from pymongo import MongoClient


# Load config (for database info, etc)
Config = ConfigParser.ConfigParser()
Config.read("litterfall_translate.conf")
MongoDB_host = Config.get('MongoDB', "host")
MongoDB_db = Config.get('MongoDB', "db")

# Connect to MongoDB
mongo = MongoClient(MongoDB_host, 27017)
mongo_db = mongo[MongoDB_db]


def remove_empty_values_from_list(the_list):
   return [value for value in the_list if value != ""]

parameters = {
	"site":[],
	"plot":[],
	"collection_type": [],
	"precipitation_condition": [],
	"sky_condition": []
}

for p in parameters.keys():
   	results = mongo_db.observations.distinct(p)
	parameters[p] = sorted(remove_empty_values_from_list(results))

print parameters



