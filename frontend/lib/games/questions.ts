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
// SCIENCE QUESTIONS (50+ questions) - WSC 2026 "Are We There Yet?" Theme Aligned
// Topics: Transportation, Space Travel, Medical Progress, Climate Goals, Infrastructure
// ============================================================================
export const scienceQuestions: Question[] = [
  // ==========================================================================
  // TRANSPORTATION & MOVEMENT SCIENCE (WSC 2026 Theme)
  // ==========================================================================
  // Easy
  createQuestion('science', 'easy', 'What type of train uses magnets to float above the tracks?', ['Steam train', 'Maglev train', 'Diesel train', 'Electric train'], 1, 'Maglev (magnetic levitation) trains can reach speeds over 600 km/h.'),
  createQuestion('science', 'easy', 'What fuel do most rockets use to escape Earth\'s atmosphere?', ['Gasoline', 'Liquid hydrogen and oxygen', 'Coal', 'Solar power'], 1, 'Hydrogen and oxygen combine explosively to produce thrust.'),
  createQuestion('science', 'easy', 'What is the fastest speed a human has ever traveled?', ['100 km/h', '1,000 km/h', '40,000 km/h', '100,000 km/h'], 2, 'Apollo 10 astronauts reached 39,897 km/h returning from the Moon.'),
  createQuestion('science', 'easy', 'What powers an electric car?', ['Gasoline', 'Batteries', 'Coal', 'Steam'], 1, 'Electric vehicles use rechargeable lithium-ion batteries.'),
  createQuestion('science', 'easy', 'How do airplanes stay in the air?', ['Magic', 'Lift created by air flowing over wings', 'Helium', 'Magnets'], 1, 'Wing shape causes air to move faster above, creating lift.'),
  createQuestion('science', 'easy', 'What is GPS used for?', ['Taking photos', 'Finding your location using satellites', 'Making phone calls', 'Playing music'], 1, 'GPS uses 24+ satellites to pinpoint locations on Earth.'),
  createQuestion('science', 'easy', 'How long does it take to fly from New York to London?', ['2 hours', '7 hours', '24 hours', '3 days'], 1, 'Commercial jets cross the Atlantic in about 7 hours.'),
  createQuestion('science', 'easy', 'What was the first vehicle to land on Mars?', ['Viking 1 lander', 'Apollo 11', 'Space Shuttle', 'Sputnik'], 0, 'Viking 1 landed on Mars on July 20, 1976.'),

  // Medium
  createQuestion('science', 'medium', 'How fast do Japan\'s Shinkansen bullet trains travel?', ['100 km/h', '200 km/h', '320 km/h', '500 km/h'], 2, 'The Shinkansen has operated since 1964 with zero fatal accidents.'),
  createQuestion('science', 'medium', 'What is "escape velocity" from Earth?', ['The speed needed to leave Earth\'s gravity', 'The speed of sound', 'The speed limit on highways', 'The fastest a plane can fly'], 0, 'You need about 11.2 km/s to escape Earth\'s gravitational pull.'),
  createQuestion('science', 'medium', 'What technology allows ships to know exactly where they are at sea?', ['Compass only', 'Satellite navigation (GPS)', 'Star charts only', 'Radar only'], 1, 'Modern ships use GPS for precise positioning anywhere on Earth.'),
  createQuestion('science', 'medium', 'How does a submarine dive and surface?', ['By changing its weight using ballast tanks', 'By using propellers', 'By changing shape', 'By using magnets'], 0, 'Submarines fill tanks with water to sink and air to rise.'),
  createQuestion('science', 'medium', 'What is "regenerative braking" in electric vehicles?', ['Using hand brakes', 'Converting motion back into electricity', 'Using parachutes', 'Friction brakes only'], 1, 'When slowing down, motors become generators that recharge batteries.'),
  createQuestion('science', 'medium', 'How long does it take to travel to Mars?', ['1 week', '3 months', '7-9 months', '5 years'], 2, 'Mars missions typically take 7-9 months depending on orbital positions.'),
  createQuestion('science', 'medium', 'What is a "hyperloop"?', ['A roller coaster', 'A proposed high-speed transport in vacuum tubes', 'A type of airplane', 'An underwater tunnel'], 1, 'Hyperloop concepts propose speeds over 1,000 km/h in low-pressure tubes.'),
  createQuestion('science', 'medium', 'What fuel might power future long-distance space travel?', ['Gasoline', 'Nuclear fusion or ion propulsion', 'Coal', 'Wind'], 1, 'Ion engines provide small but continuous thrust for deep space missions.'),

  // Hard
  createQuestion('science', 'hard', 'What is the "Oberth effect" in spaceflight?', ['Drag from atmosphere', 'More efficient fuel burn when moving faster', 'Gravity assist', 'Solar wind'], 1, 'Rockets gain more energy from fuel when already moving fast near a planet.'),
  createQuestion('science', 'hard', 'What is a Hohmann transfer orbit?', ['A type of satellite', 'The most fuel-efficient path between two orbits', 'A space station design', 'A rocket engine'], 1, 'It\'s the elliptical path spacecraft use to travel between planets efficiently.'),
  createQuestion('science', 'hard', 'What is "time dilation" during high-speed travel?', ['Jet lag', 'Time passes slower for objects moving near light speed', 'Daylight saving', 'Time zones'], 1, 'Einstein\'s relativity shows GPS satellites must correct for this effect.'),
  createQuestion('science', 'hard', 'What is the main challenge for tunneling through the Alps for high-speed rail?', ['Finding workers', 'Extreme pressure, heat, and unpredictable rock', 'Too many trees', 'Weather'], 1, 'The Gotthard Base Tunnel took 17 years and is 57 km long.'),

  // ==========================================================================
  // SPACE EXPLORATION PROGRESS (WSC 2026 Theme: "Are We There Yet?")
  // ==========================================================================
  // Easy
  createQuestion('science', 'easy', 'Has any human walked on Mars?', ['Yes, in 2020', 'No, not yet', 'Yes, in 1980', 'Yes, last year'], 1, 'Humans have only walked on the Moon; Mars remains a future goal.'),
  createQuestion('science', 'easy', 'What year did humans first land on the Moon?', ['1959', '1969', '1979', '1989'], 1, 'Neil Armstrong and Buzz Aldrin landed on July 20, 1969.'),
  createQuestion('science', 'easy', 'How far away is the Moon from Earth?', ['1,000 km', '38,000 km', '384,000 km', '3.8 million km'], 2, 'Light takes about 1.3 seconds to travel from Moon to Earth.'),
  createQuestion('science', 'easy', 'What is the International Space Station?', ['A rocket', 'A laboratory orbiting Earth', 'A hotel on the Moon', 'A satellite dish'], 1, 'The ISS has been continuously occupied since November 2000.'),

  // Medium
  createQuestion('science', 'medium', 'What is NASA\'s Artemis program trying to achieve?', ['Build the ISS', 'Return humans to the Moon and eventually reach Mars', 'Launch satellites', 'Study the Sun'], 1, 'Artemis aims to land the first woman and person of color on the Moon.'),
  createQuestion('science', 'medium', 'What is the James Webb Space Telescope studying?', ['Weather on Earth', 'The early universe and distant galaxies', 'The Moon\'s surface', 'Asteroids only'], 1, 'Webb can see infrared light from the universe\'s earliest stars.'),
  createQuestion('science', 'medium', 'How long did it take Voyager 1 to leave our solar system?', ['10 years', '25 years', '35 years', '50 years'], 2, 'Launched in 1977, Voyager 1 entered interstellar space in 2012.'),
  createQuestion('science', 'medium', 'What private company has sent astronauts to space?', ['Tesla', 'SpaceX', 'Amazon', 'Microsoft'], 1, 'SpaceX\'s Crew Dragon has transported NASA astronauts to the ISS.'),

  // Hard
  createQuestion('science', 'hard', 'What is the "Overview Effect" experienced by astronauts?', ['Motion sickness', 'A cognitive shift from seeing Earth from space', 'Muscle weakness', 'Memory loss'], 1, 'Astronauts report profound feelings of unity seeing Earth\'s fragility.'),
  createQuestion('science', 'hard', 'What is the main radiation danger for Mars travelers?', ['UV rays', 'Cosmic rays and solar particle events', 'X-rays', 'Radio waves'], 1, 'Without Earth\'s magnetic field, astronauts face increased cancer risk.'),
  createQuestion('science', 'hard', 'What is "in-situ resource utilization" for space exploration?', ['Bringing supplies from Earth', 'Using local materials on other planets', 'Remote sensing', 'Radio communication'], 1, 'Future Mars missions may produce oxygen and fuel from Martian resources.'),

  // ==========================================================================
  // MEDICAL & HEALTH PROGRESS (WSC 2026 Theme)
  // ==========================================================================
  // Easy
  createQuestion('science', 'easy', 'What is a vaccine?', ['A medicine for pain', 'A substance that trains your immune system to fight diseases', 'A type of vitamin', 'A bandage'], 1, 'Vaccines contain weakened or inactivated versions of pathogens.'),
  createQuestion('science', 'easy', 'Have scientists cured all cancers yet?', ['Yes, in 2010', 'No, but treatments keep improving', 'Yes, last year', 'There\'s no such thing as cancer'], 1, 'Cancer survival rates have dramatically improved but cures remain elusive.'),
  createQuestion('science', 'easy', 'What organ can doctors transplant from one person to another?', ['None', 'Heart, kidney, liver, and many others', 'Only bones', 'Only skin'], 1, 'The first successful heart transplant was in 1967.'),

  // Medium
  createQuestion('science', 'medium', 'What is mRNA technology used in some COVID-19 vaccines?', ['A surgical technique', 'Instructions for cells to make proteins that trigger immunity', 'A type of pill', 'A blood test'], 1, 'mRNA vaccines were developed in record time during the pandemic.'),
  createQuestion('science', 'medium', 'What is prosthetics advancement allowing amputees to do?', ['Nothing new', 'Control artificial limbs with their thoughts', 'Only walk slowly', 'Only sit'], 1, 'Brain-computer interfaces can control advanced robotic limbs.'),
  createQuestion('science', 'medium', 'How close are we to curing HIV/AIDS?', ['Already cured', 'Very close - some patients have been functionally cured', 'No progress', 'Decades away'], 1, 'A few patients have been cured through specialized stem cell treatments.'),

  // Hard
  createQuestion('science', 'hard', 'What is "CRISPR" being tested to treat?', ['Broken bones', 'Genetic diseases like sickle cell anemia', 'Common colds', 'Sunburn'], 1, 'CRISPR gene editing shows promise for treating inherited blood disorders.'),
  createQuestion('science', 'hard', 'What is xenotransplantation?', ['Exercise therapy', 'Transplanting organs from animals to humans', 'Laser surgery', 'Chemotherapy'], 1, 'In 2022, a patient received a genetically modified pig heart.'),

  // ==========================================================================
  // CLIMATE & ENVIRONMENTAL PROGRESS (WSC 2026 Theme)
  // ==========================================================================
  // Easy
  createQuestion('science', 'easy', 'What is the goal of the Paris Agreement on climate?', ['Build more cars', 'Limit global warming to 1.5°C above pre-industrial levels', 'Increase factories', 'Ban all travel'], 1, 'Nearly 200 countries signed this agreement in 2015.'),
  createQuestion('science', 'easy', 'Are electric cars completely pollution-free?', ['Yes, totally clean', 'No, but cleaner than gasoline cars overall', 'They pollute more', 'Same as gasoline'], 1, 'Production and electricity generation still have environmental impacts.'),
  createQuestion('science', 'easy', 'What percentage of electricity comes from renewable sources worldwide?', ['5%', '10%', 'About 30%', '80%'], 2, 'Renewable energy is growing but fossil fuels still dominate.'),

  // Medium
  createQuestion('science', 'medium', 'What is "carbon capture" technology?', ['A camera filter', 'Removing CO2 from the atmosphere or emissions', 'A type of fuel', 'A weather system'], 1, 'Direct air capture plants are being built but remain expensive.'),
  createQuestion('science', 'medium', 'How much has global temperature risen since 1850?', ['0.1°C', 'About 1.1°C', '5°C', '10°C'], 1, 'The planet is warming faster than any time in the past 2,000 years.'),
  createQuestion('science', 'medium', 'What is the Great Barrier Reef\'s current status?', ['Completely healthy', 'Severely damaged but recovery efforts continue', 'Already dead', 'Growing rapidly'], 1, 'Multiple mass bleaching events have occurred due to warming oceans.'),

  // Hard
  createQuestion('science', 'hard', 'What is "geoengineering"?', ['Building dams', 'Deliberate large-scale intervention in Earth\'s climate system', 'Mining', 'Farming'], 1, 'Proposals include reflecting sunlight or removing atmospheric CO2.'),
  createQuestion('science', 'hard', 'Are we on track to meet the Paris Agreement goals?', ['Yes, well ahead', 'No, current policies would lead to 2.5-3°C warming', 'Already achieved', 'Goals were cancelled'], 1, 'Significant gaps remain between pledges and actions needed.'),

  // ==========================================================================
  // CONNECTIVITY & COMMUNICATION PROGRESS (WSC 2026 Theme)
  // ==========================================================================
  // Easy
  createQuestion('science', 'easy', 'What is fiber optic internet?', ['Radio waves', 'Light signals through glass cables for fast data', 'Copper wires', 'Satellite only'], 1, 'Fiber optics can transmit data at near light speed.'),
  createQuestion('science', 'easy', 'What is 5G?', ['A vitamin', 'The fifth generation of mobile network technology', 'A video game', 'A type of car'], 1, '5G enables faster downloads and more connected devices.'),

  // Medium
  createQuestion('science', 'medium', 'What is Starlink?', ['A constellation', 'A satellite internet system providing global broadband', 'A star map app', 'A rocket'], 1, 'SpaceX\'s Starlink has launched thousands of satellites for internet access.'),
  createQuestion('science', 'medium', 'Why does Australia have internet connectivity challenges?', ['No computers', 'Vast distances, sparse population, and difficult terrain', 'Government ban', 'No electricity'], 1, 'Rural Australia relies on satellites due to the cost of ground infrastructure.'),
  createQuestion('science', 'medium', 'What is "the digital divide"?', ['A math problem', 'The gap between those with and without internet access', 'A video game', 'A phone crack'], 1, 'About 2.7 billion people still lack internet access globally.'),

  // Hard
  createQuestion('science', 'hard', 'What is quantum internet?', ['Very fast regular internet', 'Communication using quantum entanglement for unhackable data', 'Space internet', 'Wireless only'], 1, 'Quantum networks could revolutionize secure communication.'),
  createQuestion('science', 'hard', 'What is latency in internet connections?', ['Download speed', 'The delay between sending and receiving data', 'Storage space', 'Signal strength'], 1, 'Low latency is crucial for real-time applications like gaming and surgery.'),

  // ==========================================================================
  // FOUNDATIONAL SCIENCE (Core knowledge)
  // ==========================================================================
  // Easy
  createQuestion('science', 'easy', 'What is the chemical symbol for water?', ['H2O', 'CO2', 'NaCl', 'O2'], 0, 'Water is made of two hydrogen atoms and one oxygen atom.'),
  createQuestion('science', 'easy', 'Which planet is known as the Red Planet?', ['Venus', 'Mars', 'Jupiter', 'Saturn'], 1, 'Mars appears red due to iron oxide (rust) on its surface.'),
  createQuestion('science', 'easy', 'What gas do plants absorb from the air?', ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Helium'], 1, 'Plants absorb CO2 for photosynthesis and release oxygen.'),
  createQuestion('science', 'easy', 'Which force keeps us on the ground?', ['Magnetism', 'Friction', 'Gravity', 'Electricity'], 2, 'Gravity pulls objects toward Earth\'s center.'),
  createQuestion('science', 'easy', 'What is the boiling point of water in Celsius?', ['50°C', '100°C', '150°C', '200°C'], 1, 'Water boils at 100°C (212°F) at sea level.'),

  // Medium
  createQuestion('science', 'medium', 'What is the process by which plants make food?', ['Respiration', 'Photosynthesis', 'Fermentation', 'Digestion'], 1, 'Photosynthesis converts sunlight, water, and CO2 into glucose.'),
  createQuestion('science', 'medium', 'How many chromosomes do humans have?', ['23', '46', '48', '52'], 1, 'Humans have 23 pairs, or 46 total chromosomes.'),
  createQuestion('science', 'medium', 'What causes the seasons on Earth?', ['Distance from Sun', 'Earth\'s tilted axis', 'Moon\'s gravity', 'Solar flares'], 1, 'Earth\'s 23.5° tilt causes different parts to receive varying sunlight.'),
  createQuestion('science', 'medium', 'How long does it take light to travel from the Sun to Earth?', ['8 seconds', '8 minutes', '8 hours', '8 days'], 1, 'Light travels about 93 million miles in 8 minutes 20 seconds.'),

  // Hard
  createQuestion('science', 'hard', 'What is the speed of light in a vacuum?', ['300,000 km/s', '300,000 m/s', '30,000 km/s', '3,000,000 km/s'], 0, 'Light travels at approximately 299,792 km/s.'),
  createQuestion('science', 'hard', 'What is the Doppler effect?', ['Light bending around objects', 'Change in frequency due to motion', 'Heat transfer through radiation', 'Sound echoing'], 1, 'Moving sources cause frequency shifts - this is why sirens change pitch.'),
  createQuestion('science', 'hard', 'What is the powerhouse of the cell?', ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi apparatus'], 2, 'Mitochondria produce ATP through cellular respiration.'),
  createQuestion('science', 'hard', 'What is nuclear fusion?', ['Splitting atoms', 'Combining atomic nuclei to release energy', 'Chemical reaction', 'Radioactive decay'], 1, 'The Sun produces energy through nuclear fusion of hydrogen.'),
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
// SPECIAL AREA QUESTIONS (70+ questions) - WSC 2026 "Are We There Yet?" Theme
// Topics: Megaprojects, Progress Metrics, Journeys, Social Issues, Global Goals
// ============================================================================
export const specialAreaQuestions: Question[] = [
  // ==========================================================================
  // WSC 2026 THEME: "ARE WE THERE YET?" - Core Questions
  // ==========================================================================
  // Easy
  createQuestion('special_area', 'easy', 'What is the 2026 World Scholars Cup theme?', ['Reigniting the Future', 'Are We There Yet?', 'The Final Frontier', 'A World Reborn'], 1, 'The 2026 theme explores journeys, destinations, and measuring progress.'),
  createQuestion('special_area', 'easy', 'What was the 2025 World Scholars Cup theme?', ['Are We There Yet?', 'Reigniting the Future', 'A World on the Margins', 'The Great Unknown'], 1, 'The 2025 theme explored revitalizing humanity\'s approach to challenges.'),
  createQuestion('special_area', 'easy', 'What is the World Scholars Cup?', ['A math competition', 'An academic tournament for students worldwide', 'A spelling bee', 'A sports event'], 1, 'WSC combines debate, collaborative writing, and quiz competitions.'),
  createQuestion('special_area', 'easy', 'What does "Are We There Yet?" ask us to consider?', ['Vacation destinations', 'Whether we\'ve reached our goals and what "there" means', 'Driving directions', 'Airport arrivals'], 1, 'The theme questions progress, destinations, and the value of the journey itself.'),

  // Medium
  createQuestion('special_area', 'medium', 'What is the philosophical question behind "Are We There Yet?"?', ['When is lunch?', 'Is the destination or the journey more important?', 'How fast can we go?', 'Where is the map?'], 1, 'The theme explores whether reaching goals matters more than the process.'),
  createQuestion('special_area', 'medium', 'Why might some say "we\'ll never get there"?', ['Bad navigation', 'Progress creates new goals, so destinations keep moving', 'Broken vehicles', 'Wrong address'], 1, 'As societies advance, expectations and ambitions also grow.'),

  // ==========================================================================
  // MEGAPROJECTS (WSC 2026 Theme: Infrastructure & Ambition)
  // ==========================================================================
  // Easy
  createQuestion('special_area', 'easy', 'What is NEOM?', ['A video game', 'A futuristic city being built in Saudi Arabia', 'A car brand', 'A social media app'], 1, 'NEOM includes "The Line" - a 170km city with no cars or streets.'),
  createQuestion('special_area', 'easy', 'What was "The Big Dig" in Boston?', ['An archaeological project', 'A massive highway tunnel project', 'A mining operation', 'A beach cleanup'], 1, 'The Big Dig moved highways underground, taking 16 years (1991-2007).'),
  createQuestion('special_area', 'easy', 'What is high-speed rail?', ['Regular trains', 'Trains that travel over 250 km/h on dedicated tracks', 'Subway systems', 'Freight trains'], 1, 'Japan, China, and Europe have extensive high-speed rail networks.'),
  createQuestion('special_area', 'easy', 'What is the Channel Tunnel?', ['A TV channel', 'An underwater rail tunnel connecting England and France', 'A swimming pool', 'A radio station'], 1, 'The 50km "Chunnel" opened in 1994 after 6 years of construction.'),

  // Medium
  createQuestion('special_area', 'medium', 'Why has California\'s high-speed rail project faced criticism?', ['Too fast', 'Massive cost overruns and delays', 'Too many passengers', 'Perfect weather'], 1, 'Originally budgeted at $33B in 2008, now estimated over $100B.'),
  createQuestion('special_area', 'medium', 'What is "The Line" project in Saudi Arabia?', ['A queue system', 'A linear 170km city with zero cars and 100% renewable energy', 'A fashion show', 'A telephone service'], 1, 'The Line aims to house 9 million people in mirrored towers.'),
  createQuestion('special_area', 'medium', 'What lesson did The Big Dig teach about megaprojects?', ['Always easy', 'Costs and timelines often exceed initial estimates dramatically', 'Always on time', 'Never worth it'], 1, 'Originally $2.8B, it ended up costing $14.6B.'),
  createQuestion('special_area', 'medium', 'What is the Gotthard Base Tunnel?', ['A road tunnel', 'The world\'s longest rail tunnel through the Swiss Alps', 'A water pipe', 'A cable conduit'], 1, 'At 57km, it took 17 years to build and opened in 2016.'),
  createQuestion('special_area', 'medium', 'Why do countries build megaprojects despite the risks?', ['Boredom', 'National pride, economic growth, and solving major problems', 'Punishment', 'Accident'], 1, 'Megaprojects can transform regions but carry significant risks.'),

  // Hard
  createQuestion('special_area', 'hard', 'What is "megaproject optimism bias"?', ['Being happy', 'The tendency to underestimate costs and overestimate benefits', 'Successful planning', 'Realistic budgeting'], 1, 'Studies show 90% of megaprojects exceed budgets.'),
  createQuestion('special_area', 'hard', 'What percentage of megaprojects finish on budget?', ['90%', '50%', 'Less than 10%', '100%'], 2, 'Research shows the vast majority face significant overruns.'),
  createQuestion('special_area', 'hard', 'What is "sunk cost fallacy" in megaprojects?', ['Underwater construction', 'Continuing failed projects because of past investment', 'Ship building', 'Budget planning'], 1, 'Countries often continue failing projects to justify prior spending.'),

  // ==========================================================================
  // CONNECTIVITY & DIGITAL DIVIDE (WSC 2026 Theme)
  // ==========================================================================
  // Easy
  createQuestion('special_area', 'easy', 'What percentage of the world\'s population has internet access?', ['10%', '30%', 'About 60%', '95%'], 2, 'About 2.7 billion people still lack internet access.'),
  createQuestion('special_area', 'easy', 'What is the "digital divide"?', ['A math problem', 'The gap between those with and without technology access', 'A video game', 'A phone screen crack'], 1, 'Rural areas and developing nations face greater digital exclusion.'),
  createQuestion('special_area', 'easy', 'Why does rural Australia struggle with internet?', ['Too much internet', 'Vast distances make infrastructure expensive', 'No demand', 'Government choice'], 1, 'Serving remote areas with fiber optic cables is extremely costly.'),

  // Medium
  createQuestion('special_area', 'medium', 'What is Australia\'s National Broadband Network (NBN)?', ['A TV network', 'A government project to provide nationwide internet', 'A radio station', 'A phone company'], 1, 'The NBN has faced criticism for slower speeds than promised.'),
  createQuestion('special_area', 'medium', 'How are satellites helping internet access in remote areas?', ['They aren\'t', 'Projects like Starlink provide broadband from space', 'Only in cities', 'Only for governments'], 1, 'SpaceX\'s Starlink has thousands of satellites providing global coverage.'),
  createQuestion('special_area', 'medium', 'What is "last mile" connectivity?', ['Marathon running', 'The final connection between networks and homes', 'Last place finish', 'Mile markers'], 1, 'The "last mile" is often the most expensive part of internet infrastructure.'),

  // Hard
  createQuestion('special_area', 'hard', 'Why did Australia\'s NBN switch from fiber to copper?', ['Better technology', 'Cost-cutting that critics say compromised quality', 'Faster speeds', 'Public demand'], 1, 'The policy change is debated as sacrificing long-term value for short-term savings.'),
  createQuestion('special_area', 'hard', 'What is "digital colonialism"?', ['Online games', 'When tech companies from wealthy nations dominate others\' digital infrastructure', 'Computer viruses', 'Website design'], 1, 'Some argue that tech giants exert excessive control over developing nations.'),

  // ==========================================================================
  // LONELINESS & SOCIAL CONNECTION (WSC 2026 Theme)
  // ==========================================================================
  // Easy
  createQuestion('special_area', 'easy', 'What is the "loneliness epidemic"?', ['A disease', 'Rising rates of social isolation worldwide', 'Crowd phobia', 'Party planning'], 1, 'Many countries report increasing loneliness, especially after COVID-19.'),
  createQuestion('special_area', 'easy', 'Can technology make people feel more lonely?', ['Never', 'Yes, social media can increase feelings of isolation', 'Technology only helps', 'No connection'], 1, 'Online connection doesn\'t always replace in-person relationships.'),

  // Medium
  createQuestion('special_area', 'medium', 'What country appointed a "Minister of Loneliness"?', ['USA', 'United Kingdom', 'Australia', 'Canada'], 1, 'The UK created this position in 2018 to address social isolation.'),
  createQuestion('special_area', 'medium', 'How does loneliness affect physical health?', ['No effect', 'Similar health risks to smoking 15 cigarettes daily', 'Makes you stronger', 'Only mental effects'], 1, 'Chronic loneliness increases risks of heart disease and early death.'),
  createQuestion('special_area', 'medium', 'What is "social prescribing"?', ['Doctor\'s handwriting', 'When doctors recommend community activities for health', 'Medicine labels', 'Online shopping'], 1, 'Some healthcare systems prescribe social connection as treatment.'),

  // Hard
  createQuestion('special_area', 'hard', 'What is "hikikomori" in Japan?', ['A greeting', 'Severe social withdrawal, often for months or years', 'A food dish', 'A holiday'], 1, 'An estimated 1.5 million Japanese people live in extreme isolation.'),
  createQuestion('special_area', 'hard', 'How might the loneliness epidemic relate to "Are We There Yet?"?', ['It doesn\'t', 'Technology connected us globally but we\'re questioning if we\'ve arrived at true connection', 'Only about travel', 'Just about roads'], 1, 'Progress in communication hasn\'t guaranteed emotional connection.'),

  // ==========================================================================
  // POPULATION & DEMOGRAPHIC CHANGE (WSC 2026 Theme)
  // ==========================================================================
  // Easy
  createQuestion('special_area', 'easy', 'What is happening to birth rates in many developed countries?', ['Increasing rapidly', 'Declining significantly', 'Staying exactly the same', 'Doubling'], 1, 'Many nations now have birth rates below replacement level.'),
  createQuestion('special_area', 'easy', 'What is "population replacement level"?', ['Stadium capacity', 'About 2.1 children per woman to maintain population', 'Maximum capacity', 'Census counting'], 1, 'Many countries are below this level, leading to aging populations.'),

  // Medium
  createQuestion('special_area', 'medium', 'Which country has one of the lowest birth rates in the world?', ['Nigeria', 'South Korea', 'India', 'Brazil'], 1, 'South Korea\'s fertility rate dropped to 0.78 in 2022.'),
  createQuestion('special_area', 'medium', 'What challenges do aging populations create?', ['Too many toys', 'Strain on healthcare, pensions, and workforce', 'Overcrowding', 'Too much noise'], 1, 'Fewer workers must support more retirees in aging societies.'),
  createQuestion('special_area', 'medium', 'Why are birth rates declining in many countries?', ['Government mandates', 'Education, career focus, economic concerns, and personal choice', 'Lack of hospitals', 'Climate only'], 1, 'Multiple factors influence family planning decisions.'),

  // Hard
  createQuestion('special_area', 'hard', 'What is "pronatalism"?', ['Sports training', 'Policies encouraging people to have more children', 'Vegetarianism', 'Anti-technology movement'], 1, 'Some countries offer incentives like parental leave and child benefits.'),
  createQuestion('special_area', 'hard', 'How does declining population relate to "Are We There Yet?"?', ['It doesn\'t', 'We achieved longevity but face questions about sustaining our species', 'Only about roads', 'Just geography'], 1, 'Medical progress extended lives, but now birth rates concern planners.'),

  // ==========================================================================
  // PROGRESS MEASUREMENT (WSC 2026 Theme: How Do We Know?)
  // ==========================================================================
  // Easy
  createQuestion('special_area', 'easy', 'What is GDP?', ['A video game', 'A measure of a country\'s economic output', 'A social media platform', 'A type of food'], 1, 'Gross Domestic Product measures economic activity.'),
  createQuestion('special_area', 'easy', 'Does GDP measure happiness?', ['Yes, completely', 'No, it only measures economic activity', 'Always', 'Perfectly'], 1, 'GDP doesn\'t capture well-being, environment, or inequality.'),

  // Medium
  createQuestion('special_area', 'medium', 'What is "Gross National Happiness"?', ['A joke', 'Bhutan\'s alternative measure of progress beyond GDP', 'A party', 'A game show'], 1, 'Bhutan measures sustainable development, culture, and well-being.'),
  createQuestion('special_area', 'medium', 'What are the UN Sustainable Development Goals?', ['Personal goals', '17 global targets for 2030 covering poverty, health, climate, etc.', 'Sports achievements', 'Business targets'], 1, 'SDGs provide benchmarks for measuring global progress.'),
  createQuestion('special_area', 'medium', 'Are we on track to meet the 2030 SDGs?', ['Yes, ahead of schedule', 'No, most goals are significantly off track', 'Already achieved', 'Goals were cancelled'], 1, 'The UN reports that only 15% of SDG targets are on track.'),

  // Hard
  createQuestion('special_area', 'hard', 'What is the "Easterlin Paradox"?', ['A magic trick', 'That income increases don\'t always increase happiness', 'A geography feature', 'An Easter tradition'], 1, 'Beyond basic needs, more money doesn\'t guarantee more happiness.'),
  createQuestion('special_area', 'hard', 'What is "progress trap"?', ['A board game', 'When solutions to problems create new, harder problems', 'A maze', 'A hunting technique'], 1, 'Example: Cars solved transport but created pollution and sprawl.'),

  // ==========================================================================
  // CLIMATE & ENVIRONMENTAL PROGRESS
  // ==========================================================================
  // Easy
  createQuestion('special_area', 'easy', 'What is the Paris Agreement?', ['A fashion deal', 'A global agreement to limit climate change', 'A peace treaty', 'A trade deal'], 1, 'Nearly 200 countries agreed to limit warming to 1.5°C.'),
  createQuestion('special_area', 'easy', 'What is "net-zero emissions"?', ['Zero factories', 'Removing as much CO2 as we emit', 'No cars', 'No electricity'], 1, 'Many countries have pledged net-zero targets for 2050.'),

  // Medium
  createQuestion('special_area', 'medium', 'Are we on track to meet Paris Agreement goals?', ['Yes', 'No, current policies lead to 2.5-3°C warming', 'Already achieved', 'Cancelled'], 1, 'Significant gaps remain between pledges and necessary action.'),
  createQuestion('special_area', 'medium', 'What percentage of global electricity comes from renewables?', ['5%', '15%', 'About 30%', '80%'], 2, 'Renewables are growing rapidly but fossil fuels still dominate.'),
  createQuestion('special_area', 'medium', 'What is "greenwashing"?', ['Eco laundry', 'When companies falsely claim to be environmentally friendly', 'Plant washing', 'Green paint'], 1, 'Misleading environmental claims can deceive consumers.'),

  // Hard
  createQuestion('special_area', 'hard', 'What is the "carbon budget"?', ['Company expenses', 'The total CO2 we can emit while limiting warming', 'Tree counting', 'Financial planning'], 1, 'Scientists estimate how much more CO2 we can emit for 1.5°C.'),
  createQuestion('special_area', 'hard', 'Why is 1.5°C warming considered a critical threshold?', ['Random number', 'Beyond this, feedback loops may cause runaway warming', 'Comfortable temperature', 'Weather preference'], 1, 'Tipping points like ice sheet collapse become more likely beyond 1.5°C.'),

  // ==========================================================================
  // WSC LITERATURE: JOURNEYS & DESTINATIONS
  // ==========================================================================
  // Easy - The Little Prince
  createQuestion('special_area', 'easy', 'Who wrote "The Little Prince"?', ['Roald Dahl', 'Antoine de Saint-Exupéry', 'J.K. Rowling', 'C.S. Lewis'], 1, 'Saint-Exupéry was a French aviator who wrote this beloved tale in 1943.'),
  createQuestion('special_area', 'easy', 'How does the Little Prince travel between planets?', ['Spaceship', 'Using birds (wild geese)', 'Walking', 'Train'], 1, 'The Little Prince uses migrating birds to travel through space.'),
  createQuestion('special_area', 'easy', 'What does the Little Prince learn is most important?', ['Money', 'The connections and care we invest in others', 'Power', 'Speed'], 1, '"You become responsible forever for what you have tamed."'),

  // Medium - Ender\'s Game
  createQuestion('special_area', 'medium', 'Who wrote "Ender\'s Game"?', ['Isaac Asimov', 'Orson Scott Card', 'Arthur C. Clarke', 'Ray Bradbury'], 1, 'Card published this science fiction novel in 1985.'),
  createQuestion('special_area', 'medium', 'What is Ender\'s journey in "Ender\'s Game"?', ['A vacation', 'From child to military commander through intense training', 'A school trip', 'A sports competition'], 1, 'Ender is manipulated into becoming a brilliant but traumatized leader.'),
  createQuestion('special_area', 'medium', 'How does Ender\'s journey question "Are We There Yet?"?', ['It doesn\'t', 'The destination (winning) comes at devastating personal cost', 'It\'s about geography', 'Just about space'], 1, 'Victory raises questions about what was lost in achieving it.'),

  // Medium - Nightfall
  createQuestion('special_area', 'medium', 'In "Nightfall" by Asimov, what is the planet\'s journey?', ['A road trip', 'A civilization repeatedly destroyed when darkness falls', 'Space exploration', 'Time travel'], 1, 'Every 2,049 years, darkness causes societal collapse.'),
  createQuestion('special_area', 'medium', 'What does "Nightfall" suggest about progress?', ['It\'s always forward', 'Civilizations can repeatedly lose and regain knowledge', 'It\'s guaranteed', 'It\'s impossible'], 1, 'Progress is not inevitable; societies can rise and fall repeatedly.'),

  // Hard - Flowers for Algernon
  createQuestion('special_area', 'hard', 'What is Charlie\'s journey in "Flowers for Algernon"?', ['A vacation', 'From low IQ to genius and back as the procedure fails', 'A marathon', 'Space travel'], 1, 'Charlie temporarily gains then loses enhanced intelligence.'),
  createQuestion('special_area', 'hard', 'How does "Flowers for Algernon" connect to "Are We There Yet?"?', ['It doesn\'t', 'Charlie reaches intellectual heights but must return, questioning if the journey was worth it', 'Only geography', 'Just about directions'], 1, 'The story questions whether reaching a goal matters if it cannot last.'),

  // Hard - The Last Question
  createQuestion('special_area', 'hard', 'What journey does "The Last Question" by Asimov depict?', ['A road trip', 'Humanity\'s journey across trillions of years asking if entropy can be reversed', 'A vacation', 'A walk'], 1, 'The story spans from near-future to the heat death of the universe.'),
  createQuestion('special_area', 'hard', 'What does "The Last Question" say about ultimate destinations?', ['Easy to reach', 'The final question may only be answerable at the end of everything', 'Already achieved', 'Impossible'], 1, 'The answer comes only when all journeys have ended.'),

  // ==========================================================================
  // TECHNOLOGY & AI PROGRESS
  // ==========================================================================
  // Easy
  createQuestion('special_area', 'easy', 'What is artificial intelligence (AI)?', ['A type of robot', 'Computer systems that can learn and make decisions', 'A video game', 'Social media'], 1, 'AI mimics human intelligence for tasks like learning and problem-solving.'),
  createQuestion('special_area', 'easy', 'What is generative AI?', ['Power generators', 'AI that can create new content like text, images, and code', 'Game generators', 'Electricity'], 1, 'ChatGPT and DALL-E are examples of generative AI.'),

  // Medium
  createQuestion('special_area', 'medium', 'What is "Artificial General Intelligence" (AGI)?', ['Current AI', 'Hypothetical AI with human-level abilities across all tasks', 'A company', 'A video game'], 1, 'AGI doesn\'t exist yet; current AI excels at specific tasks only.'),
  createQuestion('special_area', 'medium', 'Have we reached AGI yet?', ['Yes, in 2020', 'No, and experts disagree on when or if we will', 'Yes, last year', 'It was cancelled'], 1, 'Current AI systems are narrow, not general intelligence.'),
  createQuestion('special_area', 'medium', 'What is "algorithmic bias"?', ['Computer speed', 'When AI systems produce unfair outcomes due to biased data', 'Coding style', 'Internet speed'], 1, 'Biased algorithms can discriminate in hiring, lending, and policing.'),

  // Hard
  createQuestion('special_area', 'hard', 'What is the "AI alignment problem"?', ['Printer issues', 'Ensuring AI systems pursue goals aligned with human values', 'Computer layout', 'Screen positioning'], 1, 'A misaligned superintelligent AI could pose existential risks.'),
  createQuestion('special_area', 'hard', 'What is "existential risk" from AI?', ['Fear of computers', 'The possibility that advanced AI could threaten humanity', 'Job interviews', 'Software bugs'], 1, 'Some researchers consider misaligned AI a major future risk.'),

  // ==========================================================================
  // GLOBAL ISSUES & CURRENT EVENTS
  // ==========================================================================
  // Easy
  createQuestion('special_area', 'easy', 'What is globalization?', ['A single country', 'Increasing connections between countries worldwide', 'A type of map', 'Local business'], 1, 'Globalization includes trade, culture, and communication across borders.'),
  createQuestion('special_area', 'easy', 'What is a pandemic?', ['A local disease', 'A disease outbreak across multiple countries or worldwide', 'A vaccine', 'A hospital'], 1, 'COVID-19 was declared a pandemic in 2020.'),

  // Medium
  createQuestion('special_area', 'medium', 'What is "misinformation"?', ['Newspapers', 'False or inaccurate information spread unintentionally', 'Comedy', 'Satire'], 1, 'Misinformation differs from deliberate disinformation.'),
  createQuestion('special_area', 'medium', 'What is "disinformation"?', ['Dictionaries', 'Deliberately false information spread to deceive', 'News', 'Education'], 1, 'Disinformation is intentionally created to mislead.'),
  createQuestion('special_area', 'medium', 'What is "deepfake" technology?', ['Deep sea diving', 'AI-generated fake video or audio of real people', 'Deep lakes', 'Cake'], 1, 'Deepfakes raise concerns about truth and trust in media.'),

  // Hard
  createQuestion('special_area', 'hard', 'What is the "post-truth" era?', ['After testing', 'When emotions and beliefs matter more than facts in public discourse', 'Honesty period', 'Lie detection'], 1, '"Post-truth" was Oxford Dictionary\'s 2016 word of the year.'),
  createQuestion('special_area', 'hard', 'What is "epistemic humility"?', ['Being quiet', 'Recognizing the limits of one\'s knowledge', 'Academic degree', 'Meditation'], 1, 'In complex issues, acknowledging uncertainty is intellectually honest.'),
  createQuestion('special_area', 'hard', 'What is the "attention economy"?', ['Watching TV', 'Competition for human attention as a scarce resource', 'Eye exams', 'Focus tests'], 1, 'Tech companies profit by capturing and holding our attention.'),
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
