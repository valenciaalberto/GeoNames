//////////////////maximum rows allowed by geoNames
var maxRows = 500;
////////////////from this magnitude we are going to try to find the top 10 magnitudes
var minMagnitude = 7.5;

////////////////Tem and final array for top Earthquakes
var tempErq = [];
var largestErq = [];

var listB = "";

function initMap() {
  var map = new google.maps.Map(document.getElementById('map'), {
          center: {lat: 23.6618727, lng: -102.3314144},
          zoom: 5,
          mapTypeId: 'roadmap'
        });
        getTopErq();

        // Create the search box and link it to the UI element.
        var input = document.getElementById('searchPlace');
        var searchBox = new google.maps.places.SearchBox(input);
        //map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

        // Bias the SearchBox results towards current map's viewport.
        map.addListener('bounds_changed', function() {
          searchBox.setBounds(map.getBounds());
        });

        var markers = [];
        // Listen for the event fired when the user selects a prediction and retrieve
        // more details for that place.
        searchBox.addListener('places_changed', function() {
          var places = searchBox.getPlaces();

          if (places.length == 0) {
            return;
          }

          // Clear out the old markers.
          markers.forEach(function(marker) {
            marker.setMap(null);
          });
          markers = [];


          // For each place, get the icon, name and location.
          var bounds = new google.maps.LatLngBounds();
          places.forEach(function(place) {
            if (!place.geometry) {
              console.log("Returned place contains no geometry");
              return;
            }

            if (place.geometry.viewport) {
              // Only geocodes have viewport.
              getErq(map, markers, place.geometry.viewport);
              var erqLocation = bounds.union(place.geometry.viewport);
              
              //getErq(erqLocationN, erqLocationS);
            } else {
              bounds.extend(place.geometry.location);
            }
          });
          map.fitBounds(bounds);
        });

}

// Sets the map on all markers in the array.
  function setMapOnAll(map) {
        for (var i = 0; i < markers.length; i++) {
          markers[i].setMap(map);
        }
      }

  // Removes the markers from the map, but keeps them in the array.
  function clearMarkers() {
    setMapOnAll(null);
  }

  // Deletes all markers in the array by removing references to them.
  function deleteMarkers() {
    clearMarkers();
    markers = [];
  }


function addMarker(map, markers, latlng, msg, pos) {

  ////////////creating a marking on the map
  markers.push(new google.maps.Marker({
    position: latlng,
    map: map,
    icon: 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png'
  }));

  ///////////creating a custom Infowindow for each marker
  var infoWindow = new google.maps.InfoWindow({
    content: '<h3>Details</h3><b>Position</b>'
    +'<p>Latitude: '+latlng.lat+', Longitude: '+latlng.lng+'</p>'
    +'<p>Date: '+msg.date+'<br> </p><p>Depth: '+msg.depth+'</p><p>Magnitude: '+msg.magnitude
    +'</p>'
  });

  ///////////// addding addlistener for showing and hiding the info Label
  markers[pos].addListener('mouseover', function(){
    infoWindow.open(map, markers[pos]);
  });

  markers[pos].addListener('mouseout', function(){
    infoWindow.close(map, markers[pos]);
  });
  
}
////////////////////Ajax function for getting Info from Earthquakes API
function getErq(map, markers, locViewPort) {

    var neLocation = locViewPort.getNorthEast();
    var swLocation = locViewPort.getSouthWest();
    var north = (neLocation.lat());
    var east = (neLocation.lng());
    var south = (swLocation.lat());
    var west = (swLocation.lng());
    
   $.ajax({        
        type: "GET",
        url: "http://api.geonames.org/earthquakesJSON?",
        data: "north="+north+"&south="+south+"&east="+east+"&west="+west+"&date="+getDate()+"&username=josval&maxRows=10",
        dataType:"json",
        success: function(erqPlaces) {
          var errMsg = document.getElementById('msgErr');

          //////////Msg info
          if (erqPlaces.earthquakes.length == 0) {
            errMsg.innerHTML = "No earthquakes found in this zone";
          }else{
            errMsg.innerHTML = "";
          }

          var pos = 0;
          erqPlaces.earthquakes.forEach(function(place){
            var position = {
              lat: place.lat,
              lng: place.lng
            }
            var msg = {
              date: place.datetime,
              depth: place.depth,
              magnitude : place.magnitude
            }

            addMarker(map, markers, position, msg, pos);

            pos++

            
          });
        },
        error: function(){
            alert("An error has occurred trying to connect");
        }
    });
 }

//////////////////Custom Function for getting the last earthquakes from the actual date
function getDate(){
    var dateObj = new Date();
    var month = dateObj.getUTCMonth() + 1; //months from 1-12
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();

    newdate = year + "-" + month + "-" + day;

    return newdate;
  }

//////////////////Custom function for sorting data depending on magnitude
function sortErq(erqPlaces){
  var dateObjYr = new Date().getUTCFullYear();
  var dateObjMt = new Date().getUTCMonth()+1;
  var aux;
  erqPlaces.earthquakes.forEach(function(place){
    ////////////Sorting places by date in the past 12 months
    aux = new Date(place.datetime).getUTCFullYear(); 
    auxMt = new Date(place.datetime).getUTCMonth()+1; 
    if (parseInt(dateObjYr) - 1 <= parseInt(aux)) {
      if (parseInt(dateObjMt) <= parseInt(auxMt)) {
        tempErq.push(place);
      }
    }
  });
  tempErq.sort(function(a, b){return b.magnitude-a.magnitude});
 }

////////////////////Ajax function for getting Info from Earthquakes API
function getTopErq(){

  $.ajax({        
        type: "GET",
        url: "http://api.geonames.org/earthquakesJSON?",
        data: "north=90&south=-90&east=180&west=-180&minMagnitude="+minMagnitude+"&maxRows="+maxRows+"&date="+getDate()+"&username=josval",
        dataType:"json",
        success: function(erqPlaces) {

          //////Knowing that the info it's not sorted 
          /////We should call a sort function
          sortErq(erqPlaces);

          /////Order the top Earthquakes
          for (var x = 0; x < 10; x++) {

            largestErq[x] = tempErq[x];
            //console.log(largestErq[x]);
            listB += "<tr scope='row'><td>"+(x+1)+"</td><td>"+largestErq[x].magnitude+"</td>";
            listB += "<td>"+largestErq[x].lat+"</td>";
            listB += "<td>"+largestErq[x].lng+"</td>";
            listB += "<td>"+largestErq[x].depth+"</td>";
            listB += "<td>"+largestErq[x].datetime+"</td></tr>";
          }
          document.getElementById('setBodyT').innerHTML = listB;
                
        },
        error: function(){
            alert("An error has occurred trying to connect");
        }
    });

 }
