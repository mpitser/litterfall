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
            "observation": "addObservation", //inits the add record "wizard", leads to the edit pages
            "observation/trees/:location/:plot": "editPlot",
            "observation/trees/:location/:plot/*treeid": "editTree",
            "*actions": "defaultRoute" // Backbone will try match the route above first
        }
	});
	//Generic view that uses an HTML based template included using require.js
	var AppTemplateView = Backbone.View.extend({
    	el: $('#litterfall'),
    	options: {
    		variables: {},
			templateFile: 'home.html' //home template as default
		},
		initialize: function(){
			this.render();
		},
		render: function(){
			var thisView = this;
			require(['lib/text!templates/' + this.options.templateFile], function(templateHTML){
				var template = _.template(templateHTML, thisView.options.variables );
				thisView.$el.html( template );
			});
		}
	});
	

    // Instantiate the router
    var app_router = new AppRouter;
   
    //default route is the App Home Page
    app_router.on('route:defaultRoute', function (actions) {
    	var app_view = new AppTemplateView;
    });
    
    app_router.on('route:addObservation', function () {
        var app_view = new AppTemplateView({
			variables: {
				locations: "wha",
				plots: "plot"
			},
			templateFile: 'addForm.html'
		});  
    });
    // Start Backbone history a necessary step for bookmarkable URL's
    Backbone.history.start();
	
});