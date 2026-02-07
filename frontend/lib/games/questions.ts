/**
 * Question database for Scholar Games
 * Contains 500+ questions across 5 subjects and 3 difficulty levels
 * Designed for World Scholars Cup preparation (ages 9-16)
 */

import type { Question } from './types';

// Helper to create question IDs
let questionId = 0;
const createQuestion = (
  subject: string,
  difficulty: 'easy' | 'medium' | 'hard',
  text: string,
  options: string[],
  correct_index: number,
  explanation?: string,
  extras?: {
    theme_connection?: string;
    deep_explanation?: string;
    related_questions?: string[];
    tags?: string[];
  }
): Question => ({
  id: `q${++questionId}`,
  subject,
  difficulty,
  text,
  options,
  correct_index,
  explanation,
  time_limit_seconds: difficulty === 'easy' ? 20 : difficulty === 'medium' ? 25 : 30,
  ...extras,
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

  // ==========================================================================
  // OCEAN SCIENCE (WSC 2026 Theme: "Are We There Yet?" - Exploring Earth's Frontiers)
  // ==========================================================================
  // Easy
  createQuestion('science', 'easy', 'What percentage of the ocean floor has been mapped in detail?', ['100%', 'About 75%', 'About 25%', 'Less than 10%'], 3, 'We know more about the Moon\'s surface than the deep ocean floor.', {
    theme_connection: 'The ocean is a frontier where we are decidedly not "there yet" in terms of exploration.',
    deep_explanation: 'Modern sonar and satellite technology are gradually filling in the map, but the ocean\'s sheer size and depth make full mapping a massive ongoing challenge.',
    tags: ['ocean', 'exploration', 'mapping'],
  }),
  createQuestion('science', 'easy', 'What is the deepest point in the ocean called?', ['The Great Barrier Reef', 'The Mariana Trench', 'The Mid-Atlantic Ridge', 'The Bermuda Triangle'], 1, 'The Challenger Deep in the Mariana Trench reaches about 11,000 meters below sea level.', {
    theme_connection: 'Only three people have visited the deepest ocean point, reminding us how much of our own planet remains unexplored.',
    deep_explanation: 'The Challenger Deep is about 11 km down, deeper than Mount Everest is tall. The pressure there is over 1,000 times atmospheric pressure at sea level.',
    tags: ['ocean', 'geography', 'depth'],
  }),
  createQuestion('science', 'easy', 'What gas do oceans absorb that helps slow climate change?', ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Helium'], 2, 'Oceans absorb roughly 30% of human-produced CO2, acting as a carbon sink.', {
    theme_connection: 'The ocean\'s role in absorbing carbon is crucial to whether we "get there" on climate goals.',
    deep_explanation: 'While this absorption slows atmospheric warming, it also causes ocean acidification, which threatens marine life like coral reefs and shellfish.',
    tags: ['ocean', 'climate', 'carbon-cycle'],
  }),
  createQuestion('science', 'easy', 'What causes ocean tides?', ['Wind', 'The Moon\'s gravitational pull', 'Earthquakes', 'Fish swimming'], 1, 'The Moon\'s gravity creates bulges in the ocean, causing high and low tides roughly twice a day.', {
    theme_connection: 'Tides are a journey that never stops, endlessly cycling as the Moon orbits Earth.',
    deep_explanation: 'The Sun also affects tides. When Sun and Moon align (spring tides), tides are extra strong. When at right angles (neap tides), they are weaker.',
    tags: ['ocean', 'tides', 'gravity'],
  }),

  // Medium
  createQuestion('science', 'medium', 'What is an ocean "dead zone"?', ['An area with no water', 'A region with too little oxygen to support marine life', 'A place where boats cannot sail', 'An empty stretch of sea'], 1, 'Dead zones are often caused by excess nutrient runoff from agriculture, which triggers algal blooms.', {
    theme_connection: 'Dead zones represent places where environmental progress has gone backward rather than forward.',
    deep_explanation: 'When algae die, bacteria consume them and deplete dissolved oxygen. Over 400 dead zones have been identified worldwide, including a massive one in the Gulf of Mexico.',
    tags: ['ocean', 'pollution', 'marine-life'],
  }),
  createQuestion('science', 'medium', 'What is coral bleaching?', ['Painting coral white', 'Corals expelling their symbiotic algae due to heat stress', 'Coral dying of old age', 'A natural seasonal change'], 1, 'Bleaching occurs when water temperatures rise even 1-2 degrees above normal, threatening reef ecosystems.', {
    theme_connection: 'Coral bleaching is a visible sign of whether we are "getting there" on protecting ocean ecosystems or falling behind.',
    deep_explanation: 'Corals have a symbiotic relationship with zooxanthellae algae that provide them with food and color. Heat stress breaks this partnership, starving the coral.',
    tags: ['ocean', 'coral', 'climate'],
  }),
  createQuestion('science', 'medium', 'What is bioluminescence in the ocean?', ['Sunlight reflecting off water', 'Living organisms producing their own light', 'Underwater volcanoes glowing', 'Moonlight on waves'], 1, 'Many deep-sea creatures, like anglerfish and jellyfish, produce light through chemical reactions in their bodies.', {
    theme_connection: 'Bioluminescence shows that nature arrived at its own "light technology" billions of years before humans invented electric light.',
    deep_explanation: 'About 76% of deep-sea creatures produce bioluminescence. Uses include attracting prey, finding mates, and confusing predators.',
    tags: ['ocean', 'biology', 'deep-sea'],
  }),
  createQuestion('science', 'medium', 'What are hydrothermal vents?', ['Underwater air conditioners', 'Openings in the seafloor that release superheated mineral-rich water', 'Coral formations', 'Underground caves'], 1, 'Discovered in 1977, these vents support unique ecosystems that thrive without sunlight, using chemosynthesis instead.', {
    theme_connection: 'Hydrothermal vents show that life can exist in places we once thought impossible, expanding what "there" means in exploring our planet.',
    deep_explanation: 'The discovery of vent ecosystems changed our understanding of where life can exist and fueled speculation about life on other worlds like Europa.',
    tags: ['ocean', 'deep-sea', 'biology', 'vents'],
  }),

  // Hard
  createQuestion('science', 'hard', 'What is the "thermohaline circulation" in the ocean?', ['Tidal movements', 'A global system of deep ocean currents driven by temperature and salinity differences', 'Waves caused by wind', 'Currents from river outflows'], 1, 'Often called the "global conveyor belt," it distributes heat around the planet and takes about 1,000 years for a full cycle.', {
    theme_connection: 'This slow circulation reminds us that some of Earth\'s most important processes take far longer than a human lifetime.',
    deep_explanation: 'Climate change may weaken the Atlantic portion (AMOC), which could dramatically alter weather patterns in Europe and beyond. Scientists are actively monitoring this risk.',
    tags: ['ocean', 'climate', 'currents', 'thermohaline'],
  }),
  createQuestion('science', 'hard', 'What is ocean acidification?', ['The ocean becoming salty', 'A decrease in ocean pH caused by absorbing excess CO2', 'Oil spills making water acidic', 'Natural volcanic activity'], 1, 'Ocean pH has dropped by 0.1 units since the Industrial Revolution, representing a 30% increase in acidity.', {
    theme_connection: 'Ocean acidification is a hidden consequence of our carbon journey, threatening marine life even as we focus on atmospheric warming.',
    deep_explanation: 'Lower pH dissolves the calcium carbonate shells of oysters, mussels, and corals. By 2100, oceans could be 150% more acidic than pre-industrial levels.',
    tags: ['ocean', 'chemistry', 'climate'],
  }),

  // ==========================================================================
  // RENEWABLE ENERGY TECHNOLOGY
  // ==========================================================================
  // Easy
  createQuestion('science', 'easy', 'What type of energy comes from the Sun?', ['Nuclear energy', 'Solar energy', 'Geothermal energy', 'Tidal energy'], 1, 'The Sun provides enough energy in one hour to power Earth for a year if we could capture it all.', {
    theme_connection: 'The Sun delivers virtually unlimited energy. The question "are we there yet?" on solar power is really about our ability to capture it.',
    deep_explanation: 'Solar panel costs have dropped 99% since 1976. Solar is now the cheapest form of new electricity generation in most of the world.',
    tags: ['energy', 'solar', 'renewables'],
  }),
  createQuestion('science', 'easy', 'How do wind turbines generate electricity?', ['By burning fuel', 'By using wind to spin blades connected to a generator', 'By using solar panels', 'By heating water'], 1, 'Modern wind turbines can have blades over 80 meters long and power thousands of homes.', {
    theme_connection: 'Wind energy is part of the journey toward a clean energy future, but are we there yet?',
    deep_explanation: 'Wind power capacity has grown enormously, but intermittency (wind doesn\'t always blow) means we also need energy storage solutions.',
    tags: ['energy', 'wind', 'renewables'],
  }),

  // Medium
  createQuestion('science', 'medium', 'What is a "green hydrogen" fuel?', ['Hydrogen from natural gas', 'Hydrogen produced using renewable energy to split water', 'Hydrogen mixed with chlorophyll', 'Hydrogen from coal'], 1, 'Green hydrogen could decarbonize industries like steel and shipping that are hard to electrify directly.', {
    theme_connection: 'Green hydrogen is a technology that could help us "get there" on decarbonizing heavy industry.',
    deep_explanation: 'Electrolysis uses electricity to split water (H2O) into hydrogen and oxygen. If the electricity comes from renewables, the hydrogen is "green" with zero carbon emissions.',
    tags: ['energy', 'hydrogen', 'renewables', 'decarbonization'],
  }),
  createQuestion('science', 'medium', 'What is a "battery storage system" for renewable energy?', ['A giant AA battery', 'Large-scale batteries that store excess energy for use when the sun or wind stops', 'A type of solar panel', 'A wind turbine component'], 1, 'Lithium-ion battery costs have fallen about 90% since 2010, making grid storage increasingly viable.', {
    theme_connection: 'Battery storage is the missing piece in the renewable energy journey: we can generate clean power, but can we store enough to get "there"?',
    deep_explanation: 'The Hornsdale Power Reserve in Australia (Tesla\'s "Big Battery") demonstrated how grid-scale batteries can stabilize power supplies and reduce costs.',
    tags: ['energy', 'batteries', 'storage', 'renewables'],
  }),
  createQuestion('science', 'medium', 'What is geothermal energy?', ['Heat from the Sun', 'Heat from inside the Earth used for electricity or heating', 'Energy from ocean waves', 'Energy from burning wood'], 1, 'Iceland generates about 25% of its electricity from geothermal sources due to its volcanic geology.', {
    theme_connection: 'Geothermal energy taps into heat that has been flowing since Earth formed, a source we are only beginning to harness.',
    deep_explanation: 'Enhanced geothermal systems (EGS) could unlock geothermal power almost anywhere by drilling deep enough. This technology could provide baseload clean energy 24/7.',
    tags: ['energy', 'geothermal', 'renewables'],
  }),

  // Hard
  createQuestion('science', 'hard', 'What is "perovskite" in solar technology?', ['A type of rock used in buildings', 'A crystal structure that could make solar cells cheaper and more efficient', 'A brand of solar panel', 'A solar tracking device'], 1, 'Perovskite solar cells have reached lab efficiencies rivaling silicon in just over a decade of research.', {
    theme_connection: 'Perovskite technology asks whether we can leapfrog traditional solar to get "there" faster on clean energy.',
    deep_explanation: 'Unlike silicon, perovskites can be printed onto flexible surfaces at low temperatures, potentially slashing manufacturing costs. The main challenge is long-term stability.',
    tags: ['energy', 'solar', 'materials-science', 'innovation'],
  }),

  // ==========================================================================
  // NEUROSCIENCE & GENETICS
  // ==========================================================================
  // Easy
  createQuestion('science', 'easy', 'What organ controls your thoughts, feelings, and movements?', ['Heart', 'Brain', 'Lungs', 'Stomach'], 1, 'The human brain contains roughly 86 billion neurons connected by trillions of synapses.', {
    theme_connection: 'Understanding the brain is one of science\'s greatest ongoing journeys, with much of its complexity still unmapped.',
    deep_explanation: 'The Human Brain Project and BRAIN Initiative are massive efforts to map the brain\'s connections. We have identified major regions but the detailed wiring remains largely mysterious.',
    tags: ['neuroscience', 'brain', 'biology'],
  }),
  createQuestion('science', 'easy', 'What is DNA?', ['A type of medicine', 'The molecule that carries genetic instructions for life', 'A computer program', 'A type of energy'], 1, 'DNA stands for deoxyribonucleic acid and is found in nearly every cell of your body.', {
    theme_connection: 'DNA is the instruction manual for life\'s journey, carrying information across billions of years of evolution.',
    deep_explanation: 'If you uncoiled all the DNA in your body, it would stretch to the Sun and back about 600 times. Yet it fits inside microscopic cell nuclei.',
    tags: ['genetics', 'DNA', 'biology'],
  }),

  // Medium
  createQuestion('science', 'medium', 'What is "neuroplasticity"?', ['A type of brain surgery', 'The brain\'s ability to reorganize and form new neural connections throughout life', 'A brain disease', 'An intelligence test'], 1, 'Learning a new language, instrument, or skill physically changes your brain structure.', {
    theme_connection: 'Neuroplasticity shows our brains are always on a journey of change, never truly "there" in a final state.',
    deep_explanation: 'Once scientists believed the adult brain was fixed. Now we know neurons can form new pathways even in old age, which has revolutionized stroke rehabilitation and education.',
    tags: ['neuroscience', 'brain', 'learning', 'plasticity'],
  }),
  createQuestion('science', 'medium', 'What is the Human Genome Project?', ['A music competition', 'An international effort that mapped all human genes, completed in 2003', 'A fitness program', 'A space mission'], 1, 'The project identified about 20,000-25,000 human genes and cost approximately $2.7 billion over 13 years.', {
    theme_connection: 'The Human Genome Project was a milestone on the journey to understanding ourselves, but reading the code was just the beginning.',
    deep_explanation: 'Today, sequencing a human genome costs under $1,000 and takes hours. But understanding what all the genes do and how they interact is a far longer journey.',
    tags: ['genetics', 'genome', 'science-history'],
  }),
  createQuestion('science', 'medium', 'What are "stem cells" and why are they important?', ['Plant cells', 'Cells that can develop into many different cell types in the body', 'Blood cells only', 'Skin cells only'], 1, 'Stem cells have the potential to repair damaged tissues and organs, offering hope for diseases currently without cures.', {
    theme_connection: 'Stem cell research is a journey from laboratory discovery toward regenerative medicine that could transform healthcare.',
    deep_explanation: 'In 2006, Shinya Yamanaka discovered how to reprogram adult cells into stem cells (iPSCs), winning a Nobel Prize. This avoids the ethical issues of embryonic stem cells.',
    tags: ['biology', 'stem-cells', 'medicine'],
  }),

  // Hard
  createQuestion('science', 'hard', 'What is "epigenetics"?', ['The study of outer space', 'The study of how behaviors and environment can change the way genes work', 'A branch of mathematics', 'A type of genetic mutation'], 1, 'Epigenetic changes don\'t alter DNA sequence but can turn genes on or off, and some can be passed to offspring.', {
    theme_connection: 'Epigenetics reveals that our genetic journey is shaped by our environment and choices, not just inherited code.',
    deep_explanation: 'Diet, stress, and exposure to toxins can add or remove chemical tags on DNA. This explains why identical twins can develop different health conditions over time.',
    tags: ['genetics', 'epigenetics', 'biology', 'environment'],
  }),
  createQuestion('science', 'hard', 'What is a "brain-computer interface" (BCI)?', ['A video game controller', 'Technology that enables direct communication between the brain and external devices', 'A type of MRI scan', 'An intelligence test'], 1, 'Companies like Neuralink are developing BCIs that could help paralyzed patients control computers with their thoughts.', {
    theme_connection: 'BCIs represent one of the most ambitious journeys in science: bridging the gap between mind and machine.',
    deep_explanation: 'In 2024, Neuralink\'s first human patient could control a computer cursor with thoughts alone. The technology raises profound questions about privacy, identity, and what it means to be human.',
    tags: ['neuroscience', 'technology', 'BCI', 'innovation'],
  }),

  // ==========================================================================
  // WEATHER, CLIMATE EXTREMES & MATERIALS SCIENCE
  // ==========================================================================
  // Easy
  createQuestion('science', 'easy', 'What is the difference between weather and climate?', ['They are the same', 'Weather is short-term conditions; climate is long-term patterns', 'Climate is about space', 'Weather only applies to cold places'], 1, 'Weather can change hour to hour, while climate describes averages over decades.', {
    theme_connection: 'Understanding the difference helps us see that individual weather events are stops on the journey, while climate is the overall direction of travel.',
    deep_explanation: 'A cold winter day does not disprove global warming, just as a hot summer day does not prove it. Climate trends emerge from decades of data.',
    tags: ['weather', 'climate', 'earth-science'],
  }),

  // Medium
  createQuestion('science', 'medium', 'What is the "heat island" effect in cities?', ['Islands that are hot', 'Urban areas being significantly warmer than surrounding rural areas', 'Tropical island weather', 'Heated swimming pools'], 1, 'Concrete, asphalt, and lack of vegetation in cities can make temperatures 1-3 degrees Celsius higher than nearby countryside.', {
    theme_connection: 'Urban heat islands show that "progress" through urbanization can create unintended environmental setbacks.',
    deep_explanation: 'Green roofs, urban trees, and reflective building materials are being used to combat this effect. Some cities have reduced temperatures by several degrees using these strategies.',
    tags: ['climate', 'cities', 'heat-island', 'urbanization'],
  }),
  createQuestion('science', 'medium', 'What is graphene?', ['A type of pencil lead', 'A single layer of carbon atoms arranged in a hexagonal lattice, the thinnest known material', 'A chemical compound in ink', 'A type of plastic'], 1, 'Graphene is 200 times stronger than steel yet incredibly lightweight and an excellent conductor of electricity and heat.', {
    theme_connection: 'Graphene was discovered in 2004 using sticky tape and pencil lead, showing that breakthrough materials can come from simple beginnings.',
    deep_explanation: 'Andre Geim and Konstantin Novoselov won the 2010 Nobel Prize for isolating graphene. It could revolutionize electronics, water purification, and energy storage, but mass production remains challenging.',
    tags: ['materials-science', 'graphene', 'innovation'],
  }),
  createQuestion('science', 'medium', 'What is an "atmospheric river"?', ['A river that flows through mountains', 'A long, narrow corridor of water vapor in the atmosphere that can cause extreme rainfall', 'Underground water channels', 'A type of cloud formation'], 1, 'Atmospheric rivers can carry as much water vapor as 15 Mississippi Rivers and cause both beneficial rain and devastating floods.', {
    theme_connection: 'Atmospheric rivers are invisible journeys of water vapor that can bring life-giving rain or catastrophic floods, depending on intensity.',
    deep_explanation: 'California depends on atmospheric rivers for 30-50% of its annual precipitation. Climate change is making these events more intense, increasing both drought and flood risk.',
    tags: ['weather', 'atmospheric-river', 'extreme-weather'],
  }),

  // Hard
  createQuestion('science', 'hard', 'What are "quantum dots" and why are they important?', ['Decorative patterns', 'Nanoscale semiconductor particles with unique optical properties used in displays and medicine', 'A type of computer virus', 'Astronomical objects'], 1, 'The 2023 Nobel Prize in Chemistry was awarded for the discovery of quantum dots, which are now used in QLED TVs and cancer imaging.', {
    theme_connection: 'Quantum dots show how nanoscale science has arrived at real-world applications after decades of research.',
    deep_explanation: 'By changing their size, scientists can tune the color of light quantum dots emit. This property makes them useful for ultra-efficient displays, solar cells, and medical imaging.',
    tags: ['materials-science', 'quantum-dots', 'nanotechnology', 'innovation'],
  }),
  createQuestion('science', 'hard', 'What is a "feedback loop" in climate science?', ['A music recording technique', 'A process where the output of a system amplifies or dampens the original change', 'A recycling method', 'A weather forecasting tool'], 1, 'Ice melting exposes dark water, which absorbs more heat, melting more ice. This positive feedback accelerates warming.', {
    tags: ['climate', 'feedback-loops', 'earth-science'],
  }),

  // ==========================================================================
  // QUANTUM COMPUTING & ADDITIONAL SCIENCE
  // ==========================================================================
  // Easy
  createQuestion('science', 'easy', 'What is a "renewable" resource?', ['Oil', 'A resource that can be replenished naturally, like sunlight, wind, or water', 'Coal', 'Natural gas'], 1, 'Unlike fossil fuels, renewable resources are not depleted when used and are central to sustainable energy plans.', {
    tags: ['energy', 'renewables', 'sustainability'],
  }),
  createQuestion('science', 'easy', 'What is the ozone layer?', ['A type of cloud', 'A protective layer in Earth\'s atmosphere that absorbs harmful ultraviolet radiation', 'A layer of ocean water', 'Part of the Earth\'s crust'], 1, 'The ozone layer is found in the stratosphere, about 15-35 km above Earth\'s surface.', {
    theme_connection: 'The ozone layer\'s recovery after the Montreal Protocol is a rare success story of global cooperation getting us "there."',
    deep_explanation: 'The 1987 Montreal Protocol banned CFCs that were destroying ozone. The ozone hole is now gradually healing, showing international agreements can work.',
    tags: ['atmosphere', 'ozone', 'climate', 'environment'],
  }),
  createQuestion('science', 'easy', 'What is pollination?', ['Pollution from factories', 'The transfer of pollen between flowers, enabling plants to reproduce', 'Watering plants', 'Cutting grass'], 1, 'Bees, butterflies, and other pollinators are responsible for about one-third of the food we eat.', {
    tags: ['biology', 'ecology', 'pollination', 'biodiversity'],
  }),
  createQuestion('science', 'easy', 'What is a "fossil"?', ['A type of fuel', 'Preserved remains or traces of ancient organisms found in rock', 'A living animal', 'A crystal'], 1, 'Fossils can be millions of years old and help scientists understand the history of life on Earth.', {
    tags: ['paleontology', 'fossils', 'earth-science', 'biology'],
  }),

  // Medium
  createQuestion('science', 'medium', 'What is a "quantum computer"?', ['A very fast regular computer', 'A computer that uses quantum mechanics principles like superposition to process information', 'A tiny computer', 'A space computer'], 1, 'Quantum computers use "qubits" that can be 0, 1, or both simultaneously, enabling calculations impossible for traditional computers.', {
    theme_connection: 'Quantum computing asks whether we are "there yet" in computing power, or if an entirely new paradigm is just beginning.',
    deep_explanation: 'Google claimed "quantum supremacy" in 2019 by solving a problem in 200 seconds that would take a classical supercomputer 10,000 years. But practical quantum computers are still years away.',
    tags: ['quantum-computing', 'technology', 'physics', 'innovation'],
  }),
  createQuestion('science', 'medium', 'What is "microplastic" pollution?', ['Small recycling bins', 'Tiny plastic fragments less than 5mm found in oceans, soil, and even human blood', 'Plastic wrap', 'Small plastic toys'], 1, 'Microplastics have been found in Arctic ice, deep ocean trenches, and inside human organs, raising serious health concerns.', {
    tags: ['pollution', 'microplastics', 'ocean', 'health', 'environment'],
  }),
  createQuestion('science', 'medium', 'What is "biomimicry" in science and engineering?', ['Cloning animals', 'Designing solutions inspired by nature\'s time-tested patterns and strategies', 'Keeping pets', 'Nature photography'], 1, 'Velcro was inspired by burrs sticking to dog fur. Bullet train noses were redesigned based on kingfisher beaks to reduce noise.', {
    theme_connection: 'Biomimicry suggests nature has already "arrived" at elegant solutions that human engineering is still catching up to.',
    deep_explanation: 'From termite mound ventilation inspiring energy-efficient buildings to shark skin patterns reducing drag on aircraft, biomimicry shows that 3.8 billion years of evolution holds design wisdom.',
    tags: ['biomimicry', 'engineering', 'nature', 'innovation', 'design'],
  }),
  createQuestion('science', 'medium', 'What is the "greenhouse effect"?', ['Growing plants in greenhouses', 'The trapping of heat in Earth\'s atmosphere by gases like CO2 and methane', 'Painting houses green', 'A type of farming'], 1, 'The greenhouse effect is natural and necessary for life, but human activities have intensified it, causing global warming.', {
    tags: ['climate', 'greenhouse-effect', 'atmosphere', 'earth-science'],
  }),

  // Hard
  createQuestion('science', 'hard', 'What is "CRISPR-Cas9" and why is it revolutionary?', ['A crispy snack', 'A gene-editing tool that can precisely cut and modify DNA sequences', 'A medical scanner', 'A computer chip'], 1, 'CRISPR allows scientists to edit genes with unprecedented precision. In 2023, the first CRISPR therapy for sickle cell disease was approved.', {
    tags: ['genetics', 'CRISPR', 'biotechnology', 'medicine'],
  }),
  createQuestion('science', 'hard', 'What is "dark matter" in cosmology?', ['Unlit areas of space', 'Invisible matter that makes up about 27% of the universe but doesn\'t interact with light', 'Black holes', 'Cosmic dust'], 1, 'Scientists know dark matter exists because of its gravitational effects on visible matter, but no one has directly detected it yet.', {
    theme_connection: 'Dark matter reminds us that we are far from "there" in understanding the universe; we can\'t even see most of what it\'s made of.',
    deep_explanation: 'Together with dark energy (~68%), dark matter means that ordinary matter (atoms, stars, planets) makes up only about 5% of the universe. This is one of physics\' greatest mysteries.',
    tags: ['cosmology', 'dark-matter', 'physics', 'universe'],
  }),
  createQuestion('science', 'hard', 'What is "antibiotic resistance" and why is it dangerous?', ['Allergies to medicine', 'When bacteria evolve to survive antibiotics, making infections harder to treat', 'A strong immune system', 'Vaccine side effects'], 1, 'The WHO calls antibiotic resistance one of the greatest threats to global health. Overuse in medicine and agriculture accelerates it.', {
    tags: ['health', 'antibiotics', 'bacteria', 'public-health', 'evolution'],
  }),
  createQuestion('science', 'hard', 'What is "nuclear fission" and how does it differ from fusion?', ['They are the same', 'Fission splits heavy atoms (used in power plants); fusion combines light atoms (powers the Sun)', 'Fission is chemical; fusion is physical', 'Fission needs cold; fusion needs heat'], 1, 'Current nuclear power plants use fission. Fusion promises nearly limitless clean energy but has not yet been achieved at commercial scale.', {
    tags: ['nuclear', 'fission', 'fusion', 'energy', 'physics'],
  }),
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

  // ==========================================================================
  // INDIGENOUS PEOPLES & CULTURAL EXCHANGE (WSC 2026 Theme)
  // ==========================================================================
  // Easy
  createQuestion('social_studies', 'easy', 'Who are the Aboriginal Australians?', ['European settlers', 'The Indigenous peoples of Australia, with over 65,000 years of continuous culture', 'Immigrants from Asia', 'Pacific Island settlers'], 1, 'Aboriginal Australians have the oldest continuing civilization on Earth.', {
    theme_connection: 'Aboriginal culture asks us to consider the journey of humanity itself and what endures across millennia.',
    deep_explanation: 'Aboriginal Australians maintained rich oral traditions, art (like rock paintings over 40,000 years old), and deep ecological knowledge long before written records.',
    tags: ['indigenous', 'australia', 'culture', 'history'],
  }),
  createQuestion('social_studies', 'easy', 'What is the Maori name for New Zealand?', ['Kangaroo Land', 'Aotearoa', 'Tasmania', 'Oceania'], 1, 'Aotearoa means "Land of the Long White Cloud" in the Maori language.', {
    theme_connection: 'The growing use of "Aotearoa" alongside "New Zealand" reflects the ongoing journey toward recognizing Indigenous identity.',
    deep_explanation: 'New Zealand officially added Aotearoa to its name in some contexts. The Maori people navigated thousands of kilometers across the Pacific to settle the islands around 1250-1300 CE.',
    tags: ['indigenous', 'new-zealand', 'maori', 'geography'],
  }),
  createQuestion('social_studies', 'easy', 'What is "cultural exchange"?', ['Buying souvenirs', 'Sharing ideas, traditions, and practices between different cultures', 'Trading currencies', 'Watching foreign movies only'], 1, 'Cultural exchange has occurred throughout history through trade, migration, and diplomacy.', {
    theme_connection: 'Cultural exchange is a journey where ideas travel between societies, enriching both origin and destination.',
    deep_explanation: 'The Silk Road, Columbian Exchange, and modern globalization all facilitated cultural exchange. The challenge is ensuring exchange is mutual rather than one-sided cultural dominance.',
    tags: ['culture', 'exchange', 'globalization'],
  }),
  createQuestion('social_studies', 'easy', 'What is the United Nations?', ['A country', 'An international organization of 193 countries working for peace and cooperation', 'A military alliance', 'A trade company'], 1, 'The UN was founded in 1945 after World War II to prevent future conflicts.', {
    theme_connection: 'The UN embodies the journey toward global cooperation, though achieving its goals remains an ongoing challenge.',
    deep_explanation: 'The UN includes specialized agencies like WHO, UNICEF, and UNESCO. Its Security Council has five permanent members with veto power, which critics say limits its effectiveness.',
    tags: ['international-organizations', 'UN', 'peace'],
  }),

  // Medium
  createQuestion('social_studies', 'medium', 'What is the Inuit "qulliq" and why is it important?', ['A weapon', 'A traditional oil lamp that provided heat, light, and cooking in the Arctic', 'A type of boat', 'A musical instrument'], 1, 'The qulliq was essential for Inuit survival in extreme Arctic conditions and represents resourcefulness.', {
    theme_connection: 'Indigenous technologies like the qulliq remind us that human ingenuity has always been on a journey of problem-solving.',
    deep_explanation: 'Made from soapstone and fueled by seal oil with an Arctic cotton wick, the qulliq was the center of Inuit family life, demonstrating remarkable adaptation to one of Earth\'s harshest environments.',
    tags: ['indigenous', 'inuit', 'arctic', 'technology'],
  }),
  createQuestion('social_studies', 'medium', 'What is the difference between a "refugee" and a "migrant"?', ['They are the same', 'Refugees flee danger and persecution; migrants move voluntarily for better opportunities', 'Refugees travel by boat; migrants by land', 'There is no difference'], 1, 'Refugees are protected by international law, particularly the 1951 Refugee Convention.', {
    theme_connection: 'The refugee experience is the ultimate "Are We There Yet?" question, as displaced people seek safety and a new home.',
    deep_explanation: 'Over 100 million people were forcibly displaced worldwide by 2023. The distinction matters because refugees have specific legal protections that voluntary migrants may not.',
    tags: ['migration', 'refugees', 'international-law'],
  }),
  createQuestion('social_studies', 'medium', 'What is the World Trade Organization (WTO)?', ['A department store', 'An international body that sets rules for trade between nations', 'A shipping company', 'A bank'], 1, 'The WTO has 164 member countries and helps resolve trade disputes and reduce barriers to international commerce.', {
    tags: ['international-organizations', 'trade', 'economics'],
  }),
  createQuestion('social_studies', 'medium', 'What is "urbanization"?', ['Building more parks', 'The increasing movement of people from rural areas to cities', 'Destroying old buildings', 'Creating farms'], 1, 'Over 55% of the world\'s population now lives in urban areas, projected to reach 68% by 2050.', {
    theme_connection: 'Urbanization is one of the biggest journeys of our time. Are we "there" in building cities that work for everyone?',
    deep_explanation: 'While cities offer economic opportunities, rapid urbanization can lead to overcrowding, pollution, and inequality if not managed well.',
    tags: ['urbanization', 'cities', 'demographics', 'development'],
  }),
  createQuestion('social_studies', 'medium', 'What is "economic inequality"?', ['Everyone earning the same', 'The gap between the richest and poorest people in a society', 'A type of tax', 'A banking system'], 1, 'The richest 1% of the world\'s population owns more wealth than the bottom 50% combined.', {
    theme_connection: 'Rising inequality asks whether economic progress has brought everyone along on the journey or left many behind.',
    deep_explanation: 'Between 1990 and 2020, the richest 1% captured more new wealth than the entire bottom 50%. Both between and within countries, inequality shapes life outcomes dramatically.',
    tags: ['economics', 'inequality', 'society'],
  }),
  createQuestion('social_studies', 'medium', 'What was the "Scramble for Africa"?', ['A running race', 'European powers rapidly colonizing African territories in the late 1800s', 'A treasure hunt', 'An African marathon'], 1, 'The Berlin Conference of 1884-85 divided Africa among European nations with no African representation.', {
    theme_connection: 'Colonial boundaries drawn by outsiders continue to affect African nations, raising questions about whose journey matters in defining progress.',
    deep_explanation: 'Artificial borders split ethnic groups and merged rivals, creating lasting political tensions. Many modern African conflicts trace back to these colonial-era divisions.',
    tags: ['colonialism', 'africa', 'history', 'european-imperialism'],
  }),
  createQuestion('social_studies', 'medium', 'What is the African Union?', ['A trade company', 'A continental organization of 55 African nations promoting unity and development', 'A military alliance', 'A sports league'], 1, 'Founded in 2002, the AU works on issues including peace, human rights, and economic integration across Africa.', {
    tags: ['international-organizations', 'africa', 'cooperation'],
  }),

  // Hard
  createQuestion('social_studies', 'hard', 'What is "truth and reconciliation" in the context of Indigenous rights?', ['A court case', 'A process where nations acknowledge historical injustices against Indigenous peoples', 'A peace treaty', 'A school subject'], 1, 'Canada\'s Truth and Reconciliation Commission documented the impact of residential schools on Indigenous children.', {
    theme_connection: 'Truth and reconciliation asks whether societies can ever truly "arrive" at justice after historical wrongs.',
    deep_explanation: 'South Africa, Canada, and Australia have all undertaken reconciliation processes. These efforts acknowledge that healing from colonial injustice is a long journey, not a single destination.',
    tags: ['indigenous', 'reconciliation', 'justice', 'human-rights'],
  }),
  createQuestion('social_studies', 'hard', 'What is the "Gini coefficient"?', ['A magic lamp measurement', 'A number between 0 and 1 that measures income inequality in a country', 'A population count', 'A happiness score'], 1, 'A Gini of 0 means perfect equality; 1 means one person has everything. South Africa has one of the highest Gini coefficients.', {
    tags: ['economics', 'inequality', 'measurement', 'statistics'],
  }),
  createQuestion('social_studies', 'hard', 'What is "brain drain" and how does it affect developing countries?', ['Memory loss', 'The emigration of highly educated people from poorer to wealthier countries', 'A medical condition', 'A cleaning product'], 1, 'Countries like India and Nigeria lose many doctors and engineers to higher-paying jobs abroad, weakening local institutions.', {
    theme_connection: 'Brain drain shows that individual journeys toward better opportunities can slow a nation\'s collective journey toward development.',
    deep_explanation: 'Some argue "brain circulation" is more accurate: diaspora communities send remittances and knowledge back home. India\'s tech sector has benefited from returnees who gained experience abroad.',
    tags: ['migration', 'brain-drain', 'development', 'economics'],
  }),
  createQuestion('social_studies', 'hard', 'What is "gerrymandering" in democratic systems?', ['A type of gardening', 'Manipulating electoral district boundaries to favor a particular political party', 'A voting machine', 'A campaign strategy'], 1, 'Named after Governor Elbridge Gerry in 1812, gerrymandering can distort representation and undermine fair elections.', {
    tags: ['democracy', 'elections', 'politics', 'governance'],
  }),
  createQuestion('social_studies', 'hard', 'What was the "Green Revolution" in agriculture?', ['Painting farms green', 'A period of dramatic increases in crop yields through new technologies in the 1960s-70s', 'An environmental protest', 'A garden design movement'], 1, 'Norman Borlaug\'s work on high-yield wheat varieties saved an estimated billion lives from famine.', {
    tags: ['agriculture', 'history', 'development', 'food-security'],
  }),

  // ==========================================================================
  // MODERN DEMOCRACY & GLOBAL CHALLENGES
  // ==========================================================================
  // Easy
  createQuestion('social_studies', 'easy', 'What does "democracy" mean?', ['Rule by the military', 'Government by the people, where citizens have a say in decisions', 'Rule by one person', 'No government at all'], 1, 'The word comes from Greek: "demos" (people) + "kratos" (power or rule).', {
    tags: ['democracy', 'government', 'civics'],
  }),
  createQuestion('social_studies', 'easy', 'What is the European Union?', ['A country', 'A political and economic union of 27 European countries', 'A sports league', 'A military alliance'], 1, 'The EU allows free movement of people, goods, and money between member states and uses the euro as a shared currency.', {
    tags: ['international-organizations', 'europe', 'EU'],
  }),

  // Medium
  createQuestion('social_studies', 'medium', 'What is a "megacity"?', ['A very clean city', 'A city with a population of over 10 million people', 'A city with tall buildings', 'A capital city'], 1, 'Tokyo, Delhi, Shanghai, and Sao Paulo are among the world\'s largest megacities.', {
    tags: ['urbanization', 'megacities', 'demographics'],
  }),
  createQuestion('social_studies', 'medium', 'What are "remittances" in the context of migration?', ['Return tickets', 'Money sent by migrants back to their families in their home countries', 'Government payments', 'Bank interest'], 1, 'Global remittances exceeded $650 billion in 2022, surpassing foreign aid to many developing countries.', {
    theme_connection: 'Remittances show how individual migration journeys can fuel economic progress back home.',
    deep_explanation: 'For countries like the Philippines, India, and Mexico, remittances are a vital source of income, funding education, healthcare, and housing for millions of families.',
    tags: ['migration', 'economics', 'remittances', 'development'],
  }),
  createQuestion('social_studies', 'medium', 'What is "soft power" in international relations?', ['Physical strength', 'A country\'s ability to influence others through culture, values, and diplomacy rather than force', 'Weak military', 'Quiet diplomacy only'], 1, 'Countries like Japan use anime and cuisine, while South Korea uses K-pop and film, to build global influence.', {
    tags: ['international-relations', 'soft-power', 'culture', 'diplomacy'],
  }),

  // Hard
  createQuestion('social_studies', 'hard', 'What is the "resource curse" or "paradox of plenty"?', ['Too many resources', 'When countries rich in natural resources often have slower economic growth and more conflict', 'Resource recycling', 'Environmental protection'], 1, 'Countries like Nigeria and Venezuela have vast oil wealth but face corruption, inequality, and underdevelopment.', {
    theme_connection: 'The resource curse shows that having the ingredients for success doesn\'t mean you\'ve arrived at prosperity.',
    deep_explanation: 'Resource wealth can fuel corruption, weaken institutions, and make economies dependent on a single export. Norway is a notable exception, using its oil fund to benefit future generations.',
    tags: ['economics', 'resource-curse', 'development', 'governance'],
  }),
  createQuestion('social_studies', 'hard', 'What was the "Arab Spring"?', ['A weather pattern', 'A wave of pro-democracy protests across the Middle East and North Africa beginning in 2010-2011', 'A cultural festival', 'A trade agreement'], 1, 'Starting in Tunisia, protests spread to Egypt, Libya, Syria, and other nations, with varying outcomes from reform to civil war.', {
    tags: ['democracy', 'middle-east', 'protests', 'modern-history'],
  }),
  createQuestion('social_studies', 'hard', 'What is "intersectionality" in social studies?', ['A road crossing', 'The concept that different aspects of identity (race, gender, class) overlap and create unique experiences of discrimination', 'A math term', 'An internet concept'], 1, 'Coined by Kimberle Crenshaw in 1989, intersectionality helps explain how multiple forms of inequality interact and compound.', {
    tags: ['social-justice', 'identity', 'inequality', 'sociology'],
  }),

  // ==========================================================================
  // ADDITIONAL SOCIAL STUDIES: GLOBAL GOVERNANCE & CULTURAL HERITAGE
  // ==========================================================================
  // Easy
  createQuestion('social_studies', 'easy', 'What is UNESCO?', ['A type of currency', 'A United Nations agency that protects world heritage sites and promotes education and culture', 'A military alliance', 'A tech company'], 1, 'UNESCO has designated over 1,150 World Heritage Sites, from the Great Wall of China to Machu Picchu.', {
    tags: ['international-organizations', 'UNESCO', 'culture', 'heritage'],
  }),
  createQuestion('social_studies', 'easy', 'What is a "World Heritage Site"?', ['Any famous tourist spot', 'A place of outstanding cultural or natural value recognized by UNESCO', 'A capital city', 'A national park only'], 1, 'Sites include the Pyramids of Giza, the Galapagos Islands, and Angkor Wat.', {
    theme_connection: 'World Heritage Sites represent the destinations of past human journeys that we work to preserve for the future.',
    deep_explanation: 'The 1972 World Heritage Convention is based on the idea that some places belong to all of humanity and deserve international protection regardless of where they are located.',
    tags: ['heritage', 'UNESCO', 'culture', 'conservation'],
  }),
  createQuestion('social_studies', 'easy', 'What continent has the most countries?', ['Europe', 'Asia', 'Africa', 'South America'], 2, 'Africa has 54 recognized countries, making it the continent with the most sovereign nations.', {
    tags: ['geography', 'africa', 'continents'],
  }),
  createQuestion('social_studies', 'easy', 'What is "fair trade"?', ['Free shopping', 'A movement ensuring producers in developing countries get fair prices for their goods', 'A stock market term', 'A type of barter'], 1, 'Fair trade certifies products like coffee, chocolate, and bananas, helping farmers earn sustainable incomes.', {
    tags: ['economics', 'fair-trade', 'development', 'trade'],
  }),

  // Medium
  createQuestion('social_studies', 'medium', 'What is the "Universal Declaration of Human Rights"?', ['A national law', 'A 1948 UN document proclaiming fundamental rights that all humans should enjoy', 'A religious text', 'A trade agreement'], 1, 'Drafted after WWII horrors, it established 30 articles covering rights from freedom of speech to education and shelter.', {
    theme_connection: 'The UDHR set a destination for human dignity. Are we "there yet" nearly 80 years later?',
    deep_explanation: 'Though not legally binding, the UDHR inspired over 80 international treaties and conventions. Many of its ideals remain unrealized in practice across the globe.',
    tags: ['human-rights', 'UN', 'UDHR', 'international-law', 'governance'],
  }),
  createQuestion('social_studies', 'medium', 'What is "apartheid" and where did it occur?', ['A type of apartment', 'A system of racial segregation enforced by law in South Africa from 1948 to 1994', 'A European tradition', 'A type of government'], 1, 'Nelson Mandela spent 27 years in prison fighting apartheid before becoming South Africa\'s first Black president in 1994.', {
    tags: ['history', 'south-africa', 'apartheid', 'human-rights', 'racial-justice'],
  }),
  createQuestion('social_studies', 'medium', 'What is "gentrification"?', ['General fitness', 'When wealthier people move into a neighborhood, raising costs and often displacing longtime residents', 'Building new cities', 'A gardening technique'], 1, 'Gentrification can improve infrastructure but often pushes out lower-income communities who made the neighborhood vibrant.', {
    tags: ['urbanization', 'gentrification', 'inequality', 'housing'],
  }),
  createQuestion('social_studies', 'medium', 'What are the "BRICS" nations?', ['A construction term', 'Brazil, Russia, India, China, and South Africa, an alliance of major emerging economies', 'European countries', 'Island nations'], 1, 'BRICS nations represent over 40% of the world\'s population and about 25% of global GDP. The group expanded in 2024.', {
    tags: ['international-relations', 'BRICS', 'economics', 'geopolitics'],
  }),

  // Hard
  createQuestion('social_studies', 'hard', 'What is "sovereignty" in international relations?', ['Military power', 'The principle that each state has supreme authority within its territory without external interference', 'Economic wealth', 'Cultural influence'], 1, 'The concept of state sovereignty dates to the 1648 Peace of Westphalia and remains foundational to international law.', {
    tags: ['governance', 'sovereignty', 'international-law', 'political-science'],
  }),
  createQuestion('social_studies', 'hard', 'What was the "Rwandan genocide" and when did it occur?', ['A natural disaster', 'The mass killing of approximately 800,000 Tutsi people in Rwanda in 1994 over about 100 days', 'A colonial war', 'An economic crisis'], 1, 'The international community\'s failure to intervene led to reforms in how the UN addresses genocide prevention.', {
    theme_connection: 'The Rwandan genocide is a devastating reminder that human progress is not guaranteed and that "never again" remains an unfinished journey.',
    deep_explanation: 'Rwanda has since made remarkable progress in reconciliation and development, becoming one of Africa\'s fastest-growing economies, but the scars remain deep.',
    tags: ['history', 'genocide', 'rwanda', 'human-rights', 'africa'],
  }),
  createQuestion('social_studies', 'hard', 'What is "populism" as a political phenomenon?', ['Popular music', 'A political approach that claims to represent "ordinary people" against a corrupt elite', 'Popularity contests', 'Opinion polls'], 1, 'Populist movements have emerged across democracies worldwide, from both left and right of the political spectrum.', {
    tags: ['politics', 'populism', 'democracy', 'governance'],
  }),
  createQuestion('social_studies', 'easy', 'What is an "ambassador"?', ['A luxury car', 'An official representative sent by a country to another country', 'A type of passport', 'A translator'], 1, 'Ambassadors serve as their country\'s top diplomats abroad and work in buildings called embassies.', {
    tags: ['diplomacy', 'international-relations', 'government'],
  }),
  createQuestion('social_studies', 'medium', 'What is "diaspora"?', ['A type of diamond', 'The spreading of a people from their original homeland to other places', 'A disease', 'A festival'], 1, 'The African diaspora, Jewish diaspora, and Indian diaspora have shaped cultures around the world through centuries of migration.', {
    theme_connection: 'Diaspora communities embody the "Are We There Yet?" theme, as they navigate between the homeland they left and the new places they call home.',
    deep_explanation: 'Diasporic identity often involves maintaining ties to an ancestral homeland while building new lives elsewhere. This dual belonging enriches both origin and destination cultures.',
    tags: ['migration', 'diaspora', 'culture', 'identity', 'globalization'],
  }),
  createQuestion('social_studies', 'hard', 'What is "neocolonialism"?', ['A new colony on Mars', 'The practice of using economic, political, or cultural pressure to control other countries, especially former colonies', 'An architectural style', 'A type of museum'], 1, 'Critics argue that debt structures, trade agreements, and cultural dominance by wealthy nations continue patterns of colonial exploitation.', {
    tags: ['colonialism', 'economics', 'international-relations', 'politics', 'development'],
  }),
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

  // ==========================================================================
  // DIGITAL ART & STREET ART (WSC 2026 Theme)
  // ==========================================================================
  // Easy
  createQuestion('arts', 'easy', 'What is digital art?', ['Art using only pencils', 'Art created or presented using digital technology', 'Art displayed in museums only', 'Art made with clay'], 1, 'Digital art includes everything from computer-generated images to AI-assisted creations and interactive installations.', {
    theme_connection: 'Digital art represents the journey of artistic expression into new technological frontiers.',
    deep_explanation: 'Tools like Photoshop, Procreate, and Blender have democratized art creation, allowing anyone with a device to create professional-quality work.',
    tags: ['digital-art', 'technology', 'modern-art'],
  }),
  createQuestion('arts', 'easy', 'What is a mural?', ['A small painting', 'A large artwork painted directly on a wall or ceiling', 'A type of sculpture', 'A musical instrument'], 1, 'Murals have been created since prehistoric cave paintings and continue today as public art worldwide.', {
    theme_connection: 'Murals transform blank walls into destinations, turning ordinary neighborhoods into open-air galleries.',
    deep_explanation: 'Diego Rivera\'s murals in Mexico told stories of workers and revolution. Today, cities like Berlin, Sao Paulo, and Melbourne are celebrated for their vibrant mural scenes.',
    tags: ['street-art', 'murals', 'public-art'],
  }),
  createQuestion('arts', 'easy', 'Who is Banksy?', ['A classical composer', 'An anonymous British street artist known for satirical public works', 'A Renaissance painter', 'A famous architect'], 1, 'Banksy\'s true identity remains unknown despite being one of the world\'s most famous artists.', {
    theme_connection: 'Banksy\'s anonymity challenges the art world\'s journey: can we appreciate art without knowing who made it?',
    deep_explanation: 'Banksy\'s "Girl with Balloon" famously shredded itself moments after selling at auction for over $1 million, questioning art\'s commercial value.',
    tags: ['street-art', 'banksy', 'contemporary-art'],
  }),
  createQuestion('arts', 'easy', 'What is animation?', ['Still photography', 'The technique of creating the illusion of movement from a series of images', 'Sculpture', 'A musical style'], 1, 'Animation ranges from hand-drawn cartoons to computer-generated films like those by Pixar and Studio Ghibli.', {
    theme_connection: 'Animation\'s journey from flipbooks to CGI shows how technology continually expands the possibilities of visual storytelling.',
    deep_explanation: 'Traditional animation requires 24 drawings per second of film. Modern CGI uses mathematical models and physics simulations to create photorealistic worlds.',
    tags: ['animation', 'film', 'visual-arts'],
  }),

  // Medium
  createQuestion('arts', 'medium', 'What is an NFT in the art world?', ['A type of paint', 'A non-fungible token, a digital certificate of ownership for digital art', 'A film technique', 'A gallery name'], 1, 'NFTs use blockchain technology and sparked debate about art ownership and value in the digital age.', {
    theme_connection: 'NFTs raised the question: has art "arrived" in the digital age, or is digital ownership an incomplete journey?',
    deep_explanation: 'Beeple\'s NFT artwork sold for $69 million in 2021, but the market has since cooled significantly. The technology raised important questions about value, authenticity, and environmental impact.',
    tags: ['digital-art', 'NFT', 'blockchain', 'art-market'],
  }),
  createQuestion('arts', 'medium', 'What is Bollywood?', ['A theme park', 'The Hindi-language film industry based in Mumbai, India', 'A type of dance', 'A music genre'], 1, 'Bollywood produces over 1,500 films annually and is the largest film industry by number of films, bigger than Hollywood.', {
    tags: ['cinema', 'bollywood', 'india', 'film'],
  }),
  createQuestion('arts', 'medium', 'What is "hip-hop" as a cultural movement?', ['Only a music genre', 'A culture encompassing rap music, DJing, breakdancing, and graffiti art', 'A type of dance only', 'A fashion brand'], 1, 'Hip-hop originated in the Bronx, New York, in the 1970s and has become one of the most influential cultural movements worldwide.', {
    theme_connection: 'Hip-hop\'s journey from block parties in the Bronx to global dominance mirrors how grassroots movements can transform culture.',
    deep_explanation: 'The four pillars of hip-hop are MCing (rapping), DJing, B-boying (breakdancing), and graffiti art. Each element has evolved into sophisticated art forms with global practitioners.',
    tags: ['music', 'hip-hop', 'culture', 'dance'],
  }),
  createQuestion('arts', 'medium', 'What is Nollywood?', ['A toy brand', 'Nigeria\'s film industry, the second largest in the world by number of films', 'A Hollywood studio', 'A TV network'], 1, 'Nollywood produces over 1,000 films annually and has become a major cultural export for Africa.', {
    theme_connection: 'Nollywood\'s rapid growth shows that the journey of global cinema is no longer a one-way street from Hollywood to the world.',
    deep_explanation: 'Nollywood began in the 1990s with low-budget straight-to-video films. It now generates $6+ billion annually and streams globally on platforms like Netflix.',
    tags: ['cinema', 'nollywood', 'nigeria', 'africa', 'film'],
  }),
  createQuestion('arts', 'medium', 'What is the art form of "calligraphy"?', ['Drawing animals', 'The art of beautiful handwriting, practiced across many cultures', 'A type of sculpture', 'Painting with fingers'], 1, 'Arabic, Chinese, and Japanese calligraphy are celebrated art forms with centuries of tradition and distinct aesthetic philosophies.', {
    theme_connection: 'In an age of keyboards and touchscreens, calligraphy asks whether the journey of handwriting has reached its destination or still has a future.',
    deep_explanation: 'Chinese calligraphy is considered the highest visual art form in East Asian culture. Arabic calligraphy developed because Islamic art traditionally avoided depicting human figures.',
    tags: ['calligraphy', 'writing', 'traditional-art', 'culture'],
  }),
  createQuestion('arts', 'medium', 'What is "Brutalism" in architecture?', ['Ugly buildings', 'An architectural style using raw concrete and bold geometric forms, popular in the 1950s-70s', 'Ancient Roman style', 'Glass buildings only'], 1, 'Named from the French "beton brut" (raw concrete), Brutalist buildings are now gaining appreciation and protection status.', {
    tags: ['architecture', 'brutalism', 'design', 'modernism'],
  }),

  // Hard
  createQuestion('arts', 'hard', 'What is "generative art"?', ['Art made by generals', 'Art created through autonomous systems, algorithms, or AI that follow rules set by the artist', 'Oil painting', 'Pottery'], 1, 'Generative art raises questions about authorship: is the artist the person, the algorithm, or both?', {
    theme_connection: 'AI-generated art asks whether creativity has a destination or is an ever-evolving journey between humans and machines.',
    deep_explanation: 'From early computer art by Vera Molnar in the 1960s to modern AI tools like DALL-E and Midjourney, generative art challenges our understanding of creativity and authorship.',
    tags: ['digital-art', 'AI-art', 'generative', 'technology'],
  }),
  createQuestion('arts', 'hard', 'What is the "Bauhaus" movement?', ['A type of house', 'A German art school and movement (1919-1933) that unified art, craft, and technology', 'A cooking style', 'A music genre'], 1, 'Bauhaus principles of functional design influenced everything from architecture to typography to furniture.', {
    theme_connection: 'Bauhaus sought to merge art and industry, a journey that continues in modern design thinking.',
    deep_explanation: 'Founded by Walter Gropius, Bauhaus teachers included Kandinsky and Klee. The Nazis closed it, but its ideas spread globally as members emigrated. Modern IKEA and Apple design owe debts to Bauhaus.',
    tags: ['architecture', 'bauhaus', 'design', 'art-history'],
  }),
  createQuestion('arts', 'hard', 'What is "Kathakali" in Indian performing arts?', ['A cooking technique', 'A classical dance-drama from Kerala combining dance, music, and elaborate costumes and makeup', 'A type of yoga', 'A meditation practice'], 1, 'Performers train for years to master the complex facial expressions and hand gestures that tell mythological stories.', {
    tags: ['dance', 'india', 'theater', 'traditional-art'],
  }),

  // ==========================================================================
  // WORLD CINEMA, MUSIC & PHOTOGRAPHY
  // ==========================================================================
  // Easy
  createQuestion('arts', 'easy', 'What is Studio Ghibli famous for?', ['Video games', 'Japanese animated films like "Spirited Away" and "My Neighbor Totoro"', 'Live-action movies', 'Music production'], 1, 'Founded by Hayao Miyazaki and Isao Takahata, Ghibli films are celebrated for their artistry and storytelling.', {
    tags: ['animation', 'ghibli', 'japan', 'film'],
  }),
  createQuestion('arts', 'easy', 'What does a photographer use to create images?', ['Paint', 'A camera that captures light', 'Clay', 'A pen'], 1, 'The word "photography" comes from Greek words meaning "drawing with light."', {
    tags: ['photography', 'visual-arts', 'light'],
  }),

  // Medium
  createQuestion('arts', 'medium', 'What is K-pop and where does it originate?', ['Classical Korean music', 'A genre of popular music from South Korea known for choreographed performances and global fandoms', 'A cooking style', 'A martial art'], 1, 'Groups like BTS and BLACKPINK have billions of streams and massive global followings.', {
    tags: ['music', 'k-pop', 'south-korea', 'pop-culture'],
  }),
  createQuestion('arts', 'medium', 'What is the "rule of thirds" in photography?', ['Taking three photos', 'A composition guideline that divides the frame into a 3x3 grid for more dynamic images', 'Using three cameras', 'A pricing rule'], 1, 'Placing subjects along the grid lines or intersections tends to create more visually interesting and balanced photographs.', {
    tags: ['photography', 'composition', 'visual-arts'],
  }),
  createQuestion('arts', 'medium', 'What is "Art Deco" as an architectural and design style?', ['Ancient Egyptian art', 'A decorative style from the 1920s-30s characterized by geometric patterns and bold colors', 'A type of painting', 'A music genre'], 1, 'The Chrysler Building in New York and the architecture of Miami\'s South Beach are famous Art Deco examples.', {
    tags: ['architecture', 'art-deco', 'design', 'history'],
  }),

  // Hard
  createQuestion('arts', 'hard', 'What is "neorealism" in cinema?', ['CGI-heavy films', 'An Italian film movement using non-professional actors and real locations to depict everyday life', 'Hollywood blockbusters', 'Silent films'], 1, 'Films like "Bicycle Thieves" (1948) portrayed post-war poverty with raw authenticity and influenced cinema worldwide.', {
    theme_connection: 'Italian neorealism showed that art could document the real journey of ordinary people struggling through adversity.',
    deep_explanation: 'Emerging after WWII, directors like De Sica and Rossellini rejected Hollywood glamour to show the reality of reconstruction-era Italy. The movement influenced French New Wave and modern independent cinema.',
    tags: ['cinema', 'neorealism', 'italy', 'film-history'],
  }),
  createQuestion('arts', 'hard', 'What is "polyrhythm" in African music?', ['A single drum beat', 'The simultaneous use of two or more conflicting rhythmic patterns', 'Playing one instrument', 'A type of melody'], 1, 'West African drumming traditions feature complex layered rhythms that influenced jazz, funk, and virtually all modern popular music.', {
    tags: ['music', 'african-music', 'rhythm', 'world-music'],
  }),
  createQuestion('arts', 'hard', 'What is "Deconstructivism" in architecture?', ['Tearing down buildings', 'An architectural style that fragments and distorts conventional forms to create dynamic, unpredictable structures', 'Classical building restoration', 'Log cabin construction'], 1, 'Architects like Frank Gehry, Zaha Hadid, and Daniel Libeskind created buildings that appear to defy structural logic.', {
    theme_connection: 'Deconstructivist buildings challenge our sense of arrival: they appear mid-journey, unfinished, questioning the very idea of a fixed destination.',
    deep_explanation: 'Gehry\'s Guggenheim Bilbao and Hadid\'s fluid designs reject right angles and predictability. The movement draws on Derrida\'s philosophy of questioning fixed meanings.',
    tags: ['architecture', 'deconstructivism', 'modern-art', 'design'],
  }),

  // ==========================================================================
  // DANCE FORMS & THEATER TRADITIONS
  // ==========================================================================
  // Easy
  createQuestion('arts', 'easy', 'What is "breakdancing" (breaking)?', ['Breaking plates', 'An athletic street dance style featuring acrobatic moves, spins, and freezes', 'A martial art', 'A type of gymnastics'], 1, 'Breaking became an Olympic sport at the 2024 Paris Olympics, originating from 1970s New York City.', {
    tags: ['dance', 'breaking', 'hip-hop', 'olympics'],
  }),

  // Medium
  createQuestion('arts', 'medium', 'What is a "leitmotif" in film music?', ['Background noise', 'A recurring musical theme associated with a specific character, place, or idea', 'An opening song', 'Closing credits music'], 1, 'John Williams uses leitmotifs extensively: think of Darth Vader\'s "Imperial March" or Hedwig\'s Theme in Harry Potter.', {
    tags: ['music', 'film-music', 'leitmotif', 'composition'],
  }),

  // Hard
  createQuestion('arts', 'hard', 'What is "Butoh" in Japanese performing arts?', ['A martial art', 'An avant-garde dance form born in 1950s Japan characterized by slow, controlled movements and white body paint', 'A cooking style', 'A form of calligraphy'], 1, 'Created by Tatsumi Hijikata and Kazuo Ohno as a rejection of Western dance forms, Butoh explores darkness, transformation, and the grotesque.', {
    tags: ['dance', 'butoh', 'japan', 'avant-garde', 'performing-arts'],
  }),
  createQuestion('arts', 'hard', 'What was the "Harlem Renaissance"?', ['A building renovation', 'A cultural explosion of African American art, literature, and music in 1920s-30s New York', 'A European movement', 'A political party'], 1, 'Writers like Langston Hughes, musicians like Duke Ellington, and artists like Aaron Douglas redefined American culture.', {
    theme_connection: 'The Harlem Renaissance was a journey of cultural self-definition that asked: have Black Americans arrived at full artistic recognition?',
    deep_explanation: 'Beyond individual achievements, the movement created a new Black cultural identity that challenged racial stereotypes and laid groundwork for the Civil Rights Movement.',
    tags: ['art-history', 'harlem-renaissance', 'african-american', 'culture', 'literature'],
  }),

  // ==========================================================================
  // ADDITIONAL ARTS: WORLD TRADITIONS & CONTEMPORARY FORMS
  // ==========================================================================
  // Easy
  createQuestion('arts', 'easy', 'What is a "mosaic" in art?', ['A type of painting', 'An artwork made from small pieces of colored glass, stone, or tile arranged in patterns', 'A photograph', 'A wooden sculpture'], 1, 'Mosaics date back over 4,000 years. Ancient Roman mosaics are still being discovered today at archaeological sites.', {
    tags: ['visual-arts', 'mosaic', 'ancient-art', 'technique'],
  }),
  createQuestion('arts', 'easy', 'What instrument family does the violin belong to?', ['Percussion', 'Brass', 'String', 'Woodwind'], 2, 'The violin is the highest-pitched member of the string family, which also includes viola, cello, and double bass.', {
    tags: ['music', 'instruments', 'strings', 'orchestra'],
  }),
  createQuestion('arts', 'easy', 'What is a "selfie" considered in the context of photography?', ['Professional photography', 'A self-portrait photograph typically taken with a smartphone', 'A landscape photo', 'A painting'], 1, 'Self-portraiture has a long history in art; Rembrandt painted about 80 self-portraits over his career.', {
    tags: ['photography', 'self-portrait', 'modern-culture', 'digital'],
  }),
  createQuestion('arts', 'easy', 'What is "manga"?', ['A tropical fruit', 'Japanese comic books and graphic novels with a distinctive art style', 'A martial art', 'A cooking technique'], 1, 'Manga is read right-to-left and covers every genre from action to romance. It generates billions of dollars annually.', {
    tags: ['manga', 'japan', 'comics', 'visual-arts', 'pop-culture'],
  }),

  // Medium
  createQuestion('arts', 'medium', 'What is "Afrobeat" music?', ['African classical music', 'A genre blending West African music, jazz, and funk, pioneered by Fela Kuti in Nigeria', 'A type of drumming only', 'Electronic dance music'], 1, 'Fela Kuti created Afrobeat in the 1970s as both music and political protest. Its influence extends to modern Afrobeats (with an "s"), a distinct but related genre.', {
    theme_connection: 'Afrobeat\'s journey from Lagos to global influence shows how music travels and transforms across borders.',
    deep_explanation: 'Fela Kuti used music to criticize Nigeria\'s military government, making Afrobeat a vehicle for social change. Today, Afrobeats artists like Burna Boy carry Nigerian music worldwide.',
    tags: ['music', 'afrobeat', 'nigeria', 'africa', 'world-music'],
  }),
  createQuestion('arts', 'medium', 'What is "capoeira"?', ['A coffee drink', 'A Brazilian art form combining martial arts, dance, acrobatics, and music', 'A card game', 'A type of hat'], 1, 'Developed by enslaved Africans in Brazil, capoeira disguised combat training as dance to evade colonial authorities.', {
    tags: ['dance', 'capoeira', 'brazil', 'martial-arts', 'culture'],
  }),
  createQuestion('arts', 'medium', 'What is "chiaroscuro" used for in visual art?', ['Adding color', 'Creating dramatic contrast between light and dark to add depth and atmosphere', 'Making art smaller', 'Framing pictures'], 1, 'Caravaggio and Rembrandt were masters of chiaroscuro, using strong light-dark contrasts to create emotional intensity.', {
    tags: ['visual-arts', 'technique', 'chiaroscuro', 'painting'],
  }),
  createQuestion('arts', 'medium', 'What is a "graphic novel"?', ['A textbook with graphs', 'A book-length narrative told through sequential art (comics) with mature themes', 'A photography book', 'A coloring book'], 1, 'Art Spiegelman\'s "Maus" became the first graphic novel to win a Pulitzer Prize in 1992, depicting the Holocaust.', {
    tags: ['literature', 'graphic-novel', 'comics', 'visual-storytelling'],
  }),

  // Hard
  createQuestion('arts', 'hard', 'What is "wabi-sabi" in Japanese aesthetics?', ['A type of food', 'A worldview that finds beauty in imperfection, transience, and incompleteness', 'A cleaning technique', 'A type of pottery only'], 1, 'Wabi-sabi values cracked pottery, weathered wood, and asymmetry. It influenced art, architecture, and design worldwide.', {
    theme_connection: 'Wabi-sabi suggests that perfection is not the destination; beauty exists in the imperfect, unfinished journey itself.',
    deep_explanation: 'Rooted in Zen Buddhism, wabi-sabi stands in contrast to Western ideals of perfection and symmetry. The practice of kintsugi (repairing pottery with gold) embodies this philosophy.',
    tags: ['aesthetics', 'wabi-sabi', 'japan', 'philosophy', 'design'],
  }),
  createQuestion('arts', 'hard', 'What is "Dadaism" in art history?', ['A children\'s movement', 'An avant-garde art movement that rejected logic and reason to protest World War I', 'A dance style', 'A musical genre'], 1, 'Dadaists like Marcel Duchamp created deliberately absurd works. His urinal titled "Fountain" challenged the definition of art itself.', {
    tags: ['art-history', 'dadaism', 'avant-garde', 'modern-art', 'protest'],
  }),
  createQuestion('arts', 'hard', 'What is "synesthesia" and how has it influenced art?', ['A disease', 'A neurological condition where one sense triggers another, inspiring artists who "see" sounds or "hear" colors', 'A painting technique', 'A type of camera'], 1, 'Kandinsky reportedly experienced synesthesia, which influenced his abstract paintings. Composers like Scriabin associated specific colors with musical keys.', {
    tags: ['neuroscience', 'synesthesia', 'art', 'music', 'creativity'],
  }),
  createQuestion('arts', 'easy', 'What is a "duet" in music?', ['A solo performance', 'A musical piece performed by two musicians or singers', 'A three-person group', 'An audience participation song'], 1, 'Duets appear across all music genres, from classical violin duets to pop collaborations between artists.', {
    tags: ['music', 'performance', 'vocabulary', 'musical-forms'],
  }),
  createQuestion('arts', 'medium', 'What is "sgraffito" as an art technique?', ['Scratching lottery tickets', 'A technique where a top layer of color is scratched away to reveal a different color beneath', 'A type of graffiti', 'A musical instrument'], 1, 'Sgraffito has been used in pottery, painting, and architecture for centuries, creating intricate patterns through removal rather than addition.', {
    tags: ['visual-arts', 'technique', 'sgraffito', 'ceramics'],
  }),
  createQuestion('arts', 'medium', 'What is "gamelan" music?', ['Video game soundtracks', 'Traditional Indonesian ensemble music played primarily on percussion instruments like metallophones and gongs', 'A type of guitar music', 'Electronic dance music'], 1, 'Gamelan has influenced Western composers like Claude Debussy, who encountered it at the 1889 Paris Exposition.', {
    theme_connection: 'Gamelan\'s influence on Western music shows how cultural exchange creates unexpected journeys of artistic inspiration.',
    deep_explanation: 'Each gamelan set is tuned uniquely and considered to have its own spirit. The interlocking patterns of gamelan percussion create a shimmering, hypnotic sound unlike anything in Western music.',
    tags: ['music', 'gamelan', 'indonesia', 'world-music', 'percussion'],
  }),
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

  // ==========================================================================
  // CLASSIC FAIRY TALES & MYTHOLOGY (WSC 2026 Theme)
  // ==========================================================================
  // Easy
  createQuestion('literature', 'easy', 'In Greek mythology, who flew too close to the Sun with wax wings?', ['Hercules', 'Icarus', 'Perseus', 'Odysseus'], 1, 'Icarus ignored his father Daedalus\'s warning, and the sun melted his wings, causing him to fall into the sea.', {
    theme_connection: 'The myth of Icarus warns about the dangers of overreaching on our journey toward ambitious goals.',
    deep_explanation: 'Daedalus crafted wings of feathers and wax to escape King Minos\'s labyrinth in Crete. The story is often read as a cautionary tale about hubris and the limits of ambition.',
    tags: ['mythology', 'greek', 'icarus', 'hubris'],
  }),
  createQuestion('literature', 'easy', 'What is a "fable"?', ['A true story', 'A short story with animal characters that teaches a moral lesson', 'A type of poem', 'A news report'], 1, 'Aesop\'s Fables, like "The Tortoise and the Hare," have been told for over 2,500 years.', {
    theme_connection: 'Fables compress life\'s journey into short tales with clear lessons, making wisdom accessible across ages and cultures.',
    deep_explanation: 'Fables exist in nearly every culture. India\'s Panchatantra, Africa\'s Anansi stories, and La Fontaine\'s French fables all use animals to teach human truths.',
    tags: ['literary-devices', 'fables', 'storytelling'],
  }),
  createQuestion('literature', 'easy', 'In the fairy tale "Cinderella," what does she leave behind at the ball?', ['Her crown', 'A glass slipper', 'Her necklace', 'Her gloves'], 1, 'Versions of the Cinderella story exist in cultures worldwide, from Chinese "Ye Xian" to Egyptian "Rhodopis."', {
    theme_connection: 'Cinderella\'s story of transformation through a journey is so universal that over 500 versions exist across world cultures.',
    deep_explanation: 'The earliest known version, "Rhodopis," dates to ancient Egypt. Charles Perrault wrote the French version in 1697, and the Brothers Grimm published a darker German version in 1812.',
    tags: ['fairy-tales', 'cinderella', 'folklore'],
  }),
  createQuestion('literature', 'easy', 'Who is the Norse god of thunder?', ['Odin', 'Loki', 'Thor', 'Freya'], 2, 'Thor wields the hammer Mjolnir and is one of the most popular figures in Norse mythology.', {
    theme_connection: 'Norse myths about journeys between worlds (the nine realms connected by Yggdrasil) mirror humanity\'s own exploration of the unknown.',
    deep_explanation: 'Norse mythology influenced Tolkien\'s Middle-earth, Marvel Comics, and countless fantasy works. The myths were preserved in the Prose Edda and Poetic Edda.',
    tags: ['mythology', 'norse', 'thor'],
  }),
  createQuestion('literature', 'easy', 'What is an "allegory" in literature?', ['A happy story', 'A story where characters and events represent deeper meanings or ideas', 'A scary story', 'A short poem'], 1, 'George Orwell\'s "Animal Farm" is an allegory for the Russian Revolution and totalitarianism.', {
    theme_connection: 'Allegories let authors comment on real journeys of society while telling an engaging surface story.',
    deep_explanation: 'Plato\'s "Allegory of the Cave," Bunyan\'s "The Pilgrim\'s Progress," and C.S. Lewis\'s Narnia are all allegories operating on multiple levels of meaning.',
    tags: ['literary-devices', 'allegory', 'storytelling'],
  }),

  // Medium
  createQuestion('literature', 'medium', 'What is the significance of the Odyssey by Homer?', ['It\'s a cookbook', 'It\'s one of the oldest works of Western literature, telling of Odysseus\'s 10-year journey home', 'It\'s a math textbook', 'It\'s a religious text'], 1, 'Written around the 8th century BCE, the Odyssey established the "journey home" as a fundamental literary archetype.', {
    theme_connection: 'The Odyssey is the original "Are We There Yet?" story, as Odysseus faces endless obstacles on his journey home to Ithaca.',
    deep_explanation: 'Odysseus encounters the Cyclops, the Sirens, and Scylla and Charybdis. His 10-year voyage home after the Trojan War has inspired countless works about the difficulty and meaning of journeys.',
    tags: ['mythology', 'greek', 'odyssey', 'homer', 'epic-poetry'],
  }),
  createQuestion('literature', 'medium', 'What is "magical realism" as a literary style?', ['Fantasy with wizards', 'A genre where magical elements appear naturally in an otherwise realistic setting', 'Science fiction', 'Horror fiction'], 1, 'Gabriel Garcia Marquez\'s "One Hundred Years of Solitude" is a landmark of magical realism, blending the extraordinary with the everyday.', {
    theme_connection: 'Magical realism suggests that the journey of human experience includes wonders that rational thinking alone cannot capture.',
    deep_explanation: 'Unlike fantasy, magical realism treats impossible events as normal within a realistic setting. It emerged primarily in Latin American literature, reflecting cultures where myth and daily life intertwine.',
    tags: ['literary-devices', 'magical-realism', 'genre', 'latin-american-literature'],
  }),
  createQuestion('literature', 'medium', 'What is a "haiku"?', ['A long novel', 'A Japanese poem form with three lines of 5, 7, and 5 syllables', 'A Greek epic', 'A type of essay'], 1, 'Matsuo Basho is considered the greatest haiku master. His famous frog poem: "Old pond / a frog jumps in / sound of water."', {
    tags: ['poetry', 'haiku', 'japan', 'literary-forms'],
  }),
  createQuestion('literature', 'medium', 'What is the "hero\'s journey" in storytelling?', ['A travel guide', 'A common narrative pattern where a hero ventures out, faces challenges, and returns transformed', 'A sports movie', 'A fairy tale only'], 1, 'Joseph Campbell identified this pattern in myths worldwide. It appears in Star Wars, Harry Potter, and The Lord of the Rings.', {
    theme_connection: 'The hero\'s journey is literally about "getting there" and asking whether the destination or the transformation along the way matters more.',
    deep_explanation: 'Campbell\'s "monomyth" includes stages like the Call to Adventure, Crossing the Threshold, the Ordeal, and the Return. It reflects a universal human experience of growth through challenge.',
    tags: ['storytelling', 'heros-journey', 'campbell', 'narrative'],
  }),
  createQuestion('literature', 'medium', 'In African oral tradition, what role does a "griot" play?', ['A farmer', 'A storyteller, historian, and keeper of cultural memory in West African societies', 'A warrior', 'A trader'], 1, 'Griots have preserved centuries of history, genealogy, and wisdom through oral performance, often accompanied by the kora instrument.', {
    tags: ['storytelling', 'oral-tradition', 'africa', 'griot', 'culture'],
  }),
  createQuestion('literature', 'medium', 'What is "dystopian" fiction?', ['Happy stories', 'Stories set in imagined societies where life is oppressive, often as warnings about real trends', 'Detective stories', 'Romance novels'], 1, 'Books like "1984," "The Hunger Games," and "Brave New World" explore what happens when societies go wrong.', {
    tags: ['genre', 'dystopia', 'fiction', 'social-commentary'],
  }),
  createQuestion('literature', 'medium', 'What is the Mahabharata?', ['A type of food', 'One of the longest epic poems ever written, a foundational text of Hindu literature', 'A European novel', 'A scientific paper'], 1, 'At roughly 1.8 million words, the Mahabharata is about ten times longer than the Iliad and Odyssey combined.', {
    tags: ['epic-poetry', 'india', 'hinduism', 'mythology'],
  }),

  // Hard
  createQuestion('literature', 'hard', 'What is "unreliable narrator" as a literary device?', ['A bad storyteller', 'A narrator whose credibility is compromised, making the reader question the truth of the story', 'A narrator who forgets things', 'A narrator who speaks quietly'], 1, 'In "Flowers for Algernon," Charlie is an unreliable narrator because his cognitive limitations affect what he perceives and reports.', {
    tags: ['literary-devices', 'unreliable-narrator', 'narrative-technique'],
  }),
  createQuestion('literature', 'hard', 'What is "stream of consciousness" in literature?', ['A river description', 'A narrative technique that presents a character\'s continuous flow of thoughts and feelings', 'A water poem', 'A type of diary entry'], 1, 'Virginia Woolf\'s "Mrs Dalloway" and James Joyce\'s "Ulysses" are masterpieces of stream of consciousness writing.', {
    theme_connection: 'Stream of consciousness captures the inner journey of the mind, showing that human thought never truly "arrives" but flows endlessly.',
    deep_explanation: 'This technique attempts to replicate how the mind actually works: jumping between memories, sensations, and ideas without logical transitions. It revolutionized 20th-century literature.',
    tags: ['literary-devices', 'stream-of-consciousness', 'modernism', 'narrative-technique'],
  }),
  createQuestion('literature', 'hard', 'What is the difference between "simile" and "metaphor"?', ['They are the same', 'A simile uses "like" or "as" to compare; a metaphor states one thing IS another', 'Simile is longer', 'Metaphor is only in poetry'], 1, '"Her smile was like sunshine" is a simile; "her smile was sunshine" is a metaphor. Metaphors create more direct, powerful comparisons.', {
    tags: ['literary-devices', 'simile', 'metaphor', 'figurative-language'],
  }),
  createQuestion('literature', 'hard', 'What is "Anansi" in West African and Caribbean storytelling?', ['A type of food', 'A trickster spider figure who uses cunning to outsmart more powerful opponents', 'A hero warrior', 'A wise king'], 1, 'Anansi stories traveled from West Africa to the Caribbean through the slave trade and became symbols of resistance and resilience.', {
    theme_connection: 'Anansi represents the journey of African cultural traditions surviving displacement, adapting, and thriving in new contexts.',
    deep_explanation: 'Anansi stories teach that intelligence and wit can overcome brute force. These tales influenced "Brer Rabbit" stories in the American South and remain beloved across the diaspora.',
    tags: ['mythology', 'anansi', 'west-africa', 'caribbean', 'trickster'],
  }),

  // ==========================================================================
  // MODERN YA LITERATURE & POETRY
  // ==========================================================================
  // Easy
  createQuestion('literature', 'easy', 'What is "young adult" (YA) literature?', ['Children\'s picture books', 'Books written for readers roughly ages 12-18, often featuring teenage protagonists', 'Adult mystery novels', 'Academic textbooks'], 1, 'YA literature has exploded in popularity, with series like "The Hunger Games" and "Divergent" becoming global phenomena.', {
    tags: ['YA-literature', 'genre', 'modern-literature'],
  }),
  createQuestion('literature', 'easy', 'What is a "sonnet"?', ['A long story', 'A 14-line poem with a specific rhyme scheme', 'A type of song', 'A short essay'], 1, 'Shakespeare wrote 154 sonnets. The Shakespearean sonnet has three quatrains and a closing couplet.', {
    tags: ['poetry', 'sonnet', 'literary-forms', 'shakespeare'],
  }),
  createQuestion('literature', 'easy', 'Who wrote "Percy Jackson and the Olympians"?', ['J.K. Rowling', 'Rick Riordan', 'Suzanne Collins', 'Philip Pullman'], 1, 'Riordan\'s series introduces Greek mythology to young readers through modern-day adventures of a demigod.', {
    tags: ['YA-literature', 'percy-jackson', 'mythology', 'modern-literature'],
  }),

  // Medium
  createQuestion('literature', 'medium', 'What is "spoken word poetry"?', ['Reading quietly', 'A performance art form where poetry is written to be performed aloud, emphasizing rhythm and emotion', 'Whispering poems', 'Singing lyrics'], 1, 'Spoken word has roots in oral traditions worldwide and has surged through events like poetry slams and platforms like YouTube.', {
    tags: ['poetry', 'spoken-word', 'performance', 'oral-tradition'],
  }),
  createQuestion('literature', 'medium', 'What is an "epistolary novel"?', ['A mystery novel', 'A novel written as a series of letters, diary entries, or documents', 'A fantasy novel', 'A poetry collection'], 1, '"Flowers for Algernon" uses progress reports, and "Dracula" uses letters and journal entries, both examples of epistolary form.', {
    tags: ['literary-forms', 'epistolary', 'narrative-technique'],
  }),
  createQuestion('literature', 'medium', 'What is "personification" in literature?', ['Writing biographies', 'Giving human qualities to non-human things or abstract ideas', 'Describing a person', 'Writing in first person'], 1, 'In "There Will Come Soft Rains," the automated house is personified as it continues human-like routines after humanity is gone.', {
    tags: ['literary-devices', 'personification', 'figurative-language'],
  }),
  createQuestion('literature', 'medium', 'What is the Japanese literary concept of "mono no aware"?', ['A horror story', 'The bittersweet awareness of the impermanence of things', 'A type of manga', 'A comedy style'], 1, 'This concept pervades Japanese literature and art, reflected in the appreciation of cherry blossoms that bloom briefly and fall.', {
    theme_connection: 'Mono no aware captures the beauty of journeys precisely because they end, connecting to the question of whether we ever truly "arrive."',
    deep_explanation: 'The phrase translates roughly as "the pathos of things." It suggests that beauty and sadness are intertwined because everything is temporary. Murasaki Shikibu\'s "The Tale of Genji" embodies this.',
    tags: ['japanese-literature', 'philosophy', 'aesthetics', 'culture'],
  }),

  // Hard
  createQuestion('literature', 'hard', 'What is "intertextuality" in literary analysis?', ['Texting about books', 'The way a text\'s meaning is shaped by references to other texts', 'Reading between the lines', 'Writing footnotes'], 1, 'When "The Hunger Games" echoes the myth of Theseus and the Minotaur, that\'s intertextuality creating deeper meaning.', {
    tags: ['literary-devices', 'intertextuality', 'analysis', 'literary-theory'],
  }),
  createQuestion('literature', 'hard', 'What is "post-colonial literature"?', ['Books about mail delivery', 'Literature that explores the effects of colonization on peoples and cultures', 'Ancient Roman texts', 'European travel writing'], 1, 'Writers like Chinua Achebe ("Things Fall Apart") and Chimamanda Ngozi Adichie challenge colonial narratives and reclaim cultural identity.', {
    theme_connection: 'Post-colonial literature asks whose version of the journey gets told, and whether formerly colonized peoples have "arrived" at self-determination.',
    deep_explanation: 'Achebe wrote "Things Fall Apart" partly in response to Joseph Conrad\'s "Heart of Darkness," which portrayed Africa through a European lens. Post-colonial writers recenter indigenous perspectives.',
    tags: ['post-colonial', 'literature', 'identity', 'culture', 'decolonization'],
  }),
  createQuestion('literature', 'hard', 'What is "dramatic irony"?', ['Acting in a play', 'When the audience knows something that the characters do not', 'A dramatic reading', 'An ironic ending'], 1, 'In "Ender\'s Game," readers may suspect the final simulation is real before Ender does, creating powerful dramatic irony.', {
    tags: ['literary-devices', 'dramatic-irony', 'narrative-technique'],
  }),
  createQuestion('literature', 'hard', 'What is the "One Thousand and One Nights" and why is it significant?', ['A sleep study', 'A collection of Middle Eastern folk tales framed by Scheherazade\'s storytelling to survive', 'A history book', 'A religious text'], 1, 'Scheherazade tells stories each night to delay her execution, using narrative as a tool of survival. The collection includes Aladdin and Sinbad.', {
    theme_connection: 'Scheherazade\'s survival depends on the journey never ending: she must never "arrive" at the conclusion, or she dies.',
    deep_explanation: 'The frame narrative of stories within stories influenced European literature after translation in the 18th century. It demonstrates storytelling as both entertainment and a matter of life and death.',
    tags: ['folklore', 'middle-east', 'frame-narrative', 'scheherazade', 'storytelling'],
  }),

  // ==========================================================================
  // ADDITIONAL LITERATURE: GLOBAL STORYTELLING & LITERARY CONCEPTS
  // ==========================================================================
  // Easy
  createQuestion('literature', 'easy', 'What is a "protagonist" in a story?', ['The villain', 'The main character around whom the story revolves', 'A side character', 'The narrator always'], 1, 'In "Ender\'s Game," Ender Wiggin is the protagonist. The word comes from Greek meaning "first contestant."', {
    tags: ['literary-devices', 'protagonist', 'narrative', 'vocabulary'],
  }),
  createQuestion('literature', 'easy', 'What is "fiction"?', ['A true account', 'Literature that describes imaginary events and people', 'A news article', 'A biography'], 1, 'Fiction includes novels, short stories, and plays. It can contain truths about human experience even though events are invented.', {
    tags: ['genre', 'fiction', 'literary-forms', 'vocabulary'],
  }),
  createQuestion('literature', 'easy', 'What is a "cliffhanger" in storytelling?', ['A mountain climbing scene', 'An ending that leaves the audience in suspense, wanting to know what happens next', 'A fall from a cliff', 'A type of bookmark'], 1, 'The term originated from serialized stories where characters were literally left hanging from cliffs between installments.', {
    tags: ['literary-devices', 'cliffhanger', 'narrative-technique', 'suspense'],
  }),
  createQuestion('literature', 'easy', 'Who wrote "Charlotte\'s Web"?', ['Roald Dahl', 'E.B. White', 'Dr. Seuss', 'Beatrix Potter'], 1, 'Published in 1952, "Charlotte\'s Web" explores themes of friendship, mortality, and the power of words.', {
    tags: ['childrens-literature', 'classics', 'american-literature'],
  }),

  // Medium
  createQuestion('literature', 'medium', 'What is "satire" in literature?', ['A type of comedy', 'The use of humor, irony, or exaggeration to criticize people, institutions, or society', 'A sad story', 'A type of poem'], 1, 'Jonathan Swift\'s "A Modest Proposal" satirically suggested eating children to solve poverty, shocking readers into awareness.', {
    theme_connection: 'Satire questions whether society has truly progressed or just become better at ignoring its problems.',
    deep_explanation: 'Satire works by exposing the gap between how things are and how they should be. From Voltaire to modern shows like South Park, satire forces audiences to reconsider assumptions.',
    tags: ['literary-devices', 'satire', 'humor', 'social-commentary'],
  }),
  createQuestion('literature', 'medium', 'What is a "bildungsroman"?', ['A German city', 'A coming-of-age novel that follows a character\'s growth from youth to maturity', 'A type of poetry', 'A historical document'], 1, 'Classic examples include "Jane Eyre," "The Catcher in the Rye," and "To Kill a Mockingbird."', {
    tags: ['genre', 'bildungsroman', 'coming-of-age', 'literary-forms'],
  }),
  createQuestion('literature', 'medium', 'What is "oral literature"?', ['Reading aloud from books', 'Stories, poems, and histories passed down through spoken word rather than writing', 'Dentist stories', 'Audio books'], 1, 'Before writing systems existed, all literature was oral. Many cultures, including Australian Aboriginal and West African, have rich oral traditions.', {
    tags: ['oral-tradition', 'storytelling', 'culture', 'history'],
  }),
  createQuestion('literature', 'medium', 'What is "foreshadowing" in literature?', ['A shadow puppet show', 'Hints or clues about events that will happen later in the story', 'A type of setting', 'The story\'s conclusion'], 1, 'In "Flowers for Algernon," Algernon\'s decline foreshadows Charlie\'s eventual regression, creating dramatic tension.', {
    tags: ['literary-devices', 'foreshadowing', 'narrative-technique'],
  }),

  // Hard
  createQuestion('literature', 'hard', 'What is "magical negro" as a literary criticism term?', ['A type of magic', 'A trope where a Black character exists primarily to help white protagonists through mystical abilities', 'A genre of fantasy', 'An African folktale type'], 1, 'Spike Lee coined the term to critique how Hollywood and literature often reduce Black characters to supporting roles for white stories.', {
    theme_connection: 'This trope asks whose journey is centered in storytelling, and whether literature has "arrived" at truly equitable representation.',
    deep_explanation: 'Examples include the "Green Mile" and "The Legend of Bagger Vance." Modern writers actively challenge this trope by centering Black characters in their own complex narratives.',
    tags: ['literary-criticism', 'representation', 'tropes', 'race', 'storytelling'],
  }),
  createQuestion('literature', 'hard', 'What is the "Bechdel Test" applied to fiction?', ['A spelling test', 'A measure asking whether a work features at least two women who talk to each other about something besides men', 'A reading comprehension test', 'A vocabulary assessment'], 1, 'Created by Alison Bechdel in 1985, this simple test reveals how often female characters exist only in relation to male characters.', {
    tags: ['literary-criticism', 'gender', 'representation', 'feminism'],
  }),
  createQuestion('literature', 'hard', 'What is the literary concept of "the sublime"?', ['Something good', 'An experience of overwhelming awe, often mixing beauty and terror, that exceeds rational understanding', 'A type of dessert', 'A musical term'], 1, 'In Asimov\'s "Nightfall," the sight of 30,000 stars creates a sublime experience that shatters the characters\' sanity.', {
    tags: ['literary-theory', 'sublime', 'aesthetics', 'philosophy', 'romanticism'],
  }),
  createQuestion('literature', 'easy', 'What is an "antagonist" in a story?', ['The hero', 'A character or force that opposes the main character', 'The narrator', 'A side character'], 1, 'In "Ender\'s Game," the Formics serve as antagonists, though the true antagonists may be the adults who manipulate Ender.', {
    tags: ['literary-devices', 'antagonist', 'narrative', 'vocabulary'],
  }),
  createQuestion('literature', 'medium', 'What is a "frame narrative"?', ['A picture frame', 'A story within a story, where an outer narrative sets up or contextualizes an inner narrative', 'A type of essay', 'A newspaper column'], 1, '"The Canterbury Tales" uses a frame narrative: pilgrims traveling together each tell a story. "One Thousand and One Nights" uses Scheherazade as the frame.', {
    tags: ['literary-devices', 'frame-narrative', 'narrative-technique', 'storytelling'],
  }),
  createQuestion('literature', 'hard', 'What is "Afrofuturism" in literature and art?', ['African history books', 'A cultural aesthetic that combines elements of science fiction, African history, and technology to imagine Black futures', 'A science textbook', 'A music genre only'], 1, 'Octavia Butler\'s novels and the "Black Panther" films are prominent examples. Afrofuturism envisions futures where African cultures shape technology and society.', {
    theme_connection: 'Afrofuturism reimagines who gets to define the destination and whose journey into the future is centered in storytelling.',
    deep_explanation: 'Rooted in the work of Sun Ra and Samuel Delany, Afrofuturism challenges the predominantly white vision of the future in mainstream science fiction, creating space for diverse imaginations.',
    tags: ['genre', 'afrofuturism', 'science-fiction', 'culture', 'representation'],
  }),
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

  // ==========================================================================
  // FUTURE OF WORK & SPACE ECONOMY (WSC 2026 Theme)
  // ==========================================================================
  // Easy
  createQuestion('special_area', 'easy', 'What is "remote work"?', ['Working outdoors', 'Working from a location other than a traditional office, often from home', 'Working at night', 'Working in a factory'], 1, 'The COVID-19 pandemic dramatically accelerated remote work adoption, with many companies now offering hybrid arrangements.', {
    theme_connection: 'Remote work asks if the traditional office was ever the destination, or just one stop on the journey of how we work.',
    deep_explanation: 'Studies show remote workers can be equally or more productive, but isolation and blurred work-life boundaries are real challenges. The future of work is still being defined.',
    tags: ['future-of-work', 'remote-work', 'technology', 'society'],
  }),
  createQuestion('special_area', 'easy', 'What is "space tourism"?', ['Watching movies about space', 'Paying to travel to space as a private citizen for recreation', 'Visiting a planetarium', 'Playing space video games'], 1, 'Companies like Blue Origin and Virgin Galactic have sent paying customers on brief suborbital flights.', {
    tags: ['space-economy', 'tourism', 'technology', 'innovation'],
  }),
  createQuestion('special_area', 'easy', 'What is "automation"?', ['Driving a car', 'Using machines or computers to perform tasks previously done by humans', 'Riding a bicycle', 'Writing by hand'], 1, 'From factory robots to self-checkout kiosks, automation is changing how work gets done across many industries.', {
    tags: ['future-of-work', 'automation', 'technology'],
  }),
  createQuestion('special_area', 'easy', 'What is the "gig economy"?', ['Live music concerts', 'A labor market characterized by short-term, freelance, or contract work instead of permanent jobs', 'A dance competition', 'A type of economy in video games'], 1, 'Platforms like Uber, Fiverr, and DoorDash connect workers with short-term tasks, offering flexibility but often less job security.', {
    tags: ['future-of-work', 'gig-economy', 'labor', 'economics'],
  }),

  // Medium
  createQuestion('special_area', 'medium', 'What is "universal basic income" (UBI)?', ['A university degree', 'A regular cash payment given to all citizens regardless of employment status', 'A bank account', 'A tax return'], 1, 'Finland, Kenya, and several US cities have tested UBI programs. Supporters say it could address automation-driven job loss.', {
    theme_connection: 'UBI is proposed as a safety net for the journey into an automated future where traditional employment may not be the destination for everyone.',
    deep_explanation: 'Arguments for UBI include reducing poverty and enabling creativity; arguments against include cost and potential work disincentive. Evidence from pilots has been mixed but promising.',
    tags: ['future-of-work', 'UBI', 'economics', 'policy', 'automation'],
  }),
  createQuestion('special_area', 'medium', 'What is "space mining" or "asteroid mining"?', ['Mining on Earth', 'Extracting valuable resources like metals and water from asteroids or other celestial bodies', 'An arcade game', 'Deep-sea mining'], 1, 'A single metallic asteroid could contain more platinum than has ever been mined on Earth, potentially worth trillions of dollars.', {
    tags: ['space-economy', 'mining', 'resources', 'technology'],
  }),
  createQuestion('special_area', 'medium', 'What is "upskilling" in the context of the future of work?', ['Moving upstairs', 'Learning new skills to adapt to changing job requirements', 'Getting promoted', 'Working longer hours'], 1, 'As AI and automation transform industries, workers increasingly need to learn new technical and creative skills throughout their careers.', {
    tags: ['future-of-work', 'education', 'skills', 'careers'],
  }),
  createQuestion('special_area', 'medium', 'What are "satellite mega-constellations"?', ['Star patterns', 'Networks of thousands of satellites working together to provide global services', 'Satellite TV channels', 'Space debris'], 1, 'SpaceX\'s Starlink and Amazon\'s Project Kuiper aim to deploy tens of thousands of satellites for global internet coverage.', {
    theme_connection: 'Mega-constellations represent the journey to connect every person on Earth, asking whether global connectivity means we have truly "arrived."',
    deep_explanation: 'While these constellations could bridge the digital divide, astronomers worry about light pollution and space debris. Balancing connectivity with other concerns is an ongoing challenge.',
    tags: ['space-economy', 'satellites', 'connectivity', 'technology'],
  }),

  // Hard
  createQuestion('special_area', 'hard', 'What is the "Outer Space Treaty" of 1967?', ['A movie title', 'An international agreement that prohibits nations from claiming sovereignty over celestial bodies', 'A science fiction novel', 'A rocket design plan'], 1, 'The treaty states that space exploration should benefit all nations and that no country can place weapons of mass destruction in orbit.', {
    tags: ['space-economy', 'law', 'international-relations', 'governance'],
  }),
  createQuestion('special_area', 'hard', 'What is "technological unemployment"?', ['Computers breaking', 'Job losses caused by technology replacing human workers faster than new jobs are created', 'IT department layoffs', 'Internet outages'], 1, 'While technology has historically created more jobs than it destroyed, the speed of AI advancement raises new concerns about this pattern continuing.', {
    theme_connection: 'Technological unemployment asks whether the journey of progress always creates winners, or whether some are left behind.',
    deep_explanation: 'Economists debate whether this time is different: unlike past automation which replaced physical labor, AI may replace cognitive work. The transition period matters as much as the destination.',
    tags: ['future-of-work', 'AI', 'unemployment', 'economics', 'technology'],
  }),

  // ==========================================================================
  // OCEAN EXPLORATION & FOOD SECURITY
  // ==========================================================================
  // Easy
  createQuestion('special_area', 'easy', 'What is "food security"?', ['Locked refrigerators', 'Having reliable access to sufficient, nutritious, and affordable food', 'Food safety labels', 'Restaurant security guards'], 1, 'About 735 million people worldwide face chronic hunger, despite the world producing enough food to feed everyone.', {
    tags: ['food-security', 'hunger', 'global-issues', 'development'],
  }),
  createQuestion('special_area', 'easy', 'What is "aquaculture"?', ['An aquarium hobby', 'The farming of fish, shellfish, and aquatic plants', 'A water sport', 'Underwater photography'], 1, 'Aquaculture now produces more fish for human consumption than wild-caught fishing.', {
    tags: ['food-security', 'aquaculture', 'ocean', 'agriculture'],
  }),
  createQuestion('special_area', 'easy', 'What is the "deep sea" generally defined as?', ['Below 10 meters', 'Ocean zones deeper than 200 meters where sunlight cannot reach', 'The bottom of swimming pools', 'The deepest lake'], 1, 'The deep sea is the largest habitat on Earth, yet we have explored less of it than the surface of Mars.', {
    theme_connection: 'The deep sea is Earth\'s final frontier, reminding us how far we still have to go in understanding our own planet.',
    deep_explanation: 'Deep-sea exploration requires specialized submersibles that can withstand immense pressure. New species are discovered on nearly every deep-sea expedition.',
    tags: ['ocean-exploration', 'deep-sea', 'biodiversity', 'exploration'],
  }),

  // Medium
  createQuestion('special_area', 'medium', 'What is "vertical farming"?', ['Planting on hills', 'Growing crops in stacked indoor layers using controlled environments and artificial light', 'Hanging plant pots', 'Rooftop gardens only'], 1, 'Vertical farms use up to 95% less water than traditional agriculture and can produce food year-round in urban areas.', {
    theme_connection: 'Vertical farming asks if we can reimagine agriculture to "arrive" at food security without destroying more land.',
    deep_explanation: 'While promising, vertical farms currently have high energy costs and are mainly viable for leafy greens and herbs. Staple crops like wheat and rice remain impractical for vertical farming.',
    tags: ['food-security', 'agriculture', 'technology', 'urban-farming', 'sustainability'],
  }),
  createQuestion('special_area', 'medium', 'What is "food waste" and why is it a global problem?', ['Expired food labels', 'About one-third of all food produced globally is lost or wasted, contributing to hunger and emissions', 'A cooking technique', 'Leftover containers'], 1, 'If food waste were a country, it would be the third-largest emitter of greenhouse gases after the US and China.', {
    tags: ['food-security', 'waste', 'climate', 'sustainability'],
  }),
  createQuestion('special_area', 'medium', 'What is a "submersible" used for in ocean exploration?', ['Surface sailing', 'A small underwater vehicle designed to dive to extreme depths for research', 'Submarine warfare', 'Snorkeling'], 1, 'The DSV Alvin and the Deepsea Challenger have made groundbreaking discoveries at hydrothermal vents and deep trenches.', {
    tags: ['ocean-exploration', 'submersible', 'technology', 'deep-sea'],
  }),
  createQuestion('special_area', 'medium', 'What are "lab-grown" or "cultivated" meats?', ['Fake plastic food', 'Real meat produced by culturing animal cells without raising and slaughtering animals', 'Plant-based alternatives', 'Genetically modified animals'], 1, 'Singapore became the first country to approve cultured meat for sale in 2020. Production costs are falling rapidly.', {
    tags: ['food-security', 'lab-grown-meat', 'technology', 'sustainability'],
  }),

  // Hard
  createQuestion('special_area', 'hard', 'What is the "Blue Economy"?', ['Painting things blue', 'The sustainable use of ocean resources for economic growth, jobs, and ecosystem health', 'A banking system', 'A type of currency'], 1, 'The ocean economy is estimated at $1.5 trillion annually, including fishing, tourism, energy, and biotechnology.', {
    theme_connection: 'The Blue Economy asks whether we can reach prosperity from the ocean without repeating the mistakes we made on land.',
    deep_explanation: 'Sustainable ocean industries include renewable energy from waves and tides, marine biotechnology for medicine, and responsible aquaculture. The challenge is balancing economic use with conservation.',
    tags: ['ocean-exploration', 'blue-economy', 'sustainability', 'economics'],
  }),

  // ==========================================================================
  // MENTAL HEALTH AWARENESS & DIGITAL CITIZENSHIP
  // ==========================================================================
  // Easy
  createQuestion('special_area', 'easy', 'What is "mental health"?', ['Physical fitness only', 'Our emotional, psychological, and social well-being that affects how we think, feel, and act', 'Being smart', 'Never feeling sad'], 1, 'Mental health is just as important as physical health. About 1 in 5 young people experience a mental health condition each year.', {
    tags: ['mental-health', 'well-being', 'health', 'youth'],
  }),
  createQuestion('special_area', 'easy', 'What is "digital citizenship"?', ['Having a computer', 'Using technology and the internet responsibly, ethically, and safely', 'Living in a smart city', 'Having a social media account'], 1, 'Good digital citizens think critically about what they share online, respect others, and protect their privacy.', {
    tags: ['digital-citizenship', 'technology', 'ethics', 'safety'],
  }),
  createQuestion('special_area', 'easy', 'What is "cyberbullying"?', ['A computer game', 'Using digital devices to harass, threaten, or embarrass someone', 'Building robots', 'Online shopping'], 1, 'About 37% of young people between ages 12-17 have experienced cyberbullying. It can have serious effects on mental health.', {
    tags: ['digital-citizenship', 'cyberbullying', 'mental-health', 'safety'],
  }),

  // Medium
  createQuestion('special_area', 'medium', 'What is "screen time" and why do experts discuss it?', ['Watching movies', 'Time spent using screens; excessive use is linked to sleep problems, anxiety, and reduced physical activity', 'Cleaning screens', 'Screen protectors'], 1, 'The American Academy of Pediatrics recommends balanced screen use with breaks for physical activity and face-to-face interaction.', {
    theme_connection: 'The screen time debate asks whether our digital journey has taken us to a good place, or whether we\'ve gone too far.',
    deep_explanation: 'Research is nuanced: not all screen time is equal. Creative or educational use differs from passive scrolling. Context, content, and duration all matter for health outcomes.',
    tags: ['mental-health', 'digital-citizenship', 'screen-time', 'health', 'technology'],
  }),
  createQuestion('special_area', 'medium', 'What is "digital footprint"?', ['Computer mouse marks', 'The trail of data you leave behind when using the internet', 'A shoe brand', 'A step counter app'], 1, 'Everything you post, like, search for, or share online contributes to your digital footprint, which can be permanent.', {
    tags: ['digital-citizenship', 'privacy', 'data', 'internet-safety'],
  }),
  createQuestion('special_area', 'medium', 'What is the "stigma" around mental health?', ['A medical tool', 'Negative attitudes and discrimination toward people with mental health conditions', 'A type of therapy', 'A hospital department'], 1, 'Stigma prevents many people from seeking help. Education and open conversation are key to reducing it.', {
    tags: ['mental-health', 'stigma', 'society', 'awareness'],
  }),
  createQuestion('special_area', 'medium', 'What is "media literacy"?', ['Reading newspapers', 'The ability to critically analyze and evaluate information from all types of media', 'Writing articles', 'Taking photos'], 1, 'Media literacy helps people identify misinformation, understand bias, and make informed decisions about what they consume and share.', {
    tags: ['digital-citizenship', 'media-literacy', 'critical-thinking', 'education'],
  }),

  // Hard
  createQuestion('special_area', 'hard', 'What is "doom scrolling" and what are its effects?', ['Reading comics', 'Compulsively consuming negative news on social media, which increases anxiety and helplessness', 'A video game', 'Fast reading technique'], 1, 'Research shows that excessive consumption of negative news activates stress responses and can lead to feelings of despair.', {
    theme_connection: 'Doom scrolling illustrates how our digital journey can trap us in cycles rather than moving us forward.',
    deep_explanation: 'Algorithms promote engaging content, and negative news triggers strong emotional reactions that keep us scrolling. Breaking the cycle requires conscious awareness and setting boundaries.',
    tags: ['mental-health', 'digital-citizenship', 'social-media', 'well-being'],
  }),
  createQuestion('special_area', 'hard', 'What is the "right to be forgotten" in digital law?', ['Amnesia treatment', 'The legal right to have personal information removed from internet searches and databases', 'Forgetting passwords', 'Deleting apps'], 1, 'The EU established this right in 2014. It balances privacy with the public\'s right to information and raises complex ethical questions.', {
    tags: ['digital-citizenship', 'privacy', 'law', 'ethics', 'EU'],
  }),

  // ==========================================================================
  // SUSTAINABLE CITIES & GLOBAL PROGRESS
  // ==========================================================================
  // Easy
  createQuestion('special_area', 'easy', 'What is a "smart city"?', ['A city with smart people', 'A city that uses technology and data to improve services, infrastructure, and quality of life', 'A city with good schools only', 'A small town'], 1, 'Smart cities use sensors, IoT devices, and data analytics to manage traffic, energy, waste, and public safety more efficiently.', {
    tags: ['sustainable-cities', 'technology', 'urbanization', 'innovation'],
  }),
  createQuestion('special_area', 'easy', 'What is "public transportation" and why is it important?', ['Private cars', 'Shared transit systems like buses, trains, and subways that reduce traffic and emissions', 'Walking only', 'Bicycle lanes only'], 1, 'Cities with good public transit tend to have lower carbon emissions and less traffic congestion per capita.', {
    tags: ['sustainable-cities', 'transportation', 'climate', 'urbanization'],
  }),

  // Medium
  createQuestion('special_area', 'medium', 'What is "15-minute city" concept?', ['A very small city', 'An urban planning idea where everything residents need is within a 15-minute walk or bike ride', 'A speed limit zone', 'A delivery service area'], 1, 'Paris, Melbourne, and other cities are adopting this concept to reduce car dependence and improve quality of life.', {
    theme_connection: 'The 15-minute city redefines "being there" as having everything you need within reach, rather than traveling far to reach distant destinations.',
    deep_explanation: 'Proposed by Carlos Moreno, this concept challenges car-centric urban design. Critics argue it could limit freedom of movement, while supporters say it prioritizes walkability and community.',
    tags: ['sustainable-cities', 'urban-planning', 'design', 'community'],
  }),
  createQuestion('special_area', 'medium', 'What is "circular economy"?', ['A round marketplace', 'An economic system that eliminates waste by reusing, repairing, and recycling materials', 'A currency system', 'A farming technique'], 1, 'Unlike the traditional "take-make-dispose" model, a circular economy designs products for reuse and recycling from the start.', {
    tags: ['sustainability', 'circular-economy', 'waste', 'economics'],
  }),

  // Hard
  createQuestion('special_area', 'hard', 'What is "solastalgia"?', ['A medicine', 'The distress caused by environmental change in one\'s home environment', 'A type of solar panel', 'A constellation'], 1, 'Coined by philosopher Glenn Albrecht, solastalgia describes the homesickness you feel while still at home because the environment has changed.', {
    theme_connection: 'Solastalgia captures the feeling of never "arriving" because the destination itself keeps changing due to environmental degradation.',
    deep_explanation: 'As climate change transforms landscapes, many Indigenous communities and long-term residents experience grief for the environment they knew. It\'s increasingly recognized in environmental psychology.',
    tags: ['mental-health', 'climate', 'environment', 'psychology', 'philosophy'],
  }),
  createQuestion('special_area', 'hard', 'What is "rewilding" as a conservation strategy?', ['Building more cities', 'Restoring ecosystems by reintroducing native species and allowing natural processes to resume', 'Domesticating wild animals', 'Planting only one tree species'], 1, 'The reintroduction of wolves to Yellowstone in 1995 triggered a "trophic cascade" that restored rivers and biodiversity.', {
    tags: ['sustainability', 'conservation', 'biodiversity', 'ecosystem'],
  }),
  createQuestion('special_area', 'hard', 'What is "climate justice"?', ['Weather forecasting', 'The principle that those least responsible for climate change often suffer its worst effects', 'A court for weather crimes', 'Temperature regulation'], 1, 'Small island nations and developing countries contribute least to emissions but face the most severe consequences like sea-level rise.', {
    theme_connection: 'Climate justice asks whether we can "get there" on climate goals without addressing the unequal burden of climate impacts.',
    deep_explanation: 'The concept connects environmental policy with human rights, arguing that climate solutions must address historical inequities between the Global North and Global South.',
    tags: ['climate', 'justice', 'inequality', 'global-issues', 'ethics'],
  }),

  // ==========================================================================
  // ADDITIONAL SPECIAL AREA: ETHICS, INNOVATION & GLOBAL SYSTEMS
  // ==========================================================================
  // Easy
  createQuestion('special_area', 'easy', 'What is "biodiversity"?', ['One type of animal', 'The variety of all living things on Earth, from genes to ecosystems', 'A type of fuel', 'A science experiment'], 1, 'Earth is home to an estimated 8.7 million species, but scientists have only identified about 1.2 million of them.', {
    tags: ['biodiversity', 'ecology', 'environment', 'conservation'],
  }),
  createQuestion('special_area', 'easy', 'What is the "International Space Station" used for?', ['A hotel', 'A laboratory for scientific research in microgravity orbiting Earth', 'A military base', 'A satellite dish'], 1, 'The ISS has been continuously occupied since 2000 and has hosted over 270 astronauts from 21 countries.', {
    tags: ['space', 'ISS', 'science', 'international-cooperation'],
  }),
  createQuestion('special_area', 'easy', 'What does "sustainable" mean?', ['Fast and cheap', 'Able to continue or be maintained without depleting resources or harming the environment', 'Very large', 'Technologically advanced'], 1, 'Sustainability considers whether our current actions can continue without compromising future generations\' needs.', {
    theme_connection: 'Sustainability is fundamentally about the journey: can we keep going, or will we run out of road before we get "there"?',
    deep_explanation: 'The concept was defined in the 1987 Brundtland Report as "meeting the needs of the present without compromising the ability of future generations to meet their own needs."',
    tags: ['sustainability', 'environment', 'future', 'development'],
  }),
  createQuestion('special_area', 'easy', 'What is "volunteering"?', ['Paid work', 'Giving your time and skills to help others or a cause without expecting payment', 'Mandatory community service', 'A school subject'], 1, 'Approximately 1 billion people volunteer globally each year, contributing trillions of dollars in economic value.', {
    tags: ['community', 'volunteering', 'society', 'civic-engagement'],
  }),

  // Medium
  createQuestion('special_area', 'medium', 'What is "planned obsolescence"?', ['Good engineering', 'Designing products to become outdated or break after a set period to encourage new purchases', 'Product quality testing', 'Building permits'], 1, 'Lightbulbs in the 1920s lasted decades; manufacturers agreed to limit lifespan to increase sales. Smartphones face similar criticism today.', {
    theme_connection: 'Planned obsolescence ensures we never truly "arrive" at a finished product, always pushed toward the next purchase.',
    deep_explanation: 'The EU has introduced "right to repair" laws requiring manufacturers to make products repairable. France requires a repairability score on electronics sold in the country.',
    tags: ['economics', 'technology', 'sustainability', 'consumer-rights', 'waste'],
  }),
  createQuestion('special_area', 'medium', 'What is "emotional intelligence" (EQ)?', ['IQ score', 'The ability to recognize, understand, and manage your own and others\' emotions', 'A type of therapy', 'A school grade'], 1, 'Research suggests EQ is often more important than IQ for success in leadership, relationships, and well-being.', {
    tags: ['psychology', 'emotional-intelligence', 'social-skills', 'well-being'],
  }),
  createQuestion('special_area', 'medium', 'What is "data privacy" and why does it matter?', ['Keeping computers clean', 'The right to control how your personal information is collected, used, and shared', 'Deleting files', 'Computer speed'], 1, 'The EU\'s General Data Protection Regulation (GDPR) gives citizens significant control over their personal data.', {
    tags: ['digital-citizenship', 'privacy', 'data', 'rights', 'technology'],
  }),

  // Hard
  createQuestion('special_area', 'hard', 'What is "surveillance capitalism"?', ['Security cameras', 'An economic system based on monetizing personal data collected from people\'s online behavior', 'A type of investment', 'Government monitoring only'], 1, 'Coined by Shoshana Zuboff, the term describes how tech companies profit by predicting and influencing human behavior through data.', {
    theme_connection: 'Surveillance capitalism questions whether the digital journey has taken us to a destination we did not choose or consent to.',
    deep_explanation: 'Companies collect data through apps, searches, and devices to build behavioral profiles used for targeted advertising. Critics argue this undermines autonomy and democracy.',
    tags: ['technology', 'privacy', 'economics', 'ethics', 'data'],
  }),
  createQuestion('special_area', 'hard', 'What is the "Doomsday Clock" and what does it measure?', ['A timepiece', 'A symbolic clock maintained by scientists showing how close humanity is to catastrophic destruction', 'An alarm clock', 'A countdown timer'], 1, 'Set at 90 seconds to midnight since 2023, the closest it has ever been. It considers nuclear risk, climate change, and disruptive technologies.', {
    tags: ['global-issues', 'nuclear', 'existential-risk', 'science', 'peace'],
  }),
  createQuestion('special_area', 'hard', 'What is "degrowth" as an economic concept?', ['Economic decline', 'A deliberate reduction of economic output to achieve ecological sustainability and social equity', 'Bankruptcy', 'Recession'], 1, 'Degrowth advocates argue that infinite economic growth on a finite planet is impossible and that well-being should be measured differently.', {
    theme_connection: 'Degrowth challenges the assumption that "getting there" means always growing bigger. Maybe the destination is having enough, not more.',
    deep_explanation: 'While mainstream economics treats growth as essential, degrowth scholars point to evidence that beyond a certain level, GDP increases don\'t improve life satisfaction or ecological health.',
    tags: ['economics', 'degrowth', 'sustainability', 'environment', 'philosophy'],
  }),
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
