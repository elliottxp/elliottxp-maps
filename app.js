const MAPTILER_API_KEY = "7MPdX86zVUf2NL6gNVr8";

const map = new maplibregl.Map({
    container: "map",

    style: `https://api.maptiler.com/maps/01a003b1-871c-7214-b769-c0d7dbbe5e2a/style.json?key=${MAPTILER_API_KEY}`,

    center: [0, 20],

    zoom: 1.4,

    minZoom: 1
});


/* ------------------------------
   Map controls
------------------------------ */

map.addControl(
    new maplibregl.AttributionControl({
        compact: true
    }),
    "bottom-right"
);


/* ------------------------------
   DOM elements
------------------------------ */

const placePanel =
    document.getElementById("place-panel");

const placeContent =
    document.getElementById("place-content");

const closePanel =
    document.getElementById("close-panel");

const listNavigation =
    document.getElementById("list-navigation");

const allPlacesButton =
    document.getElementById("all-places");

const resetMapButton =
    document.getElementById("reset-map");


/* ------------------------------
   Application state
------------------------------ */

let places = [];

let lists = [];

let currentList = null;


/* ------------------------------
   Load data
------------------------------ */

async function loadData() {

    const [
        placesResponse,
        listsResponse
    ] = await Promise.all([
        fetch("data/places.json"),
        fetch("data/lists.json")
    ]);


    if (!placesResponse.ok) {
        throw new Error(
            "Unable to load places.json"
        );
    }


    if (!listsResponse.ok) {
        throw new Error(
            "Unable to load lists.json"
        );
    }


    places =
        await placesResponse.json();

    lists =
        await listsResponse.json();
}


/* ------------------------------
   Lists
------------------------------ */

function createListNavigation() {

    listNavigation.innerHTML = "";


    lists.forEach((list) => {

        const button =
            document.createElement("button");


        button.type = "button";

        button.className =
            "list-button";

        button.textContent =
            list.name;


        button.addEventListener(
            "click",
            () => {
                selectList(list.id);
            }
        );


        listNavigation.appendChild(button);
    });
}


function updateActiveList() {

    const buttons =
        listNavigation.querySelectorAll(
            ".list-button"
        );


    buttons.forEach((button, index) => {

        const list = lists[index];


        button.classList.toggle(
            "is-active",
            currentList === list.id
        );
    });
}


/* ------------------------------
   Places
------------------------------ */

function getVisiblePlaces() {

    if (!currentList) {
        return places;
    }


    return places.filter((place) => {

        if (!Array.isArray(place.lists)) {
            return false;
        }


        return place.lists.includes(
            currentList
        );
    });
}


/* ------------------------------
   Featured place
------------------------------ */

function getFeaturedPlace() {

    return places.find((place) => {
        return place.featured === true;
    });
}


function panToFeaturedPlace() {

    const featuredPlace =
        getFeaturedPlace();


    if (!featuredPlace) {
        return;
    }


    map.flyTo({

        center: [
            Number(
                featuredPlace.longitude
            ),

            Number(
                featuredPlace.latitude
            )
        ],

        zoom: 3.5,

        duration: 1800
    });
}


/* ------------------------------
   GeoJSON
------------------------------ */

function createPlacesGeoJSON() {

    const visiblePlaces =
        getVisiblePlaces();


    return {

        type: "FeatureCollection",

        features:
            visiblePlaces.map((place) => {

                return {

                    type: "Feature",

                    geometry: {

                        type: "Point",

                        coordinates: [
                            Number(
                                place.longitude
                            ),

                            Number(
                                place.latitude
                            )
                        ]
                    },

                    properties: {

                        id: place.id,

                        name: place.name
                    }
                };
            })
    };
}


/* ------------------------------
   Place map layer
------------------------------ */

function createPlaceLayer() {

    map.addSource(
        "places",
        {
            type: "geojson",

            data:
                createPlacesGeoJSON()
        }
    );


    map.addLayer(
        {
            id: "place-points",

            type: "circle",

            source: "places",

            paint: {

                "circle-radius": 5,

                "circle-color": "#33312e",

                "circle-opacity": 1,

                "circle-stroke-width": 2,

                "circle-stroke-color":
                    "#f6f5ef"
            }
        }
    );
}


/* ------------------------------
   Update map places
------------------------------ */

function renderPlaces() {

    const source =
        map.getSource("places");


    if (!source) {
        return;
    }


    source.setData(
        createPlacesGeoJSON()
    );
}


/* ------------------------------
   Place interactions
------------------------------ */

