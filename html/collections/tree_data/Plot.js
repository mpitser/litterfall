define([
	'jquery',
	'underscore', 
	'backbone', 
	'models/tree_data/Tree',
	'views/tree_data/newTreeModalView'
], function($, _, Backbone, Tree, newTreeModalView){
	var Plot = Backbone.Collection.extend({
		model: Tree,
		url: "/",
		choosing_parent_tree: false,
  		initialize: function(){
  			
  			this.on('reset', this.renderTrees); 
  			//this.on('add', myFunction);
  			//this.on('reset', this.findAllObservers); 
  			//this.on('add', this.findAllObservers); 
  			//this.on('change', this.renderTrees);

  		},
  		render: function() {
  			this.renderTrees();
  			return this;
  		},
  		renderTrees: function(){
  			var site_name = "";
  			var plot_number = 0;
  			var max_diam = 0;
  			
  			var this_plot = this;
  			
  			this.each(function(tree){
  				tree.plotViewInitialize(this.mode);
  				var num_obvs = tree.get("diameter").length;

  				this_plot.listenTo(tree, 'add_new_sub_tree_from_row', function() {this_plot.addSubTree(tree.get('tree_id'));});
  				
  				// determine the maximum number of observations for any tree in this plot
  				// to allocate enough columns in the CSV file
  				if (num_obvs > max_diam) {
  					max_diam = num_obvs;
  				}
  			}, this);


  			$(".dbh").attr("href", document.location.hash);
  			$(".btn").css("display", "inline-block");
    		
    		// add tablesorter jquery plugin (no sorting for first column)
  			$("#plot-table").tablesorter({headers: { 0: { sorter: false}}}); 
  			// populate the diameter entries based on user's given years
  			this.populateTreeDiameters();

  			// set up column headers for CSV
  			var CSV = "Full Tree ID,Species,Angle,Distance"
  			for(var i = 1; i <= max_diam; i++) {
  				CSV += "," + "Obs Date " + i + ",Diameter " + i + ",Notes " + i;
  			}

  			var j = 0;
  			var agt=navigator.userAgent.toLowerCase();
  			if (agt.indexOf("firefox") != -1 || agt.indexOf("msie") != -1){
  				$(".export-info").attr("data-original-title", "Open the file in a text editor, then save it as a file with a .csv extension.");
  				$(".export-info").attr("href", "https://www.google.com/intl/en/chrome/browser/");
  			} else if (agt.indexOf("msie") != -1){
				$(".export-info").attr("data-original-title", "This WILL NOT WORK if you are using Internet Explorer. Click to download a better browser before proceeding.");
			} else if (agt.indexOf("chrome") != -1){
				 $(".export-info").attr("data-original-title", "Opening the resulting file should launch MS Excel.");
			}else if (agt.indexOf("safari") != -1){
  				$(".export-info").attr("data-original-title","Select 'Save as...' from the File menu and enter a filename that uses a .csv extension.");
  			}
  			
  			$(".export").click(function(e) {
  				// query database for all trees in the plot
  				
  				if (j == 0) {
  				
					$(".export").val("Preparing data for export...");
					//$.getJSON(app.config.cgiDir + 'litterfall.py?site=' + $(".site-name").text() + "&plot=" + $(".plot-number").text(), function(data) {
					this_plot.each(function(tree) {
						// format Comma Separated Value string with data from each tree
						CSV = CSV + "\r\n" + (parseInt(tree.get("tree_id")) + parseInt(tree.get("sub_tree_id"))*.1) + "," + tree.get("species") + "," + tree.get("angle") + "," + tree.get("distance");
						_.each(tree.get("diameter"), function(obs) {
							if (obs.date != null){
								// var formatted_date = obs["date"]["d"] + "/" + obs["date"]["m"] + "/" + obs["date"]["y"];
								CSV += "," + toFormattedDate(obs.date) + "," + obs.value + ",";
							}
							if (obs.notes != "" && obs.notes != undefined){
								CSV += obs.notes.replace(/[^a-zA-Z 0-9]+/g, '');
							}
						});
					});
					CSV += "\nDisclaimer: dates before 2013 are approximate. All data during that range was collected between September and October of the specified year.";
					// adds formatted data to a hidden input on the page
					$("#CSV").empty().append(CSV);
					$(".export").val("Click to open file");
					$(".export").addClass("btn-success");
					j = 1;
					return;
				}
				//});
				
				// ensures information has loaded before opening the CSV file
				/*if (j > 0) {
					if (agt.indexOf("firefox") != -1 || agt.indexOf("msie") != -1) {
						window.open('data:application/octet-stream;charset=utf-8,' + encodeURIComponent($('#CSV').text()));
					} else {
						window.open('data:text/csv;charset=utf-8,' + encodeURIComponent($('#CSV').text()));
					}
					e.preventDefault();   				
				}*/
				
				
				 // Creating a 1 by 1 px invisible iframe:

				var iframe = $('<iframe>',{
					width:1,
					height:1,
					frameborder:0,
					css:{
						display:'none'
					}
				}).appendTo('body');
		
				var formHTML = '<form action="" method="post">'+
					'<input type="hidden" name="filename" />'+
					'<input type="hidden" name="content" />'+
					'</form>';
		
				// Giving IE a chance to build the DOM in
				// the iframe with a short timeout:
		
				setTimeout(function(){
		
					// The body element of the iframe document:
		
					var body = (iframe.prop('contentDocument') !== undefined) ?
									iframe.prop('contentDocument').body :
									iframe.prop('document').body;	// IE
		
					body = $(body);
		
					// Adding the form to the body:
					body.html(formHTML);
		
					var form = body.find('form');
		
					form.attr('action',app.config.cgiDir + "create_file.py");
					form.find('input[name=filename]').val($(".site-name").text() + "-" + $(".plot-number").text());
					form.find('input[name=content]').val(CSV);
		
					// Submitting the form to download.php. This will
					// cause the file download dialog box to appear.
		
					form.submit();
				},50);
				
  			});
  			
    	},
		populateTreeDiameters: function(){
    		// get year range user wished to view data from
			var start_year = $("#start-year").val();
  			var end_year = $("#end-year").val();
			var num_years = $("#end-year").val()-$("#start-year").val() + 1;
			
			if (start_year > end_year){
				// switch years so user doesn't have to be specific about which direction their date range goes
				var temp_year = start_year;
				start_year = end_year;
				end_year = temp_year;
			}
			
			$('.date-entry').hide();
			for (var i=parseInt(start_year); i<=parseInt(end_year); i++){
				$('.y-'+i).show();
			}

			//format header row to make the DBH cell span all the years specified
  		//	document.getElementById("DBH").colSpan = num_years;
    	},
  		addTree: function(){

  			
  			// var random_tree = this.find(function(){return true;});
  			
  			var new_tree = new Tree({
  				plot: parseInt($('.plot-number').text()),
  				site: $('.site-name').text()
  			});
  			var new_model = new newTreeModalView({
  				model: new_tree
  			});
  			var this_plot = this;
  			
  			// reload the whole page
  			// this is not a good idea
  			// we have to somehow think about sorting
  			new_model.on("tree_saved", function() {
  				$('#plot-table tbody').empty();
  				this_plot.fetch({
  					reset: true,
  					success: function() {
  						$('#plot-table').trigger('update');
  					}
  				});
  			});

  		},
		addSubTree: function(tree_id) {
  			var parent_tree = this.find(function (tree) {return tree.get('tree_id') == tree_id;});
  			
  			var new_tree = new Tree({
  				tree_id: tree_id,
  				sub_tree_id: -1,
  				species: parent_tree.get('species'),
  				plot: parent_tree.get('plot'),
  				site: parent_tree.get('site'),
  				angle: parent_tree.get('angle'),
  				distance: parent_tree.get('distance')
  			});
  			
  			var new_model = new newTreeModalView({
  				model: new_tree
  			});
  			
  			var this_plot = this;
  			
  			// reload the whole page
  			// this is not a good idea
  			// we have to somehow think about sorting
  			new_model.on("tree_saved", function() {
  				$('#plot-table tbody').empty();
  				this_plot.fetch({
  					reset: true,
  					success: function() {
  						$('#plot-table').trigger('update');
  					}
  				});
  			});
  		}
  	});
	return Plot;
});
