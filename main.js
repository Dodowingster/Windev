var button = document.getElementById("get-location-button");
button.addEventListener("click", function() {
  navigator.geolocation.getCurrentPosition(function(position) {
    var lat = position.coords.latitude;
    var lon = position.coords.longitude;

    var url = "https://en.wikipedia.org/w/api.php"; 

    var params = {
        action: "query",
        list: "geosearch",
        gscoord: lat + "|" + lon,
        gsradius: "10000",
        gslimit: "10",
        format: "json"
    };

    url = url + "?origin=*";
    Object.keys(params).forEach(function(key){url += "&" + key + "=" + params[key];});

    fetch(url)
        .then(function(response){return response.json();})
        .then(function(response) {
            var locations = response.query.geosearch;
            var locationsList = "";
            for (var place in locations) {
                locationsList += "<li>" + locations[place].title + "</li>";
            }
            var locationsDiv = document.getElementById("locations");
            locationsDiv.innerHTML = "<ul>" + locationsList + "</ul>";
        })
        .catch(function(error){console.log(error);});
  });
});
