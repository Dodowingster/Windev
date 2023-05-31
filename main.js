var button = document.getElementById("get-location-button");

function getLocation() {
  navigator.geolocation.getCurrentPosition(function(position) {
    var userLat = position.coords.latitude;
    var userLon = position.coords.longitude;

    function initMap() {
      const map = new google.maps.Map(document.getElementById("map-container"), {
        zoom: 15,
        disableDefaultUI: true
      });

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
        format: "json"
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
          var locationsList = "";
          var fetchCount = 0; // Track the number of fetch requests completed
          for (var i = 0; i < locations.length; i++) {
            var location = locations[i];
            var locationUrl =
              "https://en.wikipedia.org/w/api.php?origin=*&action=query&format=json&prop=extracts&exintro=&explaintext=&titles=" +
              encodeURIComponent(location.title);

            // Using IIFE to capture the values of location.lat and location.lon
            (function(locationLat, locationLon) {
              fetch(locationUrl)
                .then(function(response) {
                  return response.json();
                })
                .then(function(response) {
                  var page =
                    response.query.pages[Object.keys(response.query.pages)[0]];

                  var distance = getDistance(userLat, userLon, locationLat, locationLon);

                  locationsList += `
                    <li>
                      ${page.title} - Distance: ${distance.toFixed(2)} km
                      <div class="extract-container" style="display:none">${page.extract}</div>
                      <button class="reveal-button">Reveal Details</button>
                    </li>
                  `;

                  fetchCount++; // Increment the fetch count

                  if (fetchCount === locations.length) {
                    // Call addRevealButtonListeners() when all fetch requests are completed
                    var locationsDiv = document.getElementById("locations");
                    locationsDiv.innerHTML = "<ul>" + locationsList + "</ul>";
                    addRevealButtonListeners();
                  }
                })
                .catch(function(error) {
                  console.log(error);
                });
            })(location.lat, location.lon);
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
          var extractContainer = button.previousElementSibling;
          var speechButton = button.speechButton;

          if (currentlyDisplayedExtract === extractContainer) {
            // Hide the currently displayed extract
            extractContainer.style.display = "none";

            if (speechButton) {
              // Remove the speech button if it exists
              speechButton.parentNode.removeChild(speechButton);
              delete button.speechButton;
            }

            // Update the button text
            button.textContent = "Reveal Details";
            currentlyDisplayedExtract = null;
          } else {
            if (currentlyDisplayedExtract) {
              // Hide the previously displayed extract
              currentlyDisplayedExtract.style.display = "none";

              // Restore the previous button text
              var previousButton = currentlyDisplayedExtract.nextElementSibling;
              previousButton.textContent = "Reveal Details";

              // Remove the speech button from the previous location if it exists
              var previousSpeechButton = previousButton.speechButton;
              if (previousSpeechButton) {
                previousSpeechButton.parentNode.removeChild(previousSpeechButton);
                delete previousButton.speechButton;
              }
            }

            // Show the clicked extract
            extractContainer.style.display = "block";
            button.textContent = "Hide Details";

            // Add speech buttons if they don't exist
            if (!speechButton) {
              speechButton = document.createElement("div");
              speechButton.innerHTML =
                '<button class="speak-button">Speak</button><button class="stop-button">Stop</button>';
              button.parentNode.appendChild(speechButton);
              button.speechButton = speechButton;

              // Set up the speech synthesis API
              var synth = window.speechSynthesis;
              speechButton.addEventListener("click", function(event) {
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

    initMap();
  });
}

button.addEventListener("click", getLocation);
window.addEventListener("load", getLocation);
