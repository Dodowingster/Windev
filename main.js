var button = document.getElementById("get-location-button");
button.addEventListener("click", function() {
  navigator.geolocation.getCurrentPosition(function(position) {
    var lat = position.coords.latitude;
    var lon = position.coords.longitude;

    var url = "https://en.wikipedia.org/w/api.php"; 

    var params = {
        action: "query",
        list: "geosearch",
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
          var locationUrl = "https://en.wikipedia.org/w/api.php?origin=*&action=query&format=json&prop=extracts&exintro=&explaintext=&titles=" + encodeURIComponent(locations[place].title);
          fetch(locationUrl)
            .then(function(response){return response.json();})
            .then(function(response) {
              var page = response.query.pages[Object.keys(response.query.pages)[0]];
              locationsList += `
                <li>
                  ${page.title} - 
                  <div class="extract-container">${page.extract}</div>
                </li>
              `;
              var locationsDiv = document.getElementById("locations");
              locationsDiv.innerHTML = "<ul>" + locationsList + "</ul>";
            })
            .catch(function(error){console.log(error);});
        }
      })
      .catch(function(error){console.log(error);});
    
    // Add event listener for window load
    window.addEventListener('load', function() {
      // Retrieve user's geolocation
      navigator.geolocation.getCurrentPosition(function(position) {
        var lat = position.coords.latitude;
        var lon = position.coords.longitude;
    
        params.gscoord = lat + "|" + lon;
    
        fetch(url)
          .then(function(response){return response.json();})
          .then(function(response) {
            var locations = response.query.geosearch;
            var locationsList = "";
            for (var place in locations) {
              var locationUrl = "https://en.wikipedia.org/w/api.php?origin=*&action=query&format=json&prop=extracts&exintro=&explaintext=&titles=" + encodeURIComponent(locations[place].title);
              fetch(locationUrl)
                .then(function(response){return response.json();})
                .then(function(response) {
                  var page = response.query.pages[Object.keys(response.query.pages)[0]];
                  locationsList += `
                    <li>
                      ${page.title} - 
                      <div class="extract-container">${page.extract}</div>
                    </li>
                  `;
                  var locationsDiv = document.getElementById("locations");
                  locationsDiv.innerHTML = "<ul>" + locationsList + "</ul>";
                })
                .catch(function(error){console.log(error);});
            }
          })
          .catch(function(error){console.log(error);});
      });
    });
    
    // Add event listener for scrolling
    window.addEventListener('scroll', function() {
      // Check if user has scrolled to the bottom of the page
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
        // Load more locations
        // Add code to fetch and display additional locations here
      }
    });
    
    });
}); 