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
		var bottleName, bgColor;
		
		for (var i = 0; i < formData.length; i++) {
			switch (formData[i].name) {
			case "bottle-text":
				bottleName = formData[i].value;
				break;
			case "bottle-color":
				if (formData[i].value !== "custom") {
					bgColor = formData[i].value;
				} else {
					bgColor = "black";
				}
				break;
			}
		}
		
		var headPart = f.New('span').addClass("bottle-head").css("background-color", bgColor).append(f.New('span').addClass("filler"));
		var bodyPart = f.New('span').addClass("bottle-body").css("background-color", bgColor).append(f.New('span').addClass("filler"));
		var theBottle = f.New('div').addClass("bottle").append(headPart).append(bodyPart);
		var bottleContainer = f.New('div').append(theBottle);
		var nameLabel = f.New("div").addClass("bottle-description").text(bottleName);
		var result = f.New("div").addClass("col p-2").append(bottleContainer).append(nameLabel);
		theBottle.data("bottle", {
			"$sel": theBottle,
			"$val": 0,
			val: function() {
				if (arguments.length) {
					var newValue = arguments[0];
					if (newValue > 80) {
						this.$sel.children(".bottle-head").children(".filler").css("height", (100 - newValue) * 5 + "%");
						this.$sel.children(".bottle-body").children(".filler").css("height", 0);
					} else {
						this.$sel.children(".bottle-head").children(".filler").css("height", "100%");
						this.$sel.children(".bottle-body").children(".filler").css("height", (80 - newValue) * 1.25 + "%");
					}
					this.$val = newValue;
				} else {
					return this.$val;;
				}
			},
			name: bottleName
		});
		return result;
	});
	
	
	var bottles = {}, size = 0;
	var MAX_BOTTLE_NUM = 100;
	var ERR_BOTTLE_NUMBER_EXCEED = "最多只能放 #1 个瓶子！";
	var ERR_BOTTLE_EXISTS = '瓶子 "#1" 已存在！';
	var DBLCLICK_THRESHOLD = 300;
	
	$("[name=bottle-color]").each(function() {
		$(this).parent().css("background-color", this.value);
	});
	
	$("#bottle-info").on("submit", function(e) {
		e.preventDefault();
		// check validity here
		var bottleName = $("#bottle-text").val();
		var lastClickTime = 0;
		
		if (size >= MAX_BOTTLE_NUM) {
			alert(ERR_BOTTLE_NUMBER_EXCEED.replace("#1", MAX_BOTTLE_NUM));
			return;
		} else if (bottles[bottleName] !== undefined) {
			alert(ERR_BOTTLE_EXISTS.replace("#1", bottleName));
			return;
		}
		
		var newBottle = f.New('bottle', $(this).serializeArray());
		var bottleEntity = newBottle.find(".bottle");
		bottleEntity.data("currentIntervalHandler", null);
		bottleEntity.on("mousedown touchstart", function(e) {
			e.preventDefault();
			console.log(e.target);
			var bottle = $(this).parent().parent()
			var time = Date.now();
			if (time - lastClickTime > DBLCLICK_THRESHOLD) {
				var lastIntervalHandler = $(this).data("currentIntervalHandler");
				if (lastIntervalHandler !== null) clearInterval(lastIntervalHandler);
				$(this).data("currentIntervalHandler", setInterval(function(sel) {
					var bottle = sel.data("bottle");
					if (bottle.val() < 100) {
						bottle.val(bottle.val() + 1);
					}
				}, 20, $(this)));
				lastClickTime = time;
			} else {
				$(this).data("bottle").val(0);
				lastClickTime = 0;
			}
		});
		bottleEntity.on("mouseup touchend", function() {
			var handler = $(this).data("currentIntervalHandler");
			if (handler !== null) clearTimeout(handler);
			$(this).data("currentIntervalHandler", null);
		});
		$("#bottle-container").append(newBottle);
		bottles[bottleName] = newBottle;
		size++;
	});
});