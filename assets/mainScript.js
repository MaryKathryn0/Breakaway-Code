//#region Variable Declaration
var googleAPI = "AIzaSyBQzrf9jwhfQltXdobXsZKttRNHZeURN34";
let map;
let service;
let infowindow;
var lat = 0;
var long = 0;
var zipCode = 0;
var search = "";
var searchFor = "";
let markers = [];

var activeBTN = $("#active");
var entertainBTN = $("#entertain");
var foodBTN = $("#wineDine");
var resultStorage = $(".resultStorage");

//#endregion

//#region Function Definitions

// reverse lookup for lat/long of address or zipcode user gives the application
function geoCode(search) {
    search = $("#searchLocation").val();
    // console.log("in geoCode, search for: " + search);
    queryURL = `https://maps.googleapis.com/maps/api/geocode/json?address=${search}&key=${googleAPI}`;
    $.ajax({
        url: queryURL,
        method: "GET"
    }).then(function (getGeo) {
        // console.log(getGeo);
        // converts result getGeo into variable lat/long for use elsewhere
        lat = getGeo.results[0].geometry.location.lat;
        long = getGeo.results[0].geometry.location.lng;
        var tempStorage = getGeo.results[0].formatted_address.split(" ");
        zipCode = tempStorage[2].slice(0, -1);
        // console.log(zipCode);
        // console.log("Coords: " + lat + ", " + long);
        // calls map to be displayed
        if (searchFor == "Entertainment") {
            getEvents();
        }
        else {
            initMap(lat, long);
        }
    })
}

// Displays map based on the getGeo result from the function geoCode
function initMap(lat, long) {
    // deletes anything to be displayed above the map
    $(".bottom").empty();
    // Appens a map element and search box to the resultStorage to display a map and searchbox inputs
    var element = $(`
        <div class="row">
            <div class="col s12">
                <p>Click the result search bar and tap the text again to perform the search</p>
                <input id="pac-input" class="controls" type="text" placeholder="Search For..."/>
                <div id = 'map' style = 'width: 600px; height: 500px;'></div>
            </div>
        </div>
        <div class="row">
            <div class="col s12 resultsList" id="events"></div>
        </div>
    `);
    resultStorage.append(element);

    const myLocation = new google.maps.LatLng(lat, long);
    infowindow = new google.maps.InfoWindow();
    map = new google.maps.Map(document.getElementById("map"), {
        center: myLocation,
        zoom: 15,
    });

    // searchType();
    //#region OldCode
    // Displays marker on current location
    var marker = new google.maps.Marker({ position: myLocation, map: map });

    const input = document.getElementById("pac-input");
    const searchBox = new google.maps.places.SearchBox(input);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
    map.addListener("bounds_changed", () => {
        searchBox.setBounds(map.getBounds());
    })
    searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();

        if (places.length == 0) {
            return;
        }
        console.log(places);
        // for loop printing out each result
        $(".resultsList").empty();
        for (var i = 0; i < places.length; i++) {
            // console.log(i);
            if (places[i].business_status == "OPERATIONAL") {
                var element = $(`
                    <div><strong>${places[i].name}</strong></div>
                    <address>${places[i].formatted_address}</address>
                `)
                $(".resultsList").append(element);
            }
        }
        markers.forEach((marker) => {
            marker.setMap(null);
        });
        markers = [];
        const bounds = new google.maps.LatLngBounds();
        places.forEach((place) => {
            if (!place.geometry) {
                console.log("Returned place contains no geometry");
                return;
            }
            const icon = {
                url: place.icon,
                size: new google.maps.Size(71, 71),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(17, 34),
                scaledSize: new google.maps.Size(25, 25)
            };
            markers.push(
                new google.maps.Marker({
                    map,
                    icon,
                    title: place.name,
                    position: place.geometry.location
                })
            )
            if (place.geometry.viewport) {
                bounds.union(place.geometry.viewport);
            }
            else {
                bounds.extend(place.geometry.location);
            }
        })
        map.fitBounds(bounds);
    });
    // console.log(searchFor);
    $("#pac-input").val(searchFor);
    //#endregion
}

// creates a marker on each result created from the searchArea function
function createMarker(place) {
    const marker = new google.maps.Marker({
        map,
        position: place.geometry.location
    });
    google.maps.event.addListener(marker, "click", () => {
        infowindow.setContent(place.name);
        infowindow.open(map);
    })
}

function selectionBtn() {
    // compares which of the 3 buttons were selected, then hides the two NOT selected
    if ($(this).attr("id") == "active") {
        entertainBTN.addClass("hide");
        foodBTN.addClass("hide");
        // hard coding of search selection
        searchFor = "Parks";
        // call to allow the user to input an address or zipcode
        addressEnter();
    }
    else if ($(this).attr("id") == "entertain") {
        activeBTN.addClass("hide");
        foodBTN.addClass("hide");
        // hard coding of search selection
        searchFor = "Entertainment";
        // will use TicketMaster API
        addressEnter();
    }
    else {
        activeBTN.addClass("hide");
        entertainBTN.addClass("hide");
        // hard coding of search selectioFn
        searchFor = "Restaraunts";
        addressEnter();
    }
}

function addressEnter() {
    // Generated element containing a text input for zip/address and a search button
    // search button to be targeted later
    var element = $(`
        <div class="row">
            <div class="col l3 m6 s12">
                <div class="valign-center">
                    <input type="text" id="searchLocation" placeholder="Enter your address or Zipcode">
                    <button class="waves-effect waves-light btn-small" id="searchBTN">
                    <i class="small material-icons">search</i></button>
                </div>
            </div>   
        </div>    
    `);
    $(".bottom").append(element);
    // console.log("elements made");
    $("#searchBTN").one("click", geoCode);
}

function getEvents() {
    var APIKey = "AGUitf4l225OIMq7fGj5l5i6EKPcppiE";
    // var queryURL = "https://app.ticketmaster.com/discovery/v2/events.json?size=20&postalCode=" + zipCode + "&apikey=" + APIKey;
    var queryURL = `https://app.ticketmaster.com/discovery/v2/events.json?size=10&postalCode=${zipCode}&apikey=${APIKey}`;
    // var queryURL = "https://app.ticketmaster.com/discovery/v2/events.json?size=10&postalCode=" + zipCode + "&apikey=" + APIKey;
    // then make AJAX call
    $.ajax({
        type: "GET",
        url: queryURL,
        async: true,
        dataType: "json",
        success: function (results) {

            console.log(results);
            if (results.page.totalElements == 0 || results.page.totalPages == 0) {
                console.log("No events");
            }
            else {
                initMap(lat, long);
                var events = results._embedded.events;
                console.log(events);
                // Deleting the event buttons prior to adding new event buttons
                // (this is necessary otherwise we will have repeat buttons)
                $(".resultsList").empty();
                // Looping through the array of events
                for (var i = 0; i < events.length; i++) {
                    var eventAddress = events[i]._embedded.venues[0].address.line1 + ", " + events[i]._embedded.venues[0].city.name + ", " + events[i]._embedded.venues[0].postalCode;
                    var element = $(`
                            <div><strong>${events[i].name}</strong></div>
                            <address>${eventAddress}</address>
                        `);
                    $(".resultsList").append(element);
                }
            }
        },
        error: function () {
            console.log("Error");
        }
    });
};
//#endregion

//#region Event Listeners
$(document).one("click", "button", selectionBtn);
//#endregion