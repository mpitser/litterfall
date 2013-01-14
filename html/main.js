// Filename: main.js

//app object contains global app information
var app = {
	config: {
		cgiDir: '../cgi-bin/'
	}
};


$(document).ready(function(){
	require.config({});
    //The global router declaration, handles all of the app's URLs
	var AppRouter = Backbone.Router.extend({
        routes: {
            "update": "updateObservation", //inits the add record "wizard", leads to the edit pages
            "update/trees/:location/:plot": "editPlot",
            "update/trees/:location/:plot/*treeid": "editTree",
            "*actions": "defaultRoute" // Backbone will try match the route above first
        }
	});
	
	//build an options list
	var selectionOptionsView = Backbone.View.extend({
    	template: '<option value="<%= value %>"><%= name %></option>',
    	initialize: function(){
    		 _.bindAll(this, 'render'); // fixes loss of context for 'this' within methods
			 this.collection.on('add', this.render); 
			 this.collection.on('reset',  this.render);
    	},
    	render: function(){
    		this.collection.each(function(option){
    			this.$el.append(_.template(this.template, option.toJSON()));
    		}, this);
    	}
	});
	
	//build a row in the plot table representing a tree
	var plotRowView = Backbone.View.extend({
		tagName: 'tr',
		template: '\
			<td>\
				<button class="update-btn btn btn-mini btn-danger" type="button">Update</button>\
			</td>\
			<td>\
				<%= tree_id %>\
				<% if (sub_tree_id != "0"){ %>\
					.<%= sub_tree_id %>\
				<% } %>\
			</td>\
			<td>\
				<%= species %>\
			</td>\
			<td>\
				<%= angle %>\
			</td>\
			<td>\
				<%= distance %>\
			</td>\
			<td>\
				<%= thisDiameter %> on <%= thisDate.replace(/^([0-9]{4})([0-9]{2})([0-9]{2})$/, "$2/$3/$1") %>\
			</td>\
			<td>\
				<%= thisComment %>\
		</td>',
		initialize: function(){
			this.render();
		},
		render: function(){
			var thisTree = this.model.toJSON();
			thisTree.thisDate = "";
			for (date in thisTree.diameter){                      //loop through the list of existing dates and store the most recent
				if (date > thisTree.thisDate){					  //Date format is YYYYMMDD (reformated in template html above)
					thisTree.thisDate = date;
				}
			}
			thisTree.thisDiameter = thisTree.diameter[thisTree.thisDate].value;    //gets diameter from most recent measurement
			thisTree.thisComment = thisTree.diameter[thisTree.thisDate].notes;     //gets comments from most recent measurement
			
			//$el --> gets the jQuery object for this view's element 
			//*.attr('id', thisTree._id.$oid) --> sets 'id' to MongoDB value for tree's ID
			//takes the tree's data, assigns it to this.template, inserts the HTML into the jQuery object for this view's element
			this.$el.attr('id', thisTree._id.$oid).html(_.template(this.template, thisTree));
			
			this.options.targetEl.append(this.el);								   //appends the tree's row element to table
		},
		events: {
			'click .update-btn': 'updateTree'									//if update button is clicked, runs updateTree function
		},
		updateTree: function(){
			//logs in console: the selected tree's ID and 'dead' values (alive or dead)
			console.log("updating tree:" + this.model.toJSON().id  + this.model.toJSON().dead);
		}
	});
	
	var singleOption = Backbone.Model.extend({});								//creates empty Model (to be a site, once information is loaded)
	
	
	var selectionOptions = Backbone.Collection.extend({							//creates Collection of singleOption Models (to-be locations, plots, collection type)
		model: singleOption,
		url: "data/sites.json",													//calls for server DB's location (plot, etc. information)
    	parse: function(response){												
    		var parsedOptions = [];												
    		for (element in response){											//for objects within JSON return object
    			if (_.isString(response[element])){								//if the response is a string (e.g., a location), store it in the array:
    				parsedOptions.push({										//for Backbone's use, stores object from JSON information as key:value pair (object)
    					value: response[element],
    					name: response[element].charAt(0).toUpperCase() + response[element].slice(1)
    				});
    			} else {
    				parsedOptions.push(response[element]);						//<WHAT DOES THIS DO?> [ ]
    			}
    		}
    		return parsedOptions;
    	}
	});
	
	
	//Declare the tree object (Model)
	var Tree = Backbone.Model.extend({
		urlRoot: '/tree',
		defaults: {
			site: '',
			plot: '',
			_id: '',
			tree_id: 0,
			sub_tree_id: 0,
			quadrant: 0,
			angle: 0,
			distance: 0,
			diameter: {},
			species: '',
			species_certainty: 0,
			dead: true,
			dbh_marked: false
		},
		initialize: function(){
			var plotRow = new plotRowView({
				targetEl: $("#plot-table"),
				model: this
			});
		}
	});
	
	//Declare the plot collection, contains tree objects
	var Plot = Backbone.Collection.extend({
		model: Tree,
		url: "/"
	});
	
    // Instantiate the router
    var app_router = new AppRouter;
   
    //default route is the App Home Page
    app_router.on('route:defaultRoute', function (actions) {
    	var  templateFile = 'index.html';
		require(['lib/text!templates/' + templateFile + '!strip'], function(templateHTML){			//require's library takes HTML templates
			$('#main').html(templateHTML);
		});
    });
    
    //Site, plot selection
    app_router.on('route:updateObservation', function () {											//listening for user action (for user to select location and plot)
    	var  templateFile = 'update.html';
		require(['lib/text!templates/' + templateFile + '!strip'], function(templateHTML){			
			$('#main').html(templateHTML);
			var locationOptions = new selectionOptions;
			locationOptions.url = app.config.cgiDir + "litterfall.py?site=all";						//creates list with all possible locations
			var locationSelect = new selectionOptionsView({
				el: $('#site-select'),																//populates new selectionOptionsView with locations (sites)
				collection: locationOptions
			});
			locationOptions.fetch();
			$('#get-plot').click(function(){														//waits for user to select plot
				var getPlotUrl = "update/" + $('#type-select').val() + '/' + encodeURI($('#site-select').val()) + '/' + $('#plot-select').val()
				document.location.hash = getPlotUrl;
			});
		});
    });
    
    //Plot view
    app_router.on('route:editPlot', function(site, plot) {											//reloads page based on selected location (site) and plot
    	var  templateFile = 'update2.html';
		require(['lib/text!templates/' + templateFile + '!strip'], function(templateHTML){			//<WHAT DOES THIS FUNCTION DO?> [ ] (some sort of require wrapper)
			$('#main').html(_.template(templateHTML, {
				site: decodeURI(site), 
				plot: plot
			}));
			var thisPlot = new Plot;
			//need to use site and plot variable to build url to python script
			thisPlot.url = app.config.cgiDir + 'litterfall.py?site=' + site + '&plot=' + plot;
			thisPlot.fetch();
		});
    });
    
    // Start Backbone history a necessary step for bookmarkable URL's; enables user to click BACK without navigating to entirely different domain
    Backbone.history.start();
	
	$('.dbh').tooltip({trigger:'hover'})

	
});

/*

$('#plot-table').dataTable( {
    "bPaginate": false,
    "bLengthChange": false,
    "bFilter": true,
    "bSort": true,
    "bInfo": false,
    "bAutoWidth": false
} )
*/