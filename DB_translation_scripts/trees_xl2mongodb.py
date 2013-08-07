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

def checkStatus():
	status = "alive"
	print "hello in checkStatus"
	# change Status if needed
	# check future statuses based on Status
	# if something new found in the notes, update the status
	# else default that obs status to Status from last time
	
	return status

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
		
		# current state: Status is set to alive or dead_standing
		
		
		# write for loop to go through years (upward), and make this script just add in the year
		# call checkStatus(yearnotes, Status)
		try:
			dia_2009 = sheet.row_values(rownum)[headers.index("2009 DBH cm")]
			notes_2009 = sheet.row_values(rownum)[headers.index("2009 Comments")]
			if observation['status']:
				status_2009 = 'dead_standing'
			elif "dead" in notes_2009:
				if "fallen" in notes_2009:
					status_2009 = 'dead_fallen'
				
			else:
				status_2009 = 'alive'
			observation['diameter'].append({'value': dia_2009, 'notes':notes_2009, 'date': {'y': 2009, 'm': 01, 'd': 01}, 'status': status_2009, 'observers': [] })
		except ValueError:
			print "No 2009 data"
	
		try:
			dia_2008 = sheet.row_values(rownum)[headers.index("2008 DBH cm")]
			notes_2008 = sheet.row_values(rownum)[headers.index("2008 Comments")]
			if observation['status']:
				status_2008 = 'dead'
			else:
				status_2008 = 'alive'
			observation['diameter'].append({'value': dia_2008, 'notes':notes_2008, 'date': {'y': 2008, 'm': 01, 'd': 01}, 'status': status_2008, 'observers': [] })
		except ValueError:
			print "No 2008 data"
			
			
		try:
			dia_2007 = sheet.row_values(rownum)[headers.index("2007 DBH cm")]
			notes_2007 = sheet.row_values(rownum)[headers.index("2007 Comments")]
			if observation['status']:
				status_2007 = 'dead'
			else:
				status_2007 = 'alive'
			observation['diameter'].append({'value': dia_2007, 'notes':notes_2007, 'date': {'y': 2007, 'm': 01, 'd': 01}, 'status': status_2007, 'observers': [] })
		except ValueError:
			print "No 2007 data"
			
		try:
			dia_2006 = sheet.row_values(rownum)[headers.index("2006 DBH cm")]
			notes_2006 = sheet.row_values(rownum)[headers.index("2006 Comments")]
			if observation['status']:
				status_2006 = 'dead'
			else:
				status_2006 = 'alive'
			observation['diameter'].append({'value': dia_2006, 'notes':notes_2006, 'date': {'y': 2006, 'm': 01, 'd': 01}, 'status': status_2006, 'observers': [] })
		except ValueError:
			print "No 2006 data"				
			
			
		try:
			dia_2005 = sheet.row_values(rownum)[headers.index("2005 DBH cm")]
			notes_2005 = sheet.row_values(rownum)[headers.index("2005 Comments")]
			if observation['status']:
				status_2005 = 'dead'
			else:
				status_2005 = 'alive'
			observation['diameter'].append({'value': dia_2005, 'notes':notes_2005, 'date': {'y': 2005, 'm': 01, 'd': 01}, 'status': status_2005, 'observers': [] })
		except ValueError:
			print "No 2005 data"		
			
		try:
			dia_2003 = sheet.row_values(rownum)[headers.index("2003 DBH cm")]
			notes_2003 = sheet.row_values(rownum)[headers.index("2003 Comments")]
			if observation['status']:
				status_2003 = 'dead'
			else:
				status_2003 = 'alive'
			observation['diameter'].append({'value': dia_2003, 'notes':notes_2003, 'date': {'y': 2003, 'm': 01, 'd': 01}, 'status': status_2003, 'observers': [] })
		except ValueError:
			print "No 2003 data"
			
	
		try:
			dia_2002 = sheet.row_values(rownum)[headers.index("2002 DBH cm")]
			notes_2002 = sheet.row_values(rownum)[headers.index("2002 Comments")]
			if observation['status']:
				status_2002 = 'dead'
			else:
				status_2002 = 'alive'
			observation['diameter'].append({'value': dia_2002, 'notes':notes_2002, 'date': {'y': 2002, 'm': 01, 'd': 01}, 'status': status_2002, 'observers': [] })
		except ValueError:
			print "No 2002 data"	
			
					
		print observation
		
		observation_id = observations.save(observation)
		print observation_id
		
	
