/**
 * Argument Arena -- card-based debate game with AI opponents.
 * Cards, topics, scoring, and AI opponent logic for the WSC 2026
 * "Are We There Yet?" theme: progress, journeys, destinations,
 * and whether humanity has arrived at various goals.
 */

export type CardType = 'claim' | 'evidence' | 'reasoning' | 'rebuttal';

export interface ArgumentCard {
  id: string;
  type: CardType;
  text: string;
  strength: number; // 1-10
  subject: string;
  topicId: string;
}

export interface DebateTopicArena {
  id: string;
  topic: string;
  description: string;
}

export interface AIOpponent {
  id: string;
  name: string;
  emoji: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
}

export const AI_OPPONENTS: AIOpponent[] = [
  { id: 'professor', name: 'The Professor', emoji: '\u{1F393}', difficulty: 'easy', description: 'Methodical but predictable' },
  { id: 'skeptic', name: 'The Skeptic', emoji: '\u{1F9D0}', difficulty: 'medium', description: 'Strong rebuttals, weaker evidence' },
  { id: 'devil', name: "The Devil's Advocate", emoji: '\u{1F608}', difficulty: 'hard', description: 'Unpredictable and strong' },
];

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

export function calculateArgumentStrength(cards: ArgumentCard[]): number {
  if (cards.length === 0) return 0;
  const base = cards.reduce((sum, c) => sum + c.strength, 0);
  const types = new Set(cards.map(c => c.type));
  const hasChain = types.has('claim') && types.has('evidence') && types.has('reasoning');
  const sequenceBonus = hasChain ? 1.5 : 1.0;
  const subjects = cards.map(c => c.subject);
  const coherenceBonus = subjects.every(s => s === subjects[0]) ? 1.2 : 1.0;
  const rebuttalBonus = cards.filter(c => c.type === 'rebuttal').reduce((sum, c) => sum + c.strength * 2, 0);
  return Math.round(base * sequenceBonus * coherenceBonus + rebuttalBonus);
}

// ---------------------------------------------------------------------------
// AI card selection
// ---------------------------------------------------------------------------

export function aiPlayCards(
  hand: ArgumentCard[],
  difficulty: 'easy' | 'medium' | 'hard',
  playerWinRate?: number
): ArgumentCard[] {
  let effectiveDifficulty = difficulty;
  if (playerWinRate !== undefined) {
    if (playerWinRate > 0.7) {
      if (difficulty === 'easy') effectiveDifficulty = 'medium';
      else if (difficulty === 'medium') effectiveDifficulty = 'hard';
    } else if (playerWinRate < 0.3) {
      if (difficulty === 'hard') effectiveDifficulty = 'medium';
      else if (difficulty === 'medium') effectiveDifficulty = 'easy';
    }
  }

  const sorted = [...hand].sort((a, b) => b.strength - a.strength);
  switch (effectiveDifficulty) {
    case 'easy':
      return sorted.filter(c => c.type !== 'rebuttal').slice(-3).concat(
        sorted.filter(c => c.type === 'rebuttal').slice(-1)
      ).slice(0, 4);
    case 'medium':
      return sorted.slice(1, 5);
    case 'hard':
      return sorted.slice(0, 4);
  }
}

// ---------------------------------------------------------------------------
// Topics  (WSC 2026 "Are We There Yet?" theme)
// ---------------------------------------------------------------------------

