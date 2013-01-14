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
				<%= id %>\
				<% if (sub_id != "0"){ %>\
					.<%= sub_id %>\
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
			for (date in thisTree.diameter){
				if (date > thisTree.thisDate){
					thisTree.thisDate = date;
				}
			}
			thisTree.thisDiameter = thisTree.diameter[thisTree.thisDate].value;
			thisTree.thisComment = thisTree.diameter[thisTree.thisDate].notes;
			this.$el.attr('id', thisTree._id.$oid).html(_.template(this.template, thisTree));
			this.options.targetEl.append(this.el);
		},
		events: {
			'click .update-btn': 'updateTree'
		},
		updateTree: function(){
			console.log("updating tree:" + this.model.toJSON().id  + this.model.toJSON().dead);
		}
	});
	
	var singleOption = Backbone.Model.extend({});
	
	var selectionOptions = Backbone.Collection.extend({
		model: singleOption,
		url: "data/sites.json",
    	parse: function(response){
    		var parsedOptions = [];
    		for (element in response){
    			if (_.isString(response[element])){
    				parsedOptions.push({
    					value: response[element],
    					name: response[element]
    				});
    			} else {
    				parsedOptions.push(response[element]);
    			}
    		}
    		return parsedOptions;
    	}
	});
	
	//Declare the tree object (Model)
	var Tree = Backbone.Model.extend({
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
		require(['lib/text!templates/' + templateFile + '!strip'], function(templateHTML){
			$('#main').html(templateHTML);
		});
    });
    
    //Site, plot selection
    app_router.on('route:updateObservation', function () {
    	var  templateFile = 'update.html';
		require(['lib/text!templates/' + templateFile + '!strip'], function(templateHTML){
			$('#main').html(templateHTML);
			var locationOptions = new selectionOptions;
			locationOptions.url = app.config.cgiDir + "litterfall.py?site=all";
			var locationSelect = new selectionOptionsView({
				el: $('#site-select'),
				collection: locationOptions
			});
			locationOptions.fetch();
			$('#get-plot').click(function(){
				var getPlotUrl = "update/" + $('#type-select').val() + '/' + encodeURI($('#site-select').val()) + '/' + $('#plot-select').val()
				document.location.hash = getPlotUrl;
			});
		});
    });
    
    //Plot view
    app_router.on('route:editPlot', function(site, plot) {
    	var  templateFile = 'update2.html';
		require(['lib/text!templates/' + templateFile + '!strip'], function(templateHTML){
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
    
    // Start Backbone history a necessary step for bookmarkable URL's
    Backbone.history.start();
	
	$('.dbh').tooltip({trigger:'hover'})

	
});

/*

$('#plot-table').dataTable( {
    "bPaginate": false,
    "bLengthChange": false,
    "bFilter": true,
    "bSort": false,
    "bInfo": false,
    "bAutoWidth": false
} )
*/