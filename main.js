var button = document.getElementById("get-location-button");

function getLocation() {
  navigator.geolocation.getCurrentPosition(function(position) {
    var lat = position.coords.latitude;
    var lon = position.coords.longitude;

    function initMap() {
      const map = new google.maps.Map(document.getElementById("map-container"), {
        zoom: 15,
        disableDefaultUI: true
      });
    
      // Get user's location
      navigator.geolocation.getCurrentPosition(function(position) {
        var lat = position.coords.latitude;
        var lon = position.coords.longitude;
    
        // Create a marker for the user's location
        var marker = new google.maps.Marker({
          position: { lat: lat, lng: lon },
          map: map,
          title: "Your Location"
        });
    
        // Center the map on the user's location
        map.setCenter({ lat: lat, lng: lon });
      });
    }
    
    
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
        for (var place in locations) {
          var locationUrl =
            "https://en.wikipedia.org/w/api.php?origin=*&action=query&format=json&prop=extracts&exintro=&explaintext=&titles=" +
            encodeURIComponent(locations[place].title);
          fetch(locationUrl)
            .then(function(response) {
              return response.json();
            })
            .then(function(response) {
              var page =
                response.query.pages[Object.keys(response.query.pages)[0]];
              locationsList += `
              <li>
                ${page.title} - 
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
        }
      })
      .catch(function(error) {
        console.log(error);
      });

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

