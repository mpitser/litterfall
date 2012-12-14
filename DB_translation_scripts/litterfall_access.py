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

# Utility function to remove empty strings from a list of values
def remove_empty_values_from_list(the_list):
   return [value for value in the_list if value != ""]


# Get a list of all the unique values for observation parameters
def get_unique_observation_parameters():

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
	
	return parameters


# Get the last n observations for a specific site and plot
def get_last_observations(site, plot, num_of_observations):
	results = mongo_db.observations.find({"site":site, "plot":plot}, limit = num_of_observations).sort('collection_date',-1)
	return list(results)
	
	
print get_unique_observation_parameters()
print get_last_observations("Swamp", 1, 1)

