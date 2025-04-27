import { Waypoint } from '../../CinematicController';

export interface CinematicMetadata {
  id: string;
  title: string;
  description: string;
  author: string;
  createdAt: Date;
  likes?: number;
  duration?: number;
  thumbnailUrl?: string;
  tags?: string[];
}

export interface Cinematic extends CinematicMetadata {
  waypoints: Waypoint[];
}

// This will be replaced by API calls in the future
export const DEMO_CINEMATICS: Cinematic[] = [
  {
    id: 'rio-wonders',
    title: 'Rio de Janeiro Wonders',
    description: 'A breathtaking tour of Rio\'s most iconic landmarks and beaches',
    author: 'William',
    createdAt: new Date('2025-04-26'),
    likes: 0,
    duration: 25000,
    tags: ['official', 'city-tour', 'beaches', 'landmarks'],
    waypoints: [
      // Start with global view
      {
        position: [-43.2, -22.9],
        zoom: 4,
        pitch: 40,
        bearing: 0,
        duration: 2000,
        message: 'Target acquired: Brazil! Land of samba and endless beaches!'
      },

      // Christ the Redeemer
      {
        position: [-43.2105, -22.9519],
        zoom: 17,
        pitch: 75,
        bearing: 30,
        duration: 3000,
        message: 'Christ the Redeemer - The iconic statue blessing Rio with open arms!'
      },

      // Copacabana Beach
      {
        position: [-43.1856, -22.9714],
        zoom: 17,
        pitch: 75,
        bearing: 120,
        duration: 3000,
        message: 'Copacabana Beach - World-famous stretch of golden sand and endless fun!'
      },

      // Sugarloaf Mountain
      {
        position: [-43.1566, -22.9492],
        zoom: 15.5,
        pitch: 70,
        bearing: 200,
        duration: 3000,
        message: 'Sugarloaf Mountain - Rising dramatically from Guanabara Bay!'
      },

      // Ipanema Beach
      {
        position: [-43.2096, -22.9866],
        zoom: 17,
        pitch: 75,
        bearing: 90,
        duration: 3000,
        message: 'Ipanema Beach - Where beauty and rhythm meet the sea!'
      },

      // Downtown Rio
      {
        position: [-43.1729, -22.9068],
        zoom: 16,
        pitch: 55,
        bearing: 150,
        duration: 3000,
        message: 'Downtown Rio - Where modern skyscrapers dance with historic architecture!'
      }
    ]
  },
  {
    id: 'gothenburg-highlights',
    title: 'Gothenburg Highlights',
    description: 'A scenic tour through the most iconic locations in Gothenburg',
    author: 'William',
    createdAt: new Date('2024-03-29'),
    likes: 0,
    duration: 25000,
    tags: ['official', 'city-tour', 'landmarks'],
    waypoints: [
      // Start with truly global view (extremely zoomed out)
      {
        position: [17, 62],
        zoom: 4.5,
        pitch: 40,
        bearing: 0,
        duration: 1000,
        message: 'Scanning planet Earth for the most amazing cities...'
      },

      // Zoom to Sweden
      {
        position: [17, 62],
        zoom: 4.5,
        pitch: 40,
        bearing: 0,
        duration: 1000,
        message: 'Target located: Sweden! Land of innovation and beautiful nature!'
      },

      // Approach Gothenburg
      {
        position: [12.0, 57.7],
        zoom: 13,
        pitch: 45,
        bearing: 0,
        duration: 2500,
        message: 'Approaching Gothenburg: Sweden\'s coolest city and seafood paradise!'
      },

      // Karlatornet - Scandinavia's tallest building
      {
        position: [11.935, 57.700],
        zoom: 16,
        pitch: 70,
        bearing: 30,
        duration: 4000,
        message: 'Karlatornet - Scandinavia\'s tallest skyscraper reaching for the Nordic sky!'
      },

      // Nya Ullevi - Sweden's largest stadium
      {
        position: [11.988, 57.708],
        zoom: 16,
        pitch: 70,
        bearing: 150,
        duration: 3000,
        message: 'Nya Ullevi - Sweden\'s largest stadium, home to unforgettable sporting events and concerts!'
      },

      // Gamla Ullevi - The classic football stadium
      {
        position: [11.982, 57.708],
        zoom: 16,
        pitch: 65,
        bearing: 210,
        duration: 3000,
        message: 'Gamla Ullevi - The passionate home of Gothenburg\'s beloved football clubs!'
      },
      // Liseberg Amusement Park
      {
        position: [11.991, 57.694],
        zoom: 16,
        pitch: 60,
        bearing: 120,
        duration: 3000,
        message: 'Flying over Liseberg - Scandinavia\'s most popular amusement park!'
      },

      // Haga district - historic neighborhood
      {
        position: [11.961, 57.699],
        zoom: 16,
        pitch: 60,
        bearing: 270,
        duration: 3000,
        message: 'The charming Haga district - famous for its giant cinnamon buns!'
      },

      // Götaplatsen and Avenyn
      {
        position: [11.978, 57.697],
        zoom: 16,
        pitch: 60,
        bearing: 180,
        duration: 3000,
        message: 'Avenyn - Gothenburg\'s grand boulevard and cultural heart!'
      }
    ]
  },
  {
    "id": "new-york-skyline",
    "title": "New York Skyline",
    "description": "A tour through the towering icons of the Big Apple",
    "author": "William",
    "createdAt": new Date('2025-03-29'),
    "likes": 0,
    "duration": 26000,
    "tags": ["official", "city-tour", "skyscrapers"],
    "waypoints": [
      // Zoom to the United States
      {
        "position": [-100, 40],
        "zoom": 4,
        "pitch": 40,
        "bearing": 0,
        "duration": 2000,
        "message": "Target acquired: The USA! Land of dreams and skyscrapers!"
      },
      // Empire State Building
      {
        "position": [-73.985, 40.748],
        "zoom": 16,
        "pitch": 70,
        "bearing": 30,
        "duration": 4000,
        "message": "Empire State Building - The Art Deco king of Manhattan!"
      },
      // One Penn (Penn 1)
      {
        "position": [-73.991, 40.750],
        "zoom": 16,
        "pitch": 65,
        "bearing": 150,
        "duration": 3000,
        "message": "One Penn - A modern titan overlooking Midtown!"
      },
      // Statue of Liberty
      {
        "position": [-74.045, 40.689],
        "zoom": 16,
        "pitch": 60,
        "bearing": 210,
        "duration": 3000,
        "message": "Statue of Liberty - Freedom’s beacon in the harbor!"
      },
      // One Vanderbilt
      {
        "position": [-73.978, 40.753],
        "zoom": 16,
        "pitch": 60,
        "bearing": 90,
        "duration": 3000,
        "message": "One Vanderbilt - A sleek giant with a sky-high view!"
      },
      // Flatiron Building
      {
        "position": [-73.989, 40.741],
        "zoom": 16,
        "pitch": 60,
        "bearing": 270,
        "duration": 3000,
        "message": "Flatiron Building - The wedge that slices through NYC!"
      }
    ]
  },
  {
    "id": "london-highlights",
    "title": "London Highlights",
    "description": "A tour through London’s most iconic landmarks",
    "author": "William",
    "createdAt": new Date('2024-03-29'),
    "likes": 0,
    "duration": 25000,
    "tags": ["official", "city-tour", "landmarks"],
    "waypoints": [

      // Zoom to the United Kingdom
      {
        "position": [0, 51],
        "zoom": 6,
        "pitch": 40,
        "bearing": 0,
        "duration": 2000,
        "message": "Target acquired: The United Kingdom! Land of history and tea!"
      },

      // Big Ben and the Palace of Westminster
      {
        "position": [-0.124, 51.500],
        "zoom": 16,
        "pitch": 70,
        "bearing": 30,
        "duration": 4000,
        "message": "Big Ben and Westminster - Where time chimes and history reigns!"
      },

      // London Eye
      {
        "position": [-0.119, 51.503],
        "zoom": 16,
        "pitch": 65,
        "bearing": 150,
        "duration": 3000,
        "message": "The London Eye - A giant wheel with a view over the Thames!"
      },

      // Tower Bridge
      {
        "position": [-0.075, 51.505],
        "zoom": 16,
        "pitch": 60,
        "bearing": 210,
        "duration": 3000,
        "message": "Tower Bridge - London’s iconic gateway over the river!"
      },

      // St. Paul’s Cathedral
      {
        "position": [-0.098, 51.513],
        "zoom": 16,
        "pitch": 60,
        "bearing": 120,
        "duration": 3000,
        "message": "St. Paul’s Cathedral - A masterpiece soaring above the city!"
      },

      // Trafalgar Square
      {
        "position": [-0.128, 51.508],
        "zoom": 16,
        "pitch": 60,
        "bearing": 270,
        "duration": 3000,
        "message": "Trafalgar Square - Where lions guard Nelson’s Column!"
      },

      // Buckingham Palace
      {
        "position": [-0.141, 51.501],
        "zoom": 16,
        "pitch": 60,
        "bearing": 180,
        "duration": 3000,
        "message": "Buckingham Palace - The royal residence and home of the Guard!"
      }
    ],
  },
  {
    "id": "tokyo-metropolis",
    "title": "Tokyo Metropolis",
    "description": "An exploration of Tokyo’s futuristic towers and historic gems",
    "author": "William",
    "createdAt": new Date('2025-03-29'),
    "likes": 0,
    "duration": 25000,
    "tags": ["official", "city-tour", "architecture"],
    "waypoints": [
      // Zoom to Japan
      {
        "position": [138, 36],
        "zoom": 6,
        "pitch": 40,
        "bearing": 0,
        "duration": 2000,
        "message": "Target acquired: Japan! Where tradition meets the future!"
      },
      // Tokyo Tower
      {
        "position": [139.745, 35.658],
        "zoom": 16,
        "pitch": 70,
        "bearing": 45,
        "duration": 4000,
        "message": "Tokyo Tower - The red-and-white icon lighting up the skyline!"
      },
      // Shibuya Scramble Crossing
      {
        "position": [139.701, 35.659],
        "zoom": 16,
        "pitch": 65,
        "bearing": 120,
        "duration": 3000,
        "message": "Shibuya Crossing - The world’s busiest intersection in motion!"
      },
      // Tokyo Skytree
      {
        "position": [139.810, 35.710],
        "zoom": 16,
        "pitch": 60,
        "bearing": 200,
        "duration": 3000,
        "message": "Tokyo Skytree - The tallest tower piercing the clouds!"
      },
      // Mori Tower (Roppongi Hills)
      {
        "position": [139.731, 35.660],
        "zoom": 16,
        "pitch": 60,
        "bearing": 90,
        "duration": 3000,
        "message": "Mori Tower - A sleek masterpiece in Roppongi’s heart!"
      }
    ]
  },
  {
    "id": "santorini-dreams",
    "title": "Santorini Dreams",
    "description": "A journey through the breathtaking beauty of Santorini’s caldera and whitewashed villages",
    "author": "William",
    "createdAt": new Date('2025-03-29'),
    "likes": 0,
    "duration": 23000,
    "tags": ["official", "island-tour", "scenic"],
    "waypoints": [
      // Zoom to Greece
      {
        "position": [24, 38],
        "zoom": 6,
        "pitch": 40,
        "bearing": 0,
        "duration": 2000,
        "message": "Target acquired: Greece! Land of myths and azure seas!"
      },
      // Oia Village
      {
        "position": [25.376, 36.461],
        "zoom": 16,
        "pitch": 70,
        "bearing": 45,
        "duration": 4000,
        "message": "Oia - Whitewashed cliffs and sunsets that steal your breath!"
      },
      // Fira Town
      {
        "position": [25.431, 36.416],
        "zoom": 16,
        "pitch": 65,
        "bearing": 120,
        "duration": 3000,
        "message": "Fira - Perched atop the caldera with views of volcanic majesty!"
      },
      // Red Beach
      {
        "position": [25.422, 36.349],
        "zoom": 16,
        "pitch": 60,
        "bearing": 200,
        "duration": 3000,
        "message": "Red Beach - Crimson cliffs meet the sparkling Aegean!"
      },
      // Ancient Thera
      {
        "position": [25.440, 36.363],
        "zoom": 16,
        "pitch": 60,
        "bearing": 90,
        "duration": 3000,
        "message": "Ancient Thera - Ruins whispering tales of a lost world!"
      }
    ]
  },
  {
    "id": "patagonia-wilderness",
    "title": "Patagonia Wilderness",
    "description": "An adventure through the rugged, untouched landscapes of Patagonia",
    "author": "William",
    "createdAt": new Date('2025-03-29'),
    "likes": 0,
    "duration": 26000,
    "tags": ["official", "nature-tour", "wilderness"],
    "waypoints": [
      // Zoom to Southern South America
      {
        "position": [-70, -50],
        "zoom": 5,
        "pitch": 40,
        "bearing": 0,
        "duration": 2000,
        "message": "Target acquired: Patagonia! Where the wild meets the sublime!"
      },
      // Torres del Paine
      {
        "position": [-72.983, -51.253],
        "zoom": 14,
        "pitch": 70,
        "bearing": 30,
        "duration": 4000,
        "message": "Torres del Paine - Granite towers piercing the sky!"
      },
      // Perito Moreno Glacier
      {
        "position": [-73.050, -50.483],
        "zoom": 15,
        "pitch": 65,
        "bearing": 150,
        "duration": 4000,
        "message": "Perito Moreno - A frozen giant calving into turquoise waters!"
      },
      // Fitz Roy Mountain
      {
        "position": [-73.043, -49.271],
        "zoom": 14,
        "pitch": 60,
        "bearing": 210,
        "duration": 4000,
        "message": "Fitz Roy - A jagged peak challenging the heavens!"
      },
      // Tierra del Fuego
      {
        "position": [-68.300, -54.800],
        "zoom": 14,
        "pitch": 60,
        "bearing": 180,
        "duration": 3000,
        "message": "Tierra del Fuego - The end of the world in stunning solitude!"
      }
    ]
  },
  {
    "id": "kyoto-serenity",
    "title": "Kyoto Serenity",
    "description": "A peaceful exploration of Kyoto’s timeless temples and gardens",
    "author": "William",
    "createdAt": new Date('2025-03-29'),
    "likes": 0,
    "duration": 24000,
    "tags": ["official", "cultural-tour", "zen"],
    "waypoints": [
      // Zoom to Japan
      {
        "position": [135, 35],
        "zoom": 6,
        "pitch": 40,
        "bearing": 0,
        "duration": 2000,
        "message": "Target acquired: Japan! Land of tradition and tranquility!"
      },
      // Fushimi Inari Shrine
      {
        "position": [135.772, 34.967],
        "zoom": 16,
        "pitch": 70,
        "bearing": 60,
        "duration": 4000,
        "message": "Fushimi Inari - A sea of red torii gates climbing the mountain!"
      },
      // Kinkaku-ji (Golden Pavilion)
      {
        "position": [135.729, 35.039],
        "zoom": 16,
        "pitch": 65,
        "bearing": 120,
        "duration": 3000,
        "message": "Kinkaku-ji - The Golden Pavilion shimmering in serene waters!"
      },
      // Arashiyama Bamboo Grove
      {
        "position": [135.672, 35.017],
        "zoom": 16,
        "pitch": 60,
        "bearing": 180,
        "duration": 3000,
        "message": "Arashiyama - Towering bamboo whispering in the breeze!"
      },
      // Kiyomizu-dera Temple
      {
        "position": [135.785, 34.995],
        "zoom": 16,
        "pitch": 60,
        "bearing": 240,
        "duration": 3000,
        "message": "Kiyomizu-dera - A wooden stage overlooking Kyoto’s beauty!"
      }
    ]
  }
]; 