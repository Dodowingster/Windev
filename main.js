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
        var locationUrl = "https://en.wikipedia.org/w/api.php?origin=*&action=query&format=json&prop=extracts&exintro=&explaintext=&titles=" + encodeURIComponent(locations[place].title);
        fetch(locationUrl)
          .then(function(response){return response.json();})
          .then(function(response) {
            var page = response.query.pages[Object.keys(response.query.pages)[0]];
            locationsList += `
              <li>
                ${page.title} - 
                <div class="extract-container" style="display:none">${page.extract}</div>
                <button class="reveal-button">Reveal Details</button>
              </li>
            `;
            var locationsDiv = document.getElementById("locations");
            locationsDiv.innerHTML = "<ul>" + locationsList + "</ul>";
  
            // Add event listeners to reveal buttons
            addRevealButtonListeners();
          })
          .catch(function(error){console.log(error);});
      }
    })
    .catch(function(error){console.log(error);});
  
    function addRevealButtonListeners() {
        var revealButtons = document.querySelectorAll('.reveal-button');
        revealButtons.forEach(function(button) {
          button.addEventListener('click', function() {
            var extractContainer = button.previousElementSibling;
            if (extractContainer.style.display === 'block') {
              extractContainer.style.display = 'none';
              button.textContent = 'Reveal Details';
              if (button.speechButton) {
                button.speechButton.parentNode.removeChild(button.speechButton);
                delete button.speechButton;
              }
            } else {
              extractContainer.style.display = 'block';
              button.textContent = 'Hide Details';

              // Create the "speak" button
              var speakButton = document.createElement('button');
              speakButton.classList.add('speak-button');
              speakButton.textContent = 'Play';

              // Create the "stop" button
              var stopButton = document.createElement('button');
              stopButton.classList.add('stop-button');
              stopButton.textContent = 'Stop';

              // Add the buttons to the DOM
              extractContainer.parentNode.appendChild(speakButton);
              extractContainer.parentNode.appendChild(stopButton);

              // Set up the speech synthesis API
              var synth = window.speechSynthesis;
              var voices = synth.getVoices();

              speakButton.addEventListener('click', function() {
                var extract = extractContainer.textContent;
                var utterance = new SpeechSynthesisUtterance(extract);
                synth.speak(utterance);
              });

              stopButton.addEventListener('click', function() {
                synth.cancel();
              });
            }
          });
        });
      }
    });
}); 
