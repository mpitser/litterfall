define([ 
	'jquery',
	'underscore', 
	'backbone', 
	'models/singleOption'
], function($,_, Backbone, singleOption){
	var selectionOptions = Backbone.Collection.extend({							//creates Collection of singleOption Models (to-be locations, plots, collection type)
		model: singleOption,
		url: "data/sites.json",															//populates new selectionOptionsView with locations (sites)
		initialize: function() {
    	
		},								//calls for server DB's location (plot, etc. information)
    	parse: function(response){												
    		var parsed_options = [];												
    		for (element in response){											//for objects within JSON return object
    			//if (_.isString(response[element])){								//if the response is a string (e.g., a location), store it in the array:
    				parsed_options.push({										//for Backbone's use, stores object from JSON information as key:value pair (object)
    					value: response[element],
    					name: response[element].charAt(0).toUpperCase() + response[element].slice(1)
    				});
    			//} else {
    			//	parsed_options.push(response[element]);						//<WHAT DOES THIS DO?> [ ]
    			//}
    		}
    		$.each(parsed_options, function(index, option){
    			var new_option = '<option value="' + option.value + '">' + option.name + '</option>';
    			$('#site-select').append(new_option);
    		});
    		return parsed_options;
    	}
	});
	return selectionOptions;
});