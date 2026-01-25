/**
 * Question database for Scholar Games
 * Contains 200+ questions across 5 subjects and 3 difficulty levels
 * Designed for World Scholars Cup preparation (ages 9-12)
 */

import type { Question } from '@/lib/api/client';

// Helper to create question IDs
let questionId = 0;
const createQuestion = (
  subject: string,
  difficulty: 'easy' | 'medium' | 'hard',
  text: string,
  options: string[],
  correct_index: number,
  explanation?: string
): Question => ({
  id: `q${++questionId}`,
  subject,
  difficulty,
  text,
  options,
  correct_index,
  explanation,
  time_limit_seconds: difficulty === 'easy' ? 20 : difficulty === 'medium' ? 25 : 30,
});

// ============================================================================
// SCIENCE QUESTIONS (40 questions)
// ============================================================================
export const scienceQuestions: Question[] = [
  // Easy (15)
  createQuestion('science', 'easy', 'What is the chemical symbol for water?', ['H2O', 'CO2', 'NaCl', 'O2'], 0, 'Water is made of two hydrogen atoms and one oxygen atom.'),
  createQuestion('science', 'easy', 'Which planet is known as the Red Planet?', ['Venus', 'Mars', 'Jupiter', 'Saturn'], 1, 'Mars appears red due to iron oxide (rust) on its surface.'),
  createQuestion('science', 'easy', 'What gas do plants absorb from the air?', ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Helium'], 1, 'Plants absorb CO2 for photosynthesis and release oxygen.'),
  createQuestion('science', 'easy', 'How many legs does a spider have?', ['6', '8', '10', '4'], 1, 'Spiders are arachnids and have 8 legs.'),
  createQuestion('science', 'easy', 'What is the largest organ in the human body?', ['Heart', 'Brain', 'Skin', 'Liver'], 2, 'Skin covers about 20 square feet in adults.'),
  createQuestion('science', 'easy', 'What do we call animals that eat only plants?', ['Carnivores', 'Herbivores', 'Omnivores', 'Insectivores'], 1, 'Herbivores like cows and rabbits eat only plants.'),
  createQuestion('science', 'easy', 'Which force keeps us on the ground?', ['Magnetism', 'Friction', 'Gravity', 'Electricity'], 2, 'Gravity pulls objects toward Earth\'s center.'),
  createQuestion('science', 'easy', 'What is the boiling point of water in Celsius?', ['50°C', '100°C', '150°C', '200°C'], 1, 'Water boils at 100°C (212°F) at sea level.'),
  createQuestion('science', 'easy', 'Which planet is closest to the Sun?', ['Venus', 'Earth', 'Mercury', 'Mars'], 2, 'Mercury orbits closest to the Sun.'),
  createQuestion('science', 'easy', 'What do bees collect from flowers?', ['Water', 'Nectar', 'Seeds', 'Leaves'], 1, 'Bees collect nectar to make honey.'),
  createQuestion('science', 'easy', 'How many bones are in the adult human body?', ['106', '206', '306', '406'], 1, 'Adults have 206 bones; babies have about 270.'),
  createQuestion('science', 'easy', 'What is the center of an atom called?', ['Electron', 'Proton', 'Nucleus', 'Neutron'], 2, 'The nucleus contains protons and neutrons.'),
  createQuestion('science', 'easy', 'Which ocean is the largest?', ['Atlantic', 'Indian', 'Arctic', 'Pacific'], 3, 'The Pacific Ocean covers about 63 million square miles.'),
  createQuestion('science', 'easy', 'What type of animal is a dolphin?', ['Fish', 'Mammal', 'Reptile', 'Amphibian'], 1, 'Dolphins are mammals that breathe air and nurse their young.'),
  createQuestion('science', 'easy', 'What is the hardest natural substance on Earth?', ['Gold', 'Iron', 'Diamond', 'Titanium'], 2, 'Diamond is made of carbon atoms in a crystal structure.'),

  // Medium (15)
  createQuestion('science', 'medium', 'What is the process by which plants make food?', ['Respiration', 'Photosynthesis', 'Fermentation', 'Digestion'], 1, 'Photosynthesis converts sunlight, water, and CO2 into glucose.'),
  createQuestion('science', 'medium', 'Which blood cells help fight infection?', ['Red blood cells', 'White blood cells', 'Platelets', 'Plasma'], 1, 'White blood cells are part of the immune system.'),
  createQuestion('science', 'medium', 'What is the unit of electrical resistance?', ['Volt', 'Ampere', 'Ohm', 'Watt'], 2, 'Resistance is measured in ohms, named after Georg Ohm.'),
  createQuestion('science', 'medium', 'Which element has the chemical symbol "Fe"?', ['Fluorine', 'Francium', 'Iron', 'Fermium'], 2, 'Fe comes from the Latin word "ferrum" meaning iron.'),
  createQuestion('science', 'medium', 'What type of rock is formed by cooling lava?', ['Sedimentary', 'Metamorphic', 'Igneous', 'Limestone'], 2, 'Igneous rocks form when molten rock cools and solidifies.'),
  createQuestion('science', 'medium', 'How many chromosomes do humans have?', ['23', '46', '48', '52'], 1, 'Humans have 23 pairs, or 46 total chromosomes.'),
  createQuestion('science', 'medium', 'What is the smallest unit of life?', ['Atom', 'Molecule', 'Cell', 'Organ'], 2, 'Cells are the basic building blocks of all living things.'),
  createQuestion('science', 'medium', 'Which layer of Earth\'s atmosphere do we live in?', ['Stratosphere', 'Mesosphere', 'Troposphere', 'Thermosphere'], 2, 'The troposphere extends from Earth\'s surface to about 12 km.'),
  createQuestion('science', 'medium', 'What causes the seasons on Earth?', ['Distance from Sun', 'Earth\'s tilted axis', 'Moon\'s gravity', 'Solar flares'], 1, 'Earth\'s 23.5° tilt causes different parts to receive varying sunlight.'),
  createQuestion('science', 'medium', 'Which planet has the most moons?', ['Jupiter', 'Saturn', 'Uranus', 'Neptune'], 1, 'Saturn has over 140 confirmed moons.'),
  createQuestion('science', 'medium', 'What is the study of earthquakes called?', ['Meteorology', 'Seismology', 'Geology', 'Volcanology'], 1, 'Seismologists study seismic waves and earthquakes.'),
  createQuestion('science', 'medium', 'Which vitamin is produced when skin is exposed to sunlight?', ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Vitamin E'], 2, 'UV rays trigger vitamin D synthesis in the skin.'),
  createQuestion('science', 'medium', 'What is the chemical formula for table salt?', ['NaCl', 'KCl', 'CaCO3', 'NaHCO3'], 0, 'Sodium chloride is one sodium and one chlorine atom.'),
  createQuestion('science', 'medium', 'How long does it take light to travel from the Sun to Earth?', ['8 seconds', '8 minutes', '8 hours', '8 days'], 1, 'Light travels about 93 million miles in 8 minutes 20 seconds.'),
  createQuestion('science', 'medium', 'What is the main function of red blood cells?', ['Fight infection', 'Carry oxygen', 'Clot blood', 'Store nutrients'], 1, 'Hemoglobin in red blood cells binds to oxygen.'),

  // Hard (10)
  createQuestion('science', 'hard', 'What is the name of the process where an unstable nucleus releases energy?', ['Fusion', 'Fission', 'Radioactive decay', 'Oxidation'], 2, 'Radioactive decay releases alpha, beta, or gamma radiation.'),
  createQuestion('science', 'hard', 'Which scientist developed the theory of general relativity?', ['Isaac Newton', 'Albert Einstein', 'Niels Bohr', 'Max Planck'], 1, 'Einstein published his theory of general relativity in 1915.'),
  createQuestion('science', 'hard', 'What is the powerhouse of the cell?', ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi apparatus'], 2, 'Mitochondria produce ATP through cellular respiration.'),
  createQuestion('science', 'hard', 'What is the speed of light in a vacuum?', ['300,000 km/s', '300,000 m/s', '30,000 km/s', '3,000,000 km/s'], 0, 'Light travels at approximately 299,792 km/s.'),
  createQuestion('science', 'hard', 'What is the Doppler effect?', ['Light bending around objects', 'Change in frequency due to motion', 'Heat transfer through radiation', 'Sound echoing'], 1, 'Moving sources cause frequency shifts - this is why sirens change pitch.'),
  createQuestion('science', 'hard', 'What percentage of the atmosphere is nitrogen?', ['21%', '50%', '78%', '89%'], 2, 'About 78% nitrogen, 21% oxygen, and 1% other gases.'),
  createQuestion('science', 'hard', 'What is the half-life of Carbon-14?', ['5,730 years', '10,000 years', '50,000 years', '1 million years'], 0, 'C-14 dating is used for objects up to ~50,000 years old.'),
  createQuestion('science', 'hard', 'Which particle has a positive charge?', ['Electron', 'Neutron', 'Proton', 'Photon'], 2, 'Protons have positive charge, electrons have negative.'),
  createQuestion('science', 'hard', 'What is the name of the boundary between Earth\'s crust and mantle?', ['Mohorovičić discontinuity', 'Gutenberg discontinuity', 'Conrad discontinuity', 'Lehmann discontinuity'], 0, 'The Moho is typically 5-70 km below the surface.'),
  createQuestion('science', 'hard', 'What is the phenomenon where light bends when passing through different materials?', ['Reflection', 'Refraction', 'Diffraction', 'Interference'], 1, 'Refraction is why straws look bent in water.'),

  // Additional Science Questions (WSC-aligned)
  createQuestion('science', 'easy', 'What is the main gas that makes up the Sun?', ['Oxygen', 'Hydrogen', 'Helium', 'Carbon'], 1, 'The Sun is about 75% hydrogen and 25% helium.'),
  createQuestion('science', 'easy', 'What type of energy does a battery store?', ['Solar', 'Chemical', 'Nuclear', 'Wind'], 1, 'Batteries convert chemical energy to electrical energy.'),
  createQuestion('science', 'easy', 'What is the name for animals that are active at night?', ['Diurnal', 'Nocturnal', 'Aquatic', 'Terrestrial'], 1, 'Owls, bats, and raccoons are nocturnal animals.'),
  createQuestion('science', 'easy', 'What causes a rainbow?', ['Pollution', 'Light refracting through water droplets', 'Paint', 'Reflection'], 1, 'Sunlight splits into colors as it passes through raindrops.'),
  createQuestion('science', 'easy', 'What is the study of weather called?', ['Geology', 'Astronomy', 'Meteorology', 'Biology'], 2, 'Meteorologists use data to forecast weather patterns.'),
  createQuestion('science', 'medium', 'What is the largest planet in our solar system?', ['Saturn', 'Jupiter', 'Neptune', 'Uranus'], 1, 'Jupiter is so large that all other planets could fit inside it.'),
  createQuestion('science', 'medium', 'What is the function of chlorophyll in plants?', ['Store water', 'Absorb light for photosynthesis', 'Provide structure', 'Attract insects'], 1, 'Chlorophyll gives plants their green color and captures light energy.'),
  createQuestion('science', 'medium', 'What is the ozone layer?', ['A weather pattern', 'A region of Earth\'s atmosphere that absorbs UV radiation', 'A type of cloud', 'Ocean current'], 1, 'The ozone layer protects life from harmful ultraviolet rays.'),
  createQuestion('science', 'medium', 'What are tectonic plates?', ['Kitchen dishes', 'Large pieces of Earth\'s crust that move slowly', 'Types of minerals', 'Mountain ranges'], 1, 'Plate movements cause earthquakes and form mountains.'),
  createQuestion('science', 'medium', 'What is a watershed?', ['A tool shed', 'An area of land where all water drains to a common outlet', 'A type of dam', 'A rain gauge'], 1, 'Watersheds are important for managing water resources.'),
  createQuestion('science', 'medium', 'What is bioluminescence?', ['Solar power', 'Light produced by living organisms', 'Electric lights', 'Fireproofing'], 1, 'Fireflies and deep-sea creatures produce their own light.'),
  createQuestion('science', 'hard', 'What is CRISPR-Cas9 used for?', ['Photography', 'Gene editing', 'Data storage', 'Weather prediction'], 1, 'CRISPR allows precise editing of DNA sequences.'),
  createQuestion('science', 'hard', 'What is nuclear fusion?', ['Splitting atoms', 'Combining atomic nuclei to release energy', 'Chemical reaction', 'Radioactive decay'], 1, 'The Sun produces energy through nuclear fusion of hydrogen.'),
  createQuestion('science', 'hard', 'What is the Heisenberg Uncertainty Principle?', ['Lab safety rule', 'You cannot simultaneously know both position and momentum precisely', 'Chemical formula', 'Gravity law'], 1, 'This principle is fundamental to quantum mechanics.'),
  createQuestion('science', 'hard', 'What are stem cells?', ['Plant parts', 'Cells that can develop into different cell types', 'Blood cells', 'Bacteria'], 1, 'Stem cells have potential for treating many diseases.'),
  createQuestion('science', 'hard', 'What is the event horizon of a black hole?', ['Landing zone', 'The boundary beyond which nothing can escape', 'Orbital path', 'Viewing distance'], 1, 'Beyond the event horizon, gravity is so strong that even light cannot escape.'),
];

// ============================================================================
// SOCIAL STUDIES QUESTIONS (40 questions)
// ============================================================================
export const socialStudiesQuestions: Question[] = [
  // Easy (15)
  createQuestion('social_studies', 'easy', 'What is the capital of France?', ['London', 'Berlin', 'Paris', 'Madrid'], 2, 'Paris has been France\'s capital since the 10th century.'),
  createQuestion('social_studies', 'easy', 'How many continents are there on Earth?', ['5', '6', '7', '8'], 2, 'The 7 continents are Africa, Antarctica, Asia, Australia, Europe, North America, and South America.'),
  createQuestion('social_studies', 'easy', 'What is the longest river in the world?', ['Amazon', 'Nile', 'Mississippi', 'Yangtze'], 1, 'The Nile flows about 6,650 km through northeastern Africa.'),
  createQuestion('social_studies', 'easy', 'Which country has the largest population?', ['India', 'USA', 'China', 'Indonesia'], 0, 'India recently surpassed China as the most populous country.'),
  createQuestion('social_studies', 'easy', 'What is the capital of Japan?', ['Beijing', 'Seoul', 'Tokyo', 'Bangkok'], 2, 'Tokyo means "Eastern Capital" in Japanese.'),
  createQuestion('social_studies', 'easy', 'On which continent is Egypt located?', ['Asia', 'Europe', 'Africa', 'South America'], 2, 'Egypt is in northeastern Africa, bordering the Mediterranean.'),
  createQuestion('social_studies', 'easy', 'What ocean lies between North America and Europe?', ['Pacific', 'Indian', 'Atlantic', 'Arctic'], 2, 'The Atlantic Ocean is the second-largest ocean.'),
  createQuestion('social_studies', 'easy', 'What is the capital of the United States?', ['New York', 'Los Angeles', 'Washington D.C.', 'Chicago'], 2, 'Washington D.C. has been the capital since 1800.'),
  createQuestion('social_studies', 'easy', 'Which country is known as the Land of the Rising Sun?', ['China', 'Korea', 'Japan', 'Thailand'], 2, 'Japan is called "Nippon" or "Nihon," meaning "origin of the sun."'),
  createQuestion('social_studies', 'easy', 'What is the largest country in the world by area?', ['Canada', 'China', 'USA', 'Russia'], 3, 'Russia spans 17.1 million square kilometers.'),
  createQuestion('social_studies', 'easy', 'Which ancient civilization built the pyramids?', ['Romans', 'Greeks', 'Egyptians', 'Mayans'], 2, 'The Great Pyramid was built around 2560 BCE.'),
  createQuestion('social_studies', 'easy', 'What currency is used in the United Kingdom?', ['Euro', 'Dollar', 'Pound', 'Franc'], 2, 'The British Pound Sterling (£) is one of the oldest currencies.'),
  createQuestion('social_studies', 'easy', 'How many states are in the United States?', ['48', '50', '51', '52'], 1, 'The 50th state, Hawaii, joined in 1959.'),
  createQuestion('social_studies', 'easy', 'What is the capital of Australia?', ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'], 2, 'Canberra was purpose-built as the capital in 1913.'),
  createQuestion('social_studies', 'easy', 'Which country gave the Statue of Liberty to the USA?', ['England', 'France', 'Germany', 'Italy'], 1, 'France gifted it in 1886 to celebrate friendship.'),

  // Medium (15)
  createQuestion('social_studies', 'medium', 'What year did World War II end?', ['1943', '1944', '1945', '1946'], 2, 'WWII ended in 1945 with Japan\'s surrender on September 2.'),
  createQuestion('social_studies', 'medium', 'Who was the first President of the United States?', ['John Adams', 'Thomas Jefferson', 'George Washington', 'Benjamin Franklin'], 2, 'Washington served from 1789 to 1797.'),
  createQuestion('social_studies', 'medium', 'What is the largest desert in the world?', ['Sahara', 'Gobi', 'Antarctic', 'Arabian'], 2, 'Antarctica is a cold desert with very little precipitation.'),
  createQuestion('social_studies', 'medium', 'Which empire was ruled by Julius Caesar?', ['Greek', 'Persian', 'Roman', 'Ottoman'], 2, 'Caesar was a Roman general and dictator.'),
  createQuestion('social_studies', 'medium', 'What mountain range separates Europe from Asia?', ['Alps', 'Andes', 'Himalayas', 'Urals'], 3, 'The Ural Mountains extend about 2,500 km.'),
  createQuestion('social_studies', 'medium', 'What is the name of the economic system where private individuals own businesses?', ['Socialism', 'Communism', 'Capitalism', 'Feudalism'], 2, 'Capitalism emphasizes private ownership and free markets.'),
  createQuestion('social_studies', 'medium', 'Which organization was formed after World War II to maintain peace?', ['League of Nations', 'NATO', 'United Nations', 'European Union'], 2, 'The UN was established on October 24, 1945.'),
  createQuestion('social_studies', 'medium', 'What was the name of the ship the Pilgrims sailed on?', ['Santa Maria', 'Mayflower', 'Endeavour', 'Victoria'], 1, 'The Mayflower landed at Plymouth Rock in 1620.'),
  createQuestion('social_studies', 'medium', 'Who wrote the Declaration of Independence?', ['George Washington', 'Benjamin Franklin', 'Thomas Jefferson', 'John Adams'], 2, 'Jefferson drafted it in June 1776.'),
  createQuestion('social_studies', 'medium', 'What ancient wonder was located in Alexandria, Egypt?', ['Hanging Gardens', 'Colossus', 'Lighthouse', 'Temple of Artemis'], 2, 'The Lighthouse of Alexandria was built around 280 BCE.'),
  createQuestion('social_studies', 'medium', 'What is the capital of Canada?', ['Toronto', 'Vancouver', 'Ottawa', 'Montreal'], 2, 'Ottawa was chosen as capital in 1857 by Queen Victoria.'),
  createQuestion('social_studies', 'medium', 'Which river flows through London?', ['Seine', 'Thames', 'Danube', 'Rhine'], 1, 'The River Thames is 346 km long.'),
  createQuestion('social_studies', 'medium', 'What wall divided Berlin during the Cold War?', ['Great Wall', 'Hadrian\'s Wall', 'Berlin Wall', 'Atlantic Wall'], 2, 'The Berlin Wall stood from 1961 to 1989.'),
  createQuestion('social_studies', 'medium', 'Who was the leader of the civil rights movement known for "I Have a Dream"?', ['Malcolm X', 'Rosa Parks', 'Martin Luther King Jr.', 'Jesse Jackson'], 2, 'MLK delivered the speech in 1963 at the Lincoln Memorial.'),
  createQuestion('social_studies', 'medium', 'What is the official language of Brazil?', ['Spanish', 'Portuguese', 'French', 'English'], 1, 'Brazil was colonized by Portugal in 1500.'),

  // Hard (10)
  createQuestion('social_studies', 'hard', 'In what year did the French Revolution begin?', ['1776', '1789', '1799', '1812'], 1, 'The storming of the Bastille on July 14, 1789, is considered the start.'),
  createQuestion('social_studies', 'hard', 'What was the name of the trade route connecting China to the Mediterranean?', ['Spice Route', 'Silk Road', 'Tea Trail', 'Golden Path'], 1, 'The Silk Road was named for the lucrative silk trade.'),
  createQuestion('social_studies', 'hard', 'Who was the Mongol emperor who created the largest contiguous land empire?', ['Kublai Khan', 'Genghis Khan', 'Attila', 'Timur'], 1, 'Genghis Khan united the Mongol tribes around 1206.'),
  createQuestion('social_studies', 'hard', 'What treaty ended World War I?', ['Treaty of Paris', 'Treaty of Versailles', 'Treaty of Vienna', 'Treaty of Ghent'], 1, 'The Treaty of Versailles was signed on June 28, 1919.'),
  createQuestion('social_studies', 'hard', 'Which ancient civilization developed the first writing system?', ['Egyptian', 'Greek', 'Sumerian', 'Chinese'], 2, 'Sumerians developed cuneiform around 3400 BCE.'),
  createQuestion('social_studies', 'hard', 'What is the name of the economic plan that helped rebuild Europe after WWII?', ['New Deal', 'Marshall Plan', 'Lend-Lease', 'Truman Doctrine'], 1, 'The Marshall Plan provided over $13 billion from 1948-1952.'),
  createQuestion('social_studies', 'hard', 'Which explorer led the first expedition to circumnavigate the Earth?', ['Christopher Columbus', 'Ferdinand Magellan', 'Vasco da Gama', 'James Cook'], 1, 'Magellan started the voyage in 1519, though he died before completing it.'),
  createQuestion('social_studies', 'hard', 'What was the code name for the Allied invasion of Normandy?', ['Operation Torch', 'Operation Overlord', 'Operation Market Garden', 'Operation Barbarossa'], 1, 'D-Day was June 6, 1944.'),
  createQuestion('social_studies', 'hard', 'What ancient Greek city-state was known for its military culture?', ['Athens', 'Corinth', 'Sparta', 'Thebes'], 2, 'Spartan boys began military training at age 7.'),
  createQuestion('social_studies', 'hard', 'What event sparked the beginning of World War I?', ['Sinking of Lusitania', 'Assassination of Archduke Franz Ferdinand', 'Invasion of Poland', 'Treaty of Versailles'], 1, 'Franz Ferdinand was assassinated on June 28, 1914, in Sarajevo.'),
];

// ============================================================================
// ARTS & CULTURE QUESTIONS (40 questions)
// ============================================================================
export const artsQuestions: Question[] = [
  // Easy (15)
  createQuestion('arts', 'easy', 'Who painted the Mona Lisa?', ['Vincent van Gogh', 'Leonardo da Vinci', 'Pablo Picasso', 'Michelangelo'], 1, 'Da Vinci painted it between 1503-1519. It hangs in the Louvre.'),
  createQuestion('arts', 'easy', 'What are the three primary colors?', ['Red, Yellow, Blue', 'Red, Green, Blue', 'Orange, Purple, Green', 'Cyan, Magenta, Yellow'], 0, 'Primary colors cannot be made by mixing other colors.'),
  createQuestion('arts', 'easy', 'How many strings does a standard guitar have?', ['4', '5', '6', '8'], 2, 'Guitars typically have 6 strings tuned E-A-D-G-B-E.'),
  createQuestion('arts', 'easy', 'What is the name of Mickey Mouse\'s dog?', ['Goofy', 'Pluto', 'Max', 'Spike'], 1, 'Pluto first appeared in 1930.'),
  createQuestion('arts', 'easy', 'What type of dance originated in Argentina?', ['Waltz', 'Salsa', 'Tango', 'Flamenco'], 2, 'Tango developed in Buenos Aires in the late 1800s.'),
  createQuestion('arts', 'easy', 'What color do you get when you mix blue and yellow?', ['Orange', 'Purple', 'Green', 'Brown'], 2, 'Blue and yellow are complementary to make green.'),
  createQuestion('arts', 'easy', 'Which instrument has 88 keys?', ['Guitar', 'Violin', 'Piano', 'Flute'], 2, 'Pianos have 52 white and 36 black keys.'),
  createQuestion('arts', 'easy', 'Who created the famous character Sherlock Holmes?', ['Agatha Christie', 'Arthur Conan Doyle', 'Edgar Allan Poe', 'Charles Dickens'], 1, 'The first Holmes story was published in 1887.'),
  createQuestion('arts', 'easy', 'What is origami?', ['Japanese cooking', 'Japanese paper folding', 'Japanese martial art', 'Japanese painting'], 1, 'Origami uses folding techniques to create sculptures.'),
  createQuestion('arts', 'easy', 'What museum in Paris houses the Mona Lisa?', ['British Museum', 'Uffizi Gallery', 'The Louvre', 'Metropolitan Museum'], 2, 'The Louvre is the world\'s largest art museum.'),
  createQuestion('arts', 'easy', 'Which artist is famous for cutting off part of his ear?', ['Monet', 'Picasso', 'Van Gogh', 'Renoir'], 2, 'Van Gogh cut his ear in 1888 during a mental health crisis.'),
  createQuestion('arts', 'easy', 'What type of instrument is a saxophone?', ['String', 'Percussion', 'Woodwind', 'Brass'], 2, 'Though made of brass, saxophones use a reed like woodwinds.'),
  createQuestion('arts', 'easy', 'What is the Japanese art of flower arranging called?', ['Origami', 'Ikebana', 'Bonsai', 'Kabuki'], 1, 'Ikebana emphasizes shape, line, and form.'),
  createQuestion('arts', 'easy', 'Who wrote the Harry Potter series?', ['J.R.R. Tolkien', 'J.K. Rowling', 'C.S. Lewis', 'Roald Dahl'], 1, 'The first book was published in 1997.'),
  createQuestion('arts', 'easy', 'What animated movie features a clownfish named Nemo?', ['Shark Tale', 'Finding Nemo', 'The Little Mermaid', 'Ponyo'], 1, 'Finding Nemo was released by Pixar in 2003.'),

  // Medium (15)
  createQuestion('arts', 'medium', 'Who composed "The Four Seasons"?', ['Mozart', 'Beethoven', 'Vivaldi', 'Bach'], 2, 'Antonio Vivaldi composed it around 1723.'),
  createQuestion('arts', 'medium', 'What art movement did Salvador Dalí belong to?', ['Impressionism', 'Surrealism', 'Cubism', 'Romanticism'], 1, 'Surrealism explored dreams and the unconscious mind.'),
  createQuestion('arts', 'medium', 'Which famous sculpture depicts a man thinking?', ['David', 'The Thinker', 'Venus de Milo', 'Pietà'], 1, 'Auguste Rodin created The Thinker in 1880.'),
  createQuestion('arts', 'medium', 'What is the highest singing voice type?', ['Tenor', 'Alto', 'Soprano', 'Baritone'], 2, 'Soprano is the highest vocal range.'),
  createQuestion('arts', 'medium', 'Who painted "The Starry Night"?', ['Claude Monet', 'Vincent van Gogh', 'Pierre-Auguste Renoir', 'Paul Cézanne'], 1, 'Van Gogh painted it in 1889 while in an asylum.'),
  createQuestion('arts', 'medium', 'What is the Italian word for "light and dark" used in art?', ['Sfumato', 'Chiaroscuro', 'Fresco', 'Impasto'], 1, 'Chiaroscuro creates dramatic contrast in paintings.'),
  createQuestion('arts', 'medium', 'Which composer became deaf but continued to write music?', ['Mozart', 'Beethoven', 'Chopin', 'Handel'], 1, 'Beethoven began losing hearing in his late 20s.'),
  createQuestion('arts', 'medium', 'What art technique uses small dots to create images?', ['Impressionism', 'Pointillism', 'Abstract', 'Minimalism'], 1, 'Georges Seurat pioneered pointillism.'),
  createQuestion('arts', 'medium', 'Who wrote "Romeo and Juliet"?', ['Christopher Marlowe', 'William Shakespeare', 'Ben Jonson', 'John Milton'], 1, 'Shakespeare wrote it around 1594-1596.'),
  createQuestion('arts', 'medium', 'What is the name of the famous ceiling painting in the Vatican?', ['The Last Supper', 'The Sistine Chapel ceiling', 'The School of Athens', 'The Creation of Adam'], 1, 'Michelangelo painted it between 1508-1512.'),
  createQuestion('arts', 'medium', 'Which ballet features a prince and a swan princess?', ['The Nutcracker', 'Sleeping Beauty', 'Swan Lake', 'Giselle'], 2, 'Tchaikovsky composed Swan Lake in 1876.'),
  createQuestion('arts', 'medium', 'What ancient Greek structure has massive columns and was dedicated to Athena?', ['Colosseum', 'Parthenon', 'Pantheon', 'Acropolis'], 1, 'The Parthenon was built in 447-432 BCE.'),
  createQuestion('arts', 'medium', 'Who is known for the "pop art" style with soup cans?', ['Roy Lichtenstein', 'Andy Warhol', 'Jeff Koons', 'Jasper Johns'], 1, 'Warhol\'s Campbell\'s Soup Cans were created in 1962.'),
  createQuestion('arts', 'medium', 'What musical term means to gradually get louder?', ['Diminuendo', 'Crescendo', 'Staccato', 'Legato'], 1, 'Crescendo is Italian for "growing."'),
  createQuestion('arts', 'medium', 'Which country is famous for flamenco dancing?', ['Italy', 'France', 'Spain', 'Portugal'], 2, 'Flamenco originated in Andalusia, southern Spain.'),

  // Hard (10)
  createQuestion('arts', 'hard', 'What art movement sought to capture light and its changing qualities?', ['Baroque', 'Impressionism', 'Renaissance', 'Art Nouveau'], 1, 'Monet, Renoir, and Degas were key Impressionists.'),
  createQuestion('arts', 'hard', 'Who composed "The Rite of Spring," which caused a riot at its premiere?', ['Debussy', 'Stravinsky', 'Ravel', 'Prokofiev'], 1, 'The 1913 Paris premiere caused scandal due to its revolutionary music.'),
  createQuestion('arts', 'hard', 'What is the technique of painting on wet plaster called?', ['Tempera', 'Fresco', 'Encaustic', 'Gouache'], 1, 'Fresco means "fresh" in Italian.'),
  createQuestion('arts', 'hard', 'Which Japanese theater form uses elaborate masks and slow movements?', ['Kabuki', 'Noh', 'Bunraku', 'Kyogen'], 1, 'Noh theater dates back to the 14th century.'),
  createQuestion('arts', 'hard', 'Who sculpted the "David" statue in Florence?', ['Donatello', 'Michelangelo', 'Bernini', 'Cellini'], 1, 'Michelangelo carved David from 1501-1504.'),
  createQuestion('arts', 'hard', 'What is the term for the main theme in a piece of music?', ['Coda', 'Motif', 'Cadence', 'Arpeggio'], 1, 'A motif is a short musical idea that recurs.'),
  createQuestion('arts', 'hard', 'Which architect designed the Guggenheim Museum in New York?', ['Le Corbusier', 'Frank Lloyd Wright', 'I.M. Pei', 'Frank Gehry'], 1, 'Wright designed the iconic spiral building, completed in 1959.'),
  createQuestion('arts', 'hard', 'What Renaissance technique creates the illusion of depth on a flat surface?', ['Foreshortening', 'Linear perspective', 'Aerial perspective', 'Trompe l\'oeil'], 1, 'Brunelleschi formalized linear perspective in the early 1400s.'),
  createQuestion('arts', 'hard', 'Who painted "Guernica" depicting the horrors of war?', ['Salvador Dalí', 'Pablo Picasso', 'Joan Miró', 'Diego Rivera'], 1, 'Picasso painted it in 1937 in response to the bombing of Guernica.'),
  createQuestion('arts', 'hard', 'What is the golden ratio approximately equal to?', ['1.414', '1.618', '2.718', '3.142'], 1, 'The golden ratio (phi) appears frequently in art and nature.'),
];

// ============================================================================
// LITERATURE QUESTIONS (60+ questions) - WSC 2025 Curriculum
// Based on confirmed selections: Ender's Game, The Little Prince, Nightfall,
// Flowers for Algernon, and short stories by Márquez, Asimov, and Bradbury
// ============================================================================
export const literatureQuestions: Question[] = [
  // ==========================================================================
  // ENDER'S GAME by Orson Scott Card (15 questions)
  // ==========================================================================
  // Easy
  createQuestion('literature', 'easy', 'Who is the main character in "Ender\'s Game"?', ['Peter Wiggin', 'Valentine Wiggin', 'Ender Wiggin', 'Colonel Graff'], 2, 'Andrew "Ender" Wiggin is a child genius recruited to Battle School.'),
  createQuestion('literature', 'easy', 'What is Battle School in "Ender\'s Game"?', ['A regular school', 'A space station for training child soldiers', 'A video game', 'A summer camp'], 1, 'Battle School orbits Earth and trains children to fight the Formics.'),
  createQuestion('literature', 'easy', 'What alien species threatens Earth in "Ender\'s Game"?', ['Martians', 'Formics (Buggers)', 'Vulcans', 'Klingons'], 1, 'The Formics, also called Buggers, are an insect-like alien race.'),
  createQuestion('literature', 'easy', 'How old is Ender when he goes to Battle School?', ['16', '12', '6', '10'], 2, 'Ender is only 6 years old when recruited to Battle School.'),
  createQuestion('literature', 'easy', 'What is the "Giant\'s Drink" in "Ender\'s Game"?', ['A real beverage', 'A video game within the story', 'A training exercise', 'A spaceship'], 1, 'It\'s a mind game that psychologically profiles students.'),
  // Medium
  createQuestion('literature', 'medium', 'What does Ender discover about the "final exam" at Command School?', ['It was easy', 'It was actually a real battle, not a simulation', 'He failed', 'It was cancelled'], 1, 'Ender unknowingly commanded the real fleet that destroyed the Formic homeworld.'),
  createQuestion('literature', 'medium', 'Who are Ender\'s siblings in the book?', ['Peter and Valentine', 'John and Mary', 'Bean and Petra', 'Alai and Dink'], 0, 'Peter is cruel and ambitious; Valentine is kind and protective.'),
  createQuestion('literature', 'medium', 'What does Ender find in the Giant\'s Drink game that relates to the ending?', ['A weapon', 'A cocoon with a Formic Queen', 'A spaceship', 'His family'], 1, 'The Formics left a Queen cocoon for Ender to find and save their species.'),
  createQuestion('literature', 'medium', 'What is the Battle Room used for in "Ender\'s Game"?', ['Sleeping', 'Zero-gravity combat training', 'Eating meals', 'Video games'], 1, 'Students fight mock battles in zero gravity to develop tactical skills.'),
  createQuestion('literature', 'medium', 'What does Ender become known as after the war?', ['The Hero', 'The Xenocide', 'The President', 'The Teacher'], 1, 'Ender is called "Xenocide" for destroying an entire alien species.'),
  // Hard
  createQuestion('literature', 'hard', 'What book does Ender write under a pseudonym after the war?', ['War and Peace', 'The Hive Queen', 'History of Earth', 'Battle Tactics'], 1, 'Ender writes "The Hive Queen" to tell the Formics\' story sympathetically.'),
  createQuestion('literature', 'hard', 'What is the significance of the "Third" status for Ender?', ['He is a third child in a population-controlled society', 'He came in third place', 'He has three siblings', 'He is three years old'], 0, 'Population laws limited families to two children; Ender was specially authorized.'),
  createQuestion('literature', 'hard', 'How does Ender\'s final understanding of the Formics change his perspective?', ['He becomes angry', 'He realizes they never meant to be hostile after the first war', 'He wants revenge', 'He forgets about them'], 1, 'The Formics didn\'t understand humans were sentient individuals, not a hive mind.'),
  createQuestion('literature', 'hard', 'What theme does "Ender\'s Game" explore through manipulation of Ender?', ['Romance', 'The ethics of using children as weapons and the cost of war', 'Comedy', 'Sports competition'], 1, 'The book questions whether the ends justify the means in warfare.'),
  createQuestion('literature', 'hard', 'What pen names do Peter and Valentine use to influence politics on Earth?', ['Locke and Demosthenes', 'Smith and Jones', 'Alpha and Omega', 'Sun and Moon'], 0, 'Peter writes as Locke (moderate), Valentine as Demosthenes (radical).'),

  // ==========================================================================
  // THE LITTLE PRINCE by Antoine de Saint-Exupéry (12 questions)
  // ==========================================================================
  // Easy
  createQuestion('literature', 'easy', 'Where does the Little Prince come from?', ['Earth', 'A tiny asteroid called B-612', 'Mars', 'The Moon'], 1, 'The Little Prince lives on a small asteroid with three volcanoes and a rose.'),
  createQuestion('literature', 'easy', 'Who does the Little Prince meet in the desert?', ['A teacher', 'A pilot whose plane crashed', 'A scientist', 'A king'], 1, 'The narrator is an aviator stranded in the Sahara Desert.'),
  createQuestion('literature', 'easy', 'What flower does the Little Prince love on his asteroid?', ['A daisy', 'A rose', 'A sunflower', 'A tulip'], 1, 'The Little Prince\'s rose is vain but he loves her deeply.'),
  createQuestion('literature', 'easy', 'What does the Little Prince ask the pilot to draw?', ['A house', 'A sheep', 'A tree', 'A star'], 1, 'He asks for a sheep to eat the baobab sprouts on his planet.'),
  // Medium
  createQuestion('literature', 'medium', 'What does the fox teach the Little Prince?', ['How to hunt', 'That "one sees clearly only with the heart"', 'How to fly', 'Mathematics'], 1, 'The fox explains that essential things are invisible to the eye.'),
  createQuestion('literature', 'medium', 'What adult characteristic does the book criticize through the people the Prince meets?', ['Creativity', 'Being too focused on "matters of consequence" and missing what\'s important', 'Kindness', 'Intelligence'], 1, 'Adults obsess over numbers and status while missing life\'s meaning.'),
  createQuestion('literature', 'medium', 'What does "taming" mean according to the fox?', ['Capturing', 'To establish ties and become unique to each other', 'Training', 'Feeding'], 1, 'Taming creates a bond that makes the relationship special and unique.'),
  createQuestion('literature', 'medium', 'What do the baobab trees represent in the story?', ['Good things', 'Problems that must be dealt with early before they grow too big', 'Food', 'Shade'], 1, 'Baobabs symbolize problems or bad habits that can destroy if ignored.'),
  // Hard
  createQuestion('literature', 'hard', 'What is the deeper meaning of the pilot\'s drawing of the sheep in a box?', ['It was easier to draw', 'Imagination can create what reality cannot; each person sees what they want', 'He couldn\'t draw sheep', 'The Prince asked for a box'], 1, 'The invisible sheep represents how imagination completes reality.'),
  createQuestion('literature', 'hard', 'How does the Little Prince return to his asteroid?', ['By rocket', 'He allows a snake to bite him, leaving his body behind', 'By airplane', 'He walks'], 1, 'His body was too heavy to take; the snake\'s bite freed his spirit to return.'),
  createQuestion('literature', 'hard', 'What does the Little Prince\'s relationship with his rose teach about love?', ['Love is simple', 'Love requires responsibility and effort, not just feeling', 'Roses are unimportant', 'Love is painful'], 1, '"You become responsible, forever, for what you have tamed."'),
  createQuestion('literature', 'hard', 'Why are the stars meaningful to the narrator after the Prince leaves?', ['They are brighter', 'Because the Prince is on one of them, all stars become special', 'They help navigation', 'They are colorful'], 1, 'The connection transforms ordinary stars into something personally meaningful.'),

  // ==========================================================================
  // FLOWERS FOR ALGERNON by Daniel Keyes (12 questions)
  // ==========================================================================
  // Easy
  createQuestion('literature', 'easy', 'Who is the main character in "Flowers for Algernon"?', ['Dr. Strauss', 'Algernon', 'Charlie Gordon', 'Professor Nemur'], 2, 'Charlie Gordon is a 32-year-old man with an IQ of 68 who undergoes an experiment.'),
  createQuestion('literature', 'easy', 'What is Algernon in the story?', ['A doctor', 'A laboratory mouse', 'Charlie\'s brother', 'A teacher'], 1, 'Algernon is a mouse who received the same intelligence-enhancing surgery before Charlie.'),
  createQuestion('literature', 'easy', 'What format is "Flowers for Algernon" written in?', ['Third person narrative', 'Progress reports (diary entries) by Charlie', 'Newspaper articles', 'Letters'], 1, 'The story unfolds through Charlie\'s "progris riports" which show his changing intelligence.'),
  createQuestion('literature', 'easy', 'What happens to Charlie\'s intelligence after the surgery?', ['Nothing', 'It increases dramatically to genius level', 'It decreases', 'He becomes average'], 1, 'Charlie\'s IQ rises to 185, making him a genius.'),
  // Medium
  createQuestion('literature', 'medium', 'How does Charlie\'s spelling and writing change throughout the story?', ['Stays the same', 'It improves then deteriorates, mirroring his intelligence', 'Only improves', 'Only gets worse'], 1, 'The prose quality directly reflects Charlie\'s cognitive state.'),
  createQuestion('literature', 'medium', 'What does Charlie discover about how his "friends" at the bakery treated him?', ['They protected him', 'They had been mocking him, not laughing with him', 'They respected him', 'They feared him'], 1, 'Charlie realizes people he thought were friends were actually cruel to him.'),
  createQuestion('literature', 'medium', 'What happens to Algernon that foreshadows Charlie\'s fate?', ['He escapes', 'His intelligence deteriorates and he dies', 'He has babies', 'He is released'], 1, 'Algernon\'s regression predicts that Charlie will also lose his intelligence.'),
  createQuestion('literature', 'medium', 'Why does Charlie become isolated as he grows more intelligent?', ['He moves away', 'He can\'t relate to others and they resent his superiority', 'He gets sick', 'He works too much'], 1, 'His intelligence creates emotional distance from everyone he knew.'),
  // Hard
  createQuestion('literature', 'hard', 'What does the title "Flowers for Algernon" ultimately symbolize?', ['A gift', 'Remembrance and mourning for what is lost', 'Celebration', 'Science'], 1, 'Charlie asks that flowers be placed on Algernon\'s grave, symbolizing respect for their shared fate.'),
  createQuestion('literature', 'hard', 'What ethical questions does the story raise about scientific experimentation?', ['None', 'Consent, human dignity, and whether intelligence defines worth', 'Only about animals', 'Cost concerns'], 1, 'The story questions if the experiment was ethical given the outcome and Charlie\'s limited consent.'),
  createQuestion('literature', 'hard', 'What does Charlie\'s journey suggest about the relationship between intelligence and happiness?', ['More intelligence means more happiness', 'Intelligence alone doesn\'t bring happiness and can bring isolation and pain', 'They are unrelated', 'Less intelligence is better'], 1, 'Charlie was happier before, despite being mocked, because he had hope and connection.'),
  createQuestion('literature', 'hard', 'What makes "Flowers for Algernon" a tragedy?', ['Someone dies', 'Charlie gains self-awareness only to know he will lose it and everything he learned', 'It\'s sad', 'Bad ending'], 1, 'The tragedy is in knowing what he\'s losing as his intelligence fades.'),

  // ==========================================================================
  // NIGHTFALL by Isaac Asimov (8 questions)
  // ==========================================================================
  // Easy
  createQuestion('literature', 'easy', 'What is unusual about the planet Lagash in "Nightfall"?', ['It has no water', 'It has six suns, so it\'s almost always daylight', 'It has no people', 'It\'s very cold'], 1, 'Lagash orbits six suns, meaning darkness is extremely rare.'),
  createQuestion('literature', 'easy', 'What event is about to happen for the first time in 2,049 years in "Nightfall"?', ['A war', 'Total darkness (nightfall)', 'A flood', 'An invasion'], 1, 'All six suns will be blocked, bringing darkness to Lagash.'),
  // Medium
  createQuestion('literature', 'medium', 'Why do scientists fear the coming nightfall?', ['Cold', 'Historical records suggest darkness drives people mad and destroys civilization', 'Monsters', 'Lack of food'], 1, 'Every 2,049 years, civilization collapses and rebuilds from scratch.'),
  createQuestion('literature', 'medium', 'What do the people of Lagash not understand because they\'ve never seen darkness?', ['Sleep', 'The existence of stars and the vastness of the universe', 'Food', 'Music'], 1, 'They have no concept of stars or the night sky.'),
  createQuestion('literature', 'medium', 'What causes the psychological effect of the darkness on the people?', ['Cold temperatures', 'The overwhelming sight of 30,000 stars shatters their worldview', 'Monsters appearing', 'Hunger'], 1, 'The sudden revelation of the universe\'s size drives them to madness.'),
  // Hard
  createQuestion('literature', 'hard', 'What does "Nightfall" suggest about human psychology and the unknown?', ['Fear is irrational', 'Confronting something completely outside our experience can be psychologically devastating', 'Darkness is dangerous', 'People adapt easily'], 1, 'The story explores how unprepared minds can\'t handle paradigm-shattering truths.'),
  createQuestion('literature', 'hard', 'What theme connects "Nightfall" to the WSC 2025 theme of "Reigniting the Future"?', ['Space travel', 'Cycles of civilization\'s collapse and renewal; how knowledge can be lost and rebuilt', 'War', 'Romance'], 1, 'Each cycle, Lagash must restart civilization—a form of reigniting from darkness.'),
  createQuestion('literature', 'hard', 'What is the irony in how the scientists prepare for Nightfall?', ['They oversleep', 'They record everything to preserve knowledge, but the records may not survive the chaos', 'They forget', 'They celebrate'], 1, 'Despite their efforts, the cycle of destruction may repeat anyway.'),

  // ==========================================================================
  // THE LAST QUESTION by Isaac Asimov (8 questions)
  // ==========================================================================
  // Easy
  createQuestion('literature', 'easy', 'What question is repeatedly asked throughout "The Last Question"?', ['What is life?', 'Can entropy be reversed?', 'Who created us?', 'What is time?'], 1, 'Characters across trillions of years ask if the universe\'s decay can be stopped.'),
  createQuestion('literature', 'easy', 'How much time passes during "The Last Question"?', ['One day', 'One hundred years', 'Trillions of years until the end of the universe', 'One week'], 2, 'The story spans from near-future to the heat death of the universe.'),
  // Medium
  createQuestion('literature', 'medium', 'What is "entropy" in the context of the story?', ['Order increasing', 'The gradual decline of the universe toward disorder and energy death', 'Life growing', 'Stars forming'], 1, 'Entropy means the universe is running down and will eventually become cold and lifeless.'),
  createQuestion('literature', 'medium', 'What role do computers play in "The Last Question"?', ['Entertainment', 'Each era\'s most advanced computer is asked if entropy can be reversed', 'Transportation', 'Communication'], 1, 'From Multivac to the cosmic AC, computers are asked the question.'),
  createQuestion('literature', 'medium', 'What answer does every computer give throughout the story?', ['"Yes"', '"INSUFFICIENT DATA FOR MEANINGFUL ANSWER"', '"No"', '"Maybe"'], 1, 'Until the very end, no computer can answer the question.'),
  // Hard
  createQuestion('literature', 'hard', 'How does "The Last Question" end?', ['The universe dies', 'AC finally answers by creating a new universe: "LET THERE BE LIGHT"', 'Humans escape', 'Nothing happens'], 1, 'After all matter and energy are gone, AC learns the answer and creates anew.'),
  createQuestion('literature', 'hard', 'What does the ending of "The Last Question" suggest about knowledge and time?', ['Learning is fast', 'Some problems require immense time and may only be solved after everything seems lost', 'Give up', 'Answers are easy'], 1, 'The answer comes only after the universe ends, showing some truths take cosmic time.'),
  createQuestion('literature', 'hard', 'How does "The Last Question" connect to the theme of "Reigniting the Future"?', ['It doesn\'t', 'The story literally ends with reigniting—creating a new universe from nothing', 'Through characters', 'Technology'], 1, 'The ultimate "reigniting" is the creation of a new universe.'),

  // ==========================================================================
  // THERE WILL COME SOFT RAINS by Ray Bradbury (8 questions)
  // ==========================================================================
  // Easy
  createQuestion('literature', 'easy', 'What is the main "character" in "There Will Come Soft Rains"?', ['A family', 'An automated smart house', 'A dog', 'A robot'], 1, 'The story follows an automated house continuing its routines after humanity is gone.'),
  createQuestion('literature', 'easy', 'What has happened to the family who lived in the house?', ['They\'re on vacation', 'They were killed in a nuclear explosion', 'They moved away', 'They\'re at work'], 1, 'Silhouettes burned into the wall reveal they died in an atomic blast.'),
  // Medium
  createQuestion('literature', 'medium', 'What does the house continue to do despite the family being gone?', ['Nothing', 'Make breakfast, clean, announce the time, read poetry', 'Call for help', 'Shut down'], 1, 'The house mindlessly continues its programmed routines for no one.'),
  createQuestion('literature', 'medium', 'What eventually destroys the house?', ['A bomb', 'A fire started by a fallen tree branch', 'An earthquake', 'Flooding'], 1, 'Wind blows a branch through a window, spilling cleaning fluid on the stove.'),
  createQuestion('literature', 'medium', 'What is ironic about the house\'s technology?', ['It\'s broken', 'Advanced technology survives the blast but can\'t save itself from a simple fire', 'It\'s old', 'It works perfectly'], 1, 'Technology meant to serve humans outlives them but still fails.'),
  // Hard
  createQuestion('literature', 'hard', 'What does the Sara Teasdale poem referenced in the title suggest?', ['Nature loves humans', 'Nature will continue indifferently after humanity destroys itself', 'Technology is good', 'Peace will come'], 1, '"And Spring herself...would scarcely know that we were gone."'),
  createQuestion('literature', 'hard', 'What warning does Bradbury convey about technology and nuclear war?', ['Technology is safe', 'Our creations may outlast us, but they cannot replace humanity or prevent our destruction', 'Nuclear war is unlikely', 'Houses are important'], 1, 'The story critiques blind faith in technology and warns of nuclear annihilation.'),
  createQuestion('literature', 'hard', 'How does "There Will Come Soft Rains" relate to "Reigniting the Future"?', ['It celebrates technology', 'It shows a future that failed to be reignited—a warning about paths we must avoid', 'It\'s unrelated', 'It\'s optimistic'], 1, 'The story presents a failed future where there is no one left to reignite anything.'),

  // ==========================================================================
  // THE HANDSOMEST DROWNED MAN IN THE WORLD by Gabriel García Márquez (7 questions)
  // ==========================================================================
  // Easy
  createQuestion('literature', 'easy', 'What washes ashore in the village at the start of the story?', ['A treasure chest', 'The body of an enormous, beautiful drowned man', 'A boat', 'A message in a bottle'], 1, 'An unusually large and handsome corpse washes up on a small fishing village.'),
  createQuestion('literature', 'easy', 'What name do the villagers give the drowned man?', ['Pedro', 'Esteban', 'Juan', 'Miguel'], 1, 'They name him Esteban and create an elaborate story about his life.'),
  // Medium
  createQuestion('literature', 'medium', 'How do the villagers transform while preparing the drowned man for burial?', ['They become sad', 'They imagine a grander life for themselves inspired by him', 'They become angry', 'They ignore him'], 1, 'His presence inspires them to envision beauty and possibility in their own lives.'),
  createQuestion('literature', 'medium', 'What literary style is García Márquez known for, exemplified in this story?', ['Realism', 'Magical realism', 'Science fiction', 'Horror'], 1, 'Magical realism blends fantastical elements with realistic settings.'),
  createQuestion('literature', 'medium', 'What do the villagers decide to do to their village after the funeral?', ['Leave it', 'Make it more beautiful with wider doors, higher ceilings, and flowers', 'Tear it down', 'Nothing'], 1, 'They transform their village to be worthy of Esteban\'s memory.'),
  // Hard
  createQuestion('literature', 'hard', 'What does the drowned man symbolize in the story?', ['Death', 'The power of imagination and beauty to transform ordinary lives', 'Evil', 'The ocean'], 1, 'A stranger\'s body becomes a catalyst for the village\'s spiritual renewal.'),
  createQuestion('literature', 'hard', 'How does this story connect to the theme of "Reigniting the Future"?', ['It doesn\'t', 'An unexpected event inspires a community to reimagine and rebuild their world', 'Through technology', 'Through war'], 1, 'The villagers reignite their aspirations through encountering something extraordinary.'),
];

// ============================================================================
// SPECIAL AREA QUESTIONS (40 questions) - Current Events / WSC Themes
// ============================================================================
export const specialAreaQuestions: Question[] = [
  // Easy (15)
  createQuestion('special_area', 'easy', 'What is artificial intelligence (AI)?', ['A type of robot', 'Computer systems that can learn and make decisions', 'A video game', 'A social media platform'], 1, 'AI mimics human intelligence for tasks like learning and problem-solving.'),
  createQuestion('special_area', 'easy', 'What is climate change?', ['A new season', 'Long-term changes in Earth\'s temperature and weather', 'A type of storm', 'Daily weather changes'], 1, 'Climate change affects weather patterns globally over decades.'),
  createQuestion('special_area', 'easy', 'What is renewable energy?', ['Energy that runs out', 'Energy from sources that can be replenished', 'Nuclear energy', 'Fossil fuels'], 1, 'Solar, wind, and hydropower are renewable sources.'),
  createQuestion('special_area', 'easy', 'What is the internet?', ['A type of computer', 'A global network connecting computers', 'A search engine', 'An email service'], 1, 'The internet connects billions of devices worldwide.'),
  createQuestion('special_area', 'easy', 'What is recycling?', ['Throwing things away', 'Converting waste into reusable materials', 'Burning trash', 'Burying garbage'], 1, 'Recycling reduces waste and conserves resources.'),
  createQuestion('special_area', 'easy', 'What is a pandemic?', ['A local disease', 'A disease outbreak across multiple countries or worldwide', 'A type of vaccine', 'A hospital'], 1, 'COVID-19 was declared a pandemic in 2020.'),
  createQuestion('special_area', 'easy', 'What does "sustainability" mean?', ['Using things once', 'Meeting needs without harming future generations', 'Making things bigger', 'Moving faster'], 1, 'Sustainability balances economic, environmental, and social needs.'),
  createQuestion('special_area', 'easy', 'What is social media?', ['Television', 'Websites and apps for sharing content and connecting', 'Newspapers', 'Radio'], 1, 'Platforms like Instagram, TikTok, and YouTube are social media.'),
  createQuestion('special_area', 'easy', 'What is biodiversity?', ['One type of animal', 'The variety of life on Earth', 'A type of plant', 'A zoo'], 1, 'Biodiversity includes all species of plants, animals, and microorganisms.'),
  createQuestion('special_area', 'easy', 'What is coding or programming?', ['Drawing', 'Writing instructions for computers', 'Playing games', 'Using social media'], 1, 'Programmers write code to create software and apps.'),
  createQuestion('special_area', 'easy', 'What is the World Scholars Cup?', ['A math competition', 'An academic tournament for students worldwide', 'A spelling bee', 'A sports event'], 1, 'WSC combines debate, collaborative writing, and quiz competitions.'),
  createQuestion('special_area', 'easy', 'What does "globalization" mean?', ['Local business', 'Increasing connections between countries worldwide', 'A type of map', 'A single country'], 1, 'Globalization includes trade, culture, and communication across borders.'),
  createQuestion('special_area', 'easy', 'What is an endangered species?', ['A common animal', 'An animal at risk of extinction', 'A farm animal', 'A pet'], 1, 'Pandas, tigers, and rhinos are endangered species.'),
  createQuestion('special_area', 'easy', 'What is the United Nations?', ['A country', 'An international organization for peace and cooperation', 'A company', 'A charity'], 1, 'The UN has 193 member states working on global issues.'),
  createQuestion('special_area', 'easy', 'What is a carbon footprint?', ['A type of shoe', 'The amount of carbon dioxide produced by activities', 'A hiking trail', 'A fossil'], 1, 'Reducing your carbon footprint helps fight climate change.'),

  // Medium (15)
  createQuestion('special_area', 'medium', 'What year was the first smartphone released?', ['1992', '2007', '2010', '2015'], 1, 'Apple released the first iPhone in 2007.'),
  createQuestion('special_area', 'medium', 'What is the Great Barrier Reef threatened by?', ['Too many fish', 'Climate change and coral bleaching', 'Earthquakes', 'Overfishing only'], 1, 'Rising ocean temperatures cause coral bleaching.'),
  createQuestion('special_area', 'medium', 'What is blockchain technology?', ['A type of video game', 'A decentralized digital ledger system', 'A social network', 'A search engine'], 1, 'Blockchain is used for cryptocurrencies and secure records.'),
  createQuestion('special_area', 'medium', 'What country hosted the 2024 Summer Olympics?', ['USA', 'Japan', 'France', 'Australia'], 2, 'Paris, France hosted the 2024 Summer Olympics.'),
  createQuestion('special_area', 'medium', 'What is the Paris Agreement about?', ['Trade between countries', 'Fighting climate change', 'Space exploration', 'Internet regulation'], 1, 'Countries agreed to limit global warming to 1.5°C above pre-industrial levels.'),
  createQuestion('special_area', 'medium', 'What is machine learning?', ['Teaching humans to use machines', 'AI systems that improve from experience without explicit programming', 'Building robots', 'Computer repairs'], 1, 'Machine learning powers recommendations, voice assistants, and more.'),
  createQuestion('special_area', 'medium', 'What are microplastics?', ['Large plastic containers', 'Tiny plastic particles less than 5mm', 'Recyclable plastics', 'Biodegradable plastics'], 1, 'Microplastics pollute oceans and enter the food chain.'),
  createQuestion('special_area', 'medium', 'What is the gig economy?', ['Music industry', 'Short-term contract and freelance work', 'Government jobs', 'Factory work'], 1, 'Apps like Uber and Fiverr are part of the gig economy.'),
  createQuestion('special_area', 'medium', 'What is CRISPR?', ['A type of chip', 'A gene-editing technology', 'A computer program', 'A social media app'], 1, 'CRISPR allows scientists to edit DNA precisely.'),
  createQuestion('special_area', 'medium', 'What is the main cause of deforestation?', ['Volcanoes', 'Agriculture and logging', 'Tsunamis', 'Ice ages'], 1, 'Land is cleared for farming, ranching, and timber.'),
  createQuestion('special_area', 'medium', 'What is digital citizenship?', ['Living online', 'Responsible and ethical use of technology', 'Having many followers', 'Being a gamer'], 1, 'Digital citizens respect others and protect privacy online.'),
  createQuestion('special_area', 'medium', 'What is the space race 2.0 about?', ['Racing cars in space', 'Competition between companies and countries for space exploration', 'Video game', 'Running competitions'], 1, 'SpaceX, NASA, and other nations compete for Mars missions.'),
  createQuestion('special_area', 'medium', 'What are Sustainable Development Goals (SDGs)?', ['Personal goals', '17 global goals adopted by the UN for 2030', 'Business targets', 'Sports achievements'], 1, 'SDGs address poverty, inequality, climate, and more.'),
  createQuestion('special_area', 'medium', 'What is fake news?', ['Newspapers', 'Deliberately false information presented as news', 'Comedy shows', 'Satire magazines'], 1, 'Fake news spreads misinformation, often on social media.'),
  createQuestion('special_area', 'medium', 'What is the metaverse?', ['A parallel universe', 'Immersive virtual reality spaces for interaction', 'A video game', 'A social network'], 1, 'The metaverse combines VR, AR, and the internet.'),

  // Hard (10)
  createQuestion('special_area', 'hard', 'What is net-zero emissions?', ['Zero factories', 'Balancing carbon emitted with carbon removed', 'No cars', 'Zero electricity use'], 1, 'Net-zero means removing as much CO2 as we emit.'),
  createQuestion('special_area', 'hard', 'What is the Anthropocene?', ['A geological era', 'The proposed current epoch defined by human impact on Earth', 'A type of rock', 'An ancient civilization'], 1, 'Scientists propose this term for human-dominated era.'),
  createQuestion('special_area', 'hard', 'What is algorithmic bias?', ['Computer speed', 'Unfair outcomes in AI systems due to biased data or design', 'A type of coding', 'Internet speed'], 1, 'Biased algorithms can discriminate in hiring, lending, etc.'),
  createQuestion('special_area', 'hard', 'What is the circular economy?', ['A round building', 'An economic system minimizing waste through reuse and recycling', 'Stock market', 'Currency exchange'], 1, 'It contrasts with the linear "take-make-dispose" model.'),
  createQuestion('special_area', 'hard', 'What is quantum computing?', ['Fast regular computers', 'Computing using quantum mechanical phenomena', 'Cloud computing', 'Mobile computing'], 1, 'Quantum computers use qubits that can be 0 and 1 simultaneously.'),
  createQuestion('special_area', 'hard', 'What is the "butterfly effect"?', ['Butterfly migration', 'Small changes causing large, unpredictable consequences', 'A dance', 'A painting technique'], 1, 'A butterfly flapping wings could theoretically cause a tornado.'),
  createQuestion('special_area', 'hard', 'What is epistemic humility?', ['Being quiet', 'Recognizing the limits of one\'s knowledge', 'Academic degree', 'A type of meditation'], 1, 'It means acknowledging what we don\'t know.'),
  createQuestion('special_area', 'hard', 'What is the Turing Test?', ['A math exam', 'A test of machine intelligence through human-like conversation', 'A programming language', 'A computer part'], 1, 'Alan Turing proposed it in 1950 to measure AI intelligence.'),
  createQuestion('special_area', 'hard', 'What is cultural appropriation?', ['Learning about cultures', 'Adopting elements of a culture in a way that disrespects its origin', 'Sharing food', 'Traveling abroad'], 1, 'It\'s controversial when dominant groups adopt marginalized cultures\' elements.'),
  createQuestion('special_area', 'hard', 'What is the trolley problem?', ['A transportation issue', 'An ethical thought experiment about sacrificing one to save many', 'A game', 'A math problem'], 1, 'It explores moral decisions about harm and inaction.'),

  // WSC 2025 Theme: "Reigniting the Future" Questions
  createQuestion('special_area', 'easy', 'What is the 2025 World Scholars Cup theme?', ['Reconstructing the Past', 'Reigniting the Future', 'A World Renewed', 'The World Within'], 1, 'The 2025 WSC theme explores how humanity can revitalize its approach to future challenges.'),
  createQuestion('special_area', 'easy', 'What is "futures thinking"?', ['Predicting lottery numbers', 'Systematic exploration of possible future scenarios', 'Time travel', 'Fortune telling'], 1, 'Futures thinking helps us prepare for and shape potential futures.'),
  createQuestion('special_area', 'medium', 'What was the 2024 World Scholars Cup theme?', ['Reigniting the Future', 'Reimagining the Present', 'A World on the Margins', 'An Entangled World'], 1, 'The 2024 theme explored how we can rethink our current world.'),
  createQuestion('special_area', 'medium', 'What is the 2026 World Scholars Cup theme?', ['Reigniting the Future', 'Are We There Yet?', 'The Final Frontier', 'Looking Back'], 1, 'The 2026 theme "Are We There Yet?" explores journeys and destinations.'),
  createQuestion('special_area', 'medium', 'What is "geoengineering"?', ['Building bridges', 'Large-scale interventions to modify Earth\'s climate', 'Mining', 'Road construction'], 1, 'Geoengineering includes ideas like solar radiation management and carbon capture.'),
  createQuestion('special_area', 'hard', 'What is "solarpunk"?', ['A music genre', 'An optimistic movement imagining sustainable, technology-positive futures', 'Solar panel design', 'A video game'], 1, 'Solarpunk envisions eco-friendly cities powered by renewable energy.'),
  createQuestion('special_area', 'hard', 'What is "longtermism"?', ['Long-distance running', 'A philosophy prioritizing the long-term future of humanity', 'Retirement planning', 'Historical study'], 1, 'Longtermists consider how our actions affect future generations.'),
  createQuestion('special_area', 'hard', 'What is "existential risk"?', ['Fear of heights', 'Threats that could permanently curtail humanity\'s potential', 'Job interviews', 'Stage fright'], 1, 'Examples include nuclear war, pandemics, and unaligned AI.'),

  // WSC Literature Selections
  createQuestion('special_area', 'easy', 'Who wrote "The Little Prince"?', ['Roald Dahl', 'Antoine de Saint-Exupéry', 'J.K. Rowling', 'C.S. Lewis'], 1, 'Saint-Exupéry was a French aviator who wrote this beloved tale in 1943.'),
  createQuestion('special_area', 'easy', 'What does the Little Prince learn about his rose?', ['It\'s worthless', 'It\'s unique because of the time he invested in it', 'It\'s the largest rose', 'It can talk'], 1, '"You become responsible forever for what you have tamed."'),
  createQuestion('special_area', 'medium', 'Who wrote "Ender\'s Game"?', ['Isaac Asimov', 'Orson Scott Card', 'Arthur C. Clarke', 'Ray Bradbury'], 1, 'Card published this science fiction novel about child soldiers in 1985.'),
  createQuestion('special_area', 'medium', 'In "Ender\'s Game," what is Battle School?', ['A video game company', 'A space station training children for war against aliens', 'A martial arts dojo', 'A military academy on Earth'], 1, 'Children are trained from age 6 to command forces against the Formics.'),
  createQuestion('special_area', 'medium', 'Who wrote "Things Fall Apart"?', ['Chimamanda Ngozi Adichie', 'Chinua Achebe', 'Wole Soyinka', 'Ben Okri'], 1, 'Achebe\'s 1958 novel depicts pre-colonial Nigeria and colonialism\'s impact.'),
  createQuestion('special_area', 'medium', 'What is the main character\'s name in "Things Fall Apart"?', ['Achebe', 'Okonkwo', 'Obierika', 'Nwoye'], 1, 'Okonkwo is a respected Igbo warrior whose world is disrupted by colonialism.'),
  createQuestion('special_area', 'hard', 'In "Nightfall" by Isaac Asimov, what happens when night falls?', ['People sleep', 'Civilization collapses due to psychological terror of darkness', 'The temperature drops', 'Nothing special'], 1, 'On a planet with six suns, darkness comes only every 2,049 years.'),
  createQuestion('special_area', 'hard', 'What is the theme of Asimov\'s "The Last Question"?', ['Space travel', 'Entropy and the ultimate fate of the universe', 'Robot rights', 'Time travel'], 1, 'The story spans trillions of years asking if entropy can be reversed.'),
  createQuestion('special_area', 'hard', 'In "Flowers for Algernon," who is Algernon?', ['The doctor', 'A laboratory mouse who undergoes intelligence enhancement', 'The narrator', 'A teacher'], 1, 'Charlie Gordon undergoes the same procedure that enhanced Algernon\'s intelligence.'),

  // More Current Events & Global Issues
  createQuestion('special_area', 'easy', 'What is generative AI?', ['Electricity generators', 'AI that can create new content like text, images, and code', 'Game generators', 'Power plants'], 1, 'ChatGPT and DALL-E are examples of generative AI.'),
  createQuestion('special_area', 'easy', 'What is a "deepfake"?', ['Deep sea diving', 'AI-generated fake video or audio of real people', 'A deep lake', 'A type of cake'], 1, 'Deepfakes raise concerns about misinformation and trust.'),
  createQuestion('special_area', 'medium', 'What is "rewilding"?', ['Pet training', 'Restoring natural ecosystems by reintroducing species', 'Zoo management', 'Wildlife photography'], 1, 'Rewilding aims to restore natural processes and biodiversity.'),
  createQuestion('special_area', 'medium', 'What is "fast fashion"?', ['Speed racing', 'Rapid production of cheap, trendy clothing', 'Athletic wear', 'Designer brands'], 1, 'Fast fashion contributes to pollution and labor exploitation.'),
  createQuestion('special_area', 'medium', 'What is "data sovereignty"?', ['Computer storage', 'The idea that data is subject to the laws of the country where it\'s collected', 'Internet speed', 'Cloud computing'], 1, 'Countries increasingly assert control over data within their borders.'),
  createQuestion('special_area', 'hard', 'What is the "great resignation"?', ['Government collapse', 'Mass voluntary job departures that began during COVID-19', 'Political movement', 'Military disbandment'], 1, 'Millions quit jobs seeking better work-life balance and purpose.'),
  createQuestion('special_area', 'hard', 'What is "effective altruism"?', ['Charity donation', 'Using evidence and reason to determine the most effective ways to help others', 'Volunteer work', 'Social media activism'], 1, 'EA practitioners often focus on global health, poverty, and existential risks.'),
  createQuestion('special_area', 'hard', 'What is "information asymmetry"?', ['Uneven bookshelves', 'When one party in a transaction has more information than another', 'Computer bugs', 'Network errors'], 1, 'It can lead to market failures and unfair advantages.'),
];

// ============================================================================
// COMBINED QUESTION DATABASE
// ============================================================================
export const allQuestions: Question[] = [
  ...scienceQuestions,
  ...socialStudiesQuestions,
  ...artsQuestions,
  ...literatureQuestions,
  ...specialAreaQuestions,
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get questions by subject and optionally difficulty
 */
export function getQuestionsBySubject(
  subject: string,
  difficulty?: 'easy' | 'medium' | 'hard',
  count?: number
): Question[] {
  const subjectMap: Record<string, Question[]> = {
    science: scienceQuestions,
    social_studies: socialStudiesQuestions,
    arts: artsQuestions,
    literature: literatureQuestions,
    special_area: specialAreaQuestions,
  };

  let questions = subjectMap[subject] || [];

  if (difficulty) {
    questions = questions.filter(q => q.difficulty === difficulty);
  }

  // Shuffle
  questions = [...questions].sort(() => Math.random() - 0.5);

  return count ? questions.slice(0, count) : questions;
}

/**
 * Get mixed questions from all subjects
 */
export function getMixedQuestions(
  difficulty?: 'easy' | 'medium' | 'hard',
  count: number = 10
): Question[] {
  let questions = [...allQuestions];

  if (difficulty) {
    questions = questions.filter(q => q.difficulty === difficulty);
  }

  // Shuffle and return requested count
  return questions.sort(() => Math.random() - 0.5).slice(0, count);
}

/**
 * Get question count statistics
 */
export function getQuestionStats(): {
  total: number;
  bySubject: Record<string, number>;
  byDifficulty: Record<string, number>;
} {
  const bySubject: Record<string, number> = {};
  const byDifficulty: Record<string, number> = { easy: 0, medium: 0, hard: 0 };

  for (const q of allQuestions) {
    bySubject[q.subject] = (bySubject[q.subject] || 0) + 1;
    byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] || 0) + 1;
  }

  return {
    total: allQuestions.length,
    bySubject,
    byDifficulty,
  };
}
