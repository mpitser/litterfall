define([ 
	'jquery',
	'underscore', 
	'backbone', 
	'models/tree_data/singleOption'
], function($,_, Backbone, singleOption){
	var selectionOptions = Backbone.Collection.extend({							//creates Collection of singleOption Models (to-be locations, plots, collection type)
		model: singleOption,
		url: "data/sites.json",															//populates new selectionOptionsView with locations (sites)
		initialize: function() {
    	
		},								//calls for server DB's location (plot, etc. information)
    	parse: function(response){												
    		var parsed_options = [];												
    		for (element in response){											//for objects within JSON return object
    				parsed_options.push({										//for Backbone's use, stores object from JSON information as key:value pair (object)
    					value: response[element],
    					name: response[element].charAt(0).toUpperCase() + response[element].slice(1),
    					type: "site"
    				});

    		}
    		console.log(parsed_options);
    		return parsed_options;
    	}
	});
	return selectionOptions;
});
