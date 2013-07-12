#! /usr/bin/python
import json, cgi, os, ConfigParser, unicodedata

def main():
	# Config = ConfigParser.ConfigParser()
	method = os.environ['REQUEST_METHOD']
	
	if method == 'POST':
		query = cgi.FieldStorage()
		
		if 'filename' in query:
			filename = query.getvalue('filename')
		else:
			filename = 'unspecified'
		
		print "Content-Type: text/csv "
		print "Content-Disposition: attachment; filename = \"" + filename + ".csv\"\n"
		
		if 'content' in query:
			print query.getvalue('content')
	
if __name__ == "__main__":
	main()