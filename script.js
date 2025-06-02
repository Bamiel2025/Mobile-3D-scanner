// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
    // Log to console to confirm script is running
    console.log("DOM fully loaded and parsed. Initializing application...");

    // --- DOM Element References ---
    // Map containers
    const standardMapElement = document.getElementById('map-standard');
    const geologicalMapElement = document.getElementById('map-geological');
    
    // Slider
    const mapSlider = document.getElementById('map-slider');
    const geologicalMapContainer = document.getElementById('map-geological-container');

    // Search elements
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');

    // Display elements
    const mapCenterCoordsElement = document.getElementById('map-center-coords');
    const geologicalLegendElement = document.getElementById('geological-legend');
    const geologicalDetailsElement = document.getElementById('geological-details');
    const fossilDetailsElement = document.getElementById('fossil-details');

    // --- Leaflet Map Initialization ---
    // Initial map view settings (e.g., centered on France)
    const initialLatLng = [46.2276, 2.2137]; // Approx center of France
    const initialZoom = 6;

    // Check if Leaflet is loaded
    if (typeof L === 'undefined') {
        console.error('Leaflet library is not loaded! Please check the script tag in index.html.');
        // Display an error message to the user in the map container or a general error div
        standardMapElement.innerHTML = '<p style="color:red;text-align:center;">Error: Mapping library (Leaflet) failed to load. Application cannot start.</p>';
        geologicalMapElement.innerHTML = '<p style="color:red;text-align:center;">Error: Mapping library (Leaflet) failed to load. Application cannot start.</p>';
        return; // Stop further execution
    }
    
    console.log("Leaflet library loaded.");

    // Initialize Standard Map
    let standardMap;
    try {
        standardMap = L.map(standardMapElement).setView(initialLatLng, initialZoom);
        // Add a placeholder tile layer (OpenStreetMap) - will be configured in a later step
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(standardMap);
        console.log("Standard map initialized.");
    } catch (e) {
        console.error("Error initializing standard map:", e);
        standardMapElement.innerHTML = `<p style="color:red;text-align:center;">Could not initialize standard map: ${e.message}</p>`;
    }

    // Initialize Geological Map
    let geologicalMap;
    try {
        geologicalMap = L.map(geologicalMapElement).setView(initialLatLng, initialZoom);
        // Placeholder tile layer - BRGM WMS layer will be added in a later step
        // For now, use OSM to confirm map rendering in this container too.
        // L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { // THIS LINE WILL BE REPLACED
        //     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors (placeholder for BRGM)' // THIS LINE WILL BE REPLACED
        // }).addTo(geologicalMap); // THIS LINE WILL BE REPLACED

        // --- Replacement Start ---
        L.tileLayer.wms('http://geoservices.brgm.fr/geologie', {
            layers: 'SCAN_D_GEOL50', // Corrected layer name based on GetCapabilities
            format: 'image/png',
            transparent: true,
            version: '1.3.0', // Specify WMS version
            attribution: "BRGM Scan Géol 1/50 000",
            uppercase: true // Some WMS servers are case-sensitive for parameters
        }).addTo(geologicalMap);
        // --- Replacement End ---
        console.log("Geological map initialized with BRGM WMS layer SCAN_D_GEOL50.");
    } catch (e) {
        console.error("Error initializing geological map:", e);
        geologicalMapElement.innerHTML = `<p style="color:red;text-align:center;">Could not initialize geological map: ${e.message}</p>`;
    }
    
    // --- Basic Event Listeners (more to be added later) ---
    // --- Location Search Functionality ---
    const SEARCH_ZOOM_LEVEL = 13; // Zoom level when a location is found

    if (searchButton && searchInput) {
        searchButton.addEventListener('click', handleSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }

    function handleSearch() {
        const query = searchInput.value.trim();
        if (!query) {
            updateInfoPanel("Please enter a location name or GPS coordinates.", "geological-details");
            return;
        }

        console.log(`Search initiated for: ${query}`);
        updateInfoPanel(`Searching for "${query}"...`, "geological-details");

        // Try to parse as GPS coordinates first
        const gpsCoords = parseGpsCoordinates(query);

        if (gpsCoords) {
            console.log("Interpreted as GPS coordinates:", gpsCoords);
            if (isValidGps(gpsCoords.lat, gpsCoords.lng)) {
                flyToLocation(gpsCoords.lat, gpsCoords.lng, SEARCH_ZOOM_LEVEL);
                updateInfoPanel(`Displaying GPS coordinates: ${gpsCoords.lat.toFixed(5)}, ${gpsCoords.lng.toFixed(5)}`, "geological-details");
            } else {
                updateInfoPanel("Invalid GPS coordinates. Latitude must be -90 to 90, Longitude -180 to 180.", "geological-details");
            }
        } else {
            console.log("Interpreting as place name, attempting geocoding...");
            geocodeLocationName(query);
        }
    }

    function parseGpsCoordinates(query) {
        // Regex to find patterns like "lat,lon", "lat, lon", "lat lon", "lat;lon" etc.
        // Allows for positive/negative numbers, decimals.
        const regex = /^(-?\d{1,2}(\.\d+)?)[,\s;]+(-?\d{1,3}(\.\d+)?)$/;
        const match = query.match(regex);
        if (match) {
            const lat = parseFloat(match[1]);
            const lng = parseFloat(match[3]); // Corrected index for longitude
            return { lat, lng };
        }
        return null;
    }

    function isValidGps(lat, lng) {
        return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    }

    async function geocodeLocationName(locationName) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`;
        console.log("Geocoding URL:", url);

        try {
            const response = await fetch(url, { headers: { 'User-Agent': 'GeologicalMapApp/1.0 (Educational)' } });
            if (!response.ok) {
                throw new Error(`Nominatim API request failed: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();

            if (data && data.length > 0) {
                const firstResult = data[0];
                const lat = parseFloat(firstResult.lat);
                const lng = parseFloat(firstResult.lon);
                console.log(`Geocoding result for "${locationName}": ${firstResult.display_name}`, lat, lng);
                flyToLocation(lat, lng, SEARCH_ZOOM_LEVEL);
                updateInfoPanel(`Location found: ${firstResult.display_name}`, "geological-details");

            } else {
                updateInfoPanel(`Location "${locationName}" not found.`, "geological-details");
                console.log("No results from geocoding for:", locationName);
            }
        } catch (error) {
            console.error("Geocoding error:", error);
            updateInfoPanel(`Error searching for location: ${error.message}. Please check your connection or try again.`, "geological-details");
        }
    }

    function flyToLocation(lat, lng, zoom) {
        if (standardMap) {
            standardMap.flyTo([lat, lng], zoom);
        }
        // The geologicalMap will sync due to the existing sync logic
        // but we can also explicitly call it if preferred, though it might be redundant.
        // if (geologicalMap) {
        //     geologicalMap.flyTo([lat, lng], zoom);
        // }
    }
    
    // Helper to update info panel sections
    function updateInfoPanel(message, elementId = "geological-details") {
        const targetElement = document.getElementById(elementId);
        if (targetElement) {
            targetElement.innerHTML = `<p>${message}</p>`;
        } else {
            console.warn(`Info panel element with ID "${elementId}" not found.`);
        }
    }

    // Initial map center coordinate display (already present from previous step, ensure it's there)
    if (standardMap && mapCenterCoordsElement) {
         updateMapCenterCoords(standardMap.getCenter());
    }
    
    // Function to update displayed map center coordinates (already present from previous step)
    // function updateMapCenterCoords(latLng) { ... } 


    // ... (map synchronization logic, ensure updateMapCenterCoords is defined as before) ...
    // Ensure the existing map synchronization and updateMapCenterCoords function are preserved.
    // The following should already be in the script:
    // if (standardMap && geologicalMap) {
    //     let syncing = false;
    //     standardMap.on('moveend zoomend dragend', function(e) { ... });
    //     geologicalMap.on('moveend zoomend dragend', function(e) { ... });
    //     updateMapCenterCoords(standardMap.getCenter());
    // }
    // function updateMapCenterCoords(latLng) { ... }

    console.log("Location search functionality added.");

    function parseAndDisplayWfsData(gmlString) {
        console.log("Attempting to parse GML data...");
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(gmlString, "text/xml");

        // Check for parser errors (some browsers might embed error reports in the document)
        const parserError = xmlDoc.getElementsByTagName("parsererror");
        if (parserError.length > 0) {
            console.error("Error parsing GML:", parserError[0].textContent);
            updateInfoPanel("<p>Error: Could not parse geological data response.</p>", "geological-details");
            return;
        }
        
        // Common GML feature member tag
        const featureMembers = xmlDoc.getElementsByTagNameNS('*', 'featureMember'); // More robust for GML
        let featureMemberSimple = null; // Declare here to check its length later
        if (!featureMembers || featureMembers.length === 0) {
            featureMemberSimple = xmlDoc.getElementsByTagName('gml:featureMember'); // Fallback for simpler GML
             if (!featureMemberSimple || featureMemberSimple.length === 0) {
                console.log("No featureMember found in GML response.");
                updateInfoPanel("<p>No geological features found at this location.</p>", "geological-details");
                return;
            }
            // If fallback worked, use it (though getElementsByTagNameNS should be preferred)
            // This indicates the default namespace might not be what we expect or GML is simpler.
        }
        
        let htmlOutput = "<ul>";
        let featuresFound = 0;

        // Iterate through features (usually one, or a few if BBOX is larger/multiple layers overlap)
        const membersToIterate = featureMembers.length ? featureMembers : featureMemberSimple;
        for (let i = 0; i < membersToIterate.length; i++) {
            const feature = membersToIterate[i];
            // The actual data layer is often a child of featureMember, e.g., <ms:SCAN_H_GEOL50_PERIMETRE>
            const layerData = feature.firstElementChild; // Assuming the feature type is the first child

            if (layerData) {
                featuresFound++;
                htmlOutput += `<li><strong>Feature ${featuresFound} (${layerData.tagName}):</strong><ul>`;

                // Attempt to extract common/expected attributes.
                // These are educated guesses based on typical BRGM/MapServer WFS outputs.
                // The actual GML structure will dictate what's available.
                const attributesToTry = {
                    "ID": ["gml:id", "ID"], // gml:id is an attribute, not an element usually
                    "Notation/Code": ["ms:notation", "notation", "code"],
                    "Description": ["ms:description", "description", "ms:LEGDESCRIPTION"],
                    "Lithology": ["ms:lithologie", "lithologie", "ms:NATURE"],
                    "Age (General)": ["ms:ere_geol", "ere_geol", "age"],
                    "Age (Era/System)": ["ms:ere_sys", "ere_sys"],
                    "Age (Upper)": ["ms:label_age_sup", "label_age_sup"],
                    "Age (Lower)": ["ms:label_age_inf", "label_age_inf"],
                    "Geological Unit Type": ["ms:type_geol", "type_geol"],
                    "Legend Label": ["ms:LIBELLE_LEGENDE", "LIBELLE_LEGENDE"],
                    "Original Scale": ["ms:ECHELLE_ORIGINELLE", "ECHELLE_ORIGINELLE"],
                    "Entity": ["ms:entite", "entite"], // Common for geological units
                    "Name": ["ms:nom", "nom", "gml:name"], 
                };
                
                // Check for gml:id attribute on layerData itself
                const gmlId = layerData.getAttributeNS("http://www.opengis.net/gml/3.2", "id") || layerData.getAttribute("gml:id") || layerData.id;
                if (gmlId) {
                     htmlOutput += `<li>ID: ${gmlId}</li>`;
                }

                for (const [displayName, potentialTags] of Object.entries(attributesToTry)) {
                    if (displayName === "ID" && gmlId) continue; // Already handled gml:id attribute

                    for (const tagName of potentialTags) {
                        const elements = layerData.getElementsByTagNameNS('*', tagName.split(':').pop()); // Try namespace-agnostic first
                        let elementValue = null;
                        if (elements.length > 0) {
                            elementValue = elements[0].textContent.trim();
                        } else {
                             // Fallback to MapServer (ms) or no namespace
                            const msElements = layerData.getElementsByTagName(tagName);
                            if (msElements.length > 0) {
                                elementValue = msElements[0].textContent.trim();
                            }
                        }
                        
                        if (elementValue && elementValue !== "") {
                            htmlOutput += `<li>${displayName}: ${elementValue}</li>`;
                            break; // Found a value for this display name, move to next attribute
                        }
                    }
                }
                
                // List all direct child elements and their text content as a fallback
                htmlOutput += "<li><em>Raw Properties:</em><ul>";
                let rawPropsFound = 0;
                for(let k=0; k < layerData.children.length; k++){
                    const child = layerData.children[k];
                    if(child.children.length === 0 && child.textContent.trim() !== ""){ // Only simple elements
                         htmlOutput += `<li>${child.tagName}: ${child.textContent.trim()}</li>`;
                         rawPropsFound++;
                    }
                }
                if(rawPropsFound === 0) htmlOutput += "<li>No simple properties found directly under feature.</li>";
                htmlOutput += "</ul></li>";

                htmlOutput += "</ul></li>"; // End of this feature's details
            }
        }
        htmlOutput += "</ul>";

        if (featuresFound > 0) {
            updateInfoPanel(htmlOutput, "geological-details");
        } else {
            // This might happen if featureMembers are present but no recognizable layerData inside,
            // or if the GML structure is different than expected.
            console.log("GML parsed, but no processable features found within featureMembers using expected structure (e.g., ms:SCAN_H_GEOL50_PERIMETRE as first child). Raw GML logged above.");
            updateInfoPanel("<p>Geological data found, but could not extract specific details with current parser. Check console for raw GML data.</p>", "geological-details");
        }
    }

    // --- Interactive Legend for Geological Map ---
    const geologicalLegendImageContainer = document.getElementById('geological-legend');

    if (geologicalLegendImageContainer) {
        const legendUrl = 'http://geoservices.brgm.fr/geologie?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&LAYER=SCAN_D_GEOL50&FORMAT=image/png&STYLE=default&SLD_VERSION=1.1.0';
        
        // It's good practice to also specify width/height if the server supports it,
        // or control via CSS. For now, let's try without.
        // Some servers might require a specific STYLE if 'default' isn't configured for legend.
        // SLD_VERSION=1.1.0 is often needed for GetLegendGraphic with styles.

        console.log("Attempting to load legend from URL:", legendUrl);
        
        const legendImage = document.createElement('img');
        legendImage.src = legendUrl;
        legendImage.alt = "Geological Map Legend";
        legendImage.style.maxWidth = "100%"; // Ensure it fits in the container
        legendImage.style.height = "auto";

        legendImage.onload = () => {
            console.log("Geological legend image loaded successfully.");
            updateInfoPanel("<p>Legend loaded successfully.</p>", "geological-legend"); // Clear previous messages
            geologicalLegendImageContainer.innerHTML = ''; // Clear any previous text
            geologicalLegendImageContainer.appendChild(legendImage);
        };
        legendImage.onerror = () => {
            console.error("Failed to load geological legend image from WMS GetLegendGraphic.");
            updateInfoPanel("<p>Could not automatically load legend image. Will attempt to use data from map clicks if available.</p>", "geological-legend");
            // Fallback: If GetLegendGraphic fails, the user might still get some legend-like info
            // from WFS GetFeature responses if those contain descriptive labels.
            // The existing WFS parsing function (`parseAndDisplayWfsData`) already tries to extract
            // fields like 'ms:LIBELLE_LEGENDE'. We could potentially aggregate these.
            // For now, this error message is the primary fallback for this step.
        };
        
        // Initial message while loading
        updateInfoPanel("<p>Loading legend...</p>", "geological-legend");

    } else {
        console.warn("Geological legend container not found in HTML.");
    }

    // --- Geological Data Querying on Click (WFS) ---
    if (geologicalMap) {
        geologicalMap.on('click', async function(e) {
            const latlng = e.latlng;
            console.log(`Geological map clicked at: Lat ${latlng.lat.toFixed(5)}, Lng ${latlng.lng.toFixed(5)}`);
            updateInfoPanel(`Querying geological data at ${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}...`, "geological-details");

            // Define a small bounding box around the click for the WFS query
            // BRGM services might be sensitive to too small BBOX, adjust if needed
            const buffer = 0.0001; // Approx 10-11 meters, adjust as needed
            const bboxStr = `${latlng.lng - buffer},${latlng.lat - buffer},${latlng.lng + buffer},${latlng.lat + buffer}`;
            
            // Define WFS parameters
            const wfsBaseUrl = 'http://geoservices.brgm.fr/geologie';
            const wfsParams = {
                service: 'WFS',
                version: '2.0.0', // Using 2.0.0 as per capabilities
                request: 'GetFeature',
                typeName: 'ms:SCAN_H_GEOL50_PERIMETRE', // Target layer for detailed geological info
                outputFormat: 'application/gml+xml; version=3.2', // Preferred GML version
                srsName: 'EPSG:4326', // Requesting data in WGS84
                bbox: `${bboxStr},EPSG:4326`, // BBOX with CRS
                count: 10 // Limit number of features, good practice
            };

            // Construct the URL with parameters
            const url = new URL(wfsBaseUrl);
            Object.keys(wfsParams).forEach(key => url.searchParams.append(key, wfsParams[key]));

            console.log("WFS GetFeature URL:", url.toString());

            try {
                const response = await fetch(url.toString(), { headers: { 'Accept': 'application/gml+xml, text/xml' } });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`WFS request failed: ${response.status} ${response.statusText}. Server response: ${errorText}`);
                }
                
                const gmlData = await response.text();
                console.log("WFS GetFeature Response (GML String):", gmlData); // Log the raw string

                // Call the new parsing function
                parseAndDisplayWfsData(gmlData);


            } catch (error) {
                console.error("WFS GetFeature error:", error);
                updateInfoPanel(`Error fetching geological data: ${error.message}. Check console for details.`, "geological-details");
            }
        });
    }

    // ... (rest of the script: search functions, map sync, updateMapCenterCoords, updateInfoPanel)

    if (mapSlider) {
        mapSlider.addEventListener('input', (e) => {
            const sliderValue = e.target.value; // 0 to 100
            
            // Log for debugging
            // console.log(`Slider value: ${sliderValue}%`); 
            
            if (geologicalMapContainer) {
                geologicalMapContainer.style.width = `${sliderValue}%`;
                
                // Adjust the slider input's horizontal position to match the edge 
                // of the geological map container.
                // The slider's own width (30px) is centered on this line by CSS transform.
                mapSlider.style.left = `${sliderValue}%`;

                // Important: Invalidate the size of the geological map
                // so it recalculates its layout and tile loading based on the new visible width.
                if (geologicalMap) {
                    geologicalMap.invalidateSize({ debounceMoveend: true });
                }
            }
        });

        // Initial position setup for slider handle based on default value (e.g., 50%)
        // This ensures the slider handle is correctly positioned on load.
        if (geologicalMapContainer && geologicalMap) {
            const initialSliderValue = mapSlider.value;
            geologicalMapContainer.style.width = `${initialSliderValue}%`;
            mapSlider.style.left = `${initialSliderValue}%`;
            geologicalMap.invalidateSize(); // Initial size invalidation
        }
    }

    // Synchronize map views (simple example, can be more robust)
    // This is a very basic sync. More advanced syncing (e.g. leaflet-sync plugin) could be used
    // but is likely too complex for "vanilla JS, beginner-friendly".
    if (standardMap && geologicalMap) {
        let syncing = false; // Flag to prevent sync loops

        standardMap.on('moveend zoomend dragend', function(e) {
            if (syncing) return;
            syncing = true;
            geologicalMap.setView(standardMap.getCenter(), standardMap.getZoom(), { animate: false });
            syncing = false;
            updateMapCenterCoords(standardMap.getCenter());
        });

        geologicalMap.on('moveend zoomend dragend', function(e) {
            if (syncing) return;
            syncing = true;
            standardMap.setView(geologicalMap.getCenter(), geologicalMap.getZoom(), { animate: false });
            syncing = false;
            updateMapCenterCoords(geologicalMap.getCenter());
        });
        
        // Initial coords update // This was already called by the slider initial setup, but calling again is fine.
        // updateMapCenterCoords(standardMap.getCenter()); // This line is effectively duplicated by the new code block above, so we can remove one.
                                                        // The one inside the search functionality section handles the case where standardMap might not be ready initially.
                                                        // The one here is part of map sync. Let's keep the one in map sync.
         updateMapCenterCoords(standardMap.getCenter()); 
    }
    
    // Function to update displayed map center coordinates
    function updateMapCenterCoords(latLng) { // This function definition should be preserved
        if (mapCenterCoordsElement && latLng) {
            mapCenterCoordsElement.textContent = `${latLng.lat.toFixed(5)}, ${latLng.lng.toFixed(5)}`;
        }
    }

    console.log("Initial script setup complete. Maps should be visible with placeholder tiles."); // This log will be followed by "Location search functionality added."
    console.log("WFS GetFeature query on map click listener added.");
    console.log("WFS GML parsing function added and integrated.");
    console.log("Interactive legend setup initiated.");
});
