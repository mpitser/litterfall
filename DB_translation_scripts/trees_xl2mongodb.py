import xlrd
# Script to import Jose-Luis Machado's tree data from Excel spreadsheets to MongoDB
# Run as "python trees_xl2mongodb.py <list of Excel spreadsheet files>"

import argparse
from datetime import datetime
from pymongo import MongoClient
import ConfigParser
import json
import datetime

parser = argparse.ArgumentParser(description='Extract tree data from JLM Excel files.')
parser.add_argument('excel_filenames', help='Excel tree data file(s)' ,nargs='+')
args = parser.parse_args()


# Load config (for database info, etc)
Config = ConfigParser.ConfigParser()
Config.read("crum_woods_translate.conf")
MongoDB_host = Config.get('MongoDB', "host")
MongoDB_db = Config.get('MongoDB', "db")


# Connect to MongoDB
mongo = MongoClient(MongoDB_host, 27017)
mongo_db = mongo[MongoDB_db]	

# Use MongoDB observation collection
observations = mongo_db.tree_observations

def getStatus(notes, observation):

	# had to add in a lot of specific code to catch specific errors that would mess up a tree's status listing.
	if ("missing" in notes and "not missing" not in notes) or ("no longer present" in notes) or ("can't find" in notes) or (observation['status'] == "missing"):
		return "missing"
	elif ("fallen" in notes or "fell" in notes) and ("dead" in notes or observation['status'].find("dead") != -1):
		return "dead_fallen"
	elif "standing" in notes or ("dead" in notes or "Dead" in notes and "not dead" not in notes and "might be dead" not in notes):
		return "dead_standing"
	else:
		return "alive"
	
	#print notes
	#print observation['status']
	#print 
	#return observation['status']


def addDiameterObservation(sheet, headers, rownum, observation, year):
	try:
		diam = sheet.row_values(rownum)[headers.index(str(year) + " DBH cm")]
		notes = str(sheet.row_values(rownum)[headers.index(str(year) + " Comments")])
		
		# getting the status for this observation involves combing through the notes and also the previously set global tree status
		status = getStatus(notes, observation)
		
		observation['diameter'].append({'value': diam, 'notes':notes, 'date': {'y': year, 'm': 01, 'd': 01}, 'status': status, 'observers': [] })
	except ValueError:
		print "No data from " + str(year)
		return observation['status']
		
	return status


def getSpecies(sheet, headers, rownum, observation):
	
	species_given = sheet.row_values(rownum)[headers.index("2009 Species full name")]
	#print "given: ", species_given
	
	observation['species'] = "Unidentified spp."
	
	if species_given.lower() == "dead":
		return ""
	
	f = open('../html/data/master_species_info.json')
	species_array = json.load(f)

	# see if species_given is in array (compare all lowercase)
	for i in range (0, len(species_array)):

		# exact match other than capitalizations		
		if species_given.lower() == species_array[i]['Scientific_Name'].lower():
			observation['species'] = species_array[i]['Scientific_Name']
			f.close()
			return ""
		
		# only genus matches, not specific species (NOTE: quercus (oak trees) don't have a spp., so we have to exclude it.
		if species_given.lower().split(" ")[0] == species_array[i]['Scientific_Name'].lower().split(" ")[0] and \
		   species_given.lower().split(" ")[0] != "quercus":
			observation['species'] = species_array[i]['Scientific_Name'].split(" ")[0] + " spp."
			
	f.close()
	
	# if we get through the loop, the species given was not matched exactly;
	# return the species_given to enter into comments for user info.	
	return " **Species may be: " + species_given + " (check for mispelling and edit tree info accordingly!)**"

for file in args.excel_filenames:
	workbook = xlrd.open_workbook(file)
	sheet = workbook.sheet_by_index(0)
	
	# Get values from header
	headers = sheet.row_values(0)

	# years to check for
	dataStartYear = 2002
	dataEndYear = datetime.date.today().year
	
	# Iterate through rows, returning each as a list that you can index:
	
	for rownum in range(sheet.nrows):
		if rownum == 0:
			continue
		
		# Start a new document
		observation = {}
		
		# get the tree's meta-information
		observation['collection_type'] = 'tree'
		observation['site'] = sheet.row_values(rownum)[headers.index("Site Name")]
		observation['plot'] = int(sheet.row_values(rownum)[headers.index("Plot number")])
		observation['quadrant'] = int(sheet.row_values(rownum)[headers.index("Quadrant")])
		
		full_tree_id = str(sheet.row_values(rownum)[headers.index("2009 Tree Number")]).split(".")
		observation['tree_id'] = int(full_tree_id[0])
		if len(full_tree_id) > 1:
			observation['sub_tree_id'] = int(full_tree_id[1])
	
		# sets the species in the function, but if any notes about species uncertainty are added, they are returned to be added at the end
		note_to_add = getSpecies(sheet, headers, rownum, observation)
		
		observation['species_certainty'] = sheet.row_values(rownum)[headers[::-1].index("Species ID certainty 0, 50 or 100%")]
		observation['angle'] = sheet.row_values(rownum)[headers.index("2009 Angle Degrees")]
		observation['distance'] = sheet.row_values(rownum)[headers.index("2009 Distance meters")]
		observation['dbh_marked'] = bool(sheet.row_values(rownum)[headers[::-1].index("Marked DBH location yes/no?")] == "Y")
			
		observation['diameter'] = []
		observation['status'] = "alive"
		
		# get all of the individual diameter information from the excel spreadsheet for a specific tree observation
		for y in range(dataStartYear, dataEndYear):
			observation['status'] = addDiameterObservation(sheet, headers, rownum, observation, y)
		
		# add any comments based on validation to the most recent comment
		observation['diameter'][-1]['notes'] += note_to_add
		
		print observation
		
		observation_id = observations.save(observation)
		print observation_id
		
	