function setupPlaceInteractions() {

    map.on(
        "click",
        "place-points",
        (event) => {

            const feature =
                event.features?.[0];


            if (!feature) {
                return;
            }


            const placeId =
                feature.properties.id;


            const place =
                places.find((item) => {

                    return (
                        item.id === placeId
                    );
                });


            if (place) {
                openPlace(place);
            }
        }
    );


    map.on(
        "mouseenter",
        "place-points",
        () => {

            map.getCanvas().style.cursor =
                "pointer";
        }
    );


    map.on(
        "mouseleave",
        "place-points",
        () => {

            map.getCanvas().style.cursor =
                "";
        }
    );
}


/* ------------------------------
   List selection
------------------------------ */

function selectList(listId) {

    currentList = listId;


    updateActiveList();


    renderPlaces();


    closePlace(false);


    updateUrl();
}


function showAllPlaces() {

    currentList = null;


    updateActiveList();


    renderPlaces();


    closePlace(false);


    updateUrl();
}


/* ------------------------------
   URL handling
------------------------------ */

function updateUrl() {

    const url =
        new URL(window.location.href);


    if (currentList) {

        url.searchParams.set(
            "list",
            currentList
        );

    } else {

        url.searchParams.delete(
            "list"
        );
    }


    window.history.pushState(
        {},
        "",
        url
    );
}


function updatePlaceUrl(placeId) {

    const url =
        new URL(window.location.href);


    url.searchParams.set(
        "place",
        placeId
    );


    window.history.pushState(
        {},
        "",
        url
    );
}


function loadStateFromUrl() {

    const url =
        new URL(window.location.href);


    const listId =
        url.searchParams.get("list");


    const placeId =
        url.searchParams.get("place");


    if (listId) {

        const listExists =
            lists.some((list) => {

                return list.id === listId;
            });


        if (listExists) {
            currentList = listId;
        }
    }


    return {
        placeId
    };
}


/* ------------------------------
   Place panel
------------------------------ */

function openPlace(place) {

    placeContent.innerHTML = "";


    const name =
        document.createElement("h2");


    name.className =
        "place-name";


    name.textContent =
        place.name;


    const category =
        document.createElement("div");


    category.className =
        "place-category";


    category.textContent =
        place.category;


    const address =
        document.createElement("div");


    address.className =
        "place-address";


    address.textContent =
        place.address;


    const notes =
        document.createElement("div");


    notes.className =
        "place-notes";


    notes.textContent =
        place.notes;


    placeContent.appendChild(name);

    placeContent.appendChild(category);

    placeContent.appendChild(address);

    placeContent.appendChild(notes);


    if (place.website) {

        const website =
            document.createElement("a");


        website.className =
            "place-website";


        website.href =
            place.website;


        website.target =
            "_blank";


        website.rel =
            "noopener noreferrer";


        website.textContent =
            "Visit website";


        placeContent.appendChild(
            website
        );
    }


    placePanel.classList.add(
        "is-visible"
    );


    placePanel.setAttribute(
        "aria-hidden",
        "false"
    );


    updatePlaceUrl(place.id);


    map.flyTo({

        center: [

            Number(
                place.longitude
            ),

            Number(
                place.latitude
            )
        ],

        zoom: Math.max(
            map.getZoom(),
            5
        ),

        duration: 1000
    });
}


function closePlace(
    updateBrowserUrl = true
) {

    placePanel.classList.remove(
        "is-visible"
    );


    placePanel.setAttribute(
        "aria-hidden",
        "true"
    );


    if (updateBrowserUrl) {

        const url =
            new URL(window.location.href);


        url.searchParams.delete(
            "place"
        );


        window.history.pushState(
            {},
            "",
            url
        );
    }
}


/* ------------------------------
   World reset
------------------------------ */

function resetMap() {

    closePlace();


    map.flyTo({

        center: [0, 20],

        zoom: 1.4,

        duration: 1000
    });
}


/* ------------------------------
   Initialisation
------------------------------ */

async function initialise() {

    try {

        await loadData();


        const urlState =
            loadStateFromUrl();


        createListNavigation();


        updateActiveList();


        createPlaceLayer();


        setupPlaceInteractions();


        if (urlState.placeId) {

            const place =
                places.find((item) => {

                    return (
                        item.id ===
                        urlState.placeId
                    );
                });


            if (place) {

                openPlace(place);
            }

        } else {

            panToFeaturedPlace();
        }


    } catch (error) {

        console.error(
            "Map initialisation failed:",
            error
        );
    }
}


/* ------------------------------
   Event listeners
------------------------------ */

closePanel.addEventListener(
    "click",
    () => {

        closePlace(true);
    }
);


allPlacesButton.addEventListener(
    "click",
    (event) => {

        event.preventDefault();

        showAllPlaces();
    }
);


resetMapButton.addEventListener(
    "click",
    resetMap
);


/* ------------------------------
   Browser navigation
------------------------------ */

window.addEventListener(
    "popstate",
    () => {

        window.location.reload();
    }
);


/* ------------------------------
   Start application
------------------------------ */

map.on(
    "load",
    initialise
);