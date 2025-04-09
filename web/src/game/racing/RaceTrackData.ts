import { RaceTrack } from './TimeTrialTypes';

/**
 * Predefined race tracks - easy to add more
 */
export const RACE_TRACKS: RaceTrack[] = [
  {
    id: 'apple-park',
    name: 'Apple Park Test Track',
    description: 'A simple test track around Apple\'s spaceship headquarters',
    difficulty: 'easy',
    startPosition: [-122.0142, 37.3341], // Apple Park Visitor Center
    startCamera: {
      pitch: 80,
      bearing: 180,
      zoom: 22
    },
    checkpoints: [
      {
        id: 'checkpoint-1',
        coordinates: [-122.0142, 37.3309],
        elevation: 15,
        radius: 20,
        name: 'Checkpoint 1',
      },
      {
        id: 'checkpoint-2',
        coordinates: [-122.0142, 37.3275],
        radius: 20,
        name: 'Checkpoint 2',
        elevation: 15
      },
      {
        id: 'checkpoint-3',
        coordinates: [-122.0142, 37.3248],
        radius: 20,
        name: 'Checkpoint 3',
        elevation: 15
      },
      {
        id: 'checkpoint-4',
        coordinates: [-122.0142, 37.3223],
        radius: 20,
        name: 'Checkpoint 4',
        elevation: 15
      }
    ]
  },
  {
    "id": "sydney-opera",
    "name": "Sydney Opera House Circuit",
    "description": "A scenic loop around the iconic Sydney Opera House with views of the harbor.",
    "difficulty": "easy",
    startPosition: [151.2133, -33.8497], // Apple Park Visitor Center
    startCamera: {
      pitch: 80,
      bearing: 181,
      zoom: 22
    },
    "checkpoints": [
      {
        "id": "checkpoint-1",
        coordinates: [151.2135, -33.8541],
        elevation: -35,
        "radius": 20,
        "name": "Start Line"
      },
      {
        "id": "checkpoint-2",
        coordinates: [151.2135, -33.8591],
        elevation: -20,
        "radius": 20,
        "name": "Harbor View"
      },
      {
        "id": "checkpoint-3",
        coordinates: [151.2131, -33.8615],
        elevation: 0,
        "radius": 20,
        "name": "Northern Bend"
      },
      {
        "id": "checkpoint-4",
        coordinates: [151.2131, -33.8642],
        elevation: 5,
        "radius": 20,
        "name": "Opera Plaza"
      },
      {
        "id": "checkpoint-5",
        coordinates: [151.2146, -33.8661],
        elevation: -10,
        "radius": 20,
        "name": "Opera Plaza"
      },
      {
        "id": "checkpoint-6",
        coordinates: [151.2173, -33.8678],
        elevation: -10,
        "radius": 20,
        "name": "Opera Plaza"
      },
      {
        "id": "checkpoint-7",
        coordinates: [151.2138, -33.8702],
        elevation: -10,
        "radius": 20,
        "name": "Opera Plaza"
      },

    ]
  },
  {
    "id": "paris-louvre",
    "name": "Paris Louvre Loop",
    "description": "A quick lap around the Louvre Pyramid and its historic courtyards.",
    "difficulty": "easy",
    startPosition: [2.3351, 48.8613], // Apple Park Visitor Center
    startCamera: {
      pitch: 80,
      bearing: 45,
      zoom: 22
    },
    "checkpoints": [
      {
        "id": "checkpoint-1",
        coordinates: [2.3330, 48.8621],
        elevation: 0,
        "radius": 20,
        "name": "Pyramid Start"
      },
      {
        "id": "checkpoint-2",
        coordinates: [2.3307, 48.8615],
        elevation: 0,
        "radius": 20,
        "name": "East Wing"
      },
      {
        "id": "checkpoint-3",
        coordinates: [2.3287, 48.8614],
        elevation: 0,
        "radius": 20,
        "name": "Northern Courtyard"
      },
      {
        "id": "checkpoint-4",
        coordinates: [2.3245, 48.8617],
        elevation: 0,
        "radius": 20,
        "name": "West Arch"
      },
      {
        "id": "checkpoint-5",
        coordinates: [2.3262, 48.8606],
        elevation: 0,
        "radius": 20,
        "name": "West Arch"
      }
    ]
  },
  {
    "id": "new-york",
    "name": "New York",
    "description": "A quick lap around the New York City skyline.",
    "difficulty": "easy",
    startPosition: [-73.9911, 40.7014], // Apple Park Visitor Center
    startCamera: {
      pitch: 80,
      bearing: 45,
      zoom: 22
    },
    "checkpoints": [
      {
        "id": "checkpoint-1",
        coordinates: [-73.9936, 40.7034],
        elevation: -30,
        "radius": 20,
        "name": "Pyramid Start",
        rotation: 45
      },
      {
        "id": "checkpoint-2",
        coordinates: [-73.9960, 40.7053],
        elevation: -30,
        "radius": 20,
        "name": "Pyramid Start",
        rotation: 45
      },
      {
        "id": "checkpoint-3",
        coordinates: [-74.0004, 40.7089],
        elevation: -25,
        "radius": 20,
        "name": "Pyramid Start",
        rotation: 45
      },
      {
        "id": "checkpoint-4",
        coordinates: [-74.0043, 40.7117],
        elevation: -25,
        "radius": 20,
        "name": "Pyramid Start",
        rotation: 60
      },
      {
        "id": "checkpoint-5",
        coordinates: [-74.0059, 40.7120],
        elevation: -25,
        "radius": 20,
        "name": "Pyramid Start",
        rotation: 107
      },
      {
        "id": "checkpoint-6",
        coordinates: [-74.0089, 40.7111],
        elevation: -25,
        "radius": 20,
        "name": "Pyramid Start",
        rotation: 130
      },
      {
        "id": "checkpoint-7",
        coordinates: [-74.0109, 40.7088],
        elevation: -25,
        "radius": 20,
        "name": "Pyramid Start",
        rotation: 130
      },
      {
        "id": "checkpoint-8",
        coordinates: [-74.0134, 40.7054],
        elevation: -25,
        "radius": 20,
        "name": "Pyramid Start",
        rotation: 176
      },
      {
        "id": "checkpoint-9",
        coordinates: [-74.0122, 40.7015],
        elevation: -25,
        "radius": 20,
        "name": "Pyramid Start",
        rotation: 80
      },
      {
        "id": "checkpoint-10",
        coordinates: [-74.0078, 40.7031],
        elevation: -25,
        "radius": 20,
        "name": "Pyramid Start",
        rotation: -50
      }
    ]
  }
];

/**
 * Helper function to get a track by ID
 */
export function getTrackById(trackId: string): RaceTrack | undefined {
  return RACE_TRACKS.find(track => track.id === trackId);
}

/**
 * Structure for adding new tracks easily
 */
export function createTrack(
  id: string,
  name: string,
  description: string,
  difficulty: 'easy' | 'medium' | 'hard',
  startPosition: [number, number],
  checkpointCoordinates: Array<{
    coordinates: [number, number];
    elevation?: number;
  }>,
  startCamera?: {
    pitch: number;
    bearing: number;
    zoom: number;
  }
): RaceTrack {
  return {
    id,
    name,
    description,
    difficulty,
    startPosition,
    startCamera,
    checkpoints: checkpointCoordinates.map((point, index) => ({
      id: `checkpoint-${index + 1}`,
      coordinates: point.coordinates,
      elevation: point.elevation,
      radius: 15,
      name: `Checkpoint ${index + 1}`
    }))
  };
}

/**
 * Get all available race tracks
 */
export function getAllTracks(): RaceTrack[] {
  return Object.values(RACE_TRACKS);
} 