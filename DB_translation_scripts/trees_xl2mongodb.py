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
Config.read("litterfall_translate.conf")
MongoDB_host = Config.get('MongoDB', "host")
MongoDB_db = Config.get('MongoDB', "db")


# Connect to MongoDB
mongo = MongoClient(MongoDB_host, 27017)
mongo_db = mongo[MongoDB_db]	

# Use MongoDB observation collection
observations = mongo_db.observations


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
		observation['id'] = full_tree_id[0]
		if len(full_tree_id) > 1:
			observation['sub_id'] = full_tree_id[1]
	
		observation['species'] = sheet.row_values(rownum)[headers.index("2009 Species full name")]
		observation['species_certainty'] = sheet.row_values(rownum)[headers[::-1].index("Species ID certainty 0, 50 or 100%")]
		observation['angle'] = sheet.row_values(rownum)[headers.index("2009 Angle Degrees")]
		observation['distance'] = sheet.row_values(rownum)[headers.index("2009 Distance meters")]
		observation['dbh_marked'] = bool(sheet.row_values(rownum)[headers[::-1].index("Marked DBH location yes/no?")] == "Y")
		
		observation['dead'] = bool(observation['species'] == "dead")
		
		observation['diameter'] = {}
		
		try:
			dia_2009 = sheet.row_values(rownum)[headers.index("2009 DBH cm")]
			notes_2009 = sheet.row_values(rownum)[headers.index("2009 Comments")]
			observation['diameter']["20090101"] = {'value': dia_2009, 'notes':notes_2009}
		except ValueError:
			print "No 2009 data"
	
		try:
			dia_2008 = sheet.row_values(rownum)[headers.index("2008 DBH cm")]
			notes_2008 = sheet.row_values(rownum)[headers.index("2008 Comments")]
			observation['diameter']["20080101"] = {'value': dia_2008, 'notes':notes_2008}
		except ValueError:
			print "No 2008 data"
			
			
		try:
			dia_2007 = sheet.row_values(rownum)[headers.index("2007 DBH cm")]
			notes_2007 = sheet.row_values(rownum)[headers.index("2007 Comments")]
			observation['diameter']["20070101"] = {'value': dia_2007, 'notes':notes_2007}
		except ValueError:
			print "No 2007 data"
			
		try:
			dia_2006 = sheet.row_values(rownum)[headers.index("2006 DBH cm")]
			notes_2006 = sheet.row_values(rownum)[headers.index("2006 Comments")]
			observation['diameter']["20060101"] = {'value': dia_2006, 'notes':notes_2006}
		except ValueError:
			print "No 2006 data"				
			
			
		try:
			dia_2005 = sheet.row_values(rownum)[headers.index("2005 DBH cm")]
			notes_2005 = sheet.row_values(rownum)[headers.index("2005 Comments")]
			observation['diameter']["20050101"] = {'value': dia_2005, 'notes':notes_2005}
		except ValueError:
			print "No 2005 data"		
			
		try:
			dia_2003 = sheet.row_values(rownum)[headers.index("2003 DBH cm")]
			notes_2003 = sheet.row_values(rownum)[headers.index("2003 Comments")]
			observation['diameter']["20030101"] = {'value': dia_2003, 'notes':notes_2003}
		except ValueError:
			print "No 2003 data"
			
	
		try:
			dia_2002 = sheet.row_values(rownum)[headers.index("2002 DBH cm")]
			notes_2002 = sheet.row_values(rownum)[headers.index("2002 Comments")]
			observation['diameter']["20020101"] = {'value': dia_2002, 'notes':notes_2002}
		except ValueError:
			print "No 2002 data"	
			
					
		print observation
		
		observation_id = observations.save(observation)
		print observation_id
		
	
