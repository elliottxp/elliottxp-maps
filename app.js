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


async function loadPlaces() {
    const response = await fetch("data/places.json");

    if (!response.ok) {
        throw new Error("Unable to load places.json");
    }

    return response.json();
}


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
    placePanel.setAttribute("aria-hidden", "false");

    map.flyTo({
        center: [place.longitude, place.latitude],
        zoom: Math.max(map.getZoom(), 5),
        duration: 1000
    });
}


function closePlace() {
    placePanel.classList.remove("is-visible");
    placePanel.setAttribute("aria-hidden", "true");
}


function addPlaceMarker(place) {
    const markerElement = document.createElement("button");

    markerElement.className = "place-marker";
    markerElement.type = "button";
    markerElement.setAttribute("aria-label", place.name);

    markerElement.addEventListener("click", () => {
        openPlace(place);
    });

    new maplibregl.Marker({
        element: markerElement
    })
        .setLngLat([
            place.longitude,
            place.latitude
        ])
        .addTo(map);
}


async function initialisePlaces() {
    try {
        const places = await loadPlaces();

        places.forEach(addPlaceMarker);
    } catch (error) {
        console.error(error);
    }
}


closePanel.addEventListener("click", closePlace);

map.on("load", initialisePlaces);