navigator.geolocation.getCurrentPosition(function(position) {
    var lat = position.coords.latitude;
    var lon = position.coords.longitude;

    var coordinatesDiv = document.getElementById("coordinates");
    coordinatesDiv.innerHTML = "Latitude: " + lat + ", Longitude: " + lon;
  
    var url = "https://en.wikipedia.org/w/api.php"; 
  
    var params = {
        action: "query",
        prop: "coordinates",
        titles: "Wikimedia Foundation",
        format: "json"
    };
  
    url = url + "?origin=*";
    Object.keys(params).forEach(function(key){url += "&" + key + "=" + params[key];});
  
    fetch(url)
        .then(function(response){return response.json();})
        .then(function(response) {
            var pages = response.query.pages;
            for (var page in pages) {
                console.log("Latitute: " + lat);
                console.log("Longitude: " + lon);
            }
        })
        .catch(function(error){console.log(error);});
  });
  