export const DEBATE_TOPICS: DebateTopicArena[] = [
  { id: 'topic-1', topic: 'Has social media brought us closer or further apart?', description: 'Billions are connected online, yet loneliness is rising. Has digital connection replaced real community?' },
  { id: 'topic-2', topic: 'Are we ready to colonize Mars?', description: 'SpaceX targets the 2030s, but are we solving Earth\'s problems first or escaping them?' },
  { id: 'topic-3', topic: 'Has technology made education better?', description: 'From chalkboards to AI tutors -- has the journey of ed-tech improved learning outcomes for everyone?' },
  { id: 'topic-4', topic: 'Is democracy still the best system of governance?', description: 'Democracy spread globally in the 20th century. Has it reached its potential or stalled on the journey?' },
  { id: 'topic-5', topic: 'Have we made enough progress on climate change?', description: 'Renewable energy is booming, yet emissions keep rising. Are we there yet, or just getting started?' },
  { id: 'topic-6', topic: 'Is artificial intelligence a milestone or a threat to humanity?', description: 'AI writes, paints, and codes. Is this the destination we wanted, or a detour from human creativity?' },
  { id: 'topic-7', topic: 'Has globalization helped or harmed developing nations?', description: 'Trade lifted billions from poverty but widened inequality. Where are we on this journey?' },
  { id: 'topic-8', topic: 'Should space exploration be prioritized over solving poverty?', description: 'Rockets launch while millions starve. Is reaching the stars worth more than reaching every person?' },
  { id: 'topic-9', topic: 'Has the internet delivered on its promise of free information?', description: 'The web was built for open knowledge. Are paywalls and algorithms taking us backward?' },
  { id: 'topic-10', topic: 'Are standardized tests a fair measure of student progress?', description: 'Tests were meant to track learning journeys. Have they become roadblocks instead of milestones?' },
  { id: 'topic-11', topic: 'Is remote work the future or a temporary stop?', description: 'The pandemic forced a detour to home offices. Is this the destination or a rest stop on the journey?' },
  { id: 'topic-12', topic: 'Has modern medicine reached its peak?', description: 'We cured diseases that ravaged centuries. Are we at the summit or still climbing?' },
  { id: 'topic-13', topic: 'Should we measure progress by GDP or happiness?', description: 'GDP grew for decades while depression rates soared. Are we measuring the right destination?' },
  { id: 'topic-14', topic: 'Is nuclear energy the destination for clean power?', description: 'Nuclear offers zero-carbon energy but carries risk. Is it the final stop or a dangerous shortcut?' },
  { id: 'topic-15', topic: 'Has the United Nations achieved world peace?', description: 'Founded after WWII to end all wars. 80 years later, conflicts rage. Has the journey stalled?' },
  { id: 'topic-16', topic: 'Are electric vehicles the end of the road for fossil fuels?', description: 'EVs are growing fast but batteries need rare minerals. Have we arrived or just changed vehicles?' },
  { id: 'topic-17', topic: 'Has feminism achieved gender equality?', description: 'Decades of progress in rights and representation. Are we there yet, or is the journey far from over?' },
  { id: 'topic-18', topic: 'Is genetic engineering crossing the finish line too fast?', description: 'CRISPR can edit DNA, cure diseases, and design babies. Are we running too far ahead of ethics?' },
  { id: 'topic-19', topic: 'Should countries open all borders for migration?', description: 'People move for better lives. Is free movement the destination, or do borders serve a purpose on the journey?' },
  { id: 'topic-20', topic: 'Has capitalism reached its final form?', description: 'Markets created unprecedented wealth and inequality. Is this the destination or do we need a new path?' },
  { id: 'topic-21', topic: 'Are we too dependent on smartphones?', description: 'Phones were tools for communication. Have they become chains that stop our personal journeys?' },
  { id: 'topic-22', topic: 'Should endangered languages be preserved at all costs?', description: 'A language dies every two weeks. Is losing them part of progress or losing the map of where we\'ve been?' },
  { id: 'topic-23', topic: 'Is the metaverse a destination worth building?', description: 'Tech giants invest billions in virtual worlds. Is this humanity\'s next frontier or a dead end?' },
  { id: 'topic-24', topic: 'Has the war on drugs been a failed journey?', description: 'Decades of prohibition, billions spent, prisons overflowing. Did we take a wrong turn?' },
  { id: 'topic-25', topic: 'Should voting be mandatory in democracies?', description: 'Voter turnout declines globally. Would forcing participation complete the democratic journey?' },
  { id: 'topic-26', topic: 'Is fast fashion an acceptable cost of progress?', description: 'Cheap clothes for everyone, but at what environmental price? Have we traded one destination for another?' },
  { id: 'topic-27', topic: 'Has the food industry gone too far with processing?', description: 'Ultra-processed foods are everywhere. Is convenience the destination, or have we lost our way nutritionally?' },
  { id: 'topic-28', topic: 'Should we give AI legal rights as it becomes sentient?', description: 'If machines can think and feel, do they deserve rights? Is this the next stop on the journey of justice?' },
  { id: 'topic-29', topic: 'Is universal basic income the destination for economic fairness?', description: 'Automation eliminates jobs. Is UBI the final stop or a detour from the real solution?' },
  { id: 'topic-30', topic: 'Has humanity\'s journey of exploration ended or just begun?', description: 'We mapped Earth, split the atom, and touched the Moon. Is the age of discovery over, or are we still packing?' },
];

