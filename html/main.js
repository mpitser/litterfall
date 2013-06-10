// Filename: main.js

//app object contains global app information
var app = {
	config: {
		cgiDir: './cgi-bin/'
	}
};


$(document).ready(function(){
	require.config({});
    //The global router declaration, handles all of the app's URLs
	var AppRouter = Backbone.Router.extend({
        routes: {
            "update": "updateObservation", //inits the add record "wizard", leads to the edit pages
            "update/trees/site/:location/plot/:plot": "editPlot",
            "update/trees/site/:location/plot/:plot/treeid/new": "newTree",
            "update/trees/site/:location/plot/:plot/treeid/:treeid/subtreeid/new": "newSubTree",
            "update/trees/site/:location/plot/:plot/treeid/:treeid(/subtreeid/:subTreeId)": "editTree",
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
				<button class="update-btn btn btn-mini btn-primary" type="button">Update</button>\
			</td>\
			<td>\
				<%= tree.full_tree_id %>\
			</td>\
			<td>\
				<%= tree.species %>\
			</td>\
			<td>\
				<%= tree.angle %>\
			</td>\
			<td>\
				<%= tree.distance %>\
			</td>\
			<td>\
				<%= tree.thisDiameter %> on <%= tree.thisDate.replace(/^([0-9]{4})([0-9]{2})([0-9]{2})$/, "$2/$3/$1") %>\
			</td>\
			<td>\
				<%= tree.thisComment %>\
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
			this.$el.attr('id', thisTree._id.$oid).html(_.template(this.template, {tree: thisTree}));
			
			this.options.targetEl.append(this.el);								   //appends the tree's row element to table
		},
		events: {
			'click .update-btn': 'updateTree'								//if update button is clicked, runs updateTree function
		},
		updateTree: function(){
			//goto update tree page
			var subId = this.model.get("sub_tree_id");
			var treeUrl = "/treeid/" + this.model.get("tree_id") + ((subId) ? '/subtreeid/' + subId : '');
			app_router.navigate(document.location.hash + treeUrl, {trigger: true});
		}
	});
	
	//build a row in the plot table representing a tree
	var treeEditView = Backbone.View.extend({
		tagName: 'div',
		template: '\
		<div id="tree-info">\
			<button class="btn btn-success btn-mini edit-tree-info-btn">Edit Tree Info</button>\
			<div class="edit-tree-info btn-group"><button class="btn-save-tree-info btn btn-mini btn-success" type="button">Submit</button>\
			<button class="btn-cancel-tree-info btn btn-mini btn-danger" type="button">Cancel</button>\
			</div>\
			<ul>\
				<li>Species: <span class="display-tree-info species"><%= tree.species %></span><span class="edit-tree-info species"><select></select></span></li>\
				<li>Angle Degrees: <span class="display-tree-info angle"><%= tree.angle %></span><span class="edit-tree-info angle"><input value="<%= tree.angle %>"></input></span></li>\
				<li>Distance Meters: <span class="display-tree-info distance"><%= tree.distance %></span><span class="edit-tree-info distance"><input value="<%= tree.distance %>"></input></span></li>\
			</ul>\
		</div>\
		<div class="button-row">\
			<button class="btn-new-observation btn btn-mini btn-success pull-left" type="button">+ New Entry</button>\
		</div>\
		<table id="tree_observations" class="table-striped">\
			<thead>\
				<tr>\
					<th></th>\
					<th>Date</th>\
					<th>Observers</th>\
					<th>\
						DBH (cm) <a href="#" class="dbh" rel="tooltip" data-placement="top" data-original-title="Diameter at Breast Height"><small>info</small></a>\
					</th>\
					<th>\
						Comments\
					</th>\
				</tr>\
			</thead>\
			<tbody>\
			<% _.each(tree.datesDesc, function(date){ %>\
			<tr>\
				<td>\
					<button class="display_cell btn btn-mini btn-primary edit-existing" type="button">Edit</button>\
					<div class="edit_cell btn-group"><button class="btn-save-observation btn btn-mini btn-success" type="button">Submit</button>\
					<button class="btn-cancel-observation btn btn-mini btn-danger" type="button">Cancel</button>\
				</td>\
				<td class="editable"><span class="display_cell date_select"><%= date.replace(/^([0-9]{4})([0-9]{2})([0-9]{2})$/, "$2/$3/$1") %></span><span class="edit_cell date_select"><input type="text" value="<%= date.replace(/^([0-9]{4})([0-9]{2})([0-9]{2})$/, "$2/$3/$1") %>"/>\
				<input type="hidden" class="formatted_date" value="<%= date %>"></span></td>\
				<td class="editable"><span class="display_cell observers"><%= tree.diameter[date].observers %></span><span class="edit_cell observers"><input type="text" value="<%= tree.diameter[date].observers %>"></span></td>\
				<td class="editable"><span class="display_cell diameter"><%= tree.diameter[date].value %></span><span class="edit_cell diameter"><input type="text" value="<%= tree.diameter[date].value %>"></span></td>\
				<td class="editable"><span class="display_cell notes"><%= tree.diameter[date].notes %></span><span class="edit_cell notes"><input type="text" value="<%= tree.diameter[date].notes %>"></span></span></td>\
			</tr>\
			<% }); %>\
			</tbody>\
			</table>\
			<div class="button-row">\
				<button class="btn-new-observation btn btn-mini btn-success pull-left" type="button">+ New Entry</button>\
			</div>\
		',
		initialize: function(){
			this.render();
			this.model.on('change', this.render, this); //re-render when the model is saved (new observation, or an edit)
		},
		render: function(){
			//console.log('render edit');
			var thisTree = this.model.toJSON();
			//get the dates in descending order
			thisTree.datesDesc = _.keys(thisTree.diameter).sort().reverse();
			this.$el.html(_.template(this.template, {tree: thisTree}));
			this.postRender();
		},
		postRender: function(){
			//add any methods/functions that need to be call after redendering the Tree edit view
			this.populateSpecies();
		},
		populateSpecies: function(){
			var treeSpecies = this.model.get('species');
			$.getJSON(app.config.cgiDir + 'litterfall.py?site=allSpecies', function(data) {
				$.each(data, function(index, value) {
					$("#tree-info .species select").append($("<option></option>").attr("value",value).text(value));
					$("#tree-info .species option[value='" + treeSpecies + "']").attr('selected','selected');
				});
			
			});
		},
		events: {
			'click .btn-new-observation': 'newObservation',	
			'click .edit-existing': 'editObservation',
			'click .btn-save-observation': 'saveObservation',
			'click .btn-cancel-observation': 'render',
			'click .edit-tree-info-btn': 'editTreeInfo',
			'click .btn-cancel-tree-info': 'cancelEditTreeInfo',
			'click .btn-save-tree-info': 'saveTreeInfo',
			'blur .edit_cell': 'validateField'
		},
		editTreeInfo: function(){
			$('.edit-tree-info-btn').toggle();
			$('.display-tree-info').toggle();
			$('.edit-tree-info').toggle();
		},
		cancelEditTreeInfo: function(){
			$('.edit-tree-info-btn').toggle();
			$('.display-tree-info').toggle();
			$('.edit-tree-info').toggle();
		},
		saveTreeInfo: function(){
			this.model.set({
				'species': $("#tree-info .species select").val(),
				'angle': parseInt($("#tree-info .angle input").val(), 10),
				'distance': parseFloat($("#tree-info .distance input").val(), 10)
			});
			this.model.save();
		},
		newObservation: function(){
			//add a new blank row to the observation table
			var diameters = _.clone(this.model.get('diameter')); //must clone object to update it
			var today = new Date();
			var newDateKey = [today.getFullYear(),((today.getMonth() < 9) ? 0 : ""),(today.getMonth() + 1),((today.getDate() < 10) ? 0 : ""),today.getDate()].join(""); //yes it generates the date in YYYYMMDD format
			if (diameters[newDateKey] == undefined){ //prevent overwriting of dates
				diameters[newDateKey] = {
					value: 'n/a',
					notes: "",
					observers: ""
				};
				this.model.set({"diameter": diameters});
			}
			
			// Disable all the fields from being editing
			$("#tree_observations .btn.display_cell").hide();
			
			// Show edit content, hide display content, show "Submit/cancel button", add date_picker		
			$("#tree_observations > tbody > tr:first .edit_cell").show();
			$("#tree_observations > tbody > tr:first .display_cell").hide();
			$("#tree_observations > tbody > tr:first .edit_cell.date_select :input" ).datepicker({ altFormat: "yymmdd" , altField: "#tree_observations > tbody > tr .formatted_date" , maxDate: 0});	
		},
		
		editObservation: function(event) {
		
			// User wants to edit an existing observation.  
			row_to_edit = $(event.target).parents("tr");		// Get the row of edit button
			
			// Hide any existing edit modes
			$("#tree_observations .btn.display_cell").hide();
					
			// Show edit content, hide display content, show "Submit/cancel button", add date_picker		
			row_to_edit.find(" .edit_cell").show();
			row_to_edit.find(".display_cell").hide();
			console.log(this);
			row_to_edit.find(".edit_cell.date_select :input" ).datepicker({ altFormat: "yymmdd" , altField: "#tree_observations > tbody > tr .formatted_date" , maxDate: 0 });
		},
		
		saveObservation: function(event) {
			// User added or edited an observation.  Save it to the server.	
			// Get the row that is being edited
			row_to_save = $("#tree_observations > tbody > tr .edit_cell :visible").parents("tr");
			
			var newDateKey = row_to_save.find(".formatted_date").val();
			var newValue = parseFloat(row_to_save.find(".diameter :input").val());
			// convert observers from string to array
			var newObservers = row_to_save.find(".observers :input").val().split(",");
			for (var i=0; i<newObservers.length; i++){
				newObservers[i] = newObservers[i].trim(" ");
			}
			var newNotes = row_to_save.find(".notes :input").val();
			
			// ** NEED TO INSERT VALIDATION CODE HERE **
			// (^ xd wrote this ^), but we just added a function to handle validation when any editable field goes out of focus
			// validation of diameter data a user intends to save should live there.
			
			//must clone object to update it
			var diameters = _.clone(this.model.get('diameter'));
			
			// Find the existing date key by figuring out the index of the row being edited and matching it up with the index of the 
			// observations (sorted by date key in reverse)
			var indexOfObservation = $("#tree_observations tbody tr").index(row_to_save);
			var existingDateKey = _.keys(diameters).sort().reverse()[indexOfObservation];
			
			// Remove the existing date key/object.  Since _.clone is a shallow clone, we need to remove the reference to the
			// existing observation before removing it.
			//console.log(existingDateKey);
			diameters[existingDateKey] = new Object();
			delete diameters[existingDateKey];
			
			// Add in the new data
			diameters[newDateKey] = {
					value: newValue,
					notes: newNotes,
					observers: newObservers
				};
			
			// Set the diameter to be the new list of observations and save the object	
			
			//** May need to check to see if no change 
			
			this.model.set({"diameter": diameters});
			this.model.save();			
		},
		
		validateField: function(event){
			console.log("event");	
			//console.log(event);
			
			//console.log(event.currentTarget);
			//console.log(event.currentTarget.className);
			
			var fieldToValidate = event.currentTarget.className;
			var currentRow = $("#tree_observations > tbody > tr .edit_cell :visible").parents("tr");
			
			/* if date field lost focus */
			if (fieldToValidate == "edit_cell date_select"){
				//TODO: immediate feedback when correcting mistakes (use onSelect function of datepicker to redirect to validateDate)
				this.validateDate(currentRow);
			/* if observers field lost focus */				
			} else if (fieldToValidate == "edit_cell observers"){
				this.validateObservers(currentRow);
			/* if diameter field lost focus */				
			} else if (fieldToValidate == "edit_cell diameter"){
				this.validateDiameter(currentRow);
			} else {
				// field left was comments, which don't need to be validated (and should be allowed to be empty!)
				return;
			}
			
			//TODO: 
			/*validation that no field was left empty, and other across-the-board validation */
			// must go below if-else to keep comment box from getting this validation
			// if nothing is changed, allow them to exit the edit entry view by either submit or cancel
		},
		
		validateDate: function(currentRow) {
			console.log("date validation");

			var dateEntered = currentRow.find(".formatted_date").val();
			//var dateEnteredDP = currentRow.find(".edit_cell.date_select :input" ).datepicker( "getDate" );
				
			// date can't be in future
			var today = new Date();
		    var todayFormatted = today.getFullYear().toString() + 
		    				     ((today.getMonth()+1).toString().length == 1 ? "0"+(today.getMonth()+1) : (today.getMonth()+1).toString()) + 
		    					 ((today.getDate()+1).toString().length == 1 ? "0"+today.getDate() : today.getDate().toString());
			
			console.log(dateEntered);
			//console.log(dateEnteredDP);
			console.log(todayFormatted);
			console.log(dateEntered > todayFormatted);
			if (dateEntered > todayFormatted) {
				// trigger the edit Observation button to prevent saving
				$(".edit_cell.date_select :input" ).addClass("highlight_invalid");
				alert("Can't have date past today!");
				console.log("date validation failed");
				//TODO: find a better way (possibly jquery) to highlight field that was invalid
				$(currentRow.find('.edit-existing')).trigger('click');
				return;
			} else {
				$(".edit_cell.date_select :input" ).removeClass("highlight_invalid");
			}
			//TODO: last else is that date field is fine, in which case, remove the highlight_invalid class
			//console.log($("#tree_observations > tbody > tr .edit_cell.date_select"));
			// needs to be correct format if manually entered
			//can't be a duplicate
		},
		
		validateObservers: function(currentRow) {
			console.log("observers validation");
			var obsEntered = currentRow.find(".observers :input").val().split(",");
			console.log(obsEntered);
			// dropdown list?
		},
		
		validateDiameter: function(currentRow) {
			console.log("diameter validation");
			var diamEntered = parseFloat(currentRow.find(".diameter :input").val());
			console.log(diamEntered);
			// needs to be int/float
			// validation about growth (more than 10% and alert to make sure?)
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
		defaults: {
			site: '',
			plot: '',
			_id: '',
			tree_id: 0,
			sub_tree_id: 0,
			angle: 0.0,
			distance: 0,
			diameter: {},
			species: 'Unknown',
			species_certainty: 0,
			dead: true,
			dbh_marked: false,
			url: '',
			lat: 0,
			lng: 0
		},
		initialize: function(){
			this.editViewInitialize();
			this.on('invalid', this.showError);
		},
		showError: function(){
			//TODO show the validation error that is set in the validate method
			console.log(this.validationError);
		},
		plotViewInitialize: function(){
			var plotRow = new plotRowView({
				targetEl: $("#plot-table"),
				model: this
			});
		},
		editViewInitialize: function(){
			var editForm = new treeEditView({
				el: $('#treeEditView'),
				model: this
			});
		},
		parse: function(response){
			response.full_tree_id = response.tree_id + (response.sub_tree_id * .1);
			return response;
		},
		validate: function(attrs, options){
			//this is where we validate the model's data
			var isInt = [];
			var isFloat = [];
			
			//console.log("");
			//console.log("attrs");
			console.log(attrs);
			
			//console.log("");
			//console.log("options");
			console.log(options);
			
			//console.log("");
			//console.log(attrs.diameter);
			/*var dateEntered = null;
			for (existingDateEntry in attrs.diameter) {
				if (dateEntered == existingDateEntry) {
					console.log("already in database");
				}
			}*/	
		}
	});
	
	//Declare the plot collection, contains tree objects
	var Plot = Backbone.Collection.extend({
		model: Tree,
		url: "/",
  		initialize: function(){
  			 this.on('reset', this.renderTrees); 
  			 this.on('add', this.renderTrees); 
  		},
  		renderTrees: function(){
  			this.each(function(tree){
  				tree.plotViewInitialize();
  			}, this);
  		}
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
				var getPlotUrl = "update/" + $('#type-select').val() + '/site/' + encodeURI($('#site-select').val()) + '/plot/' + $('#plot-select').val()
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
			
			//jQuery calls for, DBH Tooltip and updating functionality
			updateFunctions();
			
			
			var thisPlot = new Plot;
			//need to use site and plot variable to build url to python script
			thisPlot.url = app.config.cgiDir + 'litterfall.py?site=' + site + '&plot=' + plot;
			thisPlot.fetch();
			
			$('.add-new-tree').click(function(){
				var plotNumber = $(".plot-number").text();
				var siteName = $(".site-name").text();
				console.log(plotNumber+ " "+siteName);
				app_router.navigate('update/trees/site/'+siteName+'/plot/'+plotNumber+'/treeid/new',{trigger:true});
			});
			
		});
		
    });
    
    //Edit tree view
    app_router.on('route:editTree', function(site, plot, treeId, subTreeId) {						//reloads page based on selected location (site) and plot
    	var  templateFile = 'update-tree.html';
		require(['lib/text!templates/' + templateFile + '!strip'], function(templateHTML){			//<WHAT DOES THIS FUNCTION DO?> [ ] (some sort of require wrapper)
			
			if(typeof subTreeId === 'undefined'){
   				subTreeId = '0';
 			} else {
 				subTreeId = subTreeId;
 			}
			
			$('#main').html(_.template(templateHTML, {
				site: decodeURI(site), 
				plot: plot,
				treeId: treeId,
				subTreeId: subTreeId
			}));
			

			var thisTree = new Tree();
			thisTree.url = app.config.cgiDir + 'litterfall.py?site=' + site + '&plot=' + plot + '&treeid=' + treeId + '&subtreeid=' + subTreeId;
			thisTree.fetch();

			//DBH Tooltip 
			updateFunctions();
		});
    });
    
     //Add new tree view
    app_router.on('route:newTree', function(site, plot) {						//reloads page based on selected location (site) and plot
    	var  templateFile = 'update-tree.html';
		require(['lib/text!templates/' + templateFile + '!strip'], function(templateHTML){			//<WHAT DOES THIS FUNCTION DO?> [ ] (some sort of require wrapper)
			
			$('#main').html(_.template(templateHTML, {
				site: decodeURI(site), 
				plot: plot,
				treeId: "New",
				subTreeId: "0"
			}));
			

			var thisTree = new Tree();

			//DBH Tooltip 
			updateFunctions();
		});
    });
    
    // Start Backbone history a necessary step for bookmarkable URL's; enables user to click BACK without navigating to entirely different domain
    Backbone.history.start();
	
		
	
});
// Start Bootstrap and template related jQuery
	
function updateFunctions(){
	$('.dbh').tooltip({trigger:'hover'});
	$('.dropdown-toggle').dropdown();
}

// End Bootstrap and template related jQuery

// Start Active Nav Tracking

$(function(){
  $(".nav a").click(function(){
    $(this).parent().addClass('active'). // <li>
      siblings().removeClass('active');
  });
});
// End Active Nav Tracking

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
