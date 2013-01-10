// Filename: main.js

//app object contains global app information
var app = {
	initialize: function(){
		
	}
};


$(document).ready(function(){
	require.config({
	    baseUrl: "app/"
	});
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
    	template: '<option value="<%= option %>"><%= option %></option>',
    	initialize: function(){
    		 _.bindAll(this, 'render'); // fixes loss of context for 'this' within methods
			 this.collection.on('add', this.render); 
			 this.collection.on('reset',  this.render);
    	},
    	render: function(){
    		this.collection.each(function(option){
    			this.$el.append(_.template(this.template, {option: option.toJSON().site}));
    		}, this);
    	}
	});
	
	//Generic view that uses an HTML based template included using require.js
	var AppTemplateView = Backbone.View.extend({
    	el: $('#litterfall'),
    	options: {
    		variables: {},
    		stripBody: true,
			templateFile: 'index.html' //home template as default
		},
		initialize: function(){
			this.render();
		},
		render: function(){
			var thisView = this;
			var requirePath = 'lib/text!templates/' + this.options.templateFile + ((this.options.stripBody) ? '!strip' : '');
			require([requirePath], function(templateHTML){
				var template = _.template(templateHTML, thisView.options.variables );
				thisView.$el.html( template );
			});
		},
		events: {
			"click #get-plot": "getPlot"
		},
		getPlot: function(){
			alert('plot!');
		}
	});
	
	//View that listens to the Plot collection events (generates Tree table)
	var appPlotView = Backbone.View.extend({
		el: $('#litterfall'),
    	options: {
    		variables: {},
			templateFile: 'plotList.html' //home template as default
		},
		template: _.template("<li><%= tree.name %></li>"),
		initialize: function(){
			var thisView = this;
			this.collection = new Plot;
			//this.collection.bind("reset", this.render(), this);
			//this.collection.bind("change", this.render(), this);
			this.collection.fetch({
				success: function(){
					thisView.render();
				}
			});
			
		},
		add: function(tree){
			var treeView = new appPlotView({
				model: tree
			});
			// set cache
			this._treesInPlot[tree.get('id')] = treeView;
			treeView.render();
		},
		render: function(){
			var thisView = this;
			var treeData;
			this.collection.each(function(m){
				treeData = thisView.collection.get(m.id);
				thisView.$el.append(thisView.template({tree: treeData}));
			});
		}
	});
	
	//Declare the tree object (Model)
	var singleOption = Backbone.Model.extend({});
	
	//Declare the plot collection, contains tree objects
	var selectionOptions = Backbone.Collection.extend({
		model: singleOption,
		url: "app/data/sites.json"
	});
	
	//Declare the tree object (Model)
	var Tree = Backbone.Model.extend({
		defaults: {
			name: "tree"
		}
	});
	
	//Declare the plot collection, contains tree objects
	var Plot = Backbone.Collection.extend({
		model: Tree,
		url: "app/data/plottrees.json"
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
    
    app_router.on('route:updateObservation', function () {
    	var  templateFile = 'update.html';
		require(['lib/text!templates/' + templateFile + '!strip'], function(templateHTML){
			$('#main').html(templateHTML);
			var locationOptions = new selectionOptions({
				url: "app/data/sites.json"
			});
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
    
    app_router.on('route:editPlot', function(type, site, plot) {
    	var  templateFile = 'update2.html';
		require(['lib/text!templates/' + templateFile + '!strip'], function(templateHTML){
			$('#main').html(templateHTML);
		});
    });
    
    // Start Backbone history a necessary step for bookmarkable URL's
    Backbone.history.start();
	
});