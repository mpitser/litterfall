import xlrd
import argparse
from datetime import datetime
from pymongo import MongoClient
import ConfigParser

parser = argparse.ArgumentParser(description='Extract tree data from JLM Excel files.')
parser.add_argument('excel_filename', help='Excel tree data file')
args = parser.parse_args()


# Load config (for database info, etc)
Config = ConfigParser.ConfigParser()
Config.read("litterfall_translate.conf")
MongoDB_host = Config.get('MongoDB', "host")
MongoDB_db = Config.get('MongoDB', "db")


# Connect to MongoDB
mongo = MongoClient(MongoDB_host, 27017)
mongo_db = mongo[MongoDB_db]	

# Use MongoDB observation collection
observations = mongo_db.observations




workbook = xlrd.open_workbook(args.excel_filename)
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
	observation['site'] = sheet.row_values(rownum)[0]
	observation['plot'] = int(sheet.row_values(rownum)[1])
	observation['quadrant'] = int(sheet.row_values(rownum)[2])
	
	full_tree_id = str(sheet.row_values(rownum)[46]).split(".")
	observation['id'] = full_tree_id[0]
	if len(full_tree_id) > 1:
		observation['sub_id'] = full_tree_id[1]

	observation['species'] = sheet.row_values(rownum)[47]
	observation['species_certainty'] = sheet.row_values(rownum)[52]
	observation['theta'] = sheet.row_values(rownum)[48]
	observation['distance'] = sheet.row_values(rownum)[49]
	observation['dbh_marked'] = bool(sheet.row_values(rownum)[51] == "Y")
	
	observation['dead'] = bool(observation['species'] == "dead")
	
	dia_2009 = sheet.row_values(rownum)[50]
	notes_2009 = sheet.row_values(rownum)[53]
	
	dia_2008 = sheet.row_values(rownum)[42]
	notes_2008 = sheet.row_values(rownum)[45]
	
	dia_2007 = sheet.row_values(rownum)[34]
	notes_2007 = sheet.row_values(rownum)[37]
	
	dia_2006 = sheet.row_values(rownum)[26]
	notes_2006 = sheet.row_values(rownum)[27]

	dia_2005 = sheet.row_values(rownum)[17]
	notes_2005 = sheet.row_values(rownum)[28]

	dia_2003 = sheet.row_values(rownum)[12]
	notes_2003 = sheet.row_values(rownum)[13]

	dia_2002 = sheet.row_values(rownum)[7]
	notes_2002 = sheet.row_values(rownum)[8]

	observation['diameter'] = { "20090101" : {'value': dia_2009, 'notes':notes_2009},
								"20080101" : {'value': dia_2008, 'notes':notes_2008},
								"20070101" : {'value': dia_2007, 'notes':notes_2007},
								"20060101" : {'value': dia_2006, 'notes':notes_2006},
								"20050101" : {'value': dia_2005, 'notes':notes_2005},
								"20030101" : {'value': dia_2003, 'notes':notes_2003},
								"20020101" : {'value': dia_2002, 'notes':notes_2002}
							}

				
	#print observation
	
	observation_id = observations.save(observation)
	print observation_id
	
	
