define([
  'jquery',
  'underscore',
  'backbone',
  'models/tree_data/Tree'
], function($, _, Backbone, Tree){
	var plotRowUpdateView = Backbone.View.extend({
		tagName: 'tr',				
		template:	'\
			<td>\
				<div class="btn-group">\
					<button class="btn-tree btn btn-mini btn-primary btn-update" type="button"><i class="icon-white icon-edit"></i> Update</button>\
					<button class="btn btn-mini dropdown-toggle btn-primary" data-toggle="dropdown">\
						<span class="caret"></span>\
					</button>\
					<ul class="dropdown-menu">\
						<li><a style="cursor:pointer;" class="delete-row"><i class="icon-trash"></i>   Delete</a></li>\
						<li><a style="cursor:pointer;" class="add-new-sub-tree-from-row"><i class="icon-plus-sign"></i>   Add a sub-tree</a></li>\
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
			<% var status_display = ""; %>\
			<% if (tree.status == "alive") { %>\
			<%		status_display = "Alive"; %>\
			<%	} else if (tree.status == "dead_standing"){ %>\
			<%		status_display = "Dead (standing)"; %>\
			<%	} else if (tree.status == "dead_fallen"){ %>\
			<%		status_display = "Dead (fallen)"; %>\
			<% } %>\
				<%= status_display %>\
			</td>\
			<td>\
				<%= tree.latest_DBH_message %>\
			</td>\
			<td>\
				<%= _.escape(tree.latest_comment) %>\
			</td>',
		initialize: function(){
			this.render();
			this.model.on("change:sub_tree_id", function() {
				this.$el.find("td").eq(1).text(this.model.get("full_tree_id"));
			}, this);
		},
		render: function(){
			var this_tree = this.model.toJSON();
			/*
			this_tree.this_date = "";
			for (date in this_tree.diameter){                      //loop through the list of existing dates and store the most recent
				if (date > this_tree.this_date){					  //Date format is YYYYMMDD (reformated in template html above)
					this_tree.this_date = date;
				}
			}*/
			this_tree.latest_DBH_message = "-";
			this_tree.latest_comment = "-";
			
			if (this_tree.diameter.length > 0) {
				
				// get most recent entry
				// already sorted (the latest comes first) by Tree.parse()
				var most_recent_entry = _.first(this_tree.diameter);
				
				this_tree.latest_DBH_message = most_recent_entry.value + " in " + most_recent_entry.year;
				this_tree.latest_comment = _.isEmpty(most_recent_entry.notes) ? '-' : most_recent_entry.notes;
				
			}
			//$el --> gets the jQuery object for this view's element 
			//*.attr('id', this_tree._id.$oid) --> sets 'id' to MongoDB value for tree's ID
			//takes the tree's data, assigns it to this.template, inserts the HTML into the jQuery object for this view's element
			this.$el.attr('id', 'tree'+this_tree._id.$oid).html(_.template(this.template, {tree: this_tree}));
			this.$el.addClass("tree-cluster-" + this_tree.tree_id);
			this.$el.children().eq(2).css("font-style","italic");
			this.options.targetEl.append(this.el);	
			$('.dbh').tooltip({trigger:'hover'});
			$('.dropdown-toggle').dropdown();

		},
		events: {
			'click .delete-row': 'deleteTree',
			'click .btn-update': 'goToTree',								//if update button is clicked, runs updateTree function
			'click .add-new-sub-tree-from-row': function() {
				$('.add-new-sub-tree').eq(0).trigger("choosing_parent_tree");
				this.model.collection.addSubTree(this.model.get('tree_id'));
				//this.model.trigger("add_new_sub_tree_from_row");
				//this.addSubTree(this.model.get("tree_id"));
			}
		},
		goToTree: function(){
			//goto update tree page
			var sub_id = this.model.get("sub_tree_id");
			var tree_url = "/treeid/" + this.model.get("tree_id") + ((sub_id) ? '/subtreeid/' + sub_id : '');
			document.location.hash = document.location.hash + tree_url;
		},
		deleteTree: function(){

			// ask the user whether they're absolutely sure...
			var $alert_modal = $('<div></div>').addClass("modal hide face").attr({
				'tabindex': '-1',
				'role': 'dialog',
				'aria-labelledby': 'dialog',
				'aria-hidden': 'true'
			}).html('\
				<div class="modal-header">\
					<h3><i class="icon-large icon-warning-sign"></i> Do you want to continue?</h3>\
				</div>\
				<div class="modal-body">\
					<p>Are you sure you want to delete this tree and all of its data? This action cannot be undone.</p>\
				</div>\
				<div class="modal-footer">\
					<button class="btn btn-primary" data-dismiss="modal" aria-hidden="true">Cancel</button>\
					<button class="btn btn-danger" id="no-remorse">Yes, delete this tree.</button>\
				</div>\
			');

			$('body').append($alert_modal);
			$alert_modal.modal();
			$alert_modal.modal('show');
			$alert_modal.on('hidden', function() {
				$alert_modal.remove();
			});

			var self = this;

			$alert_modal.find('#no-remorse').on('click', function() {
				$alert_modal.modal("hide");
				self.deleteTreeFunction();
			});

		},
		deleteTreeFunction: function() {
			var this_tree_el = this.$el;
			this.model.url = app.config.cgiDir + 'tree_data.py';
			var result = this.model.destroy({
			
				success: function(model) { // once done
					
					var this_model = model;				
					this_tree_el.fadeOut("slow", function() {						//function called after fadeOut is done
						
						// remove the row--we need this because if we just hide (using visibility:hidden) the row then the table-stripe class will not work
						$(this).remove();
						
					});
					
					// reset tablesorter
					$('#plot-table').trigger('update');

				}, 
				error: function(model, xhr) {
					
					var deleteTreeError = new errorView({xhr: xhr});
					deleteTreeError.render().$el.insertAfter($("h1").eq(0));
					
				}
			});
		}
	});
	return plotRowUpdateView;
});
