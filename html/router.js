define([ 
	'jquery', 
	'underscore', 
	'backbone',
	'models/singleOption',
	'collections/selectionOptions',
	'views/selectionOptionsView',
	'collections/Plot',
	'models/Tree'
], function($, _, Backbone, singleOption, selectionOptions, selectionOptionsView, Plot, Tree) {

	var AppRouter = Backbone.Router.extend({
			routes: {
				"data": "accessObservations", //inits the add record "wizard", leads to the edit pages
				"data/:mode": "accessObservations", //inits the add record "wizard", leads to the edit pages
				"data/reports/trees/site/:location/plot/:plot": "goToReportsPlot",
				"data/update/trees/site/:location/plot/:plot": "goToUpdatePlot",
				"data/:mode/trees/site/:location/plot/:plot/treeid/:tree_id(/subtreeid/:sub_tree_id)": "goToTree",
				"*actions": "defaultRoute" // Backbone will try match the route above first
			}
	});
	$.extend($.fn.typeahead.Constructor.prototype, {
	matcher: function(item) {
		//console.log(this.source);
		if (this.options.type == 'observers') {
			var observers = this.query.split(",");
			var last_observer = observers[observers.length - 1];
			var last_observer = last_observer.replace(/^\s+/,"");
			
			if (last_observer == "") return false;
			
			for (i = 0; i < observers.length - 2; i++) {
				if (observers[i].replace(/^\s+|\s+$/g, '') == item) return false;
			}
			
			var last_observer = last_observer.toLowerCase();
			
			return last_observer.length && ~item.toLowerCase().indexOf(last_observer);
		} else if (this.options.type == 'species') {
			
			var is_matched = item.toLowerCase().indexOf(this.query.toLowerCase()) == 0;
			if (is_matched) return true;
			
			// always keep unidentified as an option
			if (item == 'Unidentified spp.') return true;
			
			// keep Genus spp. as an option--if the genus matches the query
			var query_genus = this.query.split(" ")[0];
			var item_genus = item.split(" ")[0];
			if (query_genus.toLowerCase() == item_genus.toLowerCase() && item.toLowerCase() == query_genus.toLowerCase() + " spp.") return true;
			
			return false;
		} else {
			return orig.matcher.call(this, item);
		}
	},
	updater: function(item) {
		
		if (this.options.type != 'observers') {
			return orig.updater.call(this, item);
		}
		
		if (this.query.indexOf(",") == -1) return item+", ";
		
		return this.query.replace(/,[^,]*$/, ", "+item+", ");
		
	},
	select: function() {
		
		if (this.options.type != 'observers') {
			return orig.select.call(this);
		}
		
		var to_return = orig.select.call(this);
		this.$element.focus();
		return to_return;
		
	},
	listen: function() {
		if (this.options.type == 'species') {
			this.$element.on('focus', $.proxy(this.lookup, this));
			this.$menu.css({
				'overflow-x': 'hidden',
				'overflow-y': 'auto',
				'max-height': '150px',
				'min-width': this.$element.outerWidth()
			});
		}
		orig.listen.call(this);
	}
});

	
	var initialize = function(){
		// Instantiate the router
		var app_router = new AppRouter;
	   
		//default route is the App Home Page
		app_router.on('route:defaultRoute', function (actions) {
			$(".home").addClass("active");
			$(".data").removeClass("active");
			var  template_file = 'index.html';
			require(['lib/text!templates/' + template_file + '!strip'], function(templateHTML){			//require's library takes HTML templates
				$('#main').html(templateHTML);
			});
		});
		
		//Site, plot selection
		app_router.on('route:accessObservations', function () {											//listening for user action (for user to select location and plot)
			$(".data").addClass("active");
			$(".home").removeClass("active");
			var  template_file = 'update.html';
			require(['lib/text!templates/' + template_file + '!strip'], function(templateHTML){			
				$('#main').html(templateHTML);
				location_options = new selectionOptions;
				location_options.url = app.config.cgiDir + "litterfall.py?site=all";						//creates list with all possible locations
				location_select = new selectionOptionsView({
					el: $('#site-select'),																//populates new selectionOptionsView with locations (sites)
					collection: location_options
				});
		
				location_options.fetch();
				$('#update-records').click(function(){														//waits for user to select plot
					var getPlotUrl = "data/update/" + $('#type-select').val() + '/site/' + encodeURI($('#site-select').val()) + '/plot/' + $('#plot-select').val()
					document.location.hash = getPlotUrl;
				});
				$('#analyze-data').click(function(){														//waits for user to select plot
					var getPlotUrl = "data/reports/" + $('#type-select').val() + '/site/' + encodeURI($('#site-select').val()) + '/plot/' + $('#plot-select').val()
					document.location.hash = getPlotUrl;
				});
			});
		});
		
		//Plot view
		app_router.on('route:goToReportsPlot', function(site, plot) {		
			//reloads page based on selected location (site) and plot
			$(".data").addClass("active");
			$(".home").removeClass("active");
			var this_plot = new Plot;
			//need to use site and plot variable to build url to python script
			this_plot.url = app.config.cgiDir + 'litterfall.py?site=' + site + '&plot=' + plot;
			this_plot.mode = 'reports';
			// load different template depending on whether we are updating or analyzing data	
			
			console.log("reporting");
			
			require(['lib/text!templates/reports2.html!strip'], function(templateHTML) {
				$('#main').html(_.template(templateHTML, {
					site: decodeURI(site), 
					plot: plot
				}));
	
				//jQuery calls for, DBH Tooltip and updating functionality
				$('.dbh').tooltip({trigger:'hover'});
				$('.dropdown-toggle').dropdown();

	
				// fetch the data. if successful, will trigger 'reset' event. 'reset' event triggers renderTrees
				this_plot.fetch();
				
				
				/* --------- Mallory's codes for dynamically populating the years ---------- */
				
				// add selection options for data viewing based on years data is available
				var startYear = 2002; // year that data began collection
				var endYear = new Date().getFullYear();	// data collection continues through current year (in theory)
				for (var cur=startYear; cur<=endYear; cur++){
					// add selection options
					if (cur == startYear){
						$("#start-year").append($("<option></option>").attr({selected: "selected", value: cur}).text(cur));
						$("#end-year").append($("<option></option>").attr("value",cur).text(cur));
					} else if (cur == endYear){
						$("#start-year").append($("<option></option>").attr("value",cur).text(cur));
						$("#end-year").append($("<option></option>").attr({selected: "selected", value: cur}).text(cur));
					} else {
						$("#start-year").append($("<option></option>").attr("value",cur).text(cur));
						$("#end-year").append($("<option></option>").attr("value",cur).text(cur));
					}
					
					// add sub-header columns for the years we have data for
					$("#sub-header").append($("<th></th>").addClass("date-entry y-"+cur).text(cur));
				}
				
				// make the DBH heading span all the year subheadings
				var numYears = endYear - startYear + 1;
				$("#DBH").attr("colspan", numYears);
				
				// re-populate (really just showing/hiding columns) corresponding to the date range desired when user clicks Go!
				$("#btn-go").click(this_plot.populateTreeDiameters);
				
	
			});
		});

		app_router.on('route:goToUpdatePlot', function(site, plot) {		
			$(".data").addClass("active");
			$(".home").removeClass("active");
			var this_plot = new Plot;
			this_plot.mode = 'update';
			//need to use site and plot variable to build url to python script
			this_plot.url = app.config.cgiDir + 'litterfall.py?site=' + site + '&plot=' + plot;
			
			console.log("updating");
			
			require(['lib/text!templates/update2.html!strip'], function(templateHTML) {
				$('#main').html(_.template(templateHTML, {
					site: decodeURI(site), 
					plot: plot
				}));
	
				//jQuery calls for, DBH Tooltip and updating functionality
				$('.dbh').tooltip({trigger:'hover'});
				$('.dropdown-toggle').dropdown();
				
				this_plot.fetch();
				
				var $add_new_sub_tree = $('.add-new-sub-tree');
				
				// adding new tree
				$('.add-new-tree').click(function(){
					if (this_plot.choosing_parent_tree === true) {
						$addNewSubTree.eq(0).trigger("not_choosing_parent_tree");
					}
					this_plot.addTree();
				});
				
	
				// add popover
				
				$('.add-new-sub-tree')
				.popover({
					title: 'Add a new sub-tree',
					content: 'Choose the parent tree from below'
				});
				// add the toggling functions
				$add_new_sub_tree.bind("choosing_parent_tree", function() {
					this_plot.choosing_parent_tree = true;
					$add_new_sub_tree.popover('show').addClass('active');
						
					$('#plot-table tr').css('cursor', 'pointer')
					.bind('click.makeTreeClickable', function() {
					
						// add sub-tree
						var this_tree_id = Math.floor(parseFloat($(this).children("td").eq(1).text()));
						this_plot.addSubTree(this_tree_id);
					});
					
					//$('.btn-update').attr("disabled", "disabled");
					$('#plot-table tr .btn').attr("disabled", "disabled");
				})
				.bind("not_choosing_parent_tree", function() {
					this_plot.choosing_parent_tree = false;
					$add_new_sub_tree.popover('hide').removeClass('active');
						
					$('#plot-table tr').css('cursor', 'default').unbind('click.makeTreeClickable');
					$('#plot-table tr .btn').removeAttr("disabled");
				})
				.click(function() {
					if (this_plot.choosing_parent_tree === false) {
						$(this).trigger("choosing_parent_tree");
					} else {
						$(this).trigger("not_choosing_parent_tree");
					}
				});
				
	
				
			});
		});
		
		//Edit tree view
		app_router.on('route:goToTree', function(mode, site, plot, tree_id, sub_tree_id) {						//reloads page based on selected location (site) and plot
			$(".data").addClass("active");
			$(".home").removeClass("active");
			var  template_file = 'update-tree.html';
			require(['lib/text!templates/' + template_file + '!strip'], function(templateHTML){			//<WHAT DOES THIS FUNCTION DO?> [ ] (some sort of require wrapper)
	
				if (typeof sub_tree_id === 'undefined'){
					sub_tree_id = '0';
				} else {
					sub_tree_id = sub_tree_id;
				}
	
				$('#main').html(_.template(templateHTML, {
					site: decodeURI(site), 
					plot: plot,
					tree_id: tree_id,
					sub_tree_id: sub_tree_id
				}));
	
	
				var this_tree = new Tree();
				this_tree.url = app.config.cgiDir + 'litterfall.py?site=' + site + '&plot=' + plot + '&treeid=' + tree_id + '&subtreeid=' + sub_tree_id;
				this_tree.fetch({
					success: function() {
						this_tree.editViewInitialize(mode);
					}
				});
				
				
				//DBH Tooltip 
				$('.dbh').tooltip({trigger:'hover'});
				$('.dropdown-toggle').dropdown();
				
			});
		});
		
		
		// Start Backbone history a necessary step for bookmarkable URL's; enables user to click BACK without navigating to entirely different domain
	//
	Backbone.history.start();
	
	};
	return { initialize: initialize }; });