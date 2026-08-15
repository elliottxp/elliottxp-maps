const MAPTILER_API_KEY = "MRdl9X99jU7dbRpY817N";

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
        return place.lists.includes(currentList);
    });
}


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


function selectList(listId) {

    currentList = listId;

    updateActiveList();

    renderPlaces();

    closePlace();

    updateUrl();
}


function showAllPlaces() {

    currentList = null;

    updateActiveList();

    renderPlaces();

    closePlace();

    updateUrl();
}


function updateUrl() {

    const url = new URL(window.location.href);

    if (currentList) {
        url.searchParams.set("list", currentList);
    } else {
        url.searchParams.delete("list");
    }

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

function updatePlaceUrl(placeId) {

    const url = new URL(window.location.href);

    url.searchParams.set("place", placeId);

    window.history.pushState(
        {},
        "",
        url
    );
}

function openPlace(place) {

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


function closePlace() {

    placePanel.classList.remove(
        "is-visible"
    );

    placePanel.setAttribute(
        "aria-hidden",
        "true"
    );


    const url = new URL(window.location.href);

    url.searchParams.delete("place");

    window.history.pushState(
        {},
        "",
        url
    );
}


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


closePanel.addEventListener(
    "click",
    closePlace
);


allPlacesButton.addEventListener(
    "click",
    (event) => {

        event.preventDefault();

        showAllPlaces();
    }
);


map.on("load", initialise);

