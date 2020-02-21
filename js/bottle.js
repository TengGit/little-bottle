$(function() {
	var f = {};
	
	(function(exports) {
		'use strict';
		
		var registered = {};
		
		exports.New = function(type) {
			var create = registered[type];
			if (create) {
				return create.apply(undefined, arguments)
			} else {
				var result = $(document.createElement(type));
				if (arguments.length == 2) {
					var attr = arguments[1];
					for (var name in attr) {
						result[name](attr[name]);
					}
				}
				return result;
			}
		}
		
		exports.Register = function(type, factory) {
			var prev = registered[type];
			registered[type] = factory;
			return prev;
		}
		
		exports.Unregister = function(type) {
			var prev = registered[type];
			delete registered[type];
			return prev;
		}
		
		return exports;
		
	})(f);
	
	f.Register('bottle', function(type, formData) {
		var headPart = f.New('span', {
			"addClass": ["bottle-head"],
			"append": [f.New('span').addClass("filler")]
		});
		var bodyPart = f.New('span', {
			"addClass": ["bottle-body"],
			"append": [f.New('span').addClass("filler")]
		});
		var theBottle = f.New('div').addClass("bottle").append(headPart).append(bodyPart);
		
		var bottleName;
		
		for (var i = 0; i < formData.length; i++) {
			switch (formData[i].name) {
			case "bottle-text":
				bottleName = formData[i].value;
				break;
			}
		}
		
		return f.New("div").addClass("col p-2").append(theBottle);
	});
	
	$("#bottle-info").on("submit", function(e) {
		e.preventDefault();
		// check validity here
		$("#bottle-container").append(f.New('bottle'), $.map($(this).serializeArray());
	});
});