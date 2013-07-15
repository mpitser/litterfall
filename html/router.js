define([ 
	'jquery', 
	'underscore', 
	'backbone',
	'models/tree_data/singleOption',
	'collections/tree_data/selectionOptions',
	'views/tree_data/selectionOptionsView',
	'collections/tree_data/Plot',
	'models/tree_data/Tree'
], function($, _, Backbone, singleOption, selectionOptions, selectionOptionsView, Plot, Tree) {

	var AppRouter = Backbone.Router.extend({
			routes: {
				"data/trees": "accessTrees", //inits the add record "wizard", leads to the edit pages
				"data/litterfall": "accessLitterfall", //inits the add record "wizard", leads to the edit pages
				"data/litterfall/reports":"accessLitterfallReports",
				"data/trees/reports/site/:location/plot/:plot": "goToReportsPlot",
				"data/trees/update/site/:location/plot/:plot": "goToUpdatePlot",
				"data/trees/:mode/site/:location/plot/:plot/treeid/:tree_id(/subtreeid/:sub_tree_id)": "goToTree",
				"*actions": "defaultRoute" // Backbone will try match the route above first
			}
	});
	
	var initialize = function(){
		// Instantiate the router
		var app_router = new AppRouter;
	   
		//default route is the App Home Page
		app_router.on('route:defaultRoute', function (actions) {
			$(".home").addClass("active");
			$(".home").siblings().removeClass("active");
			var  template_file = 'index.html';
			require(['lib/text!templates/' + template_file + '!strip'], function(templateHTML){			//require's library takes HTML templates
				$('#main').html(templateHTML);
			});
		});
		
		//Site, plot selection
		app_router.on('route:accessTrees', function () {											//listening for user action (for user to select location and plot)
			$(".tree-data").addClass("active");
			$(".tree-data").siblings().removeClass("active");
			var  template_file = 'access-tree.html';
			console.log("access");
			require(['lib/text!templates/' + template_file + '!strip'], function(templateHTML){			
				$('#main').html(templateHTML);
				location_options = new selectionOptions;
				location_options.url = app.config.cgiDir + "tree_data.py?site=all";						//creates list with all possible locations
				location_select = new selectionOptionsView({
					el: $('#site-select'),																//populates new selectionOptionsView with locations (sites)
					collection: location_options
				});
		
				location_options.fetch({
					success: function() {
						$('#update-records').removeAttr("disabled").click(function(){														//waits for user to select plot
							var getPlotUrl = "data/trees/update/site/" + encodeURI($('#site-select').val()) + '/plot/' + $('#plot-select').val()
							document.location.hash = getPlotUrl;
						});
						$('#analyze-data').removeAttr("disabled").click(function(){														//waits for user to select plot
							var getPlotUrl = "data/trees/reports/site/" + encodeURI($('#site-select').val()) + '/plot/' + $('#plot-select').val()
							document.location.hash = getPlotUrl;
						});
					}
				});

			});
		});
		
		app_router.on('route:accessLitterfall', function () {											//listening for user action (for user to select location and plot)
			$(".litterfall").addClass("active");
			$(".litterfall").siblings().removeClass("active");
			var  template_file = 'access-litterfall.html';
			console.log("access");
			require(['lib/text!templates/' + template_file + '!strip'], function(templateHTML){			
				$('#main').html(templateHTML);
				$('#analyze-data').click(function() {
					var Url = "data/litterfall/reports";
					document.location.hash = Url;
				});
			});
		});
		
		app_router.on('route:accessLitterfallReports', function () {
			var template_file = 'query-litterfall.html';
			console.log("querying");
			require(['lib/text!templates/' + template_file + '!strip'], function(templateHTML){			
				$('#main').html(templateHTML);
				
			});
		});
		
		//Plot view
		app_router.on('route:goToReportsPlot', function(site, plot) {		
			//reloads page based on selected location (site) and plot
			$(".data").addClass("active");
			$(".home").removeClass("active");
			var this_plot = new Plot;
			//need to use site and plot variable to build url to python script
			this_plot.url = app.config.cgiDir + 'tree_data.py?site=' + site + '&plot=' + plot;
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
				
				$('.export').tooltip({trigger: 'hover'});
				
	
			});
		});

		app_router.on('route:goToUpdatePlot', function(site, plot) {		
			$(".data").addClass("active");
			$(".home").removeClass("active");
			var this_plot = new Plot;
			this_plot.mode = 'update';
			//need to use site and plot variable to build url to python script
			this_plot.url = app.config.cgiDir + 'tree_data.py?site=' + site + '&plot=' + plot;
			
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
						$add_new_sub_tree.eq(0).trigger("not_choosing_parent_tree");
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
				$add_new_sub_tree.bind("choosingParentTree", function() {
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
				.bind("notChoosingParentTree", function() {
					this_plot.choosing_parent_tree = false;
					$add_new_sub_tree.popover('hide').removeClass('active');
						
					$('#plot-table tr').css('cursor', 'default').unbind('click.makeTreeClickable');
					$('#plot-table tr .btn').removeAttr("disabled");
				})
				.click(function() {
					if (this_plot.choosing_parent_tree === false) {
						$(this).trigger("choosingParentTree");
					} else {
						$(this).trigger("notChoosingParentTree");
					}
				});
				
				
				$('.export').tooltip({trigger: 'hover'});
								
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
				this_tree.url = app.config.cgiDir + 'tree_data.py?site=' + site + '&plot=' + plot + '&treeid=' + tree_id + '&subtreeid=' + sub_tree_id;
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
		

	$(function(){
	  $(".nav a").click(function(){
		$(this).parent().addClass('active'). // <li>
		  siblings().removeClass('active');
	  });
	});
		
	// Start Backbone history a necessary step for bookmarkable URL's; enables user to click BACK without navigating to entirely different domain
	//
	Backbone.history.start();
	
	};
	return { initialize: initialize }; });
