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
            "data": "accessObservations", //inits the add record "wizard", leads to the edit pages
            "data/update": "accessObservations", //inits the add record "wizard", leads to the edit pages
            "data/reports": "accessObservations",
            "data/update/trees/site/:location/plot/:plot": "goToPlot",
            "data/reports/trees/site/:location/plot/:plot": "goToPlot",
          	//"update/trees/site/:location/plot/:plot/treeid/new": "newTree",
            "data/update/trees/site/:location/plot/:plot/treeid/:treeid/subtreeid/new": "newSubTree",
            "data/update/trees/site/:location/plot/:plot/treeid/:treeid(/subtreeid/:subTreeId)": "goToTree",
            "data/reports/trees/site/:location/plot/:plot/treeid/:treeid(/subtreeid/:subTreeId)": "goToTree",
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
		templateReports: '\
			<td class="btn-column">\
				<button class="btn-tree btn btn-mini btn-primary btn-analyze" type="button">View More</button>\
			</td>\
			<td class="tree-id">\
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
			<td class="date-entry 2002">\
				<%= tree.diameter2 %>\
			</td>\
			<td class="date-entry 2003">\
				<%= tree.diameter3 %>\
			</td>\
			<td class="date-entry 2004">\
				<%= tree.diameter4 %>\
			</td>\
			<td class="date-entry 2005">\
				<%= tree.diameter5 %>\
			</td>\
			<td class="date-entry 2006">\
				<%= tree.diameter6 %>\
			</td>\
			<td class="date-entry 2007">\
				<%= tree.diameter7 %>\
			</td>\
			<td class="date-entry 2008">\
				<%= tree.diameter8 %>\
			</td>\
			<td class="date-entry 2009">\
				<%= tree.diameter9 %>\
			</td>\
			<td class="date-entry 2010">\
				<%= tree.diameter10 %>\
			</td>\
			<td class="date-entry 2011">\
				<%= tree.diameter11 %>\
			</td>\
			<td class="date-entry 2012">\
				<%= tree.diameter12 %>\
			</td>\
			<td class="date-entry 2013">\
				<%= tree.diameter13 %>\
			</td>',
		templateUpdate:	'\
			<td>\
				<div class="btn-group">\
					<button class="btn-tree btn btn-mini btn-primary btn-update" type="button">Update</button>\
					<button class="btn btn-mini dropdown-toggle btn-primary" data-toggle="dropdown">\
						<span class="caret"></span>\
					</button>\
					<ul class="dropdown-menu">\
						<li><a style="cursor:pointer;" class="delete-row">Delete</a></li>\
					</ul>\
				</div>\
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
				<%= tree.thisDiameter %> on <%= tree.thisDate %>\
			</td>\
			<td>\
				<%= tree.thisComment %>\
			</td>',
		initialize: function(){
			if (document.location.hash.search("update") === -1) {
				this.renderReport();
			} else {
				this.renderUpdate();
			}
		},
		renderReport: function(){
			var thisTree = this.model.toJSON();
			
			thisTree.diameter2 = "-";
			thisTree.diameter3 = "-";
			thisTree.diameter4 = "-";
			thisTree.diameter5 = "-";
			thisTree.diameter6 = "-";
			thisTree.diameter7 = "-";
			thisTree.diameter8 = "-";
			thisTree.diameter9 = "-";
			thisTree.diameter10 = "-";
			thisTree.diameter11 = "-";
			thisTree.diameter12 = "-";
			thisTree.diameter13 = "-";
			for (date in thisTree.diameter){                      //loop through the list of existing dates and store the most recent
				if (date.slice(0,4) === '2002') {
					thisTree.diameter2 = thisTree.diameter[date].value;
				} else if (date.slice(0,4) === '2003') {
					thisTree.diameter3 = thisTree.diameter[date].value;
				} else if (date.slice(0,4) === '2004') {
					thisTree.diameter4 = thisTree.diameter[date].value;
				} else if (date.slice(0,4) === '2005') {
					thisTree.diameter5 = thisTree.diameter[date].value;
				} else if (date.slice(0,4) === '2006') {
					thisTree.diameter6 = thisTree.diameter[date].value.toFixed(2);
				} else if (date.slice(0,4) === '2007') {
					thisTree.diameter7 = thisTree.diameter[date].value;
				} else if (date.slice(0,4) === '2008') {
					thisTree.diameter8 = thisTree.diameter[date].value;
				} else if (date.slice(0,4) === '2009') {
					thisTree.diameter9 = thisTree.diameter[date].value;
				} else if (date.slice(0,4) === '2010') {
					thisTree.diameter10 = thisTree.diameter[date].value;
				} else if (date.slice(0,4) === '2011') {
					thisTree.diameter11 = thisTree.diameter[date].value;
				} else if (date.slice(0,4) === '2012') {
					thisTree.diameter12 = thisTree.diameter[date].value;
				} else if (date.slice(0,4) === '2013') {
					thisTree.diameter13 = thisTree.diameter[date].value;
				}
			}
			
			//$el --> gets the jQuery object for this view's element 
			//*.attr('id', thisTree._id.$oid) --> sets 'id' to MongoDB value for tree's ID
			//takes the tree's data, assigns it to this.template, inserts the HTML into the jQuery object for this view's element
			this.$el.attr('id', thisTree._id.$oid).html(_.template(this.templateReports, {tree: thisTree}));
			this.$el.addClass("tree-cluster-" + thisTree.tree_id);
			this.$el.children().eq(2).css("font-style","italic");
			this.options.targetEl.append(this.el);	
				
		},
		renderUpdate: function(){
			var thisTree = this.model.toJSON();
			thisTree.thisDate = "";
			for (date in thisTree.diameter){                      //loop through the list of existing dates and store the most recent
				if (date > thisTree.thisDate){					  //Date format is YYYYMMDD (reformated in template html above)
					thisTree.thisDate = date;
				}
			}

			if (Object.keys(thisTree.diameter).length > 0){
				thisTree.thisDiameter = thisTree.diameter[thisTree.thisDate].value;    //gets diameter from most recent measurement
				thisTree.thisComment = thisTree.diameter[thisTree.thisDate].notes;     //gets comments from most recent measurement
			}
			
			
			//$el --> gets the jQuery object for this view's element 
			//*.attr('id', thisTree._id.$oid) --> sets 'id' to MongoDB value for tree's ID
			//takes the tree's data, assigns it to this.template, inserts the HTML into the jQuery object for this view's element
			this.$el.attr('id', thisTree._id.$oid).html(_.template(this.templateUpdate, {tree: thisTree}));
			this.$el.addClass("tree-cluster-" + thisTree.tree_id);
			this.$el.children().eq(2).css("font-style","italic");
			this.options.targetEl.append(this.el);	

		},
		events: {
			'click .delete-row': 'deleteTree',
			'click .btn-update': 'goToTree',								//if update button is clicked, runs updateTree function
			'click .btn-analyze': 'goToTree'								//if update button is clicked, runs updateTree function
		},
		goToTree: function(){
			//goto update tree page
			var subId = this.model.get("sub_tree_id");
			var treeUrl = "/treeid/" + this.model.get("tree_id") + ((subId) ? '/subtreeid/' + subId : '');
			app_router.navigate(document.location.hash + treeUrl, {trigger: true});
		},
		deleteTree: function(){
			var thisTreeEl = this.$el;
			this.model.url = app.config.cgiDir + 'litterfall.py';
			var result = this.model.destroy();
			if (result !== false) {
			
				thisModel = this.model;
				
				result.done(function() { // once done
					
					thisTreeEl.fadeOut("slow", function() {						//function called after fadeOut is done
						
						// remove the row--we need this because if we just hide (using visibility:hidden) the row then the table-stripe class will not work
						$("#"+thisModel.get('_id').$oid).remove();
						
						var targetTreeId = thisModel.get('tree_id');
						
						// update all the trees under the same tree_id
						$(".tree-cluster-"+targetTreeId).each(function(i) {
						
							// only the full_tree_id would be updated
							var updatedTree = new Tree();
							
							// grab the second child
							var fullTreeIdTd = $(this).children('td').eq(1);
							var targetFullTreeId = parseInt(parseFloat(fullTreeIdTd.text())*10);
							console.log(targetFullTreeId);
							
							// get the data
							// using oid, because that's the only way it's stable
							updatedTree.url = app.config.cgiDir + 'litterfall.py?oid=' + $(this).attr('id');
							updatedTree.fetch({
								success: function() {
									console.log(updatedTree);
									// update it, only the full tree id, for now
									console.log("tree_id: " + updatedTree.get('tree_id'));
									updatedFullTreeId = updatedTree.get('tree_id') + (updatedTree.get('sub_tree_id') * .1);
									console.log(updatedFullTreeId);
									if (targetFullTreeId * .1 != updatedFullTreeId) {
										fullTreeIdTd.text(updatedFullTreeId);
									}
							}
							});
							
						});
						
					});
				});
			}
		}
	});

	// Adding new row for inserting a new tree
	var newTreeRowView = Backbone.View.extend({
		tagName: 'tr',
		template: '\
			<td>\
				<div class="new-tree btn-group"><button class="btn-save-new-tree btn btn-mini btn-success" type="button">Submit</button>\
				<button class="btn-cancel-new-tree btn btn-mini btn-danger" type="button">Cancel</button>\
				</div>\
			</td>\
			<td>\
			</td>\
			<td>\
				<span class="species"><select></select></span>\
			</td>\
			<td class="editable">\
				<span class="edit_cell new_tree angle"><input value="" title="Angle must be a number between 0 and 360." type="text"></input></span>\
			</td>\
			<td class="editable">\
				<span class="edit_cell new_tree distance"><input value="" title="Distance must be a number between 0 and 1000." type="text"></input></span>\
			</td>\
			<td>\
			</td>\
			<td>\
		</td>',
		initialize: function() {
			this.render();
		},
		render: function(){
			//caling the template
			this.$el.html(this.template);
			//prepend the new tree row to the table
			$(".tree-row-goaway").remove();
			$(".sub-tree-row-goaway").remove();
			this.$el.addClass("tree-row-goaway");
			this.options.targetEl.prepend(this.el);
			$("#plot-table > tbody > tr:first .edit_cell").show();

			this.postRender();
		},
		postRender: function() {
			this.populateSpecies();
		},
		populateSpecies: function(){
			// creates list of all distinct species to fill dropdown menu
			$.getJSON(app.config.cgiDir + 'litterfall.py?site=allSpecies', function(data) {
			
				$.each(data, function(index, value) {
					$("#plot-table .species select").append($("<option></option>").attr("value",value).text(value));
				});

			});
		},
		events: {
			'click .btn-save-new-tree': 'saveTree',
			'click .btn-cancel-new-tree': 'deleteRow',
			'change .new_tree': 'validateField'

		},
		saveTree: function() {
			//calculate treeID
			//save tree to database
			var plotNumber = $(".plot-number").text();
			var siteName = $(".site-name").text();
			
			// create a new Tree object and set the data
			var newTree = new Tree();
			newTree.url = app.config.cgiDir + 'litterfall.py';
			newTree.set({
				"plot": parseInt(plotNumber),
				"site": siteName,
				"tree_id": -1, // -1 means it's new
				'species': $("#plot-table .species select").val(),
				'angle': parseInt($("#plot-table .angle input").val(), 10),
				'distance': parseFloat($("#plot-table .distance input").val(), 10),
				'diameter': {},
				'dead': false
			});
			if (! (this.validateDistance() && this.validateAngle())){
				console.log("didn't save");
				return; // user will remain in edit view until their data passes validation
			}

			// save the new tree
			var result = newTree.save({}, {
				'success': function(data) {if (result != null){ console.log(result);
					app_router.navigate(document.location.hash + "/treeid/" + newTree.get("tree_id"), {trigger: true});
				}}
			});
			
		},
		validateField: function(event){

			var fieldToValidate = event.currentTarget.className;
			console.log(fieldToValidate);
			/* if angle field lost focus */
			if (fieldToValidate == "edit_cell new_tree angle"){		
				this.validateAngle();
			/* if distance field lost focus */				
			} else if (fieldToValidate == "edit_cell new_tree distance"){
				this.validateDistance();
			} else {
				return;
			}

		},
		validateAngle: function() {

			// get angle entry
			var angleEntered = parseFloat($("#plot-table .angle input").val());

			// make sure the angle is in correct format and range
			if (isNaN(angleEntered)|| angleEntered < 0 || angleEntered > 360) {
				console.log("returned NaN");
				$(".edit_cell.new_tree.angle :input").tooltip(); // NOTE: the text shown on the tooltip is listed as the title attribute of the template for NewTreeRiwView.
				$(".edit_cell.new_tree.angle :input").tooltip("show");				
				$(".edit_cell.new_tree.angle :input").addClass("alert_invalid");
				return false;
			} else { 
				$(".edit_cell.new_tree.angle :input").removeClass("alert_invalid");
				$(".edit_cell.new_tree.angle :input").tooltip("destroy");
				console.log("angle validation passed");
				return true;
			}
		},
		validateDistance: function() {

			// get distance entry
			var distanceEntered = parseFloat($("#plot-table .angle input").val());

			// make sure the distance is in correct format and range
			if (isNaN(distanceEntered) || distanceEntered < 0 || distanceEntered > 999) {
				console.log("returned NaN");
				$(".edit_cell.new_tree.distance :input").tooltip(); // NOTE: the text shown on the tooltip is listed as the title attribute of the template for NewTreeRowView.
				$(".edit_cell.new_tree.distance :input").tooltip("show");				
				$(".edit_cell.new_tree.distance :input").addClass("alert_invalid");
				return false;
			} else { 
				$(".edit_cell.new_tree.distance :input").removeClass("alert_invalid");
				$(".edit_cell.new_tree.distance :input").tooltip("destroy");
				console.log("distance validation passed");
				return true;
			}
		},
		deleteRow: function() {
			
			this.$el.fadeOut("slow", function() {
				$(this).remove();
			});
		}
	});

	// Adding new row for inserting a new SUBtree
	var newSubTreeRowView = Backbone.View.extend({
		tagName: 'tr',
		template: '\
			<td>\
				<div class="new-tree btn-group"><button class="btn-save-new-subtree btn btn-mini btn-success" type="button">Submit</button>\
				<button class="btn-cancel-new-subtree btn btn-mini btn-danger" type="button">Cancel</button>\
				</div>\
			</td>\
			<td class="tree-id">\
			\
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
			</td>\
			<td>\
		</td>',
		initialize: function() {
			this.render();
		},
		render: function(){

			var thisTree = this.model.toJSON();
			//console.log("What's thisTree?");
			//console.log(thisTree);
			this.$el.html(_.template(this.template, {tree: thisTree}));

			//delete all the other ones so user can't add multiple subtrees at once
			$(".sub-tree-row-goaway").remove();
			$(".tree-row-goaway").remove();
			this.$el.addClass("sub-tree-row-goaway");
			//insert the new tree row to the table next to its fellow subtrees
			$('.tree-cluster-'+thisTree.tree_id).eq(-1).after(this.el);
			
			$('html, body').animate({
				scrollTop: $(".sub-tree-row-goaway").offset().top-100
			}, 2000);

		},

		events: {
			'click .btn-save-new-subtree': 'saveSubtree',
			'click .btn-cancel-new-subtree': 'deleteRow'
		},
		saveSubtree: function() {
			var newSubTree = new Tree();
			
			newSubTree.url = app.config.cgiDir + 'litterfall.py';
			
			// sets newSubTree's information to match the parent tree's information
			newSubTree.set({
				"plot": parseInt($(".plot-number").text()),
				"site": $(".site-name").text(),
				"tree_id": this.model.get("tree_id"),
				"sub_tree_id": -1,
				"species": this.model.get("species"),
				"angle": this.model.get("angle"),
				"distance": this.model.get("distance"),
				"diameter": {},
				"dead": false
			});

			result = newSubTree.save({}, {success: function() {
				//redirect to page where user can add entries for the newSubTree
				app_router.navigate(document.location.hash + "/treeid/" + newSubTree.get("tree_id") + "/subtreeid/" + newSubTree.get("sub_tree_id"), {trigger: true});
			}});
			
						
		}, 

		deleteRow: function() {
			this.$el.remove();
		}
	});

	//build a row in the plot table representing a tree
	var treeEditView = Backbone.View.extend({
		tagName: 'div',
		templateReport: '\
		<div id="tree-info">\
			<ul>\
				<li>Species: <span class="display-tree-info species"><%= tree.species %></span><span class="edit-tree-info species"><select></select></span></li>\
				<li>Angle Degrees: <span class="display-tree-info angle"><%= tree.angle %></span><span class="edit-tree-info angle"><input value="<%= tree.angle %>"></input></span></li>\
				<li>Distance Meters: <span class="display-tree-info distance"><%= tree.distance %></span><span class="edit-tree-info distance"><input value="<%= tree.distance %>"></input></span></li>\
			</ul>\
		</div>\
		<table id="tree_observations" class="table-striped tablesorter">\
			<thead>\
				<tr>\
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
			<% $.each(tree.datesDesc, function(obs){ %>\
				<% d = obs.date; %> \
    			<% var date = $.datepicker.formatDate("dd/mm/yy", new Date(d)); %>\
			<tr>\
				<td><span class="display_cell date_select"><%= date %></span>\
				<td><span class="display_cell observers"><%= obs.observers %></span>\
				<td><span class="display_cell diameter"><%= obs.value %></span>\
				<td><span class="display_cell notes"><%= obs.notes %></span>\
			</tr>\
			<% }); %>\
			</tbody>\
			</table>\
		',
		templateUpdate: '\
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
		<table id="tree_observations" class="table-striped tablesorter">\
			<thead>\
				<tr>\
					<th class="btn-column"></th>\
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
			<% _.each(tree.datesDesc, function(obs){ %>\
				<% d = obs.date; %> \
    			<% var date = $.datepicker.formatDate("yy/dd/mm", new Date(d)); %>\
			<tr>\
				<td class="btn-column">\
					<button class="display_cell btn btn-mini btn-primary edit-existing" type="button">Edit</button>\
					<div class="edit_cell btn-group"><button class="btn-save-observation btn btn-mini btn-success" type="button">Submit</button>\
					<button class="btn-cancel-observation btn btn-mini btn-danger" type="button">Cancel</button>\
				</td>\
				<td class="editable"><span class="display_cell date_select"><%= date %></span><span class="edit_cell date_select"><input title="Enter a date in mm/dd/yyyy format.  It may not already have an associated diameter entry or be in the future." type="text" value="<%= date %>"/>\
				<td class="editable"><span class="display_cell observers"><%= obs.observers %></span><span class="edit_cell observers"><input title="Observers field may not be empty." type="text" value="<%= obs.observers %>"></span></td>\
				<td class="editable"><span class="display_cell diameter"><%= obs.value %></span><span class="edit_cell diameter"><input title = "Please enter an integer or floating point number such as 5, 6.1, 10.33" type="text" value="<%= obs.value %>"></span></td>\
				<td class="editable"><span class="display_cell notes"><%= obs.notes %></span><span class="edit_cell notes"><input type="text" value="<%= obs.notes %>"></span></span></td>\
			</tr>\
			<% }); %>\
			</tbody>\
			</table>\
			<div class="button-row">\
				<button class="btn-new-observation btn btn-mini btn-success pull-left" type="button">+ New Entry</button>\
			</div>\
		',
		initialize: function(){
			var i = 0;
			console.log("here");
			if (document.location.hash.search("update") === -1) {
				this.renderReport();
				this.model.on('change', this.renderReport, this); //re-render when the model is saved (new observation, or an edit)
			} else {
				this.renderUpdate();
				this.model.on('change', this.renderUpdate, this); //re-render when the model is saved (new observation, or an edit)
			}
		},
		renderReport: function(){
			console.log('render report');
			var thisTree = this.model.toJSON();
			//get the dates in descending order
			var dates = thisTree.diameter;
			console.log(dates);
			thisTree.datesDesc = dates;
			this.$el.html(_.template(this.templateReport, {tree: thisTree}));
			$(".title").text("Analyzing Tree Data ");
			$("#tree_observations").tablesorter();
		},
		renderUpdate: function(){
			var thisTree = this.model.toJSON();
			//get the dates in descending order
			var dates = thisTree.diameter;

			thisTree.datesDesc = dates;
			this.$el.html(_.template(this.templateUpdate, {tree: thisTree}));
			$(".title").text("Updating Tree Data ");
			$("#tree_observations").tablesorter({headers: { 0: { sorter: false}}}); 
			this.postRender();
		},
		postRender: function(){
			//add any methods/functions that need to be call after redendering the Tree edit view
			this.populateSpecies();
		},
		populateSpecies: function(){
			var treeSpecies = this.model.get('species');
			//console.log(treeSpecies);
			//??
			$.getJSON(app.config.cgiDir + 'litterfall.py?site=allSpecies', function(data) {
				$.each(data, function(index, value) {
					if (value == treeSpecies) {
						$(".species select").append($("<option></option>").attr("value",value).attr("selected", "selected").text(value));
					} else {
						$(".species select").append($("<option></option>").attr("value",value).text(value))
					}
				});
			});

		},
		events: {
			'click .btn-new-observation': 'newObservation',	
			'click .edit-existing': 'editObservation',
			'click .btn-save-observation': 'saveObservation',
			'click .btn-cancel-observation': 'cancelEditObservation',
			'click .edit-tree-info-btn': 'editTreeInfo',
			'click .btn-cancel-tree-info': 'cancelEditTreeInfo',
			'click .btn-save-tree-info': 'saveTreeInfo',
			'change .edit_cell': 'validateField'
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
			var today = new Date();
			var todayDateKey = [today.getFullYear(),((today.getMonth() < 9) ? 0 : ""),(today.getMonth() + 1),((today.getDate() < 10) ? 0 : ""),today.getDate()].join(""); //yes it generates the date in YYYYMMDD format
			// if today's date already has an entry, set a template dateKey using tomorrow's date (which the user will be forced to change to pass validation)
			newDiameter = {
					date: today,
					value: 'n/a',
					notes: "",
					observers: ""
			};
			console.log("NEW");
			//mark the new row as new
			$("tr:first").addClass("new");
			
			// Disable all the other edit buttons
			$("#tree_observations .btn.display_cell").hide();

			// Show edit content, hide display content, show "Submit/cancel button", add date_picker		
			$("#tree_observations > tbody > tr:first .edit_cell").show();
			$("#tree_observations > tbody > tr:first .display_cell").hide();
			$("#tree_observations > tbody > tr:first .edit_cell.date_select :input" ).datepicker({ maxDate: 0 , changeYear: true , changeMonth: true , constrainInput: true});	
			//var existingObs = this.model.findAllObservers();
			var existingObs = [];
			$("#tree_observations > tbody > tr:first .edit_cell.observers :input").autocomplete({source: existingObs});
		},

		editObservation: function(event) {

			// User wants to edit an existing observation.  
			row_to_edit = $(event.target).parents("tr");		// Get the row of edit button
			$(row_to_edit).addClass("edit");
			// Hide any existing edit modes
			$("#tree_observations .btn.display_cell").hide();

			// Show edit content, hide display content, show "Submit/cancel button", add date_picker		
			row_to_edit.find(" .edit_cell").show();
			row_to_edit.find(".display_cell").hide();
			row_to_edit.find(".edit_cell.date_select :input").datepicker({ altFormat: "yymmdd" , altField: "#tree_observations > tbody > tr .formatted_date" , maxDate: 0, changeYear: true , changeMonth: true , constrainInput: true });
			row_to_edit.addClass("old");
			// get all observers existing in database, feed them into an autocomplete for the observers field
			var allDistinctObservers = this.populateObserversArray(allDistinctObservers);
			row_to_edit.find(".edit_cell.observers :input").autocomplete({source: allDistinctObservers});			

		},

		cancelEditObservation: function() {
			// user wants to cancel any edits made, or is canceling after adding a new entry
			this.model.fetch(); // retrieves recent data
			$("#tree_observations > tr").removeClass("new");
			$("#tree_observations > tr").removeClass("edit");
			this.render();      // NOTE: this is sort of a hack to exit the editing view
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

			/* final validation before saving to database */
			if (! (this.validateDate(row_to_save) && this.validateObservers(row_to_save) && this.validateDiameter(row_to_save))){
				console.log("didn't save");
				return; // user will remain in edit view until their data passes validation
			}

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
			diameters.push( {
					value: newValue,
					notes: newNotes,
					observers: newObservers
				});

			// Set the diameter to be the new list of observations and save the object	

			//** May need to check to see if no change 

			this.model.set({"diameter": diameters});
			var ret = this.model.save(null, {error: function(model, response, options){alert("There was an error with the database.  Please alert the instructor of this issue.")}, 
									         success: function(model, response, options){console.log("save to database was successful")}});	
			// NOTE: another hack to make sure that the display view is rendered instead of the edit view
			//(otherwise the edit view hangs there when nothing is changed)

			//row_to_save.find(".editable").attr("id", "current");
			//row_to_save.find("#current").addClass("alert-valid", {duration:500});
			//row_to_save.find("#current").removeClass("alert-valid", {duration:500});
			this.render();		

		},

		validateField: function(event){

			var fieldToValidate = event.currentTarget.className;
			var currentRow = $("#tree_observations > tbody > tr .edit_cell :visible").parents("tr");

			/* if date field lost focus */
			if (fieldToValidate == "edit_cell date_select"){				
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

		},

		validateDate: function(currentRow) {

			/* get date to validate */
			var dateEntered = currentRow.find(".formatted_date").val();

			/* make sure date isn't in future */
			var today = new Date();
		    var todayFormatted = today.getFullYear().toString() + 
		    				     ((today.getMonth()+1).toString().length == 1 ? "0"+(today.getMonth()+1) : (today.getMonth()+1).toString()) + 
		    					 ((today.getDate()+1).toString().length == 1 ? "0"+today.getDate() : today.getDate().toString());
			if (dateEntered > todayFormatted) {
				// trigger the edit Observation button to prevent saving
				$(".edit_cell.date_select :input" ).addClass("alert_invalid");
				alert("Can't have date past today!");
				console.log("date validation failed");
				$(currentRow.find('.edit-existing')).trigger('click');
				return false;
			} 

			/* make sure date isn't already added */		
			// get all dates listed in model for diam entries
			var existingDiamsObject = this.model.attributes.diameter;
			var existingDatesArray = Object.keys(existingDiamsObject).reverse();
			// remove the date previously listed in the date field from the list of dates to check against
			var prevDateIndex = $("#tree_observations tbody tr").index(currentRow);
			existingDatesArray.splice(prevDateIndex, 1);
			// alert user if the date already has an associated entry
			for (i in existingDatesArray) {
				if (existingDatesArray[i] == dateEntered){
					// show user a tooltip about the proper entry
					$(".edit_cell.date_select :input").tooltip();   // NOTE: the text shown on the tooltip is listed as the title attribute of the template for TreeEditView.
					$(".edit_cell.date_select :input" ).tooltip("show");
					$(".edit_cell.date_select :input" ).addClass("alert_invalid");
					return false;
				}
			}

			/* if date field passes all tests, make sure it is not highlighted anymore */
			$(".edit_cell.date_select :input" ).removeClass("alert_invalid");
			$(".edit_cell.date_select :input" ).tooltip("destroy");
			console.log("date validation passed");
			return true;
		},

		validateObservers: function(currentRow) {

			// get observers entry and format
			var obsEntered = currentRow.find(".observers :input").val().split(",");
			for (var i=0; i<obsEntered.length; i++){
				obsEntered[i] = obsEntered[i].trim(" ");
			}	

			// make sure an observer was entered
			if (obsEntered[0] === "") {
				console.log("empty list");
				$(".edit_cell.observers :input").tooltip(); // NOTE: the text shown on the tooltip is listed as the title attribute of the template for TreeEditView.
				$(".edit_cell.observers :input" ).tooltip("show");
				$(".edit_cell.observers :input" ).addClass("alert_invalid");
				return false;
			} else { 
				$(".edit_cell.observers :input" ).removeClass("alert_invalid");
				$(".edit_cell.observers :input" ).tooltip("destroy");
				console.log("observers validation passed");
				return true;
			}

		},

		validateDiameter: function(currentRow) {

			// get diameter entry
			var diamEntered = parseFloat(currentRow.find(".diameter :input").val());

			// make sure the diameter is in correct format (can be parsed as float)
			if (isNaN(diamEntered)) {
				console.log("returned NaN");
				$(".edit_cell.diameter :input").tooltip(); // NOTE: the text shown on the tooltip is listed as the title attribute of the template for TreeEditView.
				$(".edit_cell.diameter :input").tooltip("show");				
				$(".edit_cell.diameter :input").addClass("alert_invalid");
				return false;
			} else { 
				$(".edit_cell.diameter :input" ).removeClass("alert_invalid");
				$(".edit_cell.diameter :input" ).tooltip("destroy");
				console.log("diameter validation passed");
				return true;
			}
		},

		populateObserversArray: function(observersArray) {
			//finds all observers that have been previously entered into the database
			var curObservers;
			var curObserver;
			observersArray = [];
			var alreadyThere = false;
			var curDates;
			var dateThreshold = (new Date()).getFullYear() - 4; // only autocomplete with observers who have entered data in last 4 years
			// get all diameter objects and loop through to find each distinct observer entry
			$.getJSON(app.config.cgiDir + 'litterfall.py?site=allDiameters', function(data) {
				for (i in data){
					for (date in data[i]){
						// only get observers if the entry has observers listed
						if (data[i][date].observers !== undefined) {
							// only take observers from last 4 years
							if (date.substr(0,4) >= dateThreshold) {
								if (data[i][date].observers[0] !== undefined) {
									if (data[i][date].observers[0].trim(" ") !== ""){
										curObservers = data[i][date].observers;
										// check each observer listed in an entry against each observer already in comprehensive array
										for (k in curObservers) {
											curObserver = curObservers[k];
											for (date in observersArray) {
												if (curObserver === observersArray[date]) {
													alreadyThere = true;
													break;
												} else {
													alreadyThere = false;
												}
											}
											if (alreadyThere === false) {
												observersArray.push(curObserver);
											}
										}
									}
								}
							}
						}
					}
				}
			});
			observersArray.sort();
			return observersArray;
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
			//_id: '',
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
			lng: 0,
			collection_type: 'tree'
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
		// overriding the save method, so that when the model saves it updates its inside to match what the server sends back
		save: function(attrs, options) {
			
			var result = Backbone.Model.prototype.save.call(this, attrs, options);
			
			treeModel = this;
			result.done(function(data) {
				
				treeModel.set(data);
				
			});
			
			return result;
		},
		// ** Normally, it would not have to go through save, but somehow destroy doesn't work
		// I think there is something wrong with the DELETE request method
		destroy: function() {
			this.set('delete', true);
			return this.save();
		},
		validate: function(attrs, options){
			//this is where we validate the model's data
			var isInt = [];
			var isFloat = [];
		},

		newSubTreeRowViewInitialize: function() {
			var subTreeRow = new newSubTreeRowView({
				model: this
			});
		}

	});

	//Declare the plot collection, contains tree objects
	var Plot = Backbone.Collection.extend({
		model: Tree,
		url: "/",
  		initialize: function(){
  			 this.on('reset', this.renderTrees); 
  			 this.on('add', this.renderTrees); 
  			 //this.on('reset', this.findAllObservers); 
  			 //this.on('add', this.findAllObservers); 
  			 //this.on('change', this.renderTrees);
  		},
  		renderTrees: function(){
  			var siteName = "";
  			var plotNumber = 0;
  			var maxDiam = 0;
  			this.each(function(tree){
  				tree.plotViewInitialize();
  				var numObvs = tree.get("diameter").length;
  				// determine the maximum number of observations for any tree in this plot
  				// to allocate enough columns in the CSV file
  				if (numObvs > maxDiam) {
  					maxDiam = numObvs;
  				}
  			}, this);
  			// populate the treeIDs dropdown menu for adding new subtrees
  			this.populateTreeIDs();
  			$(".dbh").attr("href", document.location.hash);
  			$(".btn").css("display", "inline-block");
    		
    		// add tablesorter jquery plugin (no sorting for first column)
  			$("#plot-table").tablesorter({headers: { 0: { sorter: false}}}); 
  			// populate the diameter entries based on user's given years
  			this.populateTreeDiameters();
  			
  			// re-populate (really just showing/hiding columns) corresponding to the date range desired when user clicks Go!
  			$("#btn-go").click(this.populateTreeDiameters);

  			// set up column headers for CSV
  			var CSV = "Full Tree ID,Species,Angle,Distance"
  			for(var i = 1; i <= maxDiam; i++) {
  				CSV += "," + "Obs Date " + i + ",Diameter " + i + ",Notes " + i;
  			}

  			var j = 0;
  			$(".export").click(function(e) {
  				// query database for all trees in the plot
  				if (j == 0) {  				
  					$(".export").val("Preparing data for export...");
  					$.getJSON(app.config.cgiDir + 'litterfall.py?site=' + $(".site-name").text() + "&plot=" + $(".plot-number").text(), function(data) {
  						$.each(data, function(index, value) {
							// format Comma Separated Value string with data from each tree
							CSV = CSV + "\r\n" + (parseInt(value["tree_id"]) + parseInt(value["sub_tree_id"])*.1) + "," + value["species"] + "," + value["angle"] + "," + value["distance"];
							$.each(value["diameter"], function(i) {
								console.log(CSV);
								var obs = value["diameter"][i];
								if (obs["date"] != null){
									var parsedDate = new Date(obs["date"]["$date"]);
									var formattedDate = $.datepicker.formatDate('m/d/yy', parsedDate)
									CSV += "," + formattedDate + "," + obs["value"] + ",";
								}
								if (obs["notes"] != "" && obs["notes"] != undefined){
									CSV += obs["notes"];
								}
							});
						});
					// adds formatted data to a hidden input on the page
					$("#CSV").append(CSV);
					$(".export").val("Click to open file");
					$(".export").addClass("btn-success");
					j = 1;
					});
				}
				// ensures information has loaded before opening the CSV file
				if (j > 0) {
					var agt=navigator.userAgent.toLowerCase();
					if (agt.indexOf("firefox") != -1) {
						window.open('data:application/octet-stream;charset=utf-8,' + encodeURIComponent($('#CSV').text()));
					} else {
						window.open('data:text/csv;charset=utf-8,' + encodeURIComponent($('#CSV').text()));
					}
					e.preventDefault();   				
				}	
  			});
    	},
		populateTreeDiameters: function(){
    		// get year range user wished to view data from
			var startYear = $("#startYear").val();
  			var endYear = $("#endYear").val();
			var numYears = $("#endYear").val()-$("#startYear").val() + 1;
			
			if (startYear > endYear){
				// switch years so user doesn't have to be specific about which direction their date range goes
				var tempYear = startYear;
				startYear = endYear;
				endYear = tempYear;
			}
			
			$('.date-entry').hide();
			for (var i=parseInt(startYear); i<=parseInt(endYear); i++){
				$('.'+i).show();
			}

			//format header row to make the DBH cell span all the years specified
  		//	document.getElementById("DBH").colSpan = numYears;
    	},
  		addTree: function(){
  			this.newTreeRowViewInitialize();	
  		},
  		
  		populateTreeIDs: function(){

			// Get all the ids
			var ids = [];
			
			// Populate the ids array
			this.each(function(tree){
				var treeid = tree.get("tree_id");
				// Avoiding duplicates
				if (ids.length == 0 || ids.indexOf(treeid) < 0) {
					ids.push(treeid);
				}
			});

			// Sort the array IDs
			ids.sort(function(a,b){return a - b;});

			var treeCollection = this;

			// populate tree IDs
			for (var i = 0; i < ids.length; i++) {
				var id = ids[i];
				$(".id-list").append( 
					$("<li></li>").append( 
						$("<a></a>").text(id)
					)
				);

			}
			
			$(".id-list li a").click(function(){

				var aTag = $(this);

				var parentTree = treeCollection.find(function(tree) {
					return tree.get("tree_id") == parseInt(aTag.text());
				});

				//console.log(parentTrees[parentTrees.length - 1]);
				parentTree.newSubTreeRowViewInitialize();
				
			});






		},

		newTreeRowViewInitialize: function(){
  			console.log("newTreeRowViewInitialize");
			var newTreeRow = new newTreeRowView({
				targetEl: $("#plot-table"),
				model: this.model
			});
		}
  	});

    // Instantiate the router
    var app_router = new AppRouter;
   
    //default route is the App Home Page
    app_router.on('route:defaultRoute', function (actions) {
    	$(".home").addClass("active");
    	$(".data").removeClass("active");
    	var  templateFile = 'index.html';
		require(['lib/text!templates/' + templateFile + '!strip'], function(templateHTML){			//require's library takes HTML templates
			$('#main').html(templateHTML);
		});
    });
    
    //Site, plot selection
    app_router.on('route:accessObservations', function () {											//listening for user action (for user to select location and plot)
    	$(".data").addClass("active");
    	$(".home").removeClass("active");
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
    app_router.on('route:goToPlot', function(site, plot) {		
    	//reloads page based on selected location (site) and plot
		$(".data").addClass("active");
    	$(".home").removeClass("active");
		// load different template depending on whether we are updating or analyzing data
		var templateFile;		
		if (document.location.hash.search("update") === -1) { //if url does not contain 'update' (i.e. it must contain 'reports')
			console.log("should be reporting");
			templateFile = 'reports2.html';
		} else {		
			console.log("should be updating");									  // url contains 'update'
			templateFile = 'update2.html';
		}
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
			
			// adding new tree
			$('.add-new-tree').click(function(){
				thisPlot.addTree();
			});
			
		});

    });
    
    //Edit tree view
    app_router.on('route:goToTree', function(site, plot, treeId, subTreeId) {						//reloads page based on selected location (site) and plot
    	$(".data").addClass("active");
    	$(".home").removeClass("active");
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
    
    // Add new sub-tree
    /*
    app_router.on('route:newSubTree', function(site, plot, treeId) {
    	var templateFile = 'update-tree.html';
    	// create a new tree object in the database
    	// connect the newly created object to a tree model here
    	// emulate the edit tree view
    }*/
    
    //
    
     //Add new tree view
     /*
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
			thisTree.url = app.config.cgiDir + 'litterfall.py';
			thisTree.set("site", site);
			thisTree.set("plot", plot);
			console.log(thisTree);

			//DBH Tooltip 
			updateFunctions();
		});
    });
    */
    
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
