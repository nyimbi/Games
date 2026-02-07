/**
 * Reading passages for ScholarRead comprehension game.
 * Passages drawn from WSC themes with comprehension questions.
 */

import type { ReadingPassage } from './types';

export const passages: ReadingPassage[] = [
  {
    id: 'passage-1',
    title: 'The Loneliness Epidemic',
    subject: 'social_studies',
    theme_connection: 'Are We There Yet? - Have we arrived at true connection?',
    content: `In 2018, the United Kingdom made a surprising political appointment: a Minister of Loneliness. The role was created in response to research showing that over nine million people in the country often or always felt lonely. This was not merely a social inconvenience but a genuine public health crisis.

Studies have found that chronic loneliness carries health risks comparable to smoking fifteen cigarettes a day. It increases the likelihood of heart disease, stroke, and early death. The brain of a lonely person, researchers discovered, operates in a state of heightened alertness, constantly scanning for social threats. This perpetual stress response wears down the body over time.

Paradoxically, loneliness has grown alongside unprecedented connectivity. Social media platforms connect billions of people, yet rates of reported isolation have climbed steadily. Some psychologists suggest that online interactions, while convenient, lack the depth and physical presence that humans evolved to need. A "like" on a post does not replace a shared meal or a long conversation.

Japan has confronted an extreme form of this phenomenon called "hikikomori," where individuals withdraw from society entirely, sometimes remaining isolated in their rooms for months or years. An estimated 1.5 million Japanese people live this way, raising difficult questions about how modern societies can fail their most vulnerable members.

The solutions being explored are varied and sometimes unexpected. In the UK, doctors now practice "social prescribing," recommending community activities like gardening groups or art classes alongside traditional medicine. In Denmark, communal housing projects bring different generations together by design. These approaches share a common insight: that connection must be deliberately cultivated, not merely made technologically possible.`,
    questions: [
      {
        id: 'p1-q1',
        question: 'Why did the UK create a Minister of Loneliness?',
        options: [
          'To regulate social media usage',
          'To respond to research showing loneliness was a public health crisis',
          'To reduce government spending on healthcare',
          'To promote British culture abroad',
        ],
        correctIndex: 1,
        explanation: 'The role was created because research showed over nine million people were chronically lonely, representing a genuine public health crisis.',
        paragraph_ref: 0,
      },
      {
        id: 'p1-q2',
        question: 'What health comparison is made about chronic loneliness?',
        options: [
          'It is as dangerous as obesity',
          'It is comparable to smoking fifteen cigarettes a day',
          'It doubles the risk of diabetes',
          'It is equivalent to never exercising',
        ],
        correctIndex: 1,
        explanation: 'Studies found that chronic loneliness carries health risks comparable to smoking fifteen cigarettes daily.',
        paragraph_ref: 1,
      },
      {
        id: 'p1-q3',
        question: 'Why might social media fail to solve loneliness according to the passage?',
        options: [
          'People do not use social media enough',
          'Social media is too expensive for most people',
          'Online interactions lack the depth and physical presence humans need',
          'Social media companies deliberately cause isolation',
        ],
        correctIndex: 2,
        explanation: 'Psychologists suggest online interactions lack the depth and physical presence that humans evolved to need.',
        paragraph_ref: 2,
      },
      {
        id: 'p1-q4',
        question: 'What is "hikikomori"?',
        options: [
          'A Japanese social media platform',
          'A form of extreme social withdrawal lasting months or years',
          'A traditional Japanese community gathering',
          'A Japanese government policy on loneliness',
        ],
        correctIndex: 1,
        explanation: 'Hikikomori is when individuals withdraw from society entirely, sometimes remaining isolated for months or years.',
        paragraph_ref: 3,
      },
      {
        id: 'p1-q5',
        question: 'What is "social prescribing"?',
        options: [
          'Requiring people to join social media',
          'Doctors recommending community activities alongside traditional medicine',
          'A type of pharmaceutical treatment',
          'Government-mandated social events',
        ],
        correctIndex: 1,
        explanation: 'Social prescribing is when doctors recommend community activities like gardening groups or art classes alongside traditional medicine.',
        paragraph_ref: 4,
      },
    ],
  },
  {
    id: 'passage-2',
    title: 'The Megaproject Paradox',
    subject: 'special_area',
    theme_connection: 'Are We There Yet? - Why do ambitious projects rarely arrive on time?',
    content: `When Boston embarked on the Central Artery/Tunnel Project in 1991, known locally as "The Big Dig," the estimated cost was $2.8 billion. By the time workers placed the final piece of roadway in 2007, the true cost had ballooned to $14.6 billion. The project, which moved an elevated highway underground, took sixteen years instead of the planned seven.

The Big Dig was not unusual. Research by Bent Flyvbjerg at Oxford University found that nine out of ten megaprojects exceed their budgets, with cost overruns averaging 28 percent for roads, 45 percent for rail, and a staggering 207 percent for dams. The phenomenon is so consistent that Flyvbjerg calls it "the iron law of megaprojects: over budget, over time, over and over again."

The psychological explanation lies in what researchers call "optimism bias" and "strategic misrepresentation." Planners genuinely believe their project will be different, and politicians have incentives to present low estimates to win approval. Once construction begins, the sunk cost fallacy takes hold: having spent billions, abandoning the project feels impossible, even as costs spiral.

Yet megaprojects continue to be proposed on ever-larger scales. Saudi Arabia's NEOM project, which includes "The Line"--a linear city stretching 170 kilometers through the desert--carries a price tag estimated at $500 billion. Proponents argue these ambitious undertakings drive innovation, create jobs, and solve problems that smaller projects cannot address.

The tension between ambition and reality is the core dilemma. The Channel Tunnel connecting England and France, the Gotthard Base Tunnel through the Swiss Alps, and the International Space Station all exceeded their budgets dramatically. Yet each delivered transformative capabilities that smaller, more "realistic" projects could never have achieved. Perhaps the question is not whether megaprojects will go over budget, but whether their eventual benefits justify the true cost.`,
    questions: [
      {
        id: 'p2-q1',
        question: 'How much did The Big Dig end up costing compared to its estimate?',
        options: [
          'Double the original estimate',
          'About five times the original estimate',
          'Slightly over budget',
          'Exactly as planned',
        ],
        correctIndex: 1,
        explanation: 'The original estimate was $2.8 billion, and the final cost was $14.6 billion -- about five times more.',
        paragraph_ref: 0,
      },
      {
        id: 'p2-q2',
        question: 'What does Flyvbjerg call the pattern of megaproject overruns?',
        options: [
          'The construction curse',
          'Murphy\'s Law of building',
          'The iron law of megaprojects',
          'The budget paradox',
        ],
        correctIndex: 2,
        explanation: 'Flyvbjerg calls it "the iron law of megaprojects: over budget, over time, over and over again."',
        paragraph_ref: 1,
      },
      {
        id: 'p2-q3',
        question: 'What two psychological factors explain megaproject overruns?',
        options: [
          'Laziness and incompetence',
          'Optimism bias and strategic misrepresentation',
          'Fear and anxiety',
          'Greed and corruption',
        ],
        correctIndex: 1,
        explanation: 'Researchers identify "optimism bias" (planners believe their project will be different) and "strategic misrepresentation" (politicians present low estimates).',
        paragraph_ref: 2,
      },
      {
        id: 'p2-q4',
        question: 'What is "The Line" in Saudi Arabia?',
        options: [
          'A traditional market',
          'A 170-kilometer linear city through the desert',
          'A high-speed rail route',
          'An oil pipeline',
        ],
        correctIndex: 1,
        explanation: 'The Line is part of the NEOM project -- a linear city stretching 170 kilometers through the desert.',
        paragraph_ref: 3,
      },
      {
        id: 'p2-q5',
        question: 'What does the author suggest about whether megaprojects are worthwhile?',
        options: [
          'They should always be avoided',
          'They always succeed eventually',
          'The question is whether eventual benefits justify the true cost',
          'Only small projects make sense',
        ],
        correctIndex: 2,
        explanation: 'The passage concludes that the real question is whether megaprojects\' eventual benefits justify their true cost, not whether they will go over budget.',
        paragraph_ref: 4,
      },
    ],
  },
  {
    id: 'passage-3',
    title: 'Ender\'s Burden',
    subject: 'literature',
    theme_connection: 'Are We There Yet? - The cost of reaching the destination',
    content: `In Orson Scott Card's "Ender's Game," six-year-old Andrew "Ender" Wiggin is taken from his family and sent to Battle School, a military academy orbiting Earth. The adults who manage his training have a single goal: to transform a child into a weapon capable of defeating the Formics, an alien species that nearly destroyed humanity in two previous invasions.

What makes Ender exceptional is not merely his intelligence, but his capacity for empathy. He understands his enemies so completely that he could almost love them. Colonel Graff, the officer who oversees Ender's development, recognizes this quality as precisely what makes Ender dangerous. To defeat an enemy, one must first understand them, and Ender understands better than anyone.

The adults systematically isolate Ender, ensuring he can never rely on others for support. They manipulate his environment, his relationships, and his emotions. When he forms bonds with other students, the system breaks those bonds. When he succeeds, the challenges increase. The adults justify this cruelty with the stakes: humanity's survival depends on this one child becoming something no child should have to become.

The story's devastating twist reveals that what Ender believed was his final training simulation was actually a real battle. The fleet he commanded destroyed the Formic homeworld entirely. Ender had committed xenocide -- the extinction of an entire species -- without knowing it. The adults had determined that only by deceiving him could they ensure he would fight without hesitation or mercy.

In the aftermath, Ender discovers that the Formics had actually understood their mistake. They had not realized humans were sentient individuals rather than a hive mind. They left behind a single queen cocoon, a gesture of peace across the gulf of extinction. Ender takes responsibility for their story, writing "The Hive Queen" under a pseudonym, transforming from the species' destroyer into its only advocate. The destination was reached, but the journey had destroyed the traveler.`,
    questions: [
      {
        id: 'p3-q1',
        question: 'Why is Ender taken to Battle School?',
        options: [
          'Because he is a troublemaker at school',
          'To be trained as a weapon against the Formics',
          'Because his parents cannot afford to keep him',
          'To learn about alien cultures',
        ],
        correctIndex: 1,
        explanation: 'The adults want to transform Ender into a weapon capable of defeating the Formics, who nearly destroyed humanity twice.',
        paragraph_ref: 0,
      },
      {
        id: 'p3-q2',
        question: 'What quality makes Ender both valuable and dangerous?',
        options: [
          'His physical strength',
          'His capacity for empathy and understanding of enemies',
          'His ability to follow orders',
          'His technological expertise',
        ],
        correctIndex: 1,
        explanation: 'Ender\'s empathy allows him to understand enemies so completely he could almost love them, which is what makes him dangerous in battle.',
        paragraph_ref: 1,
      },
      {
        id: 'p3-q3',
        question: 'How do the adults control Ender\'s development?',
        options: [
          'By rewarding him constantly',
          'By giving him freedom to explore',
          'By systematically isolating him and breaking his bonds with others',
          'By letting him make his own decisions',
        ],
        correctIndex: 2,
        explanation: 'The adults isolate Ender, manipulate his relationships, and break bonds he forms with other students.',
        paragraph_ref: 2,
      },
      {
        id: 'p3-q4',
        question: 'What is the "devastating twist" in the story?',
        options: [
          'Ender fails his final test',
          'The Formics were actually friendly all along',
          'His final simulation was a real battle that destroyed the Formic homeworld',
          'Ender discovers he is part Formic',
        ],
        correctIndex: 2,
        explanation: 'What Ender believed was a training simulation was actually a real battle; he unknowingly committed xenocide.',
        paragraph_ref: 3,
      },
    ],
  },
  {
    id: 'passage-4',
    title: 'The Race to Mars',
    subject: 'science',
    theme_connection: 'Are We There Yet? - Humanity\'s greatest journey ahead',
    content: `The distance between Earth and Mars varies between 55 million and 401 million kilometers, depending on where the two planets are in their orbits. At their closest, a spacecraft using current technology would take seven to nine months to make the journey. This is not a weekend trip; it is a commitment that fundamentally changes the meaning of the word "travel."

The physical challenges are formidable. Beyond Earth's protective magnetic field, astronauts would be exposed to cosmic radiation and solar particle events that significantly increase cancer risk. The human body deteriorates in microgravity: bones lose density, muscles atrophy, and vision can be permanently damaged. NASA's studies of astronaut Scott Kelly, who spent a year on the International Space Station, revealed changes at the genetic level.

Then there is the psychological dimension. Mars crews would experience communication delays of up to twenty-four minutes each way with Earth, making real-time conversation impossible. They would live in confined spaces with the same small group for over two years. Historical analogues -- Antarctic research stations, submarine deployments, space station missions -- suggest that isolation and interpersonal conflict pose threats as serious as any technical failure.

The proposed solutions read like science fiction becoming reality. NASA's Artemis program aims to establish a sustained human presence on the Moon as a stepping stone. SpaceX is developing the Starship vehicle designed specifically for Mars transit. Concepts for in-situ resource utilization would allow astronauts to produce oxygen and fuel from Martian soil and atmosphere, dramatically reducing the supplies needed from Earth.

Whether humans will walk on Mars in the 2030s, 2040s, or later remains uncertain. The technical obstacles are enormous but potentially solvable. The deeper question may be whether the will and funding persist long enough to see it through. The Apollo program demonstrated that reaching a destination is as much about political commitment as engineering capability.`,
    questions: [
      {
        id: 'p4-q1',
        question: 'How long would a spacecraft take to reach Mars at closest approach?',
        options: [
          'Two to three weeks',
          'Seven to nine months',
          'About two years',
          'Five years',
        ],
        correctIndex: 1,
        explanation: 'At their closest, a spacecraft using current technology would take seven to nine months.',
        paragraph_ref: 0,
      },
      {
        id: 'p4-q2',
        question: 'What health risks do astronauts face traveling to Mars?',
        options: [
          'Only dehydration and hunger',
          'Cosmic radiation, bone loss, muscle atrophy, and vision damage',
          'Extreme temperatures only',
          'Allergic reactions to space dust',
        ],
        correctIndex: 1,
        explanation: 'Astronauts face cosmic radiation, bone density loss, muscle atrophy, and permanent vision damage from microgravity.',
        paragraph_ref: 1,
      },
      {
        id: 'p4-q3',
        question: 'What makes communication with a Mars crew so difficult?',
        options: [
          'There are no radios in space',
          'Signals take up to twenty-four minutes each way',
          'Mars has no atmosphere for signal transmission',
          'Solar storms block all signals',
        ],
        correctIndex: 1,
        explanation: 'Communication delays of up to twenty-four minutes each way make real-time conversation impossible.',
        paragraph_ref: 2,
      },
      {
        id: 'p4-q4',
        question: 'What is "in-situ resource utilization"?',
        options: [
          'Growing food on the spacecraft',
          'Using local materials on Mars to produce oxygen and fuel',
          'Recycling waste in space',
          'Mining asteroids for metals',
        ],
        correctIndex: 1,
        explanation: 'In-situ resource utilization means producing oxygen and fuel from Martian soil and atmosphere.',
        paragraph_ref: 3,
      },
      {
        id: 'p4-q5',
        question: 'What deeper factor does the passage suggest is critical for reaching Mars?',
        options: [
          'Finding alien allies',
          'Developing faster rockets',
          'Sustained political will and funding',
          'Training larger astronaut crews',
        ],
        correctIndex: 2,
        explanation: 'The passage argues that reaching Mars is as much about political commitment as engineering capability.',
        paragraph_ref: 4,
      },
    ],
  },
  {
    id: 'passage-5',
    title: 'What the Fox Taught',
    subject: 'literature',
    theme_connection: 'Are We There Yet? - The invisible destinations of the heart',
    content: `Antoine de Saint-Exupery's "The Little Prince" appears at first to be a children's book about a small boy who lives on an asteroid. It is, in fact, one of the most profound meditations on human connection, loss, and meaning ever written. Published in 1943, it has been translated into over 300 languages and remains one of the best-selling books in history.

The Little Prince has left his tiny planet, where he tends three volcanoes and a vain rose he loves. He travels through space visiting various asteroids, each inhabited by a single adult engaged in pointless activity: a king who rules nothing, a vain man who craves applause from no audience, a drunkard who drinks to forget his shame at drinking. These encounters are Saint-Exupery's satire of how adults become consumed by "matters of consequence" while missing what truly matters.

The pivotal scene occurs when the Prince meets a fox on Earth who asks to be "tamed." The fox explains that taming means "to establish ties." Before taming, the fox is just one among thousands of foxes, and the Prince is just one among thousands of boys. After taming, they become unique to each other. The fox's parting gift is a secret: "One sees clearly only with the heart. What is essential is invisible to the eye."

This lesson transforms how the Prince understands his rose. Earlier, encountering a garden of five thousand roses had devastated him -- his rose had claimed to be unique in all the universe. But the fox's teaching reveals that his rose IS unique, not because of what she is, but because of the time and care he has invested in her. "You become responsible, forever, for what you have tamed."

The story ends with the Prince allowing a snake to bite him so his body, too heavy for the journey, will be left behind and his spirit can return to his asteroid. The narrator, a pilot stranded in the desert, is left with grief but also with transformed perception. Every star in the sky now holds meaning because the Prince is on one of them. The invisible ties of love have made the entire universe personal.`,
    questions: [
      {
        id: 'p5-q1',
        question: 'What does each adult on the asteroids represent?',
        options: [
          'Different professions that are important',
          'How adults become consumed by pointless activities while missing what matters',
          'The diversity of human culture',
          'Different types of government',
        ],
        correctIndex: 1,
        explanation: 'The adults represent how people become consumed by "matters of consequence" while missing what truly matters.',
        paragraph_ref: 1,
      },
      {
        id: 'p5-q2',
        question: 'What does "taming" mean according to the fox?',
        options: [
          'Training an animal to obey',
          'Capturing and keeping something',
          'Establishing ties that make two beings unique to each other',
          'Teaching someone a skill',
        ],
        correctIndex: 2,
        explanation: 'Taming means "to establish ties" -- making two beings unique and important to each other.',
        paragraph_ref: 2,
      },
      {
        id: 'p5-q3',
        question: 'What secret does the fox share with the Prince?',
        options: [
          'How to find water in the desert',
          'One sees clearly only with the heart; what is essential is invisible',
          'The location of hidden treasure',
          'How to travel between planets',
        ],
        correctIndex: 1,
        explanation: 'The fox\'s secret is: "One sees clearly only with the heart. What is essential is invisible to the eye."',
        paragraph_ref: 2,
      },
      {
        id: 'p5-q4',
        question: 'Why is the Prince\'s rose unique despite the garden of five thousand roses?',
        options: [
          'It is a different species',
          'It is the most beautiful rose',
          'It is unique because of the time and care he invested in it',
          'It can talk unlike other roses',
        ],
        correctIndex: 2,
        explanation: 'The rose is unique not because of what she is, but because of the time and care the Prince invested in her.',
        paragraph_ref: 3,
      },
    ],
  },
  {
    id: 'passage-6',
    title: 'The Invisible Highway',
    subject: 'science',
    theme_connection: 'Are We There Yet? -- The infrastructure of global connectivity and who gets left behind',
    content: `Beneath the world's oceans lies an invisible highway that carries nearly everything you see online. Approximately 95% of all international data -- every email, video call, streaming movie, and social media post that crosses a border -- travels through undersea fiber optic cables thinner than a garden hose.

These cables stretch over 1.3 million kilometers across ocean floors, connecting continents in a web of glass fibers that transmit data as pulses of light. The first transatlantic telegraph cable was laid in 1858, taking three weeks to send a single message. Today, a single modern cable can transmit 250 terabits per second -- enough to carry the entire contents of the Library of Congress in a fraction of a second.

Laying these cables is an extraordinary engineering feat. Specialized ships carry thousands of kilometers of cable wound on massive drums. The cable must survive crushing pressures at depths of up to 8,000 meters, encounters with sharks (who are attracted to the electromagnetic fields), and anchors dragged by unknowing fishing boats. Each cable costs between $200 million and $500 million to manufacture and install.

The geography of these cables reflects global power dynamics. Most routes connect North America, Europe, and Asia, leaving parts of Africa, South America, and the Pacific Islands with fewer connections and slower speeds. This "digital divide" means that a student in Lagos may wait ten times longer to load a webpage than a student in London, simply because of where the cables run.

Nations have recognized these cables as critical infrastructure. A single cut cable can disrupt internet access for entire countries. In 2008, when cables in the Mediterranean were severed, internet speeds in India, Egypt, and the Middle East dropped by 70%. Countries like Australia, connected by relatively few cables crossing vast ocean distances, are particularly vulnerable.

The race to lay new cables has intensified. Tech giants like Google, Meta, and Microsoft now invest billions in their own private undersea cables to ensure reliable connections for their services. Meanwhile, emerging technologies like satellite internet from SpaceX's Starlink offer alternatives, though these currently carry less than 5% of global traffic.

The invisible highway beneath the waves remains the backbone of our connected world -- a reminder that even in the digital age, physical infrastructure determines who arrives at the information superhighway and who gets left behind.`,
    questions: [
      {
        id: 'p6-q1',
        question: 'What percentage of international data travels through undersea cables?',
        options: ['50%', '75%', '95%', '99%'],
        correctIndex: 2,
        explanation: 'The passage states that "approximately 95% of all international data" travels through undersea fiber optic cables.',
        paragraph_ref: 0,
      },
      {
        id: 'p6-q2',
        question: 'Why are sharks mentioned in relation to undersea cables?',
        options: [
          'They damage cables by biting them',
          'They are attracted to the electromagnetic fields',
          'They follow the cable-laying ships',
          'They nest near cable junction points',
        ],
        correctIndex: 1,
        explanation: 'The passage notes that sharks "are attracted to the electromagnetic fields" produced by the cables.',
        paragraph_ref: 2,
      },
      {
        id: 'p6-q3',
        question: 'What happened when Mediterranean cables were severed in 2008?',
        options: [
          'All internet worldwide stopped working',
          'Internet speeds in India, Egypt, and the Middle East dropped by 70%',
          'Satellite internet replaced the cables within hours',
          'Only email services were affected',
        ],
        correctIndex: 1,
        explanation: 'The 2008 cable cuts caused internet speeds in India, Egypt, and the Middle East to drop by 70%.',
        paragraph_ref: 4,
      },
      {
        id: 'p6-q4',
        question: 'What does the passage suggest about the "digital divide"?',
        options: [
          'It is caused by differences in computer quality',
          'It reflects physical cable geography and global power dynamics',
          'It only affects countries in Africa',
          'It has been completely solved by satellite internet',
        ],
        correctIndex: 1,
        explanation: 'The passage connects the digital divide to "the geography of these cables" and notes it "reflects global power dynamics."',
        paragraph_ref: 3,
      },
    ],
  },
  {
    id: 'passage-7',
    title: 'The Arrival Fallacy',
    subject: 'social_studies',
    theme_connection: 'Are We There Yet? -- The psychology of arrival and why reaching the destination rarely satisfies',
    content: `Tal Ben-Shahar, a Harvard professor of positive psychology, coined the term "arrival fallacy" to describe a common human experience: the belief that once we reach a certain goal, we will finally be happy. Get into the right school, land the perfect job, buy the dream house -- and then, at last, happiness will arrive.

The problem is that it rarely does. Research consistently shows that the happiness boost from achieving major life goals is surprisingly short-lived. Psychologist Philip Brickman studied lottery winners and found that within a year, they were no happier than non-winners. Daniel Kahneman's Nobel Prize-winning research revealed that people consistently overestimate how much future achievements will improve their emotional lives -- a phenomenon he called the "impact bias."

This doesn't mean goals are worthless. The arrival fallacy isn't about abandoning ambition; it's about understanding that the destination is rarely the source of lasting happiness. Studies show that people who derive satisfaction from the process of working toward goals -- rather than fixating on outcomes -- report higher levels of well-being and resilience.

The biology behind this is straightforward. Dopamine, the neurotransmitter associated with pleasure, is primarily a "seeking" chemical, not a "having" chemical. Your brain releases more dopamine in anticipation of a reward than when actually receiving it. Evolution designed us to always want more, because ancestors who were easily satisfied stopped striving and didn't survive.

This has profound implications for how we measure progress, both personally and as societies. Nations chase GDP growth that never seems sufficient. Students pursue grades that don't bring the expected satisfaction. Athletes win championships and immediately ask, "What's next?" The hedonic treadmill keeps moving, and the destination keeps shifting.

The antidote, researchers suggest, is not to stop pursuing goals but to practice what psychologists call "savoring" -- deliberately paying attention to and appreciating positive experiences as they happen. Mindfulness practices, gratitude journals, and investing in experiences rather than material possessions all help redirect focus from the arrival to the journey.

The question "Are we there yet?" may be the wrong question entirely. A better one might be: "Are we enjoying the ride?"`,
    questions: [
      {
        id: 'p7-q1',
        question: 'What is the "arrival fallacy"?',
        options: [
          'The belief that planes always arrive on time',
          'The belief that reaching a goal will bring lasting happiness',
          'A mathematical error in navigation',
          'The tendency to arrive late to appointments',
        ],
        correctIndex: 1,
        explanation: 'The arrival fallacy is "the belief that once we reach a certain goal, we will finally be happy."',
        paragraph_ref: 0,
      },
      {
        id: 'p7-q2',
        question: 'What did Philip Brickman\'s research on lottery winners reveal?',
        options: [
          'They invested their money wisely',
          'They became much happier permanently',
          'Within a year, they were no happier than non-winners',
          'They donated most of their winnings',
        ],
        correctIndex: 2,
        explanation: 'Brickman found that lottery winners "within a year, they were no happier than non-winners."',
        paragraph_ref: 1,
      },
      {
        id: 'p7-q3',
        question: 'Why does dopamine relate to the arrival fallacy?',
        options: [
          'Dopamine causes depression after achieving goals',
          'The brain releases more dopamine in anticipation than in receiving',
          'Dopamine only works during physical exercise',
          'It makes people forget their goals entirely',
        ],
        correctIndex: 1,
        explanation: 'The passage explains that "your brain releases more dopamine in anticipation of a reward than when actually receiving it."',
        paragraph_ref: 3,
      },
      {
        id: 'p7-q4',
        question: 'What does the passage suggest as an antidote to the arrival fallacy?',
        options: [
          'Setting fewer goals',
          'Avoiding all ambition',
          'Practicing savoring, mindfulness, and gratitude',
          'Focusing exclusively on material possessions',
        ],
        correctIndex: 2,
        explanation: 'The passage recommends "savoring," mindfulness, gratitude journals, and investing in experiences rather than material possessions.',
        paragraph_ref: 5,
      },
    ],
  },
  {
    id: 'passage-8',
    title: 'The Cathedral That Will Never Be Finished',
    subject: 'arts',
    theme_connection: 'Are We There Yet? -- A masterpiece defined by its incompleteness',
    content: `In the heart of Barcelona stands the Basilica de la Sagrada Familia, one of the most extraordinary buildings on Earth. Designed by the visionary architect Antoni Gaudi, construction began in 1882 and -- over 140 years later -- it remains unfinished. It is perhaps the greatest monument to the idea that some journeys matter more than their destinations.

Gaudi inherited the project from another architect and immediately threw out the existing plans. He envisioned a structure that would be a Bible rendered in stone, with every surface telling a story through sculpture, symbolism, and geometry drawn from nature. The facade depicting Christ's birth is covered with turtles, snails, and plant forms. The interior columns branch like trees, creating a forest of stone that filters light through stained glass in constantly shifting patterns.

Gaudi knew he would never see the building completed. "My client is not in a hurry," he said, referring to God. He spent the last twelve years of his life living in the workshop, sleeping beside his models, refining every detail. When he died in 1926, struck by a tram, only about 15-25% of the building was complete.

What makes the Sagrada Familia remarkable is not just its design but its construction philosophy. Gaudi left intentionally incomplete plans, expecting future architects to interpret and adapt his vision rather than copy it exactly. Each generation of builders has contributed new techniques -- from computer modeling in the 1990s to 3D printing of complex stone forms today.

The Spanish Civil War destroyed many of Gaudi's original models and drawings in 1936. Yet work continued. The building survived war, political upheaval, debates over modern additions, and the global pandemic. Over 4.5 million people visit each year, not to see a finished building but to witness a living work of art evolving across centuries.

UNESCO declared it a World Heritage Site while it was still under construction -- perhaps acknowledging that the journey itself was the masterpiece.`,
    questions: [
      {
        id: 'p8-q1',
        question: 'When did construction of the Sagrada Familia begin?',
        options: ['1850', '1882', '1926', '1936'],
        correctIndex: 1,
        explanation: 'The passage states that "construction began in 1882."',
        paragraph_ref: 0,
      },
      {
        id: 'p8-q2',
        question: 'What did Gaudi mean when he said "My client is not in a hurry"?',
        options: [
          'The Barcelona city council was patient',
          'He was referring to God and the spiritual purpose of the building',
          'The construction workers had plenty of time',
          'He wanted to delay the project deliberately',
        ],
        correctIndex: 1,
        explanation: 'He was "referring to God" -- the building serves a spiritual purpose with no deadline.',
        paragraph_ref: 2,
      },
      {
        id: 'p8-q3',
        question: 'How did the Spanish Civil War affect the project?',
        options: [
          'It sped up construction',
          'It had no effect on the building',
          'It destroyed many of Gaudi\'s original models and drawings',
          'It led to the building being completed early',
        ],
        correctIndex: 2,
        explanation: '"The Spanish Civil War destroyed many of Gaudi\'s original models and drawings in 1936."',
        paragraph_ref: 4,
      },
      {
        id: 'p8-q4',
        question: 'What is unusual about its UNESCO World Heritage status?',
        options: [
          'It was the first building ever designated',
          'It received the status while still under construction',
          'It lost the status due to modern additions',
          'Only the facade received the designation',
        ],
        correctIndex: 1,
        explanation: 'UNESCO declared it a World Heritage Site "while it was still under construction."',
        paragraph_ref: 5,
      },
    ],
  },
  {
    id: 'passage-9',
    title: 'A Nation Without Children',
    subject: 'social_studies',
    theme_connection: 'Are We There Yet? -- Progress that leads to unintended consequences',
    content: `South Korea is experiencing what demographers call a "demographic time bomb." In 2022, the country's total fertility rate dropped to 0.78 -- the lowest ever recorded in any nation. To maintain a stable population without immigration, a country needs a fertility rate of about 2.1 children per woman. South Korea's rate is barely a third of that.

The numbers tell a startling story. In 2023, more South Koreans died than were born for the fourth consecutive year. Schools are closing for lack of students. Entire apartment complexes built for young families sit partially empty. The military has shortened mandatory service because there aren't enough young men to serve.

The causes are complex and interconnected. South Korea's hyper-competitive education system means parents spend an average of $20,000 per year per child on private tutoring -- in a country where the median household income is about $40,000. Housing costs in Seoul have tripled in a decade. Young Koreans face intense pressure to secure prestigious jobs, and many feel they cannot afford children without sacrificing their career prospects.

Cultural shifts play an equally important role. The "sampo generation" describes young Koreans who have given up on dating, marriage, and children. Women, historically expected to abandon careers for childcare, are increasingly choosing professional independence over motherhood.

The government has tried everything. Since 2006, South Korea has spent over $200 billion on pronatalist policies: cash bonuses for babies, subsidized childcare, parental leave. Nothing has worked. The birth rate has continued to fall year after year.

South Korea's crisis raises a fundamental question: we have arrived at a level of prosperity that was once unimaginable -- and one consequence is that people are choosing not to have children. Is this a destination we ever intended to reach?`,
    questions: [
      {
        id: 'p9-q1',
        question: 'What was South Korea\'s total fertility rate in 2022?',
        options: ['1.2', '0.78', '2.1', '1.5'],
        correctIndex: 1,
        explanation: 'The rate "dropped to 0.78 -- the lowest ever recorded in any nation."',
        paragraph_ref: 0,
      },
      {
        id: 'p9-q2',
        question: 'What does the term "sampo generation" mean?',
        options: [
          'The richest generation in Korean history',
          'Young Koreans who have given up on dating, marriage, and children',
          'A generation that values family above all else',
          'Koreans who emigrated to other countries',
        ],
        correctIndex: 1,
        explanation: 'The "sampo generation" describes "young Koreans who have given up on dating, marriage, and children."',
        paragraph_ref: 3,
      },
      {
        id: 'p9-q3',
        question: 'How much has South Korea spent on pronatalist policies since 2006?',
        options: ['$20 billion', '$50 billion', '$200 billion', '$500 billion'],
        correctIndex: 2,
        explanation: 'South Korea "has spent over $200 billion on pronatalist policies."',
        paragraph_ref: 4,
      },
      {
        id: 'p9-q4',
        question: 'What paradox does the passage identify about progress?',
        options: [
          'Technology has made people lazier',
          'Prosperity has led people to choose not to have children',
          'Education has become too expensive worldwide',
          'Immigration has solved all population problems',
        ],
        correctIndex: 1,
        explanation: 'The passage concludes that prosperity -- a form of progress -- has the consequence that "people are choosing not to have children."',
        paragraph_ref: 5,
      },
    ],
  },
  {
    id: 'passage-10',
    title: 'Messages in a Golden Bottle',
    subject: 'science',
    theme_connection: 'Are We There Yet? -- A journey with no destination, where the message is the meaning',
    content: `In 1977, NASA launched two spacecraft -- Voyager 1 and Voyager 2 -- on a grand tour of the outer solar system. Strapped to the side of each probe is a 12-inch gold-plated copper record containing sounds and images selected to represent the diversity of life and culture on Earth. These Golden Records are humanity's message in a bottle, cast into the cosmic ocean for an audience that may never exist.

The records were curated by a committee chaired by astronomer Carl Sagan. They contain 115 images, greetings in 55 languages, a 12-minute montage of sounds from Earth (including thunder, birdsong, and a baby crying), and 90 minutes of music ranging from Bach and Beethoven to Chuck Berry. A diagram etched into the cover shows the position of our Sun relative to 14 pulsars, providing a kind of cosmic return address.

Sagan faced difficult choices about what to include. The committee chose to present humanity at its best -- no images of war, poverty, or destruction. Critics argued this painted an unrealistically optimistic picture. Sagan countered that the record was as much for humanity as for any alien listener.

The physics of the journey are humbling. Voyager 1, the most distant human-made object, is currently about 24 billion kilometers from Earth. Despite traveling at 61,000 kilometers per hour, it will take 40,000 years to pass near the closest star in its path. The records are designed to survive a billion years in space.

The Golden Records raise profound questions about destinations. There is no specific target, no expected recipient, no timetable for arrival. The message is the mission. In an era where we obsess over metrics and measurable outcomes, the Voyager program spent a portion of its budget on a gesture of pure hope.

Perhaps the most powerful aspect of the Golden Records is what they say about us, not what they say to aliens. They represent humanity's need to believe that the journey matters even when there is no destination in sight.`,
    questions: [
      {
        id: 'p10-q1',
        question: 'What is on the Golden Records?',
        options: [
          'Only music from Western classical composers',
          'Sounds, images, greetings in 55 languages, and diverse music',
          'Written letters from world leaders',
          'A map of Earth with all country borders',
        ],
        correctIndex: 1,
        explanation: 'The records contain "115 images, greetings in 55 languages, Earth sounds, and 90 minutes of music."',
        paragraph_ref: 1,
      },
      {
        id: 'p10-q2',
        question: 'Why did critics object to the Golden Records\' contents?',
        options: [
          'The music selection was too long',
          'It presented an unrealistically optimistic picture of humanity',
          'They thought aliens would not understand music',
          'The records were too expensive to produce',
        ],
        correctIndex: 1,
        explanation: 'Critics argued the committee "painted an unrealistically optimistic picture" by excluding war and destruction.',
        paragraph_ref: 2,
      },
      {
        id: 'p10-q3',
        question: 'How long will it take Voyager 1 to reach the nearest star in its path?',
        options: ['4,000 years', '40,000 years', '400,000 years', '4 million years'],
        correctIndex: 1,
        explanation: '"It will take 40,000 years to pass near the closest star in its path."',
        paragraph_ref: 3,
      },
      {
        id: 'p10-q4',
        question: 'What does the passage suggest is the true audience for the Golden Records?',
        options: [
          'Aliens from nearby star systems',
          'Future human space travelers',
          'Humanity itself -- the records say more about us than to aliens',
          'NASA scientists studying the outer planets',
        ],
        correctIndex: 2,
        explanation: 'The records reveal "what they say about us, not what they say to aliens."',
        paragraph_ref: 5,
      },
    ],
  },
  {
    id: 'passage-11',
    title: 'Your Body Clock vs. the World',
    subject: 'science',
    theme_connection: 'Are We There Yet? -- Our technology outpaces our biology',
    content: `Deep inside your brain, a tiny cluster of roughly 20,000 neurons called the suprachiasmatic nucleus (SCN) acts as your body's master clock. This internal timekeeper, known as your circadian rhythm, regulates when you feel sleepy, alert, hungry, and energetic over a roughly 24-hour cycle. It is one of the oldest biological systems on Earth, shared by everything from fruit flies to blue whales.

Your circadian rhythm is synchronized primarily by light. When light enters your eyes, specialized cells send signals to the SCN, which adjusts your internal clock to match the external world. This is why exposure to morning sunlight helps you wake up, and why staring at bright screens before bed can make it harder to fall asleep.

Jet lag occurs when your circadian rhythm and the local time zone are out of sync. If you fly from New York to London, your body still thinks it's five hours earlier. Your SCN needs about one day per time zone to fully adjust, meaning a trip across six time zones can leave you feeling foggy and exhausted for nearly a week.

The consequences of circadian disruption go far beyond feeling tired. Shift workers, who regularly work against their body clocks, have significantly higher rates of heart disease, diabetes, obesity, and certain cancers. Airlines limit the number of time zones pilots can cross without mandatory rest periods.

Modern life is increasingly at odds with our circadian biology. About 75% of the world's population is exposed to artificial light during the night. Teenagers, whose circadian rhythms naturally shift later, are forced to start school at times that conflict with their biology -- leading to chronic sleep deprivation.

The global economy demands we ignore time zones: traders in Tokyo must respond to markets in New York, remote workers attend calls with colleagues twelve hours away. We have built a world that runs 24/7, but our bodies remain stubbornly set to a cycle shaped by millions of years of sunrise and sunset.`,
    questions: [
      {
        id: 'p11-q1',
        question: 'What is the suprachiasmatic nucleus (SCN)?',
        options: [
          'A type of brain tumor',
          'A cluster of about 20,000 neurons that acts as the body\'s master clock',
          'The part of the brain that processes language',
          'A hormone that regulates sleep',
        ],
        correctIndex: 1,
        explanation: 'The SCN is "a tiny cluster of roughly 20,000 neurons" that acts as "your body\'s master clock."',
        paragraph_ref: 0,
      },
      {
        id: 'p11-q2',
        question: 'How long does it take to adjust to a new time zone?',
        options: [
          'A few hours',
          'About one day per time zone crossed',
          'Exactly 24 hours regardless of distance',
          'Adjustment happens instantly',
        ],
        correctIndex: 1,
        explanation: '"Your SCN needs about one day per time zone to fully adjust."',
        paragraph_ref: 2,
      },
      {
        id: 'p11-q3',
        question: 'What health risks are associated with circadian disruption?',
        options: [
          'Only mild headaches',
          'Higher rates of heart disease, diabetes, obesity, and certain cancers',
          'Improved immune function',
          'Better memory and concentration',
        ],
        correctIndex: 1,
        explanation: 'Shift workers "have significantly higher rates of heart disease, diabetes, obesity, and certain cancers."',
        paragraph_ref: 3,
      },
      {
        id: 'p11-q4',
        question: 'What tension does the passage describe about modern life?',
        options: [
          'People exercise too much for their circadian rhythms',
          'Our technology operates globally but our bodies are biologically local',
          'Artificial light has completely eliminated circadian rhythms',
          'Only pilots are affected by time zone changes',
        ],
        correctIndex: 1,
        explanation: '"We have built a world that runs 24/7, but our bodies remain stubbornly set to a cycle shaped by millions of years of sunrise and sunset."',
        paragraph_ref: 5,
      },
    ],
  },
  {
    id: 'passage-12',
    title: 'The Last Speakers',
    subject: 'social_studies',
    theme_connection: 'Are We There Yet? -- Global connectivity arrives at the cost of linguistic diversity',
    content: `Somewhere in the world, a language dies approximately every two weeks. Of the roughly 7,000 languages spoken today, linguists estimate that nearly half will be extinct by the end of this century. When a language dies, it does not simply mean that people switch to a different way of saying the same things. Each language represents a unique way of understanding reality -- a library of knowledge that can never be recovered.

The Yaghan language of Tierra del Fuego has one remaining fluent speaker: Cristina Calderon. Yaghan contains words with no equivalent in any other language. "Mamihlapinatapai" describes the wordless, meaningful look shared between two people who both want something to happen but neither is willing to start. When the last speaker dies, this concept will exist only in dictionaries, stripped of its living context.

Languages don't die from natural causes. They are killed by economic pressure, government policy, and social stigma. When children learn that their parents' language is "useless" for jobs or university, they stop speaking it. Colonial governments systematically banned indigenous languages through forced education programs.

Some languages are fighting back. Welsh, once endangered, now has over 800,000 speakers thanks to Welsh-medium education and government support. Hebrew was revived from a liturgical language to a living national tongue. Maori language nests in New Zealand immerse children from birth.

Technology offers new tools for preservation. Smartphone apps teach endangered languages. AI helps create dictionaries and grammar guides. But the internet's dominance of English, Mandarin, and Spanish often accelerates the marginalization of smaller languages.

The loss of linguistic diversity mirrors the loss of biodiversity. Just as a forest with many species is more resilient than a monoculture, a world with many languages possesses more cognitive tools and perspectives. Every language that vanishes narrows the range of human thought.`,
    questions: [
      {
        id: 'p12-q1',
        question: 'How often does a language die?',
        options: ['Every day', 'Every two weeks', 'Every month', 'Every year'],
        correctIndex: 1,
        explanation: '"A language dies approximately every two weeks."',
        paragraph_ref: 0,
      },
      {
        id: 'p12-q2',
        question: 'What is special about the Yaghan word "mamihlapinatapai"?',
        options: [
          'It is the longest word in any language',
          'It describes a concept with no equivalent in any other language',
          'It is used in international diplomacy',
          'It was recently added to the English dictionary',
        ],
        correctIndex: 1,
        explanation: 'The word describes a concept that "has no equivalent in any other language."',
        paragraph_ref: 1,
      },
      {
        id: 'p12-q3',
        question: 'Which language is cited as a successful revival?',
        options: ['Latin', 'Ancient Greek', 'Welsh', 'Sanskrit'],
        correctIndex: 2,
        explanation: 'Welsh "now has over 800,000 speakers thanks to Welsh-medium education and government support."',
        paragraph_ref: 3,
      },
      {
        id: 'p12-q4',
        question: 'According to the passage, what is the main cause of language death?',
        options: [
          'Natural linguistic evolution',
          'Economic pressure, government policy, and social stigma',
          'Languages becoming too complex',
          'People forgetting how to speak',
        ],
        correctIndex: 1,
        explanation: '"Languages don\'t die from natural causes. They are killed by economic pressure, government policy, and social stigma."',
        paragraph_ref: 2,
      },
    ],
  },
  {
    id: 'passage-13',
    title: 'The Overview Effect',
    subject: 'science',
    theme_connection: 'Are We There Yet? -- Leaving Earth to understand it',
    content: `In 1987, author Frank White coined the term "Overview Effect" to describe a cognitive shift reported by astronauts who see Earth from space. It is not just an aesthetic experience of beauty but a profound, often life-changing transformation in how they understand humanity's place in the universe.

Apollo 14 astronaut Edgar Mitchell described it as "an instant global consciousness." He looked at Earth from the Moon and felt an overwhelming sense that national boundaries and political conflicts were absurdly petty when viewed from 384,000 kilometers away. "You want to grab a politician by the scruff of the neck and drag him a quarter of a million miles out and say, 'Look at that,'" he said.

The science suggests it is more than emotional reaction. Neuroimaging studies of people experiencing awe show decreased activity in the default mode network, the brain region associated with self-referential thinking. Awe literally makes you less focused on yourself and more aware of the larger whole. Astronauts report this effect lasting months or years after returning.

The Overview Effect has practical consequences. Many astronauts return as passionate environmentalists. The "Blue Marble" photograph taken by Apollo 17 in 1972 is credited with catalyzing the modern environmental movement -- people saw their planet's fragility for the first time.

Yet there is a paradox. The technology required to reach space is enormously resource-intensive. Rocket launches produce significant carbon emissions. We must pollute the atmosphere to gain the perspective that tells us to stop polluting it.

Researchers are exploring whether virtual reality can replicate some of the Overview Effect's cognitive benefits without leaving Earth. Early studies are promising: VR experiences of Earth from space have produced measurable increases in environmental concern.

The Overview Effect suggests that sometimes you have to leave a place entirely to understand what it means. Perhaps the most important journey is not outward to the stars, but the moment we turn around and truly see home for the first time.`,
    questions: [
      {
        id: 'p13-q1',
        question: 'What is the Overview Effect?',
        options: [
          'A visual distortion caused by space helmets',
          'A cognitive shift experienced by astronauts seeing Earth from space',
          'A medical condition caused by zero gravity',
          'The feeling of nausea during rocket launch',
        ],
        correctIndex: 1,
        explanation: 'The Overview Effect is "a cognitive shift reported by astronauts who see Earth from space."',
        paragraph_ref: 0,
      },
      {
        id: 'p13-q2',
        question: 'What does neuroimaging reveal about the experience of awe?',
        options: [
          'Awe increases self-focused thinking',
          'Awe decreases self-referential brain activity, increasing awareness of the whole',
          'Awe has no measurable brain effects',
          'Awe only occurs in astronauts',
        ],
        correctIndex: 1,
        explanation: 'Studies show "decreased activity in the default mode network," making people "less focused on yourself and more aware of the larger whole."',
        paragraph_ref: 2,
      },
      {
        id: 'p13-q3',
        question: 'What paradox does the passage identify about space travel?',
        options: [
          'Astronauts don\'t care about the environment',
          'We must pollute the atmosphere to gain the perspective that tells us to stop polluting',
          'Space travel is inexpensive and accessible',
          'Virtual reality is better than real space travel',
        ],
        correctIndex: 1,
        explanation: '"We must pollute the atmosphere to gain the perspective that tells us to stop polluting it."',
        paragraph_ref: 4,
      },
      {
        id: 'p13-q4',
        question: 'What is the passage\'s concluding argument?',
        options: [
          'We should colonize Mars as soon as possible',
          'Space tourism should be banned',
          'The most important journey is turning around to truly see and understand home',
          'Astronauts should stay in space permanently',
        ],
        correctIndex: 2,
        explanation: '"The most important journey is not outward to the stars, but the moment we turn around and truly see home for the first time."',
        paragraph_ref: 6,
      },
    ],
  },
  {
    id: 'passage-14',
    title: 'The Persistence of Melting Clocks',
    subject: 'arts',
    theme_connection: 'Are We There Yet? -- Time itself is unreliable, questioning whether arrival is possible',
    content: `In 1931, Salvador Dali painted "The Persistence of Memory," one of the most recognized images in art history. The small canvas -- just 24 by 33 centimeters -- depicts a barren landscape where soft, melting watches drape over branches, ledges, and an amorphous sleeping figure. It has become shorthand for the strangeness of time itself.

Dali claimed the painting was inspired by the sight of Camembert cheese melting in the sun. But the work operates on a far deeper level. The melting clocks suggest that our rigid measurement of time is an illusion -- that time as we experience it is soft, flexible, and unreliable. Just decades earlier, Einstein's theory of relativity had proven scientifically what Dali painted intuitively: time is not fixed. It stretches and bends depending on speed and gravity.

The barren landscape -- modeled on the cliffs of Catalonia -- is equally significant. There are no people, only a sleeping figure that may represent Dali's own face, distorted beyond recognition. Ants swarm on one watch, suggesting decay. The scene feels like what remains after everyone has left -- time becoming meaningless because there is no one to measure it.

Dali called his approach the "paranoiac-critical method" -- a way of deliberately cultivating irrational associations to reveal hidden truths. He believed rational thought, while useful, was a cage preventing us from seeing deeper realities. The melting clocks argue that our obsession with schedules and deadlines misses something fundamental about how time actually works in human experience.

The painting's continued popularity suggests Dali touched something universal. In an age of constant scheduling and productivity apps, the image of clocks dissolving into softness feels therapeutic. It whispers what we secretly know: a minute spent in joy lasts longer than an hour of boredom, grief stretches time, and the tick of a clock has little to do with how we actually experience being alive.

If time itself is unreliable, how can we ever know if we have arrived? Destinations assume a fixed timeline -- you leave, you travel, you arrive. But if time bends and melts like Dali's watches, perhaps the journey and the destination are the same moment, experienced differently.`,
    questions: [
      {
        id: 'p14-q1',
        question: 'What did Dali claim inspired "The Persistence of Memory"?',
        options: [
          'A dream about the ocean',
          'Camembert cheese melting in the sun',
          'A photograph of a clock factory',
          'Einstein\'s equations',
        ],
        correctIndex: 1,
        explanation: 'Dali "claimed the painting was inspired by the sight of Camembert cheese melting in the sun."',
        paragraph_ref: 1,
      },
      {
        id: 'p14-q2',
        question: 'How does the passage connect Dali to Einstein?',
        options: [
          'Einstein was a fan of Dali\'s work',
          'Dali painted Einstein\'s portrait',
          'Both suggested time is not fixed -- Einstein scientifically, Dali artistically',
          'Einstein helped design the painting',
        ],
        correctIndex: 2,
        explanation: '"Einstein\'s theory of relativity had proven scientifically what Dali painted intuitively: time is not fixed."',
        paragraph_ref: 1,
      },
      {
        id: 'p14-q3',
        question: 'What was Dali\'s "paranoiac-critical method"?',
        options: [
          'A medical treatment for paranoia',
          'Deliberately cultivating irrational associations to reveal hidden truths',
          'A technique for painting straight lines',
          'A method of art criticism',
        ],
        correctIndex: 1,
        explanation: 'It was "a way of deliberately cultivating irrational associations to reveal hidden truths."',
        paragraph_ref: 3,
      },
      {
        id: 'p14-q4',
        question: 'What question does the passage connect to the WSC 2026 theme?',
        options: [
          'Whether art should be in museums',
          'If time is unreliable, how can we ever know if we have arrived?',
          'Whether surrealism is the best art movement',
          'How long it takes to paint a masterpiece',
        ],
        correctIndex: 1,
        explanation: '"If time itself is unreliable, how can we ever know if we have arrived?"',
        paragraph_ref: 5,
      },
    ],
  },
  {
    id: 'passage-15',
    title: 'The Silk Road\'s Modern Echoes',
    subject: 'social_studies',
    theme_connection: 'Are We There Yet? -- Ancient and modern trade routes as vehicles for both connection and control',
    content: `For nearly two thousand years, the Silk Road connected East and West through a sprawling network of trade routes stretching from China to the Mediterranean. Merchants carried silk, spices, and precious metals. But they also carried something more valuable: ideas. Buddhism traveled from India to China along these routes. Islamic scholarship preserved Greek philosophy. Papermaking moved westward from China, eventually enabling Europe's printing revolution.

The original Silk Road was never a single path. It was a web of interconnected routes that shifted with politics and economics. Cities like Samarkand and Constantinople grew rich as crossroads where cultures mixed. The exchange was not always peaceful -- armies followed trade routes as readily as merchants -- but the net effect was a gradual weaving together of human knowledge.

Today, China's Belt and Road Initiative (BRI) consciously echoes this ancient network. Launched in 2013, the BRI is the largest infrastructure project in history, with investments exceeding $1 trillion across more than 140 countries. It funds ports, railways, highways, and digital networks connecting Asia, Africa, and Europe.

Critics point to "debt-trap diplomacy," where nations borrow heavily from Chinese banks to fund infrastructure they may not be able to repay. Sri Lanka's Hambantota Port, leased to China for 99 years after the country could not repay its loans, is the most cited example. Others worry about environmental damage and geopolitical implications.

The parallel between ancient and modern Silk Roads reveals a persistent pattern: connectivity is never neutral. Every road that carries goods also carries influence. Every bridge that enables trade also enables dependence. The question is not whether we should build connections, but who controls the roads and on what terms.

The ancient Silk Road declined when sea routes offered faster alternatives. The modern BRI faces similar questions of sustainability. Are we building roads to shared prosperity, or paving the way for new forms of dominance?`,
    questions: [
      {
        id: 'p15-q1',
        question: 'What was the most valuable thing carried along the Silk Road?',
        options: ['Silk', 'Gold', 'Ideas', 'Weapons'],
        correctIndex: 2,
        explanation: 'Merchants "also carried something more valuable: ideas."',
        paragraph_ref: 0,
      },
      {
        id: 'p15-q2',
        question: 'What is the Belt and Road Initiative?',
        options: [
          'A Chinese military alliance',
          'The largest infrastructure project in history, connecting Asia, Africa, and Europe',
          'A UN poverty reduction program',
          'A highway within China',
        ],
        correctIndex: 1,
        explanation: 'The BRI is "the largest infrastructure project in history, with investments exceeding $1 trillion across more than 140 countries."',
        paragraph_ref: 2,
      },
      {
        id: 'p15-q3',
        question: 'What happened with Sri Lanka\'s Hambantota Port?',
        options: [
          'It became the busiest port in Asia',
          'It was leased to China for 99 years when Sri Lanka could not repay loans',
          'It was destroyed by a natural disaster',
          'It was built by the United Nations',
        ],
        correctIndex: 1,
        explanation: 'The port was "leased to China for 99 years after the country could not repay its loans."',
        paragraph_ref: 3,
      },
      {
        id: 'p15-q4',
        question: 'What "persistent pattern" does the passage identify?',
        options: [
          'All empires eventually collapse',
          'Connectivity is never neutral -- roads carry both goods and influence',
          'Sea routes are always better than land routes',
          'Trade always leads to peace',
        ],
        correctIndex: 1,
        explanation: '"Connectivity is never neutral. Every road that carries goods also carries influence."',
        paragraph_ref: 4,
      },
    ],
  },
];

export function getPassagesBySubject(subject: string): ReadingPassage[] {
  return passages.filter((p) => p.subject === subject);
}

export function getPassageById(id: string): ReadingPassage | undefined {
  return passages.find((p) => p.id === id);
}

export function getRandomPassages(count: number): ReadingPassage[] {
  const shuffled = [...passages].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
