jQuery( document ).ready(function() {
	
	jQuery("#login").submit(function( event ) {
		event.preventDefault();
		var username = jQuery(this).find("[name='username']").val();
		var password = jQuery(this).find("[name='password']").val();
		SessionControl.addToken(username, password);
	});
	jQuery("#logoutButton").click(function( event ) {
		SessionControl.removeToken();
	});
	jQuery("#connect_client").click(function( event ) {
		RemoteConnection.startConnection(false);
	});
	jQuery("#connect_server").click(function( event ) {
		RemoteConnection.startConnection(true);
	});
	jQuery("#disconnect").click(function( event ) {
		RemoteConnection.disconnect();
	});

	setInterval(function(){ 
		if(SessionControl.isAdmin()) {
			jQuery(".loggedInIndicator").html("<span style='color: green'>Logged in</span>");
			jQuery("#loginButton").attr("disabled", true);
			}
		else  {
			jQuery(".loggedInIndicator").html("<span style='color: red'>Not logged in</span>");
			jQuery("#loginButton").attr("disabled", false);
		}
		
		if(RemoteConnection.connectionIsOpen()) {
			jQuery(".connectionIndicator").html("<span style='color: green'>Connected</span>");
			jQuery(".connectButton").attr("disabled", true);
			jQuery("#disconnect").attr("disabled", false);
		}
		else {
			jQuery(".connectionIndicator").html("<span style='color: red'>Not connected</span>");
			jQuery(".connectButton").attr("disabled", false);
			jQuery("#disconnect").attr("disabled", true);
		}
			
	}, 1000);

						
	jQuery("#syncPopup").click(function() {
		showLoginPopup(true);
	});
	jQuery(".closeWindow").click(function() {
		showLoginPopup(false);
	});

	var showLoginPopup = function(show) {
		var fadeInSpeed = 333;
		var fadeOutSpeed = 333;
		
		if(show) {
			jQuery(".backgroundFade").css("opacity","0");
			jQuery(".backgroundFade").css("display","block");
			jQuery(".backgroundFade").animate({"opacity":"0.75"}, fadeInSpeed);
			
			jQuery(".login_container").css("opacity","0");
			jQuery(".login_container").css("display","block");
			jQuery(".login_container").animate({"opacity":"1"}, fadeInSpeed);	
		}
		else {
			jQuery(".backgroundFade").animate({"opacity":"0"}, fadeOutSpeed, function() {
				jQuery(".backgroundFade").css("display","none");	
			});
			
			jQuery(".login_container").animate({"opacity":"0"}, fadeOutSpeed, function() {
				jQuery(".login_container").css("display","none");
			});	
		}
	}
	
});			
				