import openai from 'openai';
function initMap(): void {
  const NUM_PATHS = 5
  const OBS_NUM = 2;

  const OPENAI_API_KEY = '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';

  // Create the client object with your API key
  const client = new openai.OpenAI({ apiKey: OPENAI_API_KEY, dangerouslyAllowBrowser: true });

  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer({
    suppressMarkers: true,
    polylineOptions: {
      strokeColor: '#000000', 
      strokeOpacity: 0, 
    },
  });

  const map = new google.maps.Map(
    document.getElementById("map") as HTMLElement,
    {
      zoom: 15,
      center: { lat: 51.5157, lng: -0.1192 },
    }
  );

  directionsRenderer.setMap(map);

  const flightPaths: google.maps.Polyline[] = [];
  const endMarkers: google.maps.Marker[] = [];
  const obsMarkers: google.maps.Marker[] = [];
  const markerColors = ['green', 'red', 'yellow', 'purple', 'orange'];

  const animationMarker = new google.maps.Marker({
    map: map,
    title: 'Animation Marker',
    animation: google.maps.Animation.DROP, // Drop animation when marker is added to the map
    icon: {
      // URL of the track icon
      url: 'http://maps.google.com/mapfiles/kml/shapes/cabs.png', // Example URL for a track icon
      scaledSize: new google.maps.Size(30, 30), // Size of the marker icon
    },
  });

  const animationPolyline = new google.maps.Polyline({
    path: [],
    geodesic: true,
    strokeColor: 'red',
    strokeOpacity: 1.0,
    // strokeWeight: 2,
    map: map // Add the polyline to the map
  });

  for (let i = 0; i < NUM_PATHS*2; i++) {
    const randomColor = markerColors[i];
    const flightPath = new google.maps.Polyline({
      path: [],
      geodesic: true,
      strokeColor: "transparent", 
      strokeOpacity: 0.8,
    });

  const endMarker = new google.maps.Marker({
    map: map,
    title: 'End Point',
    label: {
      // text: `loc${i + 1}`,
      color: 'Black',
      fontWeight: 'bold',
    },
    icon: {
      url: `http://maps.google.com/mapfiles/ms/icons/${randomColor}.png`, // URL of the marker icon with random color
      scaledSize: new google.maps.Size(50, 50), 
     // Size of the marker icon
    },
  });
    flightPath.setMap(map);
    flightPaths.push(flightPath);
    endMarkers.push(endMarker);
  }

  for (let i = 0; i < OBS_NUM; i++) {
    const obsMarker = new google.maps.Marker({
      map: map,
      title: 'OBS Point',
      label: {
        // text: `o${i + 1}`, // Set label text based on path number
        color: 'white',
        fontWeight: 'bold',
      },
          icon: {
      url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png', // URL for blue marker
      labelOrigin: new google.maps.Point(11, 50), // Adjust label position if needed
    },
    });

    obsMarkers.push(obsMarker);
  }

  const searchButton = document.getElementById("searchButton") as HTMLElement;

  searchButton.addEventListener("click", () => {
    // Call the existing onChangeHandler function
    onChangeHandler();
  });

  const startMarker = new google.maps.Marker({
    map: map,
    title: 'Start Point',
    label: {
      text: 'i',
      color: 'white', // Set the color to white
      fontWeight: 'bold', // Make it bold
    },

  });

  const onChangeHandler = async function () {
    try {
      // Clear existing markers from the map
      // clearMarkers();
      animationPolyline.getPath().clear();

      let locations = await readLocations();
      locations = locations.sort(() => Math.random() - 0.5);

      // Set the start point outside the loop
      const start = locations[0];

      const routePromises = [];

      for (let i = 0; i < NUM_PATHS; i++) {

        const routePromise = calculateAndDisplayRoute(
          directionsService,
          directionsRenderer,
          flightPaths[i],
          start,
          locations[i + 1]
        );
        routePromises.push(routePromise);
      
      }

      // midMarker.setPosition(marker.getPosition() as google.maps.LatLng);

      // Wait for both promises to resolve
      await Promise.all(routePromises);

      const route1Start = flightPaths[0].getPath().getArray();
      startMarker.setPosition(route1Start[0]);

      for (let i = 0; i < NUM_PATHS; i++) {
        const routeEnd = flightPaths[i].getPath().getArray();
        endMarkers[i].setPosition(routeEnd[routeEnd.length - 1]);
      }

      const randomIndex = Math.floor(Math.random() * NUM_PATHS);
      // const randomIndex = 0;

      // Get the selected flightPath
      const selectedFlightPath = flightPaths[randomIndex];
      console.log("Randomly Selected Flight Path:", markerColors[randomIndex]);

      // Set start marker position
      const flightPathPoints = selectedFlightPath.getPath().getArray();

      // Calculate the interval between each obstacle point
      const interval = Math.floor((flightPathPoints.length - 2) / (OBS_NUM - 1)); // Exclude start and end

      // Select OBS_NUM equally spaced obstacle points from the flight path
      const obsPointsList: google.maps.LatLng[] = [];
      for (let i = 1; i < flightPathPoints.length - 1; i++) { // Exclude start and end
        if ((i - 1) % interval === 0) {
          const obsPoint = flightPathPoints[i];
          obsPointsList.push(obsPoint);
        }
      }

      // // Choose a random index
      // const randomIndex = Math.floor(Math.random() * NUM_PATHS);

      // // Get the selected flightPath
      // const selectedFlightPath = flightPaths[randomIndex];
      // console.log("Randomly Selected Flight Path:", randomIndex);

      // // Set start marker position
      // const selectedFlightPathPoint = selectedFlightPath.getPath().getArray();

      // const randomIndexs = [];
      // for (let i = 0; i < OBS_NUM; i++) {
      //   const randomIndex = Math.floor(Math.random() * selectedFlightPathPoint.length);
      //   randomIndexs.push(randomIndex);
      // }
      // randomIndexs.sort((a, b) => a - b);

      // const obsPointsList: google.maps.LatLng[] = [];

      // for (let i = 0; i < OBS_NUM; i++) {
      //   const obsPoint = selectedFlightPathPoint[randomIndexs[i]];
      //   // obsMarkers[i].setPosition(obsPoint);
      //   obsPointsList.push(obsPoint);
      // }



      
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      const resultsContainer = document.getElementById("resultsContainer");
      const allIntentData = [];

      for (let z = 0; z < OBS_NUM; z++) {
        const similarities = [];
        const intent = [];
        const aiResponsePromises = [];
        const numOBSToDraw = z + 1;

        // Prepare AI response promises
        for (let j = 0; j < NUM_PATHS; j++) {
            const user_message: string = `Provide the shortest and fastest path with ${OBS_NUM + 5} key locations between ${start} and ${locations[j + 1]} by car that will cross the points: ${obsPointsList.slice(0, z + 1)}`;
            const aiResponsePromise = ai_response(
                user_message,
                client,
                OPENAI_API_KEY // Pass the API key as a parameter
            );

            aiResponsePromises.push(aiResponsePromise);
        }

        // Wait for all AI response promises to resolve
        await Promise.all(aiResponsePromises)
            .then((allAIResponses) => {
                // Once all AI responses are received
                for (let j = 0; j < NUM_PATHS; j++) {
                    // Extract waypoints from AI response
                    const waypoints = allAIResponses[j];

                    // Calculate and display route with the extracted waypoints
                    const routePromise = calculateAndDisplayRouteWithMarker(
                        directionsService,
                        directionsRenderer,
                        flightPaths[j + NUM_PATHS],
                        start,
                        locations[j + 1],
                        waypoints // Use AI response as waypoints
                    );

                    const similarity = calculateSimilarity(flightPaths[j], flightPaths[j + NUM_PATHS]).toFixed(2);
                    similarities.push(similarity);
                }

                // Calculate sum of similarities and intent percentages
                const sumOfSimilarities = similarities.reduce((acc, val) => acc + parseFloat(val), 0);
                for (let i = 0; i < NUM_PATHS; i++) {
                    const intentPercentage = (parseFloat(similarities[i]) / sumOfSimilarities) * 100;
                    intent.push(intentPercentage.toFixed(2));
                }

                const intentData = [];
                for (let i = 0; i < NUM_PATHS; i++) {
                    intentData.push({ path: i + 1, percentage: parseFloat(intent[i]), color: markerColors[i] });
                }
                // Sort intentData array based on percentage score
                intentData.sort((a, b) => b.percentage - a.percentage);
                allIntentData.push(intentData);

                console.log("intent:", z, intent);
            })
            .catch((error) => {
                console.error("Error in AI response promises:", error);
            });

        // await delay(500); // Delay before proceeding to the next iteration
    }
      await delay(5000);

      const selectedFlightPathPoints = selectedFlightPath.getPath().getArray();
      const animationDuration = 20000;
      const stepInterval = animationDuration / selectedFlightPathPoints.length;

      let currentIndex = 0; // Track the current index of the allIntentData array
      selectedFlightPathPoints.forEach((point, index) => {
          setTimeout(() => {
              const isObstaclePoint = obsPointsList.some(obsPoint => {
                  return google.maps.geometry.spherical.computeDistanceBetween(point, obsPoint) < 10;
              });

              if (!isObstaclePoint) {
                  animateMarker(animationMarker, point);
                  animationPolyline.getPath().push(point);
              }

              // Update HTML content if marker touches an obstacle point or animation completes
              if (isObstaclePoint || index === selectedFlightPathPoints.length - 1) {
                  const intentData = allIntentData[currentIndex];
                  if (intentData) {
                      let htmlContent = "";
                      intentData.forEach(data => {
                          const fillWidth = (data.percentage / 100) * 200;
                          htmlContent += `
                              <div class="percentage-item">
                                  <span class="path-number">P(${data.color}):</span>
                                  <span>${data.percentage.toFixed(2)}%</span>
                                  <div class="percentage-bar">
                                      <div class="fill-bar" style="width: ${fillWidth}px"></div>
                                  </div>
                              </div>
                          `;
                      });
                      resultsContainer.innerHTML = htmlContent;
                      currentIndex++;
                  }
              }
          }, index * stepInterval);
      });
      


    } catch (error) {
      console.error("Error during route calculation: " + error);
    }
  };
}

