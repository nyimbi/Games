/**
 * Cross-subject connection data for Connection Quest and Memory Mosaic.
 * Contains puzzles (4 groups of 4) and memory pairs (concept links across subjects).
 */

export interface ConnectionGroup {
  theme: string;
  difficulty: 'gold' | 'sage' | 'coral' | 'ink';
  items: { text: string; subject: string }[];
}

export interface ConnectionPuzzle {
  id: string;
  groups: [ConnectionGroup, ConnectionGroup, ConnectionGroup, ConnectionGroup];
}

export interface MemoryPair {
  itemA: { text: string; subject: string };
  itemB: { text: string; subject: string };
  connection: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// ============================================================================
// CONNECTION PUZZLES (20 puzzles, 80 cross-subject groups)
// ============================================================================

export const CONNECTION_PUZZLES: ConnectionPuzzle[] = [
  {
    id: 'cp1',
    groups: [
      { theme: 'Named after Greek gods', difficulty: 'gold', items: [
        { text: 'Mercury (planet)', subject: 'science' },
        { text: 'Nike (brand)', subject: 'arts' },
        { text: 'Athena (Parthenon)', subject: 'social_studies' },
        { text: 'Odyssey (Homer)', subject: 'literature' },
      ]},
      { theme: 'Things that orbit', difficulty: 'sage', items: [
        { text: 'Moon', subject: 'science' },
        { text: 'Electron', subject: 'science' },
        { text: 'Satellite', subject: 'special_area' },
        { text: 'ISS', subject: 'science' },
      ]},
      { theme: 'Revolutions', difficulty: 'coral', items: [
        { text: 'French Revolution', subject: 'social_studies' },
        { text: 'Industrial Revolution', subject: 'social_studies' },
        { text: 'Copernican Revolution', subject: 'science' },
        { text: 'Digital Revolution', subject: 'special_area' },
      ]},
      { theme: 'Famous bridges', difficulty: 'ink', items: [
        { text: 'Golden Gate', subject: 'social_studies' },
        { text: 'Tower Bridge', subject: 'social_studies' },
        { text: 'Bridge of Sighs', subject: 'literature' },
        { text: 'Rainbow Bridge (myth)', subject: 'literature' },
      ]},
    ],
  },
  {
    id: 'cp2',
    groups: [
      { theme: 'Things with scales', difficulty: 'gold', items: [
        { text: 'Fish', subject: 'science' },
        { text: 'Musical scale', subject: 'arts' },
        { text: 'Justice scales', subject: 'social_studies' },
        { text: 'Map scale', subject: 'social_studies' },
      ]},
      { theme: 'Famous Leonardos', difficulty: 'sage', items: [
        { text: 'da Vinci', subject: 'arts' },
        { text: 'DiCaprio', subject: 'arts' },
        { text: 'Fibonacci', subject: 'science' },
        { text: 'Euler', subject: 'science' },
      ]},
      { theme: 'Types of waves', difficulty: 'coral', items: [
        { text: 'Sound wave', subject: 'science' },
        { text: 'Ocean wave', subject: 'science' },
        { text: 'Heat wave', subject: 'science' },
        { text: 'New Wave (music)', subject: 'arts' },
      ]},
      { theme: 'Contain a color in name', difficulty: 'ink', items: [
        { text: 'Red Cross', subject: 'social_studies' },
        { text: 'Black Hole', subject: 'science' },
        { text: 'Greenland', subject: 'social_studies' },
        { text: 'Blue Danube', subject: 'arts' },
      ]},
    ],
  },
  {
    id: 'cp3',
    groups: [
      { theme: 'Types of cells', difficulty: 'gold', items: [
        { text: 'Battery cell', subject: 'science' },
        { text: 'Prison cell', subject: 'social_studies' },
        { text: 'Biological cell', subject: 'science' },
        { text: 'Spreadsheet cell', subject: 'special_area' },
      ]},
      { theme: 'Inspired by nature', difficulty: 'sage', items: [
        { text: 'Velcro (from burrs)', subject: 'science' },
        { text: 'Bullet train (kingfisher)', subject: 'science' },
        { text: 'Impressionism', subject: 'arts' },
        { text: 'Walden (Thoreau)', subject: 'literature' },
      ]},
      { theme: 'Ancient wonders', difficulty: 'coral', items: [
        { text: 'Great Pyramid', subject: 'social_studies' },
        { text: 'Hanging Gardens', subject: 'social_studies' },
        { text: 'Colossus of Rhodes', subject: 'arts' },
        { text: 'Lighthouse of Alexandria', subject: 'science' },
      ]},
      { theme: '___ of the world', difficulty: 'ink', items: [
        { text: 'End of the World', subject: 'literature' },
        { text: 'Wonders of the World', subject: 'social_studies' },
        { text: 'Roof of the World (Tibet)', subject: 'social_studies' },
        { text: 'Edge of the World', subject: 'science' },
      ]},
    ],
  },
  {
    id: 'cp4',
    groups: [
      { theme: 'Movements in art', difficulty: 'gold', items: [
        { text: 'Cubism', subject: 'arts' },
        { text: 'Surrealism', subject: 'arts' },
        { text: 'Renaissance', subject: 'arts' },
        { text: 'Baroque', subject: 'arts' },
      ]},
      { theme: 'Things that have periods', difficulty: 'sage', items: [
        { text: 'Periodic table', subject: 'science' },
        { text: 'Historical period', subject: 'social_studies' },
        { text: 'Musical period', subject: 'arts' },
        { text: 'Sentence period', subject: 'literature' },
      ]},
      { theme: 'Famous walls', difficulty: 'coral', items: [
        { text: 'Great Wall of China', subject: 'social_studies' },
        { text: 'Berlin Wall', subject: 'social_studies' },
        { text: "Hadrian's Wall", subject: 'social_studies' },
        { text: 'The Wall (Pink Floyd)', subject: 'arts' },
      ]},
      { theme: 'Types of current', difficulty: 'ink', items: [
        { text: 'Electric current', subject: 'science' },
        { text: 'Ocean current', subject: 'science' },
        { text: 'Current events', subject: 'social_studies' },
        { text: 'Current (river)', subject: 'science' },
      ]},
    ],
  },
  {
    id: 'cp5',
    groups: [
      { theme: 'Things that can be flat or sharp', difficulty: 'gold', items: [
        { text: 'Musical note', subject: 'arts' },
        { text: 'Knife', subject: 'science' },
        { text: 'Tire', subject: 'science' },
        { text: 'Cheese', subject: 'special_area' },
      ]},
      { theme: 'Written on paper first', difficulty: 'sage', items: [
        { text: 'US Constitution', subject: 'social_studies' },
        { text: 'Theory of Relativity', subject: 'science' },
        { text: 'Beethoven\'s 5th', subject: 'arts' },
        { text: 'Harry Potter', subject: 'literature' },
      ]},
      { theme: 'Journeys in literature', difficulty: 'coral', items: [
        { text: 'The Odyssey', subject: 'literature' },
        { text: 'The Hobbit', subject: 'literature' },
        { text: 'Gulliver\'s Travels', subject: 'literature' },
        { text: 'Around the World in 80 Days', subject: 'literature' },
      ]},
      { theme: 'Things measured in degrees', difficulty: 'ink', items: [
        { text: 'Temperature', subject: 'science' },
        { text: 'Angle', subject: 'science' },
        { text: 'University degree', subject: 'social_studies' },
        { text: 'Latitude', subject: 'social_studies' },
      ]},
    ],
  },
  {
    id: 'cp6',
    groups: [
      { theme: 'Elements named after places', difficulty: 'gold', items: [
        { text: 'Californium', subject: 'science' },
        { text: 'Francium', subject: 'science' },
        { text: 'Americium', subject: 'science' },
        { text: 'Germanium', subject: 'science' },
      ]},
      { theme: 'Things with keys', difficulty: 'sage', items: [
        { text: 'Piano', subject: 'arts' },
        { text: 'Computer keyboard', subject: 'special_area' },
        { text: 'Map legend (key)', subject: 'social_studies' },
        { text: 'Key signature', subject: 'arts' },
      ]},
      { theme: 'Famous pairs in literature', difficulty: 'coral', items: [
        { text: 'Romeo & Juliet', subject: 'literature' },
        { text: 'Don Quixote & Sancho', subject: 'literature' },
        { text: 'Sherlock & Watson', subject: 'literature' },
        { text: 'Huck & Jim', subject: 'literature' },
      ]},
      { theme: 'Types of power', difficulty: 'ink', items: [
        { text: 'Solar power', subject: 'science' },
        { text: 'Political power', subject: 'social_studies' },
        { text: 'Power chord', subject: 'arts' },
        { text: 'Purchasing power', subject: 'social_studies' },
      ]},
    ],
  },
  {
    id: 'cp7',
    groups: [
      { theme: 'Things with rings', difficulty: 'gold', items: [
        { text: 'Saturn', subject: 'science' },
        { text: 'Olympic rings', subject: 'special_area' },
        { text: 'Tree rings', subject: 'science' },
        { text: 'Boxing ring', subject: 'special_area' },
      ]},
      { theme: 'Renaissance figures', difficulty: 'sage', items: [
        { text: 'Michelangelo', subject: 'arts' },
        { text: 'Galileo', subject: 'science' },
        { text: 'Machiavelli', subject: 'social_studies' },
        { text: 'Shakespeare', subject: 'literature' },
      ]},
      { theme: 'Things that can be broken', difficulty: 'coral', items: [
        { text: 'Sound barrier', subject: 'science' },
        { text: 'World record', subject: 'special_area' },
        { text: 'Code (cipher)', subject: 'science' },
        { text: 'Fourth wall', subject: 'arts' },
      ]},
      { theme: 'Contain an animal', difficulty: 'ink', items: [
        { text: 'Catfish', subject: 'science' },
        { text: 'Dogma', subject: 'literature' },
        { text: 'Foxhound', subject: 'science' },
        { text: 'Bearish market', subject: 'social_studies' },
      ]},
    ],
  },
  {
    id: 'cp8',
    groups: [
      { theme: 'Things that flow', difficulty: 'gold', items: [
        { text: 'River', subject: 'science' },
        { text: 'Electricity', subject: 'science' },
        { text: 'Traffic', subject: 'social_studies' },
        { text: 'Music', subject: 'arts' },
      ]},
      { theme: 'Inventions that changed travel', difficulty: 'sage', items: [
        { text: 'Steam engine', subject: 'science' },
        { text: 'Compass', subject: 'science' },
        { text: 'Airplane', subject: 'science' },
        { text: 'GPS', subject: 'special_area' },
      ]},
      { theme: 'Dystopian novels', difficulty: 'coral', items: [
        { text: '1984', subject: 'literature' },
        { text: 'Brave New World', subject: 'literature' },
        { text: 'Fahrenheit 451', subject: 'literature' },
        { text: 'The Giver', subject: 'literature' },
      ]},
      { theme: 'Types of bonds', difficulty: 'ink', items: [
        { text: 'Chemical bond', subject: 'science' },
        { text: 'James Bond', subject: 'arts' },
        { text: 'Government bond', subject: 'social_studies' },
        { text: 'Bail bond', subject: 'social_studies' },
      ]},
    ],
  },
  {
    id: 'cp9',
    groups: [
      { theme: 'Things shaped like a circle', difficulty: 'gold', items: [
        { text: 'Earth (globe)', subject: 'science' },
        { text: 'Clock face', subject: 'special_area' },
        { text: 'Pizza', subject: 'special_area' },
        { text: 'Vinyl record', subject: 'arts' },
      ]},
      { theme: 'Nobel Prize categories', difficulty: 'sage', items: [
        { text: 'Physics', subject: 'science' },
        { text: 'Literature', subject: 'literature' },
        { text: 'Peace', subject: 'social_studies' },
        { text: 'Chemistry', subject: 'science' },
      ]},
      { theme: 'Shakespeare plays', difficulty: 'coral', items: [
        { text: 'Hamlet', subject: 'literature' },
        { text: 'Macbeth', subject: 'literature' },
        { text: 'Othello', subject: 'literature' },
        { text: 'The Tempest', subject: 'literature' },
      ]},
      { theme: 'Things with crowns', difficulty: 'ink', items: [
        { text: 'Monarch', subject: 'social_studies' },
        { text: 'Tooth', subject: 'science' },
        { text: 'Rooster', subject: 'science' },
        { text: 'Chess queen', subject: 'special_area' },
      ]},
    ],
  },
  {
    id: 'cp10',
    groups: [
      { theme: 'Explorers', difficulty: 'gold', items: [
        { text: 'Columbus', subject: 'social_studies' },
        { text: 'Marco Polo', subject: 'social_studies' },
        { text: 'Neil Armstrong', subject: 'science' },
        { text: 'Jacques Cousteau', subject: 'science' },
      ]},
      { theme: 'Types of harmony', difficulty: 'sage', items: [
        { text: 'Musical harmony', subject: 'arts' },
        { text: 'Color harmony', subject: 'arts' },
        { text: 'Social harmony', subject: 'social_studies' },
        { text: 'Ecosystem balance', subject: 'science' },
      ]},
      { theme: 'Things that can eclipse', difficulty: 'coral', items: [
        { text: 'Sun', subject: 'science' },
        { text: 'Moon', subject: 'science' },
        { text: 'Fame', subject: 'arts' },
        { text: 'Economic power', subject: 'social_studies' },
      ]},
      { theme: 'Codes and ciphers', difficulty: 'ink', items: [
        { text: 'Morse code', subject: 'science' },
        { text: 'Da Vinci Code', subject: 'literature' },
        { text: 'Enigma machine', subject: 'social_studies' },
        { text: 'Binary code', subject: 'special_area' },
      ]},
    ],
  },
  {
    id: 'cp11',
    groups: [
      { theme: 'Things with layers', difficulty: 'gold', items: [
        { text: 'Atmosphere', subject: 'science' },
        { text: 'Cake', subject: 'special_area' },
        { text: 'Paint on canvas', subject: 'arts' },
        { text: 'Earth\'s crust', subject: 'science' },
      ]},
      { theme: 'Symbols on flags', difficulty: 'sage', items: [
        { text: 'Star', subject: 'social_studies' },
        { text: 'Crescent', subject: 'social_studies' },
        { text: 'Sun', subject: 'social_studies' },
        { text: 'Eagle', subject: 'social_studies' },
      ]},
      { theme: 'Children\'s book authors', difficulty: 'coral', items: [
        { text: 'Roald Dahl', subject: 'literature' },
        { text: 'Dr. Seuss', subject: 'literature' },
        { text: 'J.K. Rowling', subject: 'literature' },
        { text: 'C.S. Lewis', subject: 'literature' },
      ]},
      { theme: 'Spectrum-related', difficulty: 'ink', items: [
        { text: 'Light spectrum', subject: 'science' },
        { text: 'Political spectrum', subject: 'social_studies' },
        { text: 'Radio spectrum', subject: 'science' },
        { text: 'Autism spectrum', subject: 'science' },
      ]},
    ],
  },
  {
    id: 'cp12',
    groups: [
      { theme: 'Things that melt', difficulty: 'gold', items: [
        { text: 'Ice', subject: 'science' },
        { text: 'Chocolate', subject: 'special_area' },
        { text: 'Dali\'s clocks', subject: 'arts' },
        { text: 'Glaciers', subject: 'science' },
      ]},
      { theme: 'Musical instruments', difficulty: 'sage', items: [
        { text: 'Violin', subject: 'arts' },
        { text: 'Drum', subject: 'arts' },
        { text: 'Flute', subject: 'arts' },
        { text: 'Trumpet', subject: 'arts' },
      ]},
      { theme: 'Empires', difficulty: 'coral', items: [
        { text: 'Roman Empire', subject: 'social_studies' },
        { text: 'British Empire', subject: 'social_studies' },
        { text: 'Ottoman Empire', subject: 'social_studies' },
        { text: 'Mongol Empire', subject: 'social_studies' },
      ]},
      { theme: 'Types of plates', difficulty: 'ink', items: [
        { text: 'Tectonic plate', subject: 'science' },
        { text: 'Dinner plate', subject: 'special_area' },
        { text: 'License plate', subject: 'social_studies' },
        { text: 'Home plate', subject: 'special_area' },
      ]},
    ],
  },
  {
    id: 'cp13',
    groups: [
      { theme: 'Things with wings', difficulty: 'gold', items: [
        { text: 'Bird', subject: 'science' },
        { text: 'Airplane', subject: 'science' },
        { text: 'Angel (art)', subject: 'arts' },
        { text: 'Building wing', subject: 'arts' },
      ]},
      { theme: 'Related to gravity', difficulty: 'sage', items: [
        { text: 'Newton\'s apple', subject: 'science' },
        { text: 'Tides', subject: 'science' },
        { text: 'Falling (in poetry)', subject: 'literature' },
        { text: 'Weight', subject: 'science' },
      ]},
      { theme: 'Banned books', difficulty: 'coral', items: [
        { text: 'To Kill a Mockingbird', subject: 'literature' },
        { text: 'The Catcher in the Rye', subject: 'literature' },
        { text: 'Animal Farm', subject: 'literature' },
        { text: 'Lord of the Flies', subject: 'literature' },
      ]},
      { theme: 'Types of charts', difficulty: 'ink', items: [
        { text: 'Pie chart', subject: 'science' },
        { text: 'Star chart', subject: 'science' },
        { text: 'Music chart', subject: 'arts' },
        { text: 'Flow chart', subject: 'special_area' },
      ]},
    ],
  },
  {
    id: 'cp14',
    groups: [
      { theme: 'Things at the bottom of the ocean', difficulty: 'gold', items: [
        { text: 'Coral reef', subject: 'science' },
        { text: 'Titanic wreck', subject: 'social_studies' },
        { text: 'Hydrothermal vent', subject: 'science' },
        { text: 'Mariana Trench', subject: 'science' },
      ]},
      { theme: 'Dance forms', difficulty: 'sage', items: [
        { text: 'Ballet', subject: 'arts' },
        { text: 'Tango', subject: 'arts' },
        { text: 'Hip-hop dance', subject: 'arts' },
        { text: 'Bharatanatyam', subject: 'arts' },
      ]},
      { theme: 'Things with roots', difficulty: 'coral', items: [
        { text: 'Tree', subject: 'science' },
        { text: 'Word (etymology)', subject: 'literature' },
        { text: 'Cultural roots', subject: 'social_studies' },
        { text: 'Square root', subject: 'science' },
      ]},
      { theme: 'Paradoxes', difficulty: 'ink', items: [
        { text: 'Schrödinger\'s cat', subject: 'science' },
        { text: 'Ship of Theseus', subject: 'literature' },
        { text: 'Bootstrap paradox', subject: 'science' },
        { text: 'Catch-22', subject: 'literature' },
      ]},
    ],
  },
  {
    id: 'cp15',
    groups: [
      { theme: 'Forms of energy', difficulty: 'gold', items: [
        { text: 'Kinetic energy', subject: 'science' },
        { text: 'Solar energy', subject: 'science' },
        { text: 'Sound energy', subject: 'science' },
        { text: 'Thermal energy', subject: 'science' },
      ]},
      { theme: 'Things that can be golden', difficulty: 'sage', items: [
        { text: 'Golden ratio', subject: 'science' },
        { text: 'Golden age', subject: 'social_studies' },
        { text: 'Golden Gate', subject: 'social_studies' },
        { text: 'Golden fleece (myth)', subject: 'literature' },
      ]},
      { theme: 'Things with trunks', difficulty: 'coral', items: [
        { text: 'Elephant', subject: 'science' },
        { text: 'Tree', subject: 'science' },
        { text: 'Car trunk', subject: 'special_area' },
        { text: 'Steamer trunk', subject: 'social_studies' },
      ]},
      { theme: 'Silent letters', difficulty: 'ink', items: [
        { text: 'Knight', subject: 'social_studies' },
        { text: 'Psychology', subject: 'science' },
        { text: 'Pneumonia', subject: 'science' },
        { text: 'Rhetoric', subject: 'literature' },
      ]},
    ],
  },
  {
    id: 'cp16',
    groups: [
      { theme: 'Things discovered by accident', difficulty: 'gold', items: [
        { text: 'Penicillin', subject: 'science' },
        { text: 'Americas (Columbus)', subject: 'social_studies' },
        { text: 'X-rays', subject: 'science' },
        { text: 'Microwave oven', subject: 'science' },
      ]},
      { theme: 'Types of composition', difficulty: 'sage', items: [
        { text: 'Musical composition', subject: 'arts' },
        { text: 'Photo composition', subject: 'arts' },
        { text: 'Essay composition', subject: 'literature' },
        { text: 'Chemical composition', subject: 'science' },
      ]},
      { theme: 'Famous speeches', difficulty: 'coral', items: [
        { text: 'I Have a Dream', subject: 'social_studies' },
        { text: 'Gettysburg Address', subject: 'social_studies' },
        { text: 'We Shall Fight on the Beaches', subject: 'social_studies' },
        { text: 'To be or not to be', subject: 'literature' },
      ]},
      { theme: 'Things with needles', difficulty: 'ink', items: [
        { text: 'Compass', subject: 'science' },
        { text: 'Pine tree', subject: 'science' },
        { text: 'Sewing', subject: 'arts' },
        { text: 'Vinyl record player', subject: 'arts' },
      ]},
    ],
  },
  {
    id: 'cp17',
    groups: [
      { theme: 'Things with a horizon', difficulty: 'gold', items: [
        { text: 'Ocean', subject: 'science' },
        { text: 'Event horizon (black hole)', subject: 'science' },
        { text: 'Painting perspective', subject: 'arts' },
        { text: 'Planning horizon', subject: 'social_studies' },
      ]},
      { theme: 'Board games', difficulty: 'sage', items: [
        { text: 'Chess', subject: 'special_area' },
        { text: 'Go', subject: 'special_area' },
        { text: 'Monopoly', subject: 'special_area' },
        { text: 'Scrabble', subject: 'literature' },
      ]},
      { theme: 'Things with branches', difficulty: 'coral', items: [
        { text: 'Tree', subject: 'science' },
        { text: 'Government branch', subject: 'social_studies' },
        { text: 'Bank branch', subject: 'social_studies' },
        { text: 'River branch', subject: 'science' },
      ]},
      { theme: 'Named after real people', difficulty: 'ink', items: [
        { text: 'Fahrenheit', subject: 'science' },
        { text: 'Machiavellian', subject: 'social_studies' },
        { text: 'Kafkaesque', subject: 'literature' },
        { text: 'Braille', subject: 'special_area' },
      ]},
    ],
  },
  {
    id: 'cp18',
    groups: [
      { theme: 'Things under pressure', difficulty: 'gold', items: [
        { text: 'Diamond formation', subject: 'science' },
        { text: 'Deep sea creatures', subject: 'science' },
        { text: 'Pressure cooker', subject: 'special_area' },
        { text: 'Under Pressure (song)', subject: 'arts' },
      ]},
      { theme: 'Map projections/views', difficulty: 'sage', items: [
        { text: 'Mercator', subject: 'social_studies' },
        { text: 'Globe', subject: 'social_studies' },
        { text: 'Satellite view', subject: 'science' },
        { text: 'Bird\'s eye view', subject: 'arts' },
      ]},
      { theme: 'Things with shells', difficulty: 'coral', items: [
        { text: 'Turtle', subject: 'science' },
        { text: 'Egg', subject: 'science' },
        { text: 'Shell company', subject: 'social_studies' },
        { text: 'Bombshell (origin)', subject: 'literature' },
      ]},
      { theme: 'Mathematical concepts in art', difficulty: 'ink', items: [
        { text: 'Fibonacci spiral', subject: 'science' },
        { text: 'Fractal art', subject: 'arts' },
        { text: 'Escher tessellations', subject: 'arts' },
        { text: 'Perspective geometry', subject: 'arts' },
      ]},
    ],
  },
  {
    id: 'cp19',
    groups: [
      { theme: 'Things with a pulse', difficulty: 'gold', items: [
        { text: 'Heartbeat', subject: 'science' },
        { text: 'Music beat', subject: 'arts' },
        { text: 'Electromagnetic pulse', subject: 'science' },
        { text: 'Pulse (lentils)', subject: 'special_area' },
      ]},
      { theme: 'Island nations', difficulty: 'sage', items: [
        { text: 'Japan', subject: 'social_studies' },
        { text: 'Iceland', subject: 'social_studies' },
        { text: 'Madagascar', subject: 'social_studies' },
        { text: 'New Zealand', subject: 'social_studies' },
      ]},
      { theme: 'Light-related', difficulty: 'coral', items: [
        { text: 'Photosynthesis', subject: 'science' },
        { text: 'Photography', subject: 'arts' },
        { text: 'Enlightenment', subject: 'social_studies' },
        { text: 'Speed of light', subject: 'science' },
      ]},
      { theme: 'Fictional islands', difficulty: 'ink', items: [
        { text: 'Treasure Island', subject: 'literature' },
        { text: 'Neverland', subject: 'literature' },
        { text: 'Jurassic Park (Isla Nublar)', subject: 'literature' },
        { text: 'Utopia', subject: 'literature' },
      ]},
    ],
  },
  {
    id: 'cp20',
    groups: [
      { theme: 'Measurement systems', difficulty: 'gold', items: [
        { text: 'Metric system', subject: 'science' },
        { text: 'Richter scale', subject: 'science' },
        { text: 'Decibel scale', subject: 'science' },
        { text: 'pH scale', subject: 'science' },
      ]},
      { theme: 'Things that migrate', difficulty: 'sage', items: [
        { text: 'Birds', subject: 'science' },
        { text: 'Whales', subject: 'science' },
        { text: 'People (human migration)', subject: 'social_studies' },
        { text: 'Butterflies', subject: 'science' },
      ]},
      { theme: 'Color in art movements', difficulty: 'coral', items: [
        { text: 'Blue Period (Picasso)', subject: 'arts' },
        { text: 'Fauvism (wild beasts of color)', subject: 'arts' },
        { text: 'De Stijl (primary colors)', subject: 'arts' },
        { text: 'Pointillism (color dots)', subject: 'arts' },
      ]},
      { theme: 'Transport + literature', difficulty: 'ink', items: [
        { text: 'Orient Express (Christie)', subject: 'literature' },
        { text: 'Chitty Chitty Bang Bang', subject: 'literature' },
        { text: 'The Polar Express', subject: 'literature' },
        { text: '20,000 Leagues Under the Sea', subject: 'literature' },
      ]},
    ],
  },
];

// ============================================================================
// MEMORY PAIRS (60 cross-subject linked concepts)
// ============================================================================

export const MEMORY_PAIRS: MemoryPair[] = [
  // Easy pairs (20)
  { itemA: { text: 'Theory of Relativity', subject: 'science' }, itemB: { text: 'Persistence of Memory (Dali)', subject: 'arts' }, connection: 'Both explore the nature of time', difficulty: 'easy' },
  { itemA: { text: 'Newton\'s Apple', subject: 'science' }, itemB: { text: 'Garden of Eden Apple', subject: 'literature' }, connection: 'Apples that changed our understanding', difficulty: 'easy' },
  { itemA: { text: 'DNA Double Helix', subject: 'science' }, itemB: { text: 'Spiral Staircase (architecture)', subject: 'arts' }, connection: 'Both are spiral structures', difficulty: 'easy' },
  { itemA: { text: 'Water Cycle', subject: 'science' }, itemB: { text: 'Circle of Life (Lion King)', subject: 'arts' }, connection: 'Both are endless cycles', difficulty: 'easy' },
  { itemA: { text: 'Compass', subject: 'science' }, itemB: { text: 'North Star in Poetry', subject: 'literature' }, connection: 'Both guide travelers', difficulty: 'easy' },
  { itemA: { text: 'Fossils', subject: 'science' }, itemB: { text: 'Ancient Scrolls', subject: 'social_studies' }, connection: 'Both preserve the past', difficulty: 'easy' },
  { itemA: { text: 'Solar System', subject: 'science' }, itemB: { text: 'The Starry Night (van Gogh)', subject: 'arts' }, connection: 'Both depict celestial objects', difficulty: 'easy' },
  { itemA: { text: 'Echo (sound)', subject: 'science' }, itemB: { text: 'Echo (Greek myth)', subject: 'literature' }, connection: 'The myth inspired the science term', difficulty: 'easy' },
  { itemA: { text: 'Volcano', subject: 'science' }, itemB: { text: 'Pompeii', subject: 'social_studies' }, connection: 'Natural force shaped human history', difficulty: 'easy' },
  { itemA: { text: 'Light Prism', subject: 'science' }, itemB: { text: 'Rainbow in Art', subject: 'arts' }, connection: 'Both split white light into colors', difficulty: 'easy' },
  { itemA: { text: 'Migration (animals)', subject: 'science' }, itemB: { text: 'Immigration (people)', subject: 'social_studies' }, connection: 'Both involve mass movement for survival', difficulty: 'easy' },
  { itemA: { text: 'Telescope', subject: 'science' }, itemB: { text: 'Galileo on Trial', subject: 'social_studies' }, connection: 'A tool that challenged authority', difficulty: 'easy' },
  { itemA: { text: 'Seed Growth', subject: 'science' }, itemB: { text: 'Character Growth (novels)', subject: 'literature' }, connection: 'Both describe development from small beginnings', difficulty: 'easy' },
  { itemA: { text: 'Butterfly', subject: 'science' }, itemB: { text: 'Metamorphosis (Kafka)', subject: 'literature' }, connection: 'Both involve transformation', difficulty: 'easy' },
  { itemA: { text: 'Bridge (engineering)', subject: 'science' }, itemB: { text: 'Bridge (music)', subject: 'arts' }, connection: 'Both connect two sections', difficulty: 'easy' },
  { itemA: { text: 'Gravity', subject: 'science' }, itemB: { text: 'Icarus (myth)', subject: 'literature' }, connection: 'Both about falling from heights', difficulty: 'easy' },
  { itemA: { text: 'Periodic Table', subject: 'science' }, itemB: { text: 'Alphabet', subject: 'literature' }, connection: 'Both are organized systems of building blocks', difficulty: 'easy' },
  { itemA: { text: 'Moon Phases', subject: 'science' }, itemB: { text: 'Islamic Calendar', subject: 'social_studies' }, connection: 'Lunar cycles mark time in both', difficulty: 'easy' },
  { itemA: { text: 'Electric Circuit', subject: 'science' }, itemB: { text: 'Plot Circle (narrative)', subject: 'literature' }, connection: 'Both follow a complete loop', difficulty: 'easy' },
  { itemA: { text: 'Camera Obscura', subject: 'science' }, itemB: { text: 'Renaissance Painting', subject: 'arts' }, connection: 'Scientific tool that revolutionized art', difficulty: 'easy' },

  // Medium pairs (20)
  { itemA: { text: 'Fibonacci Sequence', subject: 'science' }, itemB: { text: 'Spiral in Nautilus Shell', subject: 'arts' }, connection: 'Mathematics visible in nature and art', difficulty: 'medium' },
  { itemA: { text: 'Black Holes', subject: 'science' }, itemB: { text: 'The Abyss (literature)', subject: 'literature' }, connection: 'Both represent the unknowable void', difficulty: 'medium' },
  { itemA: { text: 'Plate Tectonics', subject: 'science' }, itemB: { text: 'Continental Empires', subject: 'social_studies' }, connection: 'Both shaped by the movement of landmasses', difficulty: 'medium' },
  { itemA: { text: 'Doppler Effect', subject: 'science' }, itemB: { text: 'Sirens in The Odyssey', subject: 'literature' }, connection: 'Sound that changes as you move toward or away', difficulty: 'medium' },
  { itemA: { text: 'Camouflage (biology)', subject: 'science' }, itemB: { text: 'Irony (literature)', subject: 'literature' }, connection: 'Both hide true nature beneath surface', difficulty: 'medium' },
  { itemA: { text: 'Symbiosis', subject: 'science' }, itemB: { text: 'Trade Alliances', subject: 'social_studies' }, connection: 'Both are mutually beneficial partnerships', difficulty: 'medium' },
  { itemA: { text: 'Erosion', subject: 'science' }, itemB: { text: 'Fall of Rome', subject: 'social_studies' }, connection: 'Both describe gradual wearing away', difficulty: 'medium' },
  { itemA: { text: 'Pendulum', subject: 'science' }, itemB: { text: 'Political Swing', subject: 'social_studies' }, connection: 'Both oscillate between extremes', difficulty: 'medium' },
  { itemA: { text: 'Constellations', subject: 'science' }, itemB: { text: 'Aboriginal Dreamtime', subject: 'social_studies' }, connection: 'Stars used to tell stories across cultures', difficulty: 'medium' },
  { itemA: { text: 'Vaccination', subject: 'science' }, itemB: { text: 'Prometheus (fire to humans)', subject: 'literature' }, connection: 'Both gave humanity protection at great cost', difficulty: 'medium' },
  { itemA: { text: 'Crystallization', subject: 'science' }, itemB: { text: 'Haiku Poetry', subject: 'literature' }, connection: 'Both distill complexity into perfect form', difficulty: 'medium' },
  { itemA: { text: 'Adaptation (evolution)', subject: 'science' }, itemB: { text: 'Book-to-Film Adaptation', subject: 'arts' }, connection: 'Both transform to fit a new environment', difficulty: 'medium' },
  { itemA: { text: 'Refraction', subject: 'science' }, itemB: { text: 'Point of View (narrative)', subject: 'literature' }, connection: 'Both show how perspective bends reality', difficulty: 'medium' },
  { itemA: { text: 'Carbon Dating', subject: 'science' }, itemB: { text: 'Historical Archives', subject: 'social_studies' }, connection: 'Both methods of dating the past', difficulty: 'medium' },
  { itemA: { text: 'Entropy', subject: 'science' }, itemB: { text: 'Ozymandias (Shelley)', subject: 'literature' }, connection: 'Both describe inevitable decay and disorder', difficulty: 'medium' },
  { itemA: { text: 'Magnetic Poles', subject: 'science' }, itemB: { text: 'Cold War Superpowers', subject: 'social_studies' }, connection: 'Both involve opposing forces of attraction', difficulty: 'medium' },
  { itemA: { text: 'Photosynthesis', subject: 'science' }, itemB: { text: 'Impressionist Light', subject: 'arts' }, connection: 'Both capture and transform light', difficulty: 'medium' },
  { itemA: { text: 'Food Chain', subject: 'science' }, itemB: { text: 'Social Hierarchy', subject: 'social_studies' }, connection: 'Both are systems of power from top to bottom', difficulty: 'medium' },
  { itemA: { text: 'Mutation', subject: 'science' }, itemB: { text: 'Jazz Improvisation', subject: 'arts' }, connection: 'Both create novelty through unexpected changes', difficulty: 'medium' },
  { itemA: { text: 'Supernova', subject: 'science' }, itemB: { text: 'Renaissance', subject: 'social_studies' }, connection: 'Both are explosive rebirths from destruction', difficulty: 'medium' },

  // Hard pairs (20)
  { itemA: { text: 'Quantum Entanglement', subject: 'science' }, itemB: { text: 'Soulmates (Plato)', subject: 'literature' }, connection: 'Both describe instant connection across distance', difficulty: 'hard' },
  { itemA: { text: 'Heisenberg Uncertainty', subject: 'science' }, itemB: { text: 'Unreliable Narrator', subject: 'literature' }, connection: 'Both show that observation changes what we see', difficulty: 'hard' },
  { itemA: { text: 'Catalyst (chemistry)', subject: 'science' }, itemB: { text: 'Rosa Parks', subject: 'social_studies' }, connection: 'Both trigger transformation without being consumed', difficulty: 'hard' },
  { itemA: { text: 'Fractals', subject: 'science' }, itemB: { text: 'Russian Nesting Dolls', subject: 'arts' }, connection: 'Both contain copies of themselves at every scale', difficulty: 'hard' },
  { itemA: { text: 'Dark Matter', subject: 'science' }, itemB: { text: 'The Subconscious (Freud)', subject: 'social_studies' }, connection: 'Both are invisible forces that shape what we see', difficulty: 'hard' },
  { itemA: { text: 'Wave-Particle Duality', subject: 'science' }, itemB: { text: 'Ambiguity in Poetry', subject: 'literature' }, connection: 'Both show things can be two things at once', difficulty: 'hard' },
  { itemA: { text: 'Ecosystem Collapse', subject: 'science' }, itemB: { text: 'Tragedy (genre)', subject: 'literature' }, connection: 'Both describe cascading failure from a single flaw', difficulty: 'hard' },
  { itemA: { text: 'Parallax', subject: 'science' }, itemB: { text: 'Rashomon Effect', subject: 'arts' }, connection: 'Both show different views of the same object', difficulty: 'hard' },
  { itemA: { text: 'Vestigial Organs', subject: 'science' }, itemB: { text: 'Archaic Words', subject: 'literature' }, connection: 'Both are remnants of a previous era', difficulty: 'hard' },
  { itemA: { text: 'Nuclear Fission', subject: 'science' }, itemB: { text: 'Civil War', subject: 'social_studies' }, connection: 'Both split a unified whole with enormous energy', difficulty: 'hard' },
  { itemA: { text: 'Resonance Frequency', subject: 'science' }, itemB: { text: 'Rhetoric (Aristotle)', subject: 'literature' }, connection: 'Both find the exact frequency that moves the audience', difficulty: 'hard' },
  { itemA: { text: 'Schrödinger\'s Cat', subject: 'science' }, itemB: { text: 'Hamlet\'s Indecision', subject: 'literature' }, connection: 'Both exist in a state of unresolved duality', difficulty: 'hard' },
  { itemA: { text: 'Tidal Locking', subject: 'science' }, itemB: { text: 'Codependency (psychology)', subject: 'social_studies' }, connection: 'Both describe one side always facing the other', difficulty: 'hard' },
  { itemA: { text: 'Antimatter', subject: 'science' }, itemB: { text: 'Antihero', subject: 'literature' }, connection: 'Both are the opposite of the expected norm', difficulty: 'hard' },
  { itemA: { text: 'Biomimicry', subject: 'science' }, itemB: { text: 'Ekphrasis (art in writing)', subject: 'literature' }, connection: 'Both create by imitating another medium', difficulty: 'hard' },
  { itemA: { text: 'Half-Life (radioactive)', subject: 'science' }, itemB: { text: 'Nostalgia', subject: 'literature' }, connection: 'Both describe something that fades but never fully disappears', difficulty: 'hard' },
  { itemA: { text: 'Interference Pattern', subject: 'science' }, itemB: { text: 'Counterpoint (music)', subject: 'arts' }, connection: 'Both create beauty from overlapping waves', difficulty: 'hard' },
  { itemA: { text: 'Hubble Redshift', subject: 'science' }, itemB: { text: 'Loss of Innocence', subject: 'literature' }, connection: 'Both describe things moving irreversibly apart', difficulty: 'hard' },
  { itemA: { text: 'Emergent Behavior', subject: 'science' }, itemB: { text: 'Democracy', subject: 'social_studies' }, connection: 'Both arise from many simple agents acting together', difficulty: 'hard' },
  { itemA: { text: 'Thermal Equilibrium', subject: 'science' }, itemB: { text: 'Treaty of Westphalia', subject: 'social_studies' }, connection: 'Both describe systems reaching a stable balance', difficulty: 'hard' },
];

// ============================================================================
// DAILY PUZZLE SEEDING
// ============================================================================

/**
 * Get today's daily puzzle index, seeded by date so everyone gets the same puzzle.
 */
export function getDailyPuzzleIndex(): number {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return seed % CONNECTION_PUZZLES.length;
}

/**
 * Get today's Connection Quest puzzle.
 */
export function getDailyPuzzle(): ConnectionPuzzle {
  return CONNECTION_PUZZLES[getDailyPuzzleIndex()];
}

/**
 * Get a random puzzle (non-daily).
 */
export function getRandomPuzzle(excludeId?: string): ConnectionPuzzle {
  const available = excludeId
    ? CONNECTION_PUZZLES.filter(p => p.id !== excludeId)
    : CONNECTION_PUZZLES;
  return available[Math.floor(Math.random() * available.length)];
}

/**
 * Get memory pairs by difficulty, shuffled.
 */
export function getMemoryPairs(difficulty?: 'easy' | 'medium' | 'hard', count?: number): MemoryPair[] {
  let pairs = [...MEMORY_PAIRS];
  if (difficulty) {
    pairs = pairs.filter(p => p.difficulty === difficulty);
  }
  // Shuffle
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return count ? pairs.slice(0, count) : pairs;
}
