jQuery( document ).ready(function() {
	var logginAsAdmin = false;
	var loopActive = false;
	
	jQuery("#joinSession").submit(function( event ) {
		event.preventDefault();
		logginAsAdmin = false;
		loopActive = true;
		var session_id = jQuery(this).find("[name='session_id']").val();
		RemoteConnection.startConnection(session_id, null);
	});
	
	jQuery("#createSession").submit(function( event ) {
		event.preventDefault();
		logginAsAdmin = true;
		loopActive = true;
		var session_id = jQuery(this).find("[name='session_id']").val();
		var password = jQuery(this).find("[name='password']").val();
		RemoteConnection.startConnection(session_id, password);
	});
	
	jQuery("#cancelReconnect").click(function( event ) {
		loopActive = false;
		RemoteConnection.disconnect();
	});
	
	setInterval(function(){ 
		
		if(RemoteConnection.connectionIsOpen() && logginAsAdmin) {
			jQuery(".connectionIndicator").html("<span style='color: green'>You are connected as admin.</span>");
			
		}
		else if(RemoteConnection.connectionIsOpen()) {
			jQuery(".connectionIndicator").html("<span style='color: green'>You are connected as a client.</span>");
			
		}
		else if (loopActive) {
			jQuery(".connectionIndicator").html("<span style='color: red'>Disconnected. Trying to reconnect.</span><a id='cancelReconnect' href='#'>Cancel</a>");
		}
		else { 
			jQuery(".connectionIndicator").html("<span style='color: red'>Not connected</span>");
		
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
			/*
			jQuery(".backgroundFade").css("opacity","0");
			jQuery(".backgroundFade").css("display","block");
			jQuery(".backgroundFade").animate({"opacity":"0.75"}, fadeInSpeed);
			*/
			jQuery(".login_container").css("opacity","0");
			jQuery(".login_container").css("display","block");
			jQuery(".login_container").animate({"opacity":"1"}, fadeInSpeed);	
		}
		else {
			/*
			jQuery(".backgroundFade").animate({"opacity":"0"}, fadeOutSpeed, function() {
				jQuery(".backgroundFade").css("display","none");	
			});
			*/
			jQuery(".login_container").animate({"opacity":"0"}, fadeOutSpeed, function() {
				jQuery(".login_container").css("display","none");
			});	
		}
	}
	
});			
				