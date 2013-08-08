import xlrd
# Script to import Jose-Luis Machado's tree data from Excel spreadsheets to MongoDB
# Run as "python trees_xl2mongodb.py <list of Excel spreadsheet files>"

import argparse
from datetime import datetime
from pymongo import MongoClient
import ConfigParser

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

	#status_tree = observation['status']
	# change Status if needed
	if "missing" in notes:
		observation['status'] = "missing"
	elif ("fallen" in notes or "fell" in notes) and ("dead" in notes or "dead" in observation['status']):
		observation['status'] = "dead_fallen"
	elif "standing" in notes or "dead" in notes:
		observation['status'] = "dead_standing"
	else:
		observation['status'] = "alive"
	
	# check future statuses based on Status
	# if something new found in the notes, update the status
	# else default that obs status to Status from last time
	
	return observation['status']

def addDiameterObservation(sheet, headers, rownum, observation, year):
	try:
		diam = sheet.row_values(rownum)[headers.index(str(year) + " DBH cm")]
		notes = str(sheet.row_values(rownum)[headers.index(str(year) + " Comments")])
		
		# getting the status for this observation involves combing through the notes and also the previously set global tree status
		status = getStatus(notes, observation)
		
		observation['diameter'].append({'value': diam, 'notes':notes, 'date': {'y': year, 'm': 01, 'd': 01}, 'status': status, 'observers': [] })
	except ValueError:
		print "No data from " + str(year)
		
	return

for file in args.excel_filenames:
	workbook = xlrd.open_workbook(file)
	sheet = workbook.sheet_by_index(0)
	
	# Get values from header
	headers = sheet.row_values(0)
	
	
	# Iterate through rows, returning each as a list that you can index:
	
	for rownum in range(sheet.nrows):
		if rownum == 0:
			continue
		print rownum
		
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
	
		# change trees listed with species 'dead' to 'unidentified'
		# allows for a tree to be identified by species AND marked as dead.
		if (sheet.row_values(rownum)[headers.index("2009 Species full name")] == "dead"):
			observation['species'] = "Unidentified spp."
			observation['status'] = "dead_standing"	# NOTE: this is the Tree's overall status.  status is also noted down at each DBH observation.
		else:
			observation['species'] = sheet.row_values(rownum)[headers.index("2009 Species full name")]
			observation['status'] = "alive"
		
		observation['species_certainty'] = sheet.row_values(rownum)[headers[::-1].index("Species ID certainty 0, 50 or 100%")]
		observation['angle'] = sheet.row_values(rownum)[headers.index("2009 Angle Degrees")]
		observation['distance'] = sheet.row_values(rownum)[headers.index("2009 Distance meters")]
		observation['dbh_marked'] = bool(sheet.row_values(rownum)[headers[::-1].index("Marked DBH location yes/no?")] == "Y")
			
		observation['diameter'] = []
		
		
		# get all of the individual diameter information from the excel spreadsheet for a specific tree observation
		for y in range(2002, 2009):
			addDiameterObservation(sheet, headers, rownum, observation, y)
			
		print observation
		
		observation_id = observations.save(observation)
		print observation_id
		
	
