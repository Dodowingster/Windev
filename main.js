var button = document.getElementById("get-location-button");
var directionsService = new google.maps.DirectionsService();
var directionsRenderer = new google.maps.DirectionsRenderer({
  polylineOptions: {
    strokeColor: "blue",
    strokeWeight: 8,
    strokeOpacity: 0.8
  }
});

function getLocation() {
  navigator.geolocation.getCurrentPosition(function(position) {
    var userLat = position.coords.latitude;
    var userLon = position.coords.longitude;
    
    function initMap() {
      const map = new google.maps.Map(document.getElementById("map-container"), {
        zoom: 15,
        disableDefaultUI: true
      });

      directionsRenderer.setMap(map);

      // Get user's location
      var userMarker = new google.maps.Marker({
        position: { lat: userLat, lng: userLon },
        map: map,
        title: "Your Location"
      });

      // Center the map on the user's location
      map.setCenter({ lat: userLat, lng: userLon });

      var url = "https://en.wikipedia.org/w/api.php";
      var params = {
        action: "query",
        list: "geosearch",
        gscoord: userLat + "|" + userLon,
        gsradius: "10000",
        gslimit: "10",
        format: "json",
      };

      url = url + "?origin=*";
      Object.keys(params).forEach(function(key) {
        url += "&" + key + "=" + params[key];
      });

      fetch(url)
        .then(function(response) {
          return response.json();
        })
        .then(function(response) {
          var locations = response.query.geosearch;
          var locationsDiv = document.getElementById("locations");
          locationsDiv.innerHTML = ""; // Clear previous locations

          var fetchCount = 0; // Track the number of fetch requests completed
          var delay = 200; // Delay in milliseconds before each location slides in
          var delayIncrement = 50; // Incremental delay between each location

          for (var i = 0; i < locations.length; i++) {
            var location = locations[i];
            var locationUrl =
              "https://en.wikipedia.org/w/api.php?origin=*&action=query&format=json&prop=extracts&exintro=&explaintext=&titles=" +
              encodeURIComponent(location.title);

            // Using IIFE to capture the values of location.lat and location.lon
            (function(locationLat, locationLon, index) {
              fetch(locationUrl)
                .then(function(response) {
                  return response.json();
                })
                .then(function(response) {
                  var page =
                    response.query.pages[Object.keys(response.query.pages)[0]];

                  var distance = getDistance(userLat, userLon, locationLat, locationLon);

                  var listItem = document.createElement("li");
                  listItem.className = "slide-in";
                  listItem.innerHTML = `
                  ${page.title} ~ <span class="distance-prefix">Distance:</span>
                  <span class="distance-value" id="distanceValue">${distance.toFixed(2)}</span>
                  <span class="distance-suffix">km</span>
                  <div class="extract-container slide-down" style="display:none">${page.extract}</div>
                  <br>
                  <button class="reveal-button">Reveal Details</button>
                  <br>
                  <br>
                  <button class="set-destination-button">Set Destination</button>
                  <br>
                  <br>
                  <a href="https://en.wikipedia.org/wiki/${encodeURIComponent(locations[index].title)}" target="_blank">Read More</a>
                  `;

                  listItem.setAttribute("data-lat", locationLat);
                  listItem.setAttribute("data-lon", locationLon);

                  setTimeout(function() {
                    locationsDiv.appendChild(listItem);

                    if (index === locations.length - 1) {
                      // Call addRevealButtonListeners() when all locations are appended
                      addRevealButtonListeners();
                      addSetDestinationButtonListeners();
                    }
                  }, delay + index * delayIncrement);

                  fetchCount++; // Increment the fetch count
                });
            })(location.lat, location.lon, i); // Pass location.lat, location.lon, and index to the IIFE
          }
        })
        .catch(function(error) {
          console.log(error);
        });
    }

    function getDistance(lat1, lon1, lat2, lon2) {
      const R = 6371; // Radius of the earth in kilometers
      const dLat = deg2rad(lat2 - lat1);
      const dLon = deg2rad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      return distance;
    }

    function deg2rad(deg) {
      return deg * (Math.PI / 180);
    }

    var currentlyDisplayedExtract = null; // Keep track of the currently displayed extract

    function addRevealButtonListeners() {
      var revealButtons = document.querySelectorAll(".reveal-button");
      revealButtons.forEach(function(button) {
        button.addEventListener("click", function() {
          var listItem = button.parentNode; // Get the parent <li> element
          var extractContainer = listItem.querySelector(".extract-container");
          var link = listItem.querySelector("a");

          extractContainer.classList.toggle("show");
          link.classList.toggle("show-link");

          if (currentlyDisplayedExtract === extractContainer) {
            // Hide the currently displayed extract
            extractContainer.style.display = "none";

            // Remove the speech button if it exists
            var speechButton = button.parentNode.querySelector(".speech-buttons");
            if (speechButton) {
              speechButton.parentNode.removeChild(speechButton);
            }

            // Update the button text
            button.textContent = "Reveal Details";
            currentlyDisplayedExtract = null;
          } else {
            if (currentlyDisplayedExtract) {
              // Hide the previously displayed extract
              currentlyDisplayedExtract.style.display = "none";

              // Restore the previous button text
              var previousButton = currentlyDisplayedExtract.parentNode.querySelector(".reveal-button");
              previousButton.textContent = "Reveal Details";

              // Remove the speech button from the previous location if it exists
              var previousSpeechButton = previousButton.parentNode.querySelector(".speech-buttons");
              if (previousSpeechButton) {
                previousSpeechButton.parentNode.removeChild(previousSpeechButton);
              }
            }

            // Show the clicked extract
            extractContainer.style.display = "block";
            button.textContent = "Hide Details";

            // Add speech buttons if they don't exist
            var speechButtons = listItem.querySelector(".speech-buttons");
            if (!speechButtons) {
              speechButtons = document.createElement("div");
              speechButtons.className = "speech-buttons";
              speechButtons.innerHTML =
                '<button class="speak-button">Speak</button><button class="stop-button">Stop</button>';
              button.parentNode.appendChild(speechButtons);

              // Set up the speech synthesis API
              var synth = window.speechSynthesis;
              speechButtons.addEventListener("click", function(event) {
                var extract = extractContainer.textContent;
                if (event.target.classList.contains("speak-button")) {
                  var utterance = new SpeechSynthesisUtterance(extract);
                  synth.speak(utterance);
                } else if (event.target.classList.contains("stop-button")) {
                  synth.cancel();
                }
              });
            }

            currentlyDisplayedExtract = extractContainer; // Update the currently displayed extract
          }
        });
      });
    }

    function addSetDestinationButtonListeners() {
      var setDestinationButtons = document.querySelectorAll(".set-destination-button");
      setDestinationButtons.forEach(function(button) {
        button.addEventListener("click", function() {
          var listItem = button.parentNode; // Get the parent <li> element
          var lat = listItem.getAttribute("data-lat");
          var lon = listItem.getAttribute("data-lon");

          var destinationUrl = "https://www.google.com/maps/dir/?api=1&destination=" + lat + "," + lon;
          //window.open(destinationUrl);
          
          calculateAndDisplayRoute(userLat, userLon, parseFloat(lat), parseFloat(lon));
          window.scrollTo({
            top: 0,
            behavior: "smooth"
          })
        });
      });
    }

    function calculateAndDisplayRoute(startLat, startLon, endLat, endLon) {
      directionsService.route(
        {
          origin: { lat: startLat, lng: startLon },
          destination: { lat: endLat, lng: endLon },
          travelMode: "DRIVING"
        },
        function(response, status) {
          if (status === "OK") {
            directionsRenderer.setDirections(response);
          } else {
            window.alert("Directions request failed due to " + status);
          }
        }
      );
    }

    initMap();
  });
}

button.addEventListener("click", getLocation);
