var button = document.getElementById("get-location-button");
var directionsService = new google.maps.DirectionsService();
var directionsRenderer = new google.maps.DirectionsRenderer({
  polylineOptions: {
    strokeColor: "blue",
    strokeWeight: 8,
    strokeOpacity: 0.8
  }
});

// Check if local storage is supported
function isLocalStorageSupported() {
  try {
    var testKey = "test";
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

// Save location to local storage
function saveLocation(title, lat, lon) {
  if (isLocalStorageSupported()) {
    var location = {
      title: title,
      lat: lat,
      lon: lon
    };

    var savedLocations = localStorage.getItem("savedLocations");
    if (savedLocations) {
      var parsedLocations = JSON.parse(savedLocations);

      // Check if the location already exists
      if (parsedLocations.some(function(savedLocation) {
        return savedLocation.title === location.title && savedLocation.lat === location.lat && savedLocation.lon === location.lon;
      })) {
        alert("Location has already been saved!");
        return;
      }

      parsedLocations.push(location);
      localStorage.setItem("savedLocations", JSON.stringify(parsedLocations));
    } else {
      localStorage.setItem("savedLocations", JSON.stringify([location]));
    }

    // Refresh the saved locations list
    displaySavedLocations();
  } else {
    console.log("Local storage is not supported.");
  }
}

function removeLocation(location) {
  if (isLocalStorageSupported()) {
    var savedLocations = localStorage.getItem("savedLocations");
    if (savedLocations) {
      var parsedLocations = JSON.parse(savedLocations);
      var updatedLocations = parsedLocations.filter(function(savedLocation) {
        return savedLocation.title !== location.title;
      });
      localStorage.setItem("savedLocations", JSON.stringify(updatedLocations));

      // Refresh the saved locations list
      displaySavedLocations();
    }
  } else {
    console.log("Local storage is not supported.");
  }
}


function displaySavedLocations() {
  if (isLocalStorageSupported()) {
    var savedLocations = localStorage.getItem("savedLocations");
    var savedLocationsList = document.getElementById("saved-locations-list");

    if (savedLocations && savedLocationsList) {
      var parsedLocations = JSON.parse(savedLocations);
      savedLocationsList.innerHTML = ""; // Clear previous saved locations

      parsedLocations.forEach(function(location) {
        var listItem = document.createElement("li");
        listItem.textContent = location.title;

        var deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.classList.add("delete-button");
        deleteButton.addEventListener("click", function() {
          removeLocation(location);
        });

        var readMoreButton = document.createElement("button");
        readMoreButton.textContent = "Read More";
        readMoreButton.classList.add("read-more-button");
        readMoreButton.addEventListener("click", function() {
          openWikipediaPage(location.title);
        });

        listItem.appendChild(deleteButton);
        listItem.appendChild(readMoreButton);

        savedLocationsList.appendChild(listItem);
      });
    }
  } else {
    console.log("Local storage is not supported.");
  }

  // Check if any saved locations are present, if not, show the save button
  if (savedLocationsList && savedLocationsList.childElementCount === 0) {
    var noSavedLocations = document.createElement("p");
    noSavedLocations.textContent = "No saved locations found.";
    savedLocationsList.appendChild(noSavedLocations);
  }
}

function openWikipediaPage(title) {
  var url = "https://en.wikipedia.org/wiki/" + encodeURIComponent(title);
  window.open(url, "_blank", "width=600,height=400");
}


function isLocationSaved(title) {
  if (isLocalStorageSupported()) {
    var savedLocations = localStorage.getItem("savedLocations");
    if (savedLocations) {
      var parsedLocations = JSON.parse(savedLocations);
      return parsedLocations.some(function(savedLocation) {
        return savedLocation.title === title;
      });
    }
  }
  return false;
}

// Load saved locations on page load
window.addEventListener("DOMContentLoaded", function() {
  displaySavedLocations();
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
                  <span class="page-title">${page.title}</span>
                  <br>
                  <span class="distance-prefix">Distance:</span>
                  <span class="distance-value" id="distanceValue">${distance.toFixed(2)}</span>
                  <span class="distance-suffix">Km</span>
                  <div class="extract-container slide-down" style="display:none">${page.extract}</div>
                  <br>
                  <br>
                  <button class="reveal-button">Reveal Details</button>
                  <br>
                  <br>
                  <button class="set-destination-button">Set Destination</button>
                  <br>
                  <br>
                  <a href="https://en.wikipedia.org/wiki/${encodeURIComponent(locations[index].title)}" target="_blank">Go To Wiki</a>
                  <br>
                  <br>
                  <button class="save-location-button">Save Location</button>
                  `;

                  listItem.setAttribute("data-lat", locationLat);
                  listItem.setAttribute("data-lon", locationLon);

                  setTimeout(function() {
                    locationsDiv.appendChild(listItem);

                    if (index === locations.length - 1) {
                      // Call addRevealButtonListeners() when all locations are appended
                      addRevealButtonListeners();
                      addSetDestinationButtonListeners();
                      addSaveLocationButtonListeners();
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

    function addSaveLocationButtonListeners() {
      var saveLocationButtons = document.querySelectorAll(".save-location-button");
      saveLocationButtons.forEach(function(button) {
        var listItem = button.parentNode; // Get the parent <li> element
        var pageTitleElement = listItem.querySelector(".page-title");
        
        if (pageTitleElement) {
          var title = pageTitleElement.textContent;

          button.addEventListener("click", function() {
            var lat = listItem.getAttribute("data-lat");
            var lon = listItem.getAttribute("data-lon");
    
            saveLocation(title, lat, lon);
          });
        }
      });
    }
    

    initMap();
  });
}

// Display the route between the user's location and the selected destination
function calculateAndDisplayRoute(userLat, userLon, destinationLat, destinationLon) {
  var start = new google.maps.LatLng(userLat, userLon);
  var end = new google.maps.LatLng(destinationLat, destinationLon);

  directionsService.route(
    {
      origin: start,
      destination: end,
      travelMode: google.maps.TravelMode.WALKING
    },
    function(response, status) {
      if (status === google.maps.DirectionsStatus.OK) {
        directionsRenderer.setDirections(response);
      } else {
        window.alert("Directions request failed due to " + status);
      }
    }
  );
}

button.addEventListener("click", getLocation);