function animateMarker(marker, newPosition) {
  marker.setPosition(newPosition);
}

function getRandomColor(): string {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

async function readLocations(): Promise<string[]> {
  try {
    const response = await fetch('locations.txt');
    const locationsText = await response.text();
    // Split the text file into an array of trimmed strings and filter out empty strings
    const locations = locationsText.split('\n').map(location => location.trim()).filter(Boolean);
    return locations;
  } catch (error) {
    console.error('Error reading locations:', error);
    return [];
  }
}

function getRandomLocation(locations: string[]): string {
  const randomIndex = Math.floor(Math.random() * locations.length);
  return locations[randomIndex];
}

function calculateAndDisplayRoute(
  directionsService: google.maps.DirectionsService,
  directionsRenderer: google.maps.DirectionsRenderer,
  flightPath: google.maps.Polyline,
  origin: string,
  destination: string
): Promise<void> {
  return directionsService
    .route({
      origin: {
        query: origin,
      },
      destination: {
        query: destination,
      },
      travelMode: google.maps.TravelMode.DRIVING,
    })
    .then((response) => {
      // console.log("Destination:",destination);
      directionsRenderer.setDirections(response);

      const route = response.routes[0];
      const path = route.overview_path.map((point) => ({ lat: point.lat(), lng: point.lng() }));
      flightPath.setPath(path);
    })
    .catch((e) => {
      console.error("Directions request failed due to " + e + destination);
      throw e; // Rethrow the error to propagate it to the caller
    });
}

function markcommon(route1: google.maps.Polyline, route2: google.maps.Polyline): google.maps.LatLng[] {
  const path1 = route1.getPath().getArray();
  const path2 = route2.getPath().getArray();

  const commonPoints = path1.filter(point1 =>
    path2.some(point2 =>
      arePointsEqual(point1, point2)
    )
  );

  return commonPoints;
}

function calculateSimilarity(route1: google.maps.Polyline, route2: google.maps.Polyline): number {
  const path1 = route1.getPath().getArray();
  const path2 = route2.getPath().getArray();

  if (path1.length === 0 && path2.length === 0) {
    return 1000; // If either path is empty, consider them 100% similar
  }

  const commonPoints = path1.filter(point1 =>
    path2.some(point2 =>
      arePointsEqual(point1, point2)
    )
  );

  const similarityPercentage = (commonPoints.length / Math.min(path1.length, path2.length)) * 100;

  if (similarityPercentage > 100){
    return 100;
  }
  return similarityPercentage;
}

function arePointsEqual(point1: google.maps.LatLng, point2: google.maps.LatLng): boolean {
  const epsilon = 1e-3;
  const latDiff = Math.abs(point1.lat() - point2.lat());
  const lngDiff = Math.abs(point1.lng() - point2.lng());

  return latDiff < epsilon && lngDiff < epsilon;
}

function calculateAndDisplayRouteWithMarker(
  directionsService: google.maps.DirectionsService,
  directionsRenderer: google.maps.DirectionsRenderer,
  flightPath: google.maps.Polyline,
  origin: string,
  destination: string,
  waypoints: number[][]
): Promise<void> {
  const waypointsFormatted = waypoints.map(waypoint => new google.maps.LatLng(waypoint[0], waypoint[1]));

  return directionsService
    .route({
      origin: {
        query: origin,
      },
      waypoints: waypointsFormatted.map(waypoint => ({
        location: waypoint,
        stopover: true,
      })),
      destination: {
        query: destination,
      },
      travelMode: google.maps.TravelMode.DRIVING,
    })
    .then((response) => {
      directionsRenderer.setDirections(response);

      const route = response.routes[0];
      const path = route.overview_path.map((point) => ({ lat: point.lat(), lng: point.lng() }));
      flightPath.setPath(path);
    })
    .catch((e) => {
      console.error("Directions request failed due to " + e);
      throw e; // Rethrow the error to propagate it to the caller
    });
}

function clearMarkers() {
  markers.forEach(marker => marker.setMap(null));
  markers = []; // Clear the array
}


function ai_response(user_message: string, client: any, apiKey: string): Promise<number[][]> {
    return new Promise((resolve, reject) => {
        const response = client.chat.completions.create(
            {
                messages: [
                    {
                        role: "system",
                        content: "You only need to provide latitude,longitude of key locations. Don't provide anything else than lat and lng in the format (latitude,longitude)\n(latitude,longitude)\n.",
                    },
                    {
                        role: "user",
                        content: user_message,
                    }
                ],
                model: "gpt-3.5-turbo-0125",
                max_tokens: 400 
            },
            { headers: { 'Authorization': `Bearer ${apiKey}` } } // Use apiKey parameter here
        );

        response.then((response) => {
            // console.log(response.choices[0].message.content);
            const response_message: string = response.choices[0].message.content;

            // Convert the string into a 2D array
            const pattern: RegExp = /\((-?\d+\.\d+),\s*(-?\d+\.\d+)\)/g;
            let match: RegExpExecArray | null;
            const ai_responses: number[][] = [];

            while ((match = pattern.exec(response_message)) !== null) {
                const latitude: number = parseFloat(match[1]);
                const longitude: number = parseFloat(match[2]);
                ai_responses.push([latitude, longitude]);
            }

            resolve(ai_responses);
        }).catch((error) => {
            reject(error);
        });
    });
}


declare global {
  interface Window {
    initMap: () => void;
  }
}

window.initMap = initMap;
export {};



  // for (let i = 0; i < NUM_PATHS; i++){
            
  //           const intentPercentage = (parseFloat(similarities[i]) / sumOfSimilarities) * 100; // Convert to float before division
           
  //           intent.push(intentPercentage.toFixed(2));

  //           const maxIntent = Math.max(...intent);
  //           let highestPercentageIndex = 0;

  //           // for (let j = 0; j < NUM_PATHS; j++) {
  //           //   if (intent[j] == maxIntent) {
  //           //     highestPercentageIndex = j;
  //           //   }
  //           // }

  //           // flightPaths[highestPercentageIndex].setOptions({
  //           //   strokeColor: 'red',
  //           //   strokeOpacity: 1,
  //           // });

  //           // for (let k = 0; k < NUM_PATHS; k++) {
  //           //   if (k !== highestPercentageIndex) {
  //           //     flightPaths[k].setOptions({
  //           //       strokeColor: 'transparent',
  //           //       strokeOpacity: 0.8,
  //           //     });
  //           //   }
  //           // }

  //     const intentData = [];
  //     for (let i = 0; i < NUM_PATHS; i++) {
  //         intentData.push({ path: i + 1, percentage: parseFloat(intent[i]), color: markerColors[i] });
  //     }

  //     // Sort the intentData array based on intent percentages in descending order
  //     intentData.sort((a, b) => b.percentage - a.percentage);

  //     // Construct the HTML content to display intent percentages
  //     let htmlContent = "";
  //     intentData.forEach((data, index) => {
  //         // Calculate width of the fill bar
  //         const fillWidth = (data.percentage / 100) * 200;
          
  //         // Append HTML for each item
  //         htmlContent += `
  //           <div class="percentage-item">
  //             <span class="path-number">P(loc_${data.path})(${data.color}):</span>
  //             <span>${data.percentage.toFixed(2)}%</span>
  //             <div class="percentage-bar">
  //               <div class="fill-bar" style="width: ${fillWidth}px"></div>
  //             </div>
  //           </div>
  //         `;
  //     });

  //     // Update the inner HTML of the resultsContainer with the constructed content
  //     resultsContainer.innerHTML = htmlContent;



  //           }