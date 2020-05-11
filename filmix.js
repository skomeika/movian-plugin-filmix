(function (plugin) {
var logo = plugin.path + "logo.png";
var pluginDescriptor = plugin.getDescriptor();
var service = plugin.createService(pluginDescriptor.title, pluginDescriptor.id + ":start", "video", true, logo);
var items = [];
var http = require('showtime/http');
var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36';
var headers = {
														  debug: false,
														  compression: true,
														  headRequest: false,
														  headers: {
															  'User-Agent': UA,															 
															  'accept': 'application/json, text/javascript, */*; q=0.01',
															  'X-FX-Token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiIsImp0aSI6ImZ4LTVlYjg3NzgwMjY5MWMifQ.eyJpc3MiOiJodHRwczpcL1wvZmlsbWl4Lm1lIiwiYXVkIjoiaHR0cHM6XC9cL2ZpbG1peC5tZSIsImp0aSI6ImZ4LTVlYjg3NzgwMjY5MWMiLCJpYXQiOjE1ODkxNDc1MjAsIm5iZiI6MTU4OTEzNjcyMCwiZXhwIjoxNTkxNzM5NTIwLCJwYXJ0bmVyX2lkIjoiMiIsImhhc2giOiJiOTMwZDhjMGMzOTE5ZDZkNDBjYWE4ZWExODY0ODFmODVjNGVlNjA4IiwidXNlcl9pZCI6bnVsbCwiaXNfcHJvIjpmYWxzZSwiaXNfcHJvX3BsdXMiOmZhbHNlLCJzZXJ2ZXIiOiIifQ.I8NBrVlREjVA_CthL0i6GBTgR6-y7lndU5JLmhh4ejA',
															  
														  },
														  
														};
														
var links_for_serials = [];

														
	function setPageHeader(page, title, icon) {
		page.type = "directory";
		page.contents = "items";
		page.metadata.logo = logo;
		page.metadata.icon = logo;
		page.metadata.title = new showtime.RichText(title);
	}


plugin.addURI(plugin.getDescriptor().id + ":start", function (page) {
		setPageHeader(page, plugin.getDescriptor().synopsis);
		page.loading = true;
	
		var doc = showtime.httpReq('http://5.61.48.15/partner_api/popular?page=0', headers);	
		doc = showtime.JSONDecode(doc);
		
		for (i = 0; i < doc.items.length; i++) {
			 var item = doc.items[i];
	

			 page.appendItem(plugin.getDescriptor().id + ":open" + item.id +'~'+item.title+'~'+item.poster, "directory", {
				title: item.title ,
				icon: item.poster,
				id:item.id
				});
			  
		 }
		page.loading = false;
	});

plugin.addURI(plugin.getDescriptor().id + ":open(.*)~(.*)~(.*)", function (page, id, title, img) {
	
	
	var detail_url = 'http://5.61.48.15/partner_api/film/'+id+'/details';
	var links_url = 'http://5.61.48.15/partner_api/video_links/'+id;

	
	setPageHeader(page, plugin.getDescriptor().synopsis);
	page.loading = true;
	var detail = showtime.JSONDecode(showtime.httpReq(detail_url, headers));	
	var links = showtime.JSONDecode(showtime.httpReq(links_url, headers));		 		
		
		
	 if (links.length > 0){
		
		 for (i = 0; i < links.length; i++) {		 
			 	
			 
			if(links[i].seasons){	
				var seasons = links[i].seasons;
				links_for_serials = links;
				
				page.appendItem(plugin.getDescriptor().id + ":seasons:"+img+"~"+i, "directory", {
					title: links[i].name,
					icon: img,	
					description: detail.short_story		
				});			 
			
			} else {
			 
			    var files = links[i].files;	
				
				page.appendItem(plugin.getDescriptor().id + ":types:" + showtime.JSONEncode(files) + "~" + img, 'directory', {
					title: links[i].name,
					icon: img,	
					description: detail.short_story
				});	
			}
		
		 }
		
	}
	
	
	page.loading = false;
	
});



plugin.addURI(plugin.getDescriptor().id + ":types:(.*)~(.*)", function (page, list, img) {
	setPageHeader(page, plugin.getDescriptor().synopsis);
	page.loading = true;
	list = showtime.JSONDecode(list);

	 for (i = 0; i < list.length; i++) {							
			 page.appendItem(list[i]['url'], 'directory', {
				title: list[i]['quality'],
				icon: img,
			});	
		
		 }
		 
		 page.loading = false;
	
});


plugin.addURI(plugin.getDescriptor().id + ":seasons:(.*)~(.*)", function (page, img, num) {	
		setPageHeader(page, plugin.getDescriptor().synopsis);
		page.loading = true;	
		
		var seasons = links_for_serials[num].seasons;
		
		 for (i = 0; i < seasons.length; i++) {			

			var season_name = "Сезон "+seasons[i].season;						
			page.appendItem(plugin.getDescriptor().id + ":series:" + img + "~"+num+"~"+i, 'directory', {
				title: season_name,
				icon: img,
			});
			
		}

		 
		 page.loading = false;
	
});



plugin.addURI(plugin.getDescriptor().id + ":series:(.*)~(.*)~(.*)", function (page, img, num, s) {
	setPageHeader(page, plugin.getDescriptor().synopsis);
	page.loading = true;	

	var episodes = links_for_serials[num].seasons[s].episodes;
	
	for(var index in episodes) {
		
		var val = episodes[index];
		var ep_name = 'Серия '+val.episode+": "+val.title;		
		var files = val.files;	
				
		page.appendItem(plugin.getDescriptor().id + ":types:" + showtime.JSONEncode(files) + "~" + img, 'directory', {
			title: ep_name,
			icon: img,				
		});	
		
	}

		 
	page.loading = false;
	
});


plugin.addSearcher(plugin.getDescriptor().id, logo, function (page, query) {
	page.entries = 0;
	var fromPage = 0,
	tryToSearch = true;	
	page.loading = true;
	var encoded = query;
	//var encoded = encodeURI(query);
	

	var v = showtime.httpReq("http://5.61.48.15/partner_api/list?search="+query+"&sort=news_read&page=0", headers);

	var doc = showtime.JSONDecode(v);
	
	if (doc.items.length > 0) {
			page.entries = doc.items.length;
			for (var i = 0; i < doc.items.length; i++) {
				
				 var item = doc.items[i];
				

				 page.appendItem(plugin.getDescriptor().id + ":open" + item.id +'~'+item.title+'~'+item.poster, "directory", {
					title: item.title ,
					icon: item.poster,
					id:item.id
					});
			}	
	}
	
	
	page.loading = false;
	tryToSearch = false;
	
	});

})(this);


