const MAPTILER_API_KEY = "6wr7ktK4OkJWyKMlhoSb";

const map = new maplibregl.Map({
    container: "map",

    style: `https://api.maptiler.com/maps/streets-v4/style.json?key=${MAPTILER_API_KEY}`,

    center: [0, 20],

    zoom: 1.4,

    minZoom: 1
});


const placePanel = document.getElementById("place-panel");
const placeContent = document.getElementById("place-content");
const closePanel = document.getElementById("close-panel");
const listNavigation = document.getElementById("list-navigation");
const allPlacesButton = document.getElementById("all-places");


let places = [];
let lists = [];
let currentList = null;
let markers = [];


/* ------------------------------
   Load data
------------------------------ */

async function loadData() {

    const [placesResponse, listsResponse] = await Promise.all([
        fetch("data/places.json"),
        fetch("data/lists.json")
    ]);

    if (!placesResponse.ok) {
        throw new Error("Unable to load places.json");
    }

    if (!listsResponse.ok) {
        throw new Error("Unable to load lists.json");
    }

    places = await placesResponse.json();
    lists = await listsResponse.json();
}


/* ------------------------------
   Lists
------------------------------ */

function createListNavigation() {

    listNavigation.innerHTML = "";

    lists.forEach((list) => {

        const button = document.createElement("button");

        button.type = "button";
        button.className = "list-button";
        button.textContent = list.name;

        button.addEventListener("click", () => {
            selectList(list.id);
        });

        listNavigation.appendChild(button);
    });
}


function updateActiveList() {

    const buttons = listNavigation.querySelectorAll(".list-button");

    buttons.forEach((button, index) => {

        const list = lists[index];

        button.classList.toggle(
            "is-active",
            currentList === list.id
        );
    });
}


function getVisiblePlaces() {

    if (!currentList) {
        return places;
    }

    return places.filter((place) => {

        if (!Array.isArray(place.lists)) {
            return false;
        }

        return place.lists.includes(currentList);
    });
}


/* ------------------------------
   Markers
------------------------------ */

function removeMarkers() {

    markers.forEach((marker) => {
        marker.remove();
    });

    markers = [];
}


function addPlaceMarker(place) {

    const markerElement = document.createElement("button");

    markerElement.className = "place-marker";
    markerElement.type = "button";

    markerElement.setAttribute(
        "aria-label",
        place.name
    );

    markerElement.addEventListener("click", () => {
        openPlace(place);
    });

    const marker = new maplibregl.Marker({
        element: markerElement
    })
        .setLngLat([
            place.longitude,
            place.latitude
        ])
        .addTo(map);

    markers.push(marker);
}


function renderPlaces() {

    removeMarkers();

    const visiblePlaces = getVisiblePlaces();

    visiblePlaces.forEach((place) => {
        addPlaceMarker(place);
    });
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

    const url = new URL(window.location.href);

    if (currentList) {
        url.searchParams.set("list", currentList);
    } else {
        url.searchParams.delete("list");
    }

    window.history.pushState({}, "", url);
}


function updatePlaceUrl(placeId) {

    const url = new URL(window.location.href);

    url.searchParams.set("place", placeId);

    window.history.pushState({}, "", url);
}


function loadStateFromUrl() {

    const url = new URL(window.location.href);

    const listId = url.searchParams.get("list");
    const placeId = url.searchParams.get("place");


    if (listId) {

        const listExists = lists.some((list) => {
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


    const name = document.createElement("h2");

    name.className = "place-name";

    name.textContent = place.name;


    const category = document.createElement("div");

    category.className = "place-category";

    category.textContent = place.category;


    const address = document.createElement("div");

    address.className = "place-address";

    address.textContent = place.address;


    const notes = document.createElement("div");

    notes.className = "place-notes";

    notes.textContent = place.notes;


    placeContent.appendChild(name);

    placeContent.appendChild(category);

    placeContent.appendChild(address);

    placeContent.appendChild(notes);


    if (place.website) {

        const website = document.createElement("a");

        website.className = "place-website";

        website.href = place.website;

        website.target = "_blank";

        website.rel = "noopener noreferrer";

        website.textContent = "Visit website";

        placeContent.appendChild(website);
    }


    placePanel.classList.add("is-visible");

    placePanel.setAttribute(
        "aria-hidden",
        "false"
    );


    updatePlaceUrl(place.id);


    map.flyTo({
        center: [
            place.longitude,
            place.latitude
        ],

        zoom: Math.max(
            map.getZoom(),
            5
        ),

        duration: 1000
    });
}


function closePlace(updateBrowserUrl = true) {

    placePanel.classList.remove(
        "is-visible"
    );

    placePanel.setAttribute(
        "aria-hidden",
        "true"
    );


    if (updateBrowserUrl) {

        const url = new URL(window.location.href);

        url.searchParams.delete("place");

        window.history.pushState(
            {},
            "",
            url
        );
    }
}


/* ------------------------------
   Initialisation
------------------------------ */

async function initialise() {

    try {

        await loadData();

        const urlState = loadStateFromUrl();

        createListNavigation();

        updateActiveList();

        renderPlaces();


        if (urlState.placeId) {

            const place = places.find((item) => {
                return item.id === urlState.placeId;
            });


            if (place) {
                openPlace(place);
            }
        }

    } catch (error) {

        console.error(error);
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


window.addEventListener(
    "popstate",
    () => {

        window.location.reload();
    }
);


map.on("load", initialise);