// ---------------------------------------------------------------------------
// Cards  (120+ cards across all types, tagged to topics)
// ---------------------------------------------------------------------------

const CARDS: ArgumentCard[] = [
  // ===================== CLAIM CARDS (30) =====================
  { id: 'cl-1', type: 'claim', text: 'Social media has fundamentally weakened real human connection.', strength: 7, subject: 'social_studies', topicId: 'topic-1' },
  { id: 'cl-2', type: 'claim', text: 'Mars colonization is essential for the long-term survival of our species.', strength: 8, subject: 'science', topicId: 'topic-2' },
  { id: 'cl-3', type: 'claim', text: 'Technology in education has widened the gap between rich and poor students.', strength: 7, subject: 'social_studies', topicId: 'topic-3' },
  { id: 'cl-4', type: 'claim', text: 'Democracy is under greater threat today than at any point since WWII.', strength: 8, subject: 'social_studies', topicId: 'topic-4' },
  { id: 'cl-5', type: 'claim', text: 'Current climate action is too slow to prevent catastrophic warming.', strength: 9, subject: 'science', topicId: 'topic-5' },
  { id: 'cl-6', type: 'claim', text: 'AI will replace more jobs than it creates within the next decade.', strength: 7, subject: 'science', topicId: 'topic-6' },
  { id: 'cl-7', type: 'claim', text: 'Globalization has made developing nations more dependent, not independent.', strength: 6, subject: 'social_studies', topicId: 'topic-7' },
  { id: 'cl-8', type: 'claim', text: 'Every dollar spent on space exploration returns tenfold in innovation.', strength: 7, subject: 'science', topicId: 'topic-8' },
  { id: 'cl-9', type: 'claim', text: 'The internet has become a tool for surveillance, not liberation.', strength: 8, subject: 'social_studies', topicId: 'topic-9' },
  { id: 'cl-10', type: 'claim', text: 'Standardized tests measure test-taking ability, not true intelligence.', strength: 7, subject: 'social_studies', topicId: 'topic-10' },
  { id: 'cl-11', type: 'claim', text: 'Remote work has proven that productivity does not require a commute.', strength: 6, subject: 'social_studies', topicId: 'topic-11' },
  { id: 'cl-12', type: 'claim', text: 'Modern medicine has created a system that profits from sickness, not health.', strength: 7, subject: 'science', topicId: 'topic-12' },
  { id: 'cl-13', type: 'claim', text: 'GDP is a deeply flawed measure of a nation\'s true progress.', strength: 8, subject: 'social_studies', topicId: 'topic-13' },
  { id: 'cl-14', type: 'claim', text: 'Nuclear energy is the only realistic path to decarbonization at scale.', strength: 8, subject: 'science', topicId: 'topic-14' },
  { id: 'cl-15', type: 'claim', text: 'The UN has prevented a third World War, and that alone justifies its existence.', strength: 7, subject: 'social_studies', topicId: 'topic-15' },
  { id: 'cl-16', type: 'claim', text: 'Electric vehicles are only as clean as the grid that charges them.', strength: 7, subject: 'science', topicId: 'topic-16' },
  { id: 'cl-17', type: 'claim', text: 'Gender equality cannot be achieved without economic equality.', strength: 8, subject: 'social_studies', topicId: 'topic-17' },
  { id: 'cl-18', type: 'claim', text: 'Genetic engineering will create a two-tier society of enhanced and natural humans.', strength: 8, subject: 'science', topicId: 'topic-18' },
  { id: 'cl-19', type: 'claim', text: 'Open borders would reduce global poverty faster than any aid program.', strength: 7, subject: 'social_studies', topicId: 'topic-19' },
  { id: 'cl-20', type: 'claim', text: 'Capitalism without regulation inevitably leads to monopoly and exploitation.', strength: 8, subject: 'social_studies', topicId: 'topic-20' },
  { id: 'cl-21', type: 'claim', text: 'Smartphone addiction is the tobacco crisis of the 21st century.', strength: 7, subject: 'science', topicId: 'topic-21' },
  { id: 'cl-22', type: 'claim', text: 'Every language that dies takes irreplaceable knowledge with it.', strength: 7, subject: 'arts', topicId: 'topic-22' },
  { id: 'cl-23', type: 'claim', text: 'The metaverse is a corporate distraction from real-world problems.', strength: 6, subject: 'science', topicId: 'topic-23' },
  { id: 'cl-24', type: 'claim', text: 'The war on drugs has caused more harm than the drugs themselves.', strength: 8, subject: 'social_studies', topicId: 'topic-24' },
  { id: 'cl-25', type: 'claim', text: 'Mandatory voting would strengthen democracy, not weaken it.', strength: 6, subject: 'social_studies', topicId: 'topic-25' },
  { id: 'cl-26', type: 'claim', text: 'Fast fashion exploits workers and destroys ecosystems for disposable clothes.', strength: 8, subject: 'social_studies', topicId: 'topic-26' },
  { id: 'cl-27', type: 'claim', text: 'Ultra-processed food is the leading driver of the global obesity epidemic.', strength: 8, subject: 'science', topicId: 'topic-27' },
  { id: 'cl-28', type: 'claim', text: 'Granting rights to AI would undermine the concept of human rights entirely.', strength: 7, subject: 'social_studies', topicId: 'topic-28' },
  { id: 'cl-29', type: 'claim', text: 'Universal basic income is an inevitable response to automation.', strength: 7, subject: 'social_studies', topicId: 'topic-29' },
  { id: 'cl-30', type: 'claim', text: 'The greatest discoveries in human history are still ahead of us.', strength: 9, subject: 'science', topicId: 'topic-30' },

  // ===================== EVIDENCE CARDS (40) =====================
  { id: 'ev-1', type: 'evidence', text: 'Studies show average screen time tripled since 2010, while reported loneliness doubled.', strength: 8, subject: 'social_studies', topicId: 'topic-1' },
  { id: 'ev-2', type: 'evidence', text: 'The UK appointed a Minister of Loneliness in 2018 to combat an epidemic affecting 9 million people.', strength: 6, subject: 'social_studies', topicId: 'topic-1' },
  { id: 'ev-3', type: 'evidence', text: 'NASA estimates a crewed Mars mission could launch by 2040, but radiation exposure remains unsolved.', strength: 7, subject: 'science', topicId: 'topic-2' },
  { id: 'ev-4', type: 'evidence', text: 'The ISS has been continuously inhabited since 2000, proving long-term space habitation is possible.', strength: 6, subject: 'science', topicId: 'topic-2' },
  { id: 'ev-5', type: 'evidence', text: 'UNESCO reports that 258 million children worldwide still lack access to basic education technology.', strength: 8, subject: 'social_studies', topicId: 'topic-3' },
  { id: 'ev-6', type: 'evidence', text: 'Students using adaptive learning software improved test scores by 30% in randomized trials.', strength: 7, subject: 'science', topicId: 'topic-3' },
  { id: 'ev-7', type: 'evidence', text: 'Freedom House reports that global freedom has declined for 18 consecutive years.', strength: 9, subject: 'social_studies', topicId: 'topic-4' },
  { id: 'ev-8', type: 'evidence', text: 'Earth has already warmed 1.2 degrees C above pre-industrial levels, approaching the 1.5 degree limit.', strength: 9, subject: 'science', topicId: 'topic-5' },
  { id: 'ev-9', type: 'evidence', text: 'Renewable energy now provides 30% of global electricity, up from 10% in 2010.', strength: 7, subject: 'science', topicId: 'topic-5' },
  { id: 'ev-10', type: 'evidence', text: 'McKinsey estimates 800 million jobs could be displaced by automation by 2030.', strength: 8, subject: 'social_studies', topicId: 'topic-6' },
  { id: 'ev-11', type: 'evidence', text: 'The Industrial Revolution also displaced millions of jobs but ultimately created more new ones.', strength: 6, subject: 'social_studies', topicId: 'topic-6' },
  { id: 'ev-12', type: 'evidence', text: 'Global extreme poverty fell from 36% in 1990 to under 10% in 2020, largely due to trade.', strength: 8, subject: 'social_studies', topicId: 'topic-7' },
  { id: 'ev-13', type: 'evidence', text: 'NASA technology spinoffs include water purification, fire-resistant materials, and satellite medicine.', strength: 7, subject: 'science', topicId: 'topic-8' },
  { id: 'ev-14', type: 'evidence', text: 'Over 80% of the world\'s web content is in just 10 languages, excluding billions from digital knowledge.', strength: 7, subject: 'social_studies', topicId: 'topic-9' },
  { id: 'ev-15', type: 'evidence', text: 'Finland has minimal standardized testing yet consistently ranks among top education systems.', strength: 8, subject: 'social_studies', topicId: 'topic-10' },
  { id: 'ev-16', type: 'evidence', text: 'Stanford research found remote workers were 13% more productive than their office counterparts.', strength: 7, subject: 'social_studies', topicId: 'topic-11' },
  { id: 'ev-17', type: 'evidence', text: 'Life expectancy has nearly doubled in the last century, from 40 to 73 years globally.', strength: 8, subject: 'science', topicId: 'topic-12' },
  { id: 'ev-18', type: 'evidence', text: 'Bhutan uses Gross National Happiness instead of GDP and reports higher citizen satisfaction.', strength: 6, subject: 'social_studies', topicId: 'topic-13' },
  { id: 'ev-19', type: 'evidence', text: 'France generates 70% of its electricity from nuclear power with one of the lowest carbon footprints in Europe.', strength: 9, subject: 'science', topicId: 'topic-14' },
  { id: 'ev-20', type: 'evidence', text: 'Since the UN\'s founding, interstate wars have declined by 90% compared to the pre-UN era.', strength: 7, subject: 'social_studies', topicId: 'topic-15' },
  { id: 'ev-21', type: 'evidence', text: 'EV battery production requires mining cobalt, 70% of which comes from the Congo using child labor.', strength: 8, subject: 'social_studies', topicId: 'topic-16' },
  { id: 'ev-22', type: 'evidence', text: 'Women hold less than 27% of parliamentary seats worldwide despite being 50% of the population.', strength: 8, subject: 'social_studies', topicId: 'topic-17' },
  { id: 'ev-23', type: 'evidence', text: 'CRISPR has successfully treated sickle cell disease in clinical trials, curing patients.', strength: 9, subject: 'science', topicId: 'topic-18' },
  { id: 'ev-24', type: 'evidence', text: 'Research shows immigrants contribute more in taxes than they receive in public services.', strength: 7, subject: 'social_studies', topicId: 'topic-19' },
  { id: 'ev-25', type: 'evidence', text: 'The wealthiest 1% own more than the bottom 50% of the global population combined.', strength: 9, subject: 'social_studies', topicId: 'topic-20' },
  { id: 'ev-26', type: 'evidence', text: 'The average person checks their phone 96 times per day, up from 52 times in 2015.', strength: 7, subject: 'science', topicId: 'topic-21' },
  { id: 'ev-27', type: 'evidence', text: 'A language dies approximately every two weeks; of 7,000 languages, nearly half are endangered.', strength: 8, subject: 'arts', topicId: 'topic-22' },
  { id: 'ev-28', type: 'evidence', text: 'Meta invested over $36 billion in metaverse development while its user adoption remains below projections.', strength: 6, subject: 'science', topicId: 'topic-23' },
  { id: 'ev-29', type: 'evidence', text: 'Portugal decriminalized all drugs in 2001; drug-related deaths dropped by 80% over the following decade.', strength: 9, subject: 'social_studies', topicId: 'topic-24' },
  { id: 'ev-30', type: 'evidence', text: 'Australia has mandatory voting and consistently achieves 90%+ voter turnout.', strength: 7, subject: 'social_studies', topicId: 'topic-25' },
  { id: 'ev-31', type: 'evidence', text: 'The fashion industry produces 10% of global carbon emissions, more than aviation and shipping combined.', strength: 8, subject: 'science', topicId: 'topic-26' },
  { id: 'ev-32', type: 'evidence', text: 'Countries with the highest ultra-processed food consumption have the highest obesity rates.', strength: 8, subject: 'science', topicId: 'topic-27' },
  { id: 'ev-33', type: 'evidence', text: 'Saudi Arabia granted citizenship to robot Sophia in 2017, raising questions about AI personhood.', strength: 5, subject: 'social_studies', topicId: 'topic-28' },
  { id: 'ev-34', type: 'evidence', text: 'Finland\'s UBI pilot showed recipients were happier and healthier but not significantly more employed.', strength: 7, subject: 'social_studies', topicId: 'topic-29' },
  { id: 'ev-35', type: 'evidence', text: 'We have explored less than 5% of the ocean floor and mapped more of Mars than our own seabed.', strength: 8, subject: 'science', topicId: 'topic-30' },
  { id: 'ev-36', type: 'evidence', text: 'Social media movements like #MeToo and Arab Spring demonstrate the connective power of platforms.', strength: 7, subject: 'social_studies', topicId: 'topic-1' },
  { id: 'ev-37', type: 'evidence', text: 'A seven-month Mars journey would expose astronauts to radiation levels exceeding lifetime safety limits.', strength: 7, subject: 'science', topicId: 'topic-2' },
  { id: 'ev-38', type: 'evidence', text: 'The global gender pay gap stands at 20%, meaning women earn 80 cents for every dollar men earn.', strength: 7, subject: 'social_studies', topicId: 'topic-17' },
  { id: 'ev-39', type: 'evidence', text: 'Nuclear waste remains radioactive for up to 10,000 years, requiring permanent geological storage.', strength: 7, subject: 'science', topicId: 'topic-14' },
  { id: 'ev-40', type: 'evidence', text: 'The US spent over $1 trillion on the war on drugs since 1971, yet drug use rates remain unchanged.', strength: 9, subject: 'social_studies', topicId: 'topic-24' },

  // ===================== REASONING CARDS (30) =====================
  { id: 'rs-1', type: 'reasoning', text: 'If connection requires vulnerability, and screens remove vulnerability, then screens prevent true connection.', strength: 7, subject: 'social_studies', topicId: 'topic-1' },
  { id: 'rs-2', type: 'reasoning', text: 'Colonizing Mars before solving Earth\'s crises means exporting our problems rather than solving them.', strength: 7, subject: 'science', topicId: 'topic-2' },
  { id: 'rs-3', type: 'reasoning', text: 'Technology amplifies existing inequalities: those with access accelerate while those without fall further behind.', strength: 8, subject: 'social_studies', topicId: 'topic-3' },
  { id: 'rs-4', type: 'reasoning', text: 'Democracy requires an informed electorate, but misinformation makes informed consent increasingly impossible.', strength: 8, subject: 'social_studies', topicId: 'topic-4' },
  { id: 'rs-5', type: 'reasoning', text: 'If emissions must reach zero by 2050 but are still rising, the gap between ambition and action proves we are not there yet.', strength: 9, subject: 'science', topicId: 'topic-5' },
  { id: 'rs-6', type: 'reasoning', text: 'AI that replaces human judgment removes accountability, because algorithms cannot be held morally responsible.', strength: 7, subject: 'science', topicId: 'topic-6' },
  { id: 'rs-7', type: 'reasoning', text: 'When developing nations export raw materials and import finished goods, they remain dependent on wealthy nations.', strength: 7, subject: 'social_studies', topicId: 'topic-7' },
  { id: 'rs-8', type: 'reasoning', text: 'Investing in space forces us to solve problems like recycling, energy, and food production that benefit Earth.', strength: 7, subject: 'science', topicId: 'topic-8' },
  { id: 'rs-9', type: 'reasoning', text: 'When algorithms decide what we see, the internet becomes a tool of control rather than liberation.', strength: 8, subject: 'social_studies', topicId: 'topic-9' },
  { id: 'rs-10', type: 'reasoning', text: 'A test that can be gamed with preparation measures preparation skill, not knowledge or capability.', strength: 7, subject: 'social_studies', topicId: 'topic-10' },
  { id: 'rs-11', type: 'reasoning', text: 'If productivity stays the same without commuting, the commute was never necessary -- it was cultural inertia.', strength: 6, subject: 'social_studies', topicId: 'topic-11' },
  { id: 'rs-12', type: 'reasoning', text: 'A healthcare system that profits from treatment rather than prevention has a perverse incentive to keep people sick.', strength: 8, subject: 'science', topicId: 'topic-12' },
  { id: 'rs-13', type: 'reasoning', text: 'If GDP rises while citizens become unhappier, the metric has decoupled from its purpose of measuring wellbeing.', strength: 8, subject: 'social_studies', topicId: 'topic-13' },
  { id: 'rs-14', type: 'reasoning', text: 'The risks of nuclear disaster are concentrated and catastrophic, while the risks of climate change are distributed and certain.', strength: 8, subject: 'science', topicId: 'topic-14' },
  { id: 'rs-15', type: 'reasoning', text: 'Preventing wars between major powers is the most important single goal an international body can achieve.', strength: 7, subject: 'social_studies', topicId: 'topic-15' },
  { id: 'rs-16', type: 'reasoning', text: 'Shifting environmental damage from tailpipes to mines does not eliminate the problem, it relocates it.', strength: 8, subject: 'science', topicId: 'topic-16' },
  { id: 'rs-17', type: 'reasoning', text: 'Equal representation in leadership is both a cause and consequence of broader gender equality.', strength: 7, subject: 'social_studies', topicId: 'topic-17' },
  { id: 'rs-18', type: 'reasoning', text: 'If only the wealthy can afford genetic enhancements, biology becomes another axis of inequality.', strength: 8, subject: 'science', topicId: 'topic-18' },
  { id: 'rs-19', type: 'reasoning', text: 'Labor moves to where wages are highest; restricting movement traps talent in low-productivity economies.', strength: 7, subject: 'social_studies', topicId: 'topic-19' },
  { id: 'rs-20', type: 'reasoning', text: 'Unregulated markets concentrate power, and concentrated power undermines the free market itself.', strength: 8, subject: 'social_studies', topicId: 'topic-20' },
  { id: 'rs-21', type: 'reasoning', text: 'Devices designed to maximize engagement are optimized for addiction, not for the user\'s benefit.', strength: 7, subject: 'science', topicId: 'topic-21' },
  { id: 'rs-22', type: 'reasoning', text: 'Languages encode unique ecological knowledge; losing them means losing solutions to problems we haven\'t yet faced.', strength: 7, subject: 'arts', topicId: 'topic-22' },
  { id: 'rs-23', type: 'reasoning', text: 'A virtual world governed by a single corporation is not a new frontier but a digital company town.', strength: 7, subject: 'science', topicId: 'topic-23' },
  { id: 'rs-24', type: 'reasoning', text: 'Criminalizing addiction treats a health problem as a moral failing, which prevents people from seeking help.', strength: 8, subject: 'social_studies', topicId: 'topic-24' },
  { id: 'rs-25', type: 'reasoning', text: 'Voting is both a right and a civic duty; making it mandatory ensures all voices shape the destination.', strength: 6, subject: 'social_studies', topicId: 'topic-25' },
  { id: 'rs-26', type: 'reasoning', text: 'When clothes cost less than a coffee, someone else is paying the real price in wages or pollution.', strength: 8, subject: 'social_studies', topicId: 'topic-26' },
  { id: 'rs-27', type: 'reasoning', text: 'Foods engineered to be hyper-palatable override natural hunger signals, making overeating the default.', strength: 7, subject: 'science', topicId: 'topic-27' },
  { id: 'rs-28', type: 'reasoning', text: 'Rights historically expanded from property owners to all humans; extending them to AI follows no such moral logic.', strength: 7, subject: 'social_studies', topicId: 'topic-28' },
  { id: 'rs-29', type: 'reasoning', text: 'If machines can do the work, the question is not whether to distribute wealth, but how.', strength: 8, subject: 'social_studies', topicId: 'topic-29' },
  { id: 'rs-30', type: 'reasoning', text: 'Each discovery reveals how much more we don\'t know, meaning the journey of exploration is inherently infinite.', strength: 8, subject: 'science', topicId: 'topic-30' },

  // ===================== REBUTTAL CARDS (22) =====================
  { id: 'rb-1', type: 'rebuttal', text: 'Social media also reunites families, enables global activism, and gives voice to the marginalized.', strength: 7, subject: 'social_studies', topicId: 'topic-1' },
  { id: 'rb-2', type: 'rebuttal', text: 'Waiting until Earth is "fixed" means we may never leave -- no planet is ever perfectly ready.', strength: 7, subject: 'science', topicId: 'topic-2' },
  { id: 'rb-3', type: 'rebuttal', text: 'Technology is a tool; blaming the tool instead of unequal access misdiagnoses the problem.', strength: 6, subject: 'social_studies', topicId: 'topic-3' },
  { id: 'rb-4', type: 'rebuttal', text: 'Democracies self-correct through free elections; authoritarian regimes have no such mechanism.', strength: 7, subject: 'social_studies', topicId: 'topic-4' },
  { id: 'rb-5', type: 'rebuttal', text: 'Climate progress is accelerating exponentially; comparing today to yesterday underestimates momentum.', strength: 6, subject: 'science', topicId: 'topic-5' },
  { id: 'rb-6', type: 'rebuttal', text: 'AI also creates entirely new categories of work that didn\'t exist before, just as the internet did.', strength: 6, subject: 'science', topicId: 'topic-6' },
  { id: 'rb-7', type: 'rebuttal', text: 'Globalization also transferred knowledge and skills, enabling countries like South Korea to industrialize.', strength: 7, subject: 'social_studies', topicId: 'topic-7' },
  { id: 'rb-8', type: 'rebuttal', text: 'We can invest in both space and poverty; it is a false choice created by limited political will, not limited resources.', strength: 8, subject: 'social_studies', topicId: 'topic-8' },
  { id: 'rb-9', type: 'rebuttal', text: 'The internet has democratized publishing; anyone can now share knowledge without gatekeepers.', strength: 6, subject: 'social_studies', topicId: 'topic-9' },
  { id: 'rb-10', type: 'rebuttal', text: 'Without standardized measures, we cannot identify struggling schools or allocate resources fairly.', strength: 7, subject: 'social_studies', topicId: 'topic-10' },
  { id: 'rb-11', type: 'rebuttal', text: 'Innovation often happens through spontaneous in-person interaction that remote work cannot replicate.', strength: 6, subject: 'social_studies', topicId: 'topic-11' },
  { id: 'rb-12', type: 'rebuttal', text: 'Modern medicine has eradicated smallpox and nearly eliminated polio -- that is undeniable progress.', strength: 8, subject: 'science', topicId: 'topic-12' },
  { id: 'rb-13', type: 'rebuttal', text: 'GDP is imperfect but alternatives like happiness indices are subjective and easily manipulated.', strength: 6, subject: 'social_studies', topicId: 'topic-13' },
  { id: 'rb-14', type: 'rebuttal', text: 'Modern reactor designs are fundamentally different from Chernobyl; comparing them is technologically illiterate.', strength: 7, subject: 'science', topicId: 'topic-14' },
  { id: 'rb-15', type: 'rebuttal', text: 'The UN failed in Rwanda, Syria, and Yemen -- preventing some wars while ignoring others is not success.', strength: 8, subject: 'social_studies', topicId: 'topic-15' },
  { id: 'rb-16', type: 'rebuttal', text: 'Battery recycling technology is advancing rapidly and will close the mineral supply chain.', strength: 5, subject: 'science', topicId: 'topic-16' },
  { id: 'rb-17', type: 'rebuttal', text: 'Genetic editing to cure disease is fundamentally different from editing for enhancement; conflating them is misleading.', strength: 7, subject: 'science', topicId: 'topic-18' },
  { id: 'rb-18', type: 'rebuttal', text: 'Open borders without institutional capacity would overwhelm social services and create backlash against immigrants.', strength: 7, subject: 'social_studies', topicId: 'topic-19' },
  { id: 'rb-19', type: 'rebuttal', text: 'Regulated capitalism has produced the highest living standards in history; the problem is not the system but its capture.', strength: 7, subject: 'social_studies', topicId: 'topic-20' },
  { id: 'rb-20', type: 'rebuttal', text: 'Smartphones also provide access to education, healthcare, and banking for billions without physical infrastructure.', strength: 7, subject: 'science', topicId: 'topic-21' },
  { id: 'rb-21', type: 'rebuttal', text: 'UBI pilots are too small and short to prove long-term effects; scaling up could cause inflation.', strength: 6, subject: 'social_studies', topicId: 'topic-29' },
  { id: 'rb-22', type: 'rebuttal', text: 'Exploration is not just about discovery -- it is about the technologies, jobs, and inspiration created along the way.', strength: 7, subject: 'science', topicId: 'topic-30' },
];

// ---------------------------------------------------------------------------
// Accessors
// ---------------------------------------------------------------------------

export function getCardsForTopic(topicId: string): ArgumentCard[] {
  return CARDS.filter(c => c.topicId === topicId);
}

export function getRandomTopics(count: number): DebateTopicArena[] {
  const shuffled = [...DEBATE_TOPICS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
