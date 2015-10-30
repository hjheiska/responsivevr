/*
*	SessionControl
*	
*
*/

SessionControl = {};
(function (SessionControl) {

	SessionControl.isAdmin = function() {
		var token = Utils.getCookie("token");
		return (token != "");
	}
	
	SessionControl.addToken = function(username, password) {
		var data = "username=" + username + "&password=" + password;
		Utils.ajaxRequest("POST", "https://54.93.164.209:8080/auth", data, function(token) {
			Utils.createCookie("token",token,1);
		});	
	}
	
	SessionControl.removeToken = function() {
		Utils.createCookie("token","",0);
	}	
	
	SessionControl.getToken = function() {
		return Utils.getCookie("token");
	}

}(SessionControl));
	