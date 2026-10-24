/* Piano bank: the questions and the pieces for the piano course.
 *
 * Three things are worth knowing before editing this file.
 *
 * Questions are *generated* where the content is systematic -- every note on
 * the staff, every interval inside an octave, every key signature -- and
 * authored where it is not. A generated question still carries a real
 * explanation: the position of the note is computed from its staff degree, so
 * "F is the top line of the treble staff" is derived from the geometry rather
 * than typed beside it and left to drift.
 *
 * Every question is answered through one of three channels, and the engine
 * decides which from what the question carries rather than from a field here:
 * `read` (the staff is the question), `hear` (it is played and the staff is
 * hidden) and `find` (the answer is a key on the keyboard, so only questions
 * with a single `midi` qualify).
 *
 * `d1`..`d3` are the distractors, and each one is a specific mistake: the note
 * in the adjacent space, the interval a step away, the same chord with the
 * wrong quality. A distractor that is merely different teaches nothing when it
 * is chosen.
 */
(function () {
  'use strict';

  const BANK = [];
  let seq = 0;
  const add = q => { q.id = q.id || ('g' + (++seq)); BANK.push(q); };

  /* Pitch. MIDI 60 is middle C, and A4 is 69 -- the two anchors every other
     number in this file is derived from. */
  const NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  const LETTER = ['C', 'C', 'D', 'D', 'E', 'F', 'F', 'G', 'G', 'A', 'A', 'B'];
  const LETTER_AT = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
  const pc = m => ((m % 12) + 12) % 12;
  const nameOf = m => NAMES[pc(m)] + (Math.floor(m / 12) - 1);
  const letterOf = m => LETTER[pc(m)];
  const octaveOf = m => Math.floor(m / 12) - 1;

  /* The diatonic index counts lines and spaces, not semitones: C4 and C♯4 share
     one, because on the staff they share a position and differ only by an
     accidental. Every vertical placement in the renderer comes from this. */
  const diatonic = m => octaveOf(m) * 7 + LETTER_AT[pc(m)];
  const BOTTOM = { treble: 30, bass: 18 };   // E4 and G2: the bottom line of each staff
  const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth'];

  function positionOf(midi, clef) {
    const delta = diatonic(midi) - BOTTOM[clef || 'treble'];
    if (delta < 0) return 'on a ledger line below the staff';
    if (delta > 8) return 'on a ledger line above the staff';
    const line = delta % 2 === 0;
    const n = line ? delta / 2 + 1 : (delta + 1) / 2;
    return (line ? 'on the ' : 'in the ') + ORD[n - 1] + (line ? ' line' : ' space');
  }

  /* The letter of the note a mistake lands on. The neighbours are the ones a
     learner actually reaches: the adjacent line or space (a second away), the
     next line or space of the same kind (a third away), and the octave. */
  function letterDistractors(midi) {
    const right = letterOf(midi);
    const out = [];
    [2, 4, -2, -4, 1, -1, 12, -12].forEach(d => {
      const L = letterOf(midi + d);
      if (L !== right && out.indexOf(L) < 0) out.push(L);
    });
    return out.slice(0, 3);
  }

  /* ---------- notes on the staff ----------
   *
   * Tier 1 is the five lines and four spaces of each staff. Tier 2 adds the
   * ledger notes, which is where a beginner stops guessing and starts
   * counting. Tier 3 puts accidentals in front of them.
   */
  const IN_STAFF = {
    treble: [64, 65, 67, 69, 71, 72, 74, 76, 77],   // E4 .. F5
    bass: [43, 45, 47, 48, 50, 52, 53, 55, 57]      // G2 .. A3
  };
  const LEDGER = {
    treble: [60, 62, 79, 81],                       // C4 D4, G5 A5
    bass: [40, 41, 59, 60]                          // E2 F2, B3 C4
  };

  ['treble', 'bass'].forEach(clef => {
    IN_STAFF[clef].forEach(midi => {
      add({
        tier: 1, topic: 'names', kind: 'note', midi, clef,
        q: 'Which note is this?',
        staff: { clef, notes: [midi] },
        play: [midi],
        a: letterOf(midi),
        d1: letterDistractors(midi)[0], d2: letterDistractors(midi)[1], d3: letterDistractors(midi)[2],
        trap: 'Reading from the wrong line: the note is ' + positionOf(midi, clef) + '.',
        explain: letterOf(midi) + octaveOf(midi) + ' is ' + positionOf(midi, clef) +
          ' of the ' + clef + ' staff.'
      });
    });
    LEDGER[clef].forEach(midi => {
      add({
        tier: 2, topic: 'names', kind: 'note', midi, clef,
        q: 'Which note is this?',
        staff: { clef, notes: [midi] },
        play: [midi],
        a: letterOf(midi),
        d1: letterDistractors(midi)[0], d2: letterDistractors(midi)[1], d3: letterDistractors(midi)[2],
        trap: 'Ledger notes are counted outwards from the staff, one line or space at a time.',
        explain: letterOf(midi) + octaveOf(midi) + ' sits ' + positionOf(midi, clef) +
          '. Count outwards from the bottom line and do not skip a space.'
      });
    });
  });

  /* Accidentals: the same position, a different key. Tier 3. */
  [[61, 'treble'], [63, 'treble'], [66, 'treble'], [68, 'treble'], [70, 'treble'],
   [66, 'bass'], [68, 'bass'], [70, 'bass']].forEach(([midi, clef]) => {
    add({
      tier: 3, topic: 'names', kind: 'note', midi, clef,
      q: 'Which note is this?',
      staff: { clef, notes: [midi] },
      play: [midi],
      // The natural spelling is the mistake a learner makes by ignoring the
      // accidental, so it is always one option. The other two are the white
      // key above and the black key above that -- not the semitone below,
      // which for every sharp is the natural itself and would leave the
      // renderer with three options after de-duplicating.
      a: NAMES[pc(midi)],
      d1: letterOf(midi), d2: NAMES[pc(midi + 1)], d3: NAMES[pc(midi + 2)],
      trap: 'The accidental changes the key, not the line. The note is still ' +
        positionOf(midi, clef) + '.',
      explain: 'The accidental sits before the note head, so the position is unchanged: ' +
        positionOf(midi, clef) + ', raised or lowered by a semitone.'
    });
  });

  /* ---------- intervals ---------- */
  const INTERVALS = ['unison', 'minor 2nd', 'major 2nd', 'minor 3rd', 'major 3rd',
    'perfect 4th', 'tritone', 'perfect 5th', 'minor 6th', 'major 6th',
    'minor 7th', 'major 7th', 'octave'];
  const SEMIS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  /* Three wrong answers, each a real confusion: the interval a semitone out
     either way, and the one a third away -- major versus minor is the mistake
     learners actually make, and a third is where "counted the lines wrong"
     lands. The offsets are ordered so the nearest confusions come first, and
     a question at the end of the table (the octave) has no +1 or +2 to reach
     for, so it walks backwards instead. */
  function intervalNeighbours(i) {
    const out = [];
    [1, -1, 2, -2, 3, -3].forEach(d => {
      const j = i + d;
      if (j >= 0 && j < INTERVALS.length && out.indexOf(INTERVALS[j]) < 0) out.push(INTERVALS[j]);
      if (out.length === 3) return;
    });
    return out.slice(0, 3);
  }

  for (let i = 1; i < 13; i++) {
    [[60, 60 + i, 'up'], [72, 72 - i, 'down']].forEach(([lo, hi, dir]) => {
      const first = dir === 'up' ? lo : lo, second = hi;
      const a = INTERVALS[i];
      const d = intervalNeighbours(i);
      add({
        tier: i <= 5 ? 1 : i <= 9 ? 2 : 3,
        topic: 'intervals', kind: 'interval',
        q: 'Name this interval.',
        staff: { clef: 'treble', notes: [first, second], simul: true },
        play: [first, second],
        a,
        d1: d[0], d2: d[1], d3: d[2],
        trap: 'Count both ends: from C up to G is a fifth, not a fourth.',
        explain: 'From ' + nameOf(first) + ' ' + dir + ' to ' + nameOf(second) +
          ' is ' + SEMIS[i] + ' semitones, which is a ' + a + '.'
      });
    });
  }

  /* ---------- chords ---------- */
  const SHAPES = [
    ['major', [0, 4, 7], 'a major third then a minor third'],
    ['minor', [0, 3, 7], 'a minor third then a major third'],
    ['diminished', [0, 3, 6], 'two minor thirds'],
    ['augmented', [0, 4, 8], 'two major thirds']
  ];
  const ROOTS = [60, 65, 67];   // C, F, G

  ROOTS.forEach(root => {
    SHAPES.forEach(([quality, shape, recipe]) => {
      const notes = shape.map(s => root + s);
      const others = SHAPES.filter(s => s[0] !== quality).map(s => s[0]);
      add({
        tier: quality === 'major' || quality === 'minor' ? 1 : 3,
        topic: 'chords', kind: 'chord',
        q: 'Name this chord.',
        staff: { clef: 'treble', notes, simul: true },
        play: notes,
        a: letterOf(root) + ' ' + quality,
        d1: letterOf(root) + ' ' + others[0],
        d2: letterOf(root) + ' ' + others[1],
        d3: letterOf(root + 5) + ' ' + quality,
        trap: 'The quality is set by the third: a major triad has a major third above the root.',
        explain: 'A ' + quality + ' triad is built from ' + recipe +
          '. Here that is ' + notes.map(nameOf).join(', ') + '.'
      });
    });
  });

  /* Inversions of one chord, so the answer is about the bass note rather than
     about the chord. */
  [['root position', [60, 64, 67], 'C is in the bass'],
   ['first inversion', [64, 67, 72], 'E is in the bass'],
   ['second inversion', [67, 72, 76], 'G is in the bass']].forEach(([pos, notes, bass]) => {
    add({
      tier: 2, topic: 'chords', kind: 'chord',
      q: 'Which position is this C major triad in?',
      staff: { clef: 'treble', notes, simul: true },
      play: notes,
      a: pos,
      d1: ['root position', 'first inversion', 'second inversion'].filter(p => p !== pos)[0],
      d2: ['root position', 'first inversion', 'second inversion'].filter(p => p !== pos)[1],
      d3: 'not a triad',
      trap: 'The chord is named by its root, and the position by its lowest note.',
      explain: 'Same three notes, different order: ' + bass +
        ', which makes it ' + pos + '.'
    });
  });

  add({
    tier: 3, topic: 'chords', kind: 'chord',
    q: 'Name this chord.',
    staff: { clef: 'treble', notes: [67, 71, 74, 77], simul: true },
    play: [67, 71, 74, 77],
    a: 'G dominant seventh',
    d1: 'G major seventh', d2: 'G minor seventh', d3: 'D diminished seventh',
    trap: 'A dominant seventh takes a minor seventh above the root; a major seventh is a semitone higher.',
    explain: 'G major triad (G B D) plus F, the minor seventh above G. That F is what makes it dominant.'
  });

  /* ---------- key signatures ---------- */
  const MAJORS = [['G', 1, 0], ['D', 2, 0], ['A', 3, 0], ['E', 4, 0], ['B', 5, 0],
    ['F♯', 6, 0], ['C♯', 7, 0],
    ['F', 0, 1], ['B♭', 0, 2], ['E♭', 0, 3], ['A♭', 0, 4], ['D♭', 0, 5],
    ['G♭', 0, 6], ['C♭', 0, 7]];
  const count = (n, kind) => n + ' ' + kind + (n === 1 ? '' : 's');
  const spell = (sharp, flat) => sharp ? count(sharp, 'sharp') : flat ? count(flat, 'flat') : 'none';

  // The first twelve entries are the circle of fifths, sharp side first; the
  // last two (G♭ and C♭) are enharmonic spellings of keys already in the list,
  // so a distractor drawn by stepping around the circle would sometimes name
  // the same key twice. Twelve, not fourteen, is the length of that circle.
  const CIRCLE = 12;
  MAJORS.forEach(([key, sharp, flat], i) => {
    const right = spell(sharp, flat);
    const alts = sharp
      ? [count(Math.max(sharp - 1, 0), 'sharp'), count(sharp + 1, 'sharp'), count(sharp, 'flat')]
      : flat
        ? [count(Math.max(flat - 1, 0), 'flat'), count(flat + 1, 'flat'), count(flat, 'sharp')]
        : [count(1, 'sharp'), count(1, 'flat'), count(2, 'sharps')];
    add({
      tier: 1, topic: 'scales', kind: 'text',
      q: 'How many sharps or flats does ' + key + ' major have?',
      a: right, d1: alts[0], d2: alts[1], d3: alts[2],
      trap: 'The order of sharps is F C G D A E B; flats run the other way, B E A D G C F.',
      explain: key + ' major has ' + right + '. The sharps arrive in the order F C G D A E B, ' +
        'so a key with ' + (sharp || flat) + ' of them takes the first ' + (sharp || flat) + ' of that list.'
    });

    add({
      tier: 2, topic: 'scales', kind: 'text',
      q: 'Which major key has ' + right + '?',
      // Distractors step around the circle of fifths, which is what a learner
      // is being asked to do in their head -- three, seven and ten steps away
      // are all plausible answers to "how many sharps?", and each is the
      // answer for a different key. The offsets are coprime with 12 where it
      // matters, so the three land on three different keys.
      a: key + ' major',
      d1: MAJORS[(i + 3) % CIRCLE][0] + ' major',
      d2: MAJORS[(i + 7) % CIRCLE][0] + ' major',
      d3: MAJORS[(i + 10) % CIRCLE][0] + ' major',
      trap: 'Count around the circle of fifths: each step clockwise adds a sharp, anticlockwise a flat.',
      explain: key + ' major has ' + right + '. Moving a fifth up adds a sharp; a fifth down adds a flat.'
    });
  });

  /* ---------- the keyboard ---------- */
  const KEYBOARD = [
    ['How many white keys are there in one octave?', '7', ['5', '8', '12'],
      'The white keys are the seven letter names, C to B.', 'White keys: C D E F G A B. The eighth white key is C again, an octave up.'],
    ['How many black keys are there in one octave?', '5', ['7', '6', '12'],
      'Count the groups: two black keys, then three.', 'Black keys come in a group of two and a group of three, so five in the octave.'],
    ['Which pair of white keys has no black key between them?', 'E and F', ['C and D', 'F and G', 'A and B'],
      'Look at where the groups of two and three black keys sit.', 'E–F and B–C are the two places with no black key, because those pairs are a semitone apart already.'],
    ['Which pair of white keys has no black key between them?', 'B and C', ['D and E', 'G and A', 'A and B'],
      'There are two such pairs; this is the other one.', 'E–F and B–C are the two places with no black key.'],
    ['A black key takes the name of the white key to its left, raised by a semitone. What is the black key between C and D called?', 'C♯', ['D♭ only', 'E♭', 'B♯'],
      'A black key has two names, one from each neighbour.', 'The key between C and D is C♯ (C raised) and also D♭ (D lowered). Both names are correct; this one is C♯.'],
    ['How many keys does a full-size piano have?', '88', ['61', '76', '96'],
      'It is a round number of keys, not of octaves.', 'A standard piano has 88 keys: 52 white and 36 black, seven and a quarter octaves from A0 to C8.'],
    ['In right-hand five-finger position on C, which finger plays C?', '1 (thumb)', ['2 (index)', '3 (middle)', '5 (little)'],
      'Fingers are numbered from the thumb outwards.', 'The thumb is finger 1 and the little finger is 5, so C in C position is played by the thumb.'],
    ['Where is middle C on the piano?', 'The C nearest the middle of the keyboard', ['The lowest C', 'The highest C', 'Any C'],
      'It is named for where it sits, not for how it sounds.', 'Middle C is C4, the C nearest the centre, and it is written on a ledger line between the treble and bass staves.'],
    ['Which white key is immediately to the left of a group of two black keys?', 'C', ['D', 'F', 'A'],
      'The group of two black keys sits above C and D.', 'The two black keys are C♯ and D♯, so the white key to their left is C.'],
    ['Which white key is immediately to the left of a group of three black keys?', 'F', ['G', 'A', 'B'],
      'The group of three sits above F, G and A.', 'The three black keys are F♯, G♯ and A♯, so the white key to their left is F.']
  ];
  KEYBOARD.forEach(([q, a, d, trap, explain], i) => add({
    tier: i < 4 ? 1 : i < 8 ? 2 : 3, topic: 'keys', kind: 'text',
    q, a, d1: d[0], d2: d[1], d3: d[2], trap, explain
  }));

  /* ---------- the staff ---------- */
  const STAFF = [
    ['How many lines does a staff have?', '5', ['4', '6', '7'],
      'Count the lines, not the spaces.', 'Five lines and the four spaces between them; a note is on a line or in a space, never on both.'],
    ['How many spaces are there between the lines of a staff?', '4', ['5', '3', '6'],
      'One fewer than the number of lines.', 'Four spaces sit between the five lines. The space above and the space below the staff are ledger spaces.'],
    ['Which clef curls around the second line from the bottom?', 'treble', ['bass', 'alto', 'tenor'],
      'The curl marks the line the clef names.', 'The treble clef is a G clef: its spiral wraps the second line from the bottom, which is G.'],
    ['Which clef is also called the F clef?', 'bass', ['treble', 'alto', 'soprano'],
      'The two dots of this clef sit either side of a line.', 'The bass clef is an F clef; its two dots bracket the second line from the top, which is F.'],
    ['In treble clef, which note is on the second line from the bottom?', 'G', ['E', 'B', 'D'],
      'That line is the one the clef curls around.', 'The treble clef curls around G, so the second line from the bottom is G4.'],
    ['In bass clef, which note is on the bottom line?', 'G', ['E', 'C', 'A'],
      'The bass staff starts lower than the treble staff by one line and a space.', 'The bottom line of the bass staff is G2.'],
    ['In treble clef, which note is in the space below the staff?', 'D', ['C', 'E', 'B'],
      'The space below the bottom line is one step down from it.', 'The bottom line is E4, so the space below it is D4.'],
    ['The grand staff joins which two clefs?', 'treble and bass', ['treble and alto', 'bass and tenor', 'alto and tenor'],
      'It is what piano music is written on.', 'Piano music uses the grand staff: treble for the right hand, bass for the left, joined by a brace.'],
    ['Which line does the treble clef curl around?', 'the second from the bottom', ['the bottom line', 'the middle line', 'the top line'],
      'The curl is the whole point of the symbol.', 'The treble clef is a G clef and its curl marks the second line from the bottom as G.']
  ];
  STAFF.forEach(([q, a, d, trap, explain], i) => add({
    tier: i < 4 ? 1 : i < 8 ? 2 : 3, topic: 'staff', kind: 'text',
    q, a, d1: d[0], d2: d[1], d3: d[2], trap, explain
  }));

  /* ---------- rhythm ---------- */
  const RHYTHM = [
    ['How many crotchet (quarter-note) beats is a semibreve (whole note) worth?', '4', ['2', '3', '8'],
      'Double the minim.', 'A semibreve is worth four crotchets, or two minims, or one bar of 4/4.',
      [{ v: 'w' }]],
    ['How many crotchet beats is a minim (half note) worth?', '2', ['1', '4', '3'],
      'Half of a semibreve.', 'A minim is worth two crotchets, so it fills half of a 4/4 bar.',
      [{ v: 'h' }]],
    ['How many quavers (eighth notes) are in a crotchet?', '2', ['1', '4', '3'],
      'The quaver is the next value down.', 'Two quavers make one crotchet, because each halving of a note value doubles the count.',
      [{ v: 'q' }]],
    ['How many semiquavers (sixteenth notes) are in a quaver?', '2', ['4', '1', '3'],
      'Each step down the tree doubles again.', 'Two semiquavers make a quaver, so four make a crotchet.',
      [{ v: 'e' }]],
    ['What does a dot after a note do?', 'adds half the note\'s value', ['doubles its value', 'shortens it by half', 'raises it a semitone'],
      'A dot adds, it does not multiply.', 'A dot adds half the note\'s own value: a dotted minim is two crotchets plus one, so three.',
      [{ v: 'h', dot: true }]],
    ['How many crotchet beats is a dotted minim worth?', '3', ['2', '4', '1.5'],
      'Two plus half of two.', 'A minim is two crotchets; the dot adds one more, so three.',
      [{ v: 'h', dot: true }]],
    ['In 4/4 time, how many crotchet beats are in a bar?', '4', ['3', '2', '6'],
      'The top number of the time signature is the count.', 'In 4/4 the top number says four beats to the bar, and the bottom 4 says the crotchet is the beat.',
      null],
    ['In 3/4 time, how many crotchet beats are in a bar?', '3', ['4', '2', '6'],
      'A waltz is in this time.', 'Three crotchet beats to the bar, counted one-two-three.',
      null],
    ['In 6/8 time, what does the 8 tell you?', 'the quaver is the beat unit', ['there are eight beats', 'the piece is in eight', 'the tempo is 8'],
      'The bottom number names the note value that gets one beat.', 'In 6/8 the bottom 8 means the quaver is the unit and the top 6 means six of them per bar, felt as two groups of three.',
      null],
    ['What does a rest mean?', 'silence for that value', ['hold the note longer', 'play softer', 'repeat the bar'],
      'It is a note of silence with a value of its own.', 'A rest has a value like a note, but nothing sounds. A semibreve rest fills a whole 4/4 bar.',
      [{ v: 'w', rest: true }]],
    ['How many crotchet beats of silence is a minim rest?', '2', ['1', '4', '3'],
      'The rest matches the note of the same name.', 'A minim rest is worth two crotchets of silence, the same as a minim note.',
      [{ v: 'h', rest: true }]],
    ['Which is longer: a dotted crotchet or a minim?', 'a minim', ['a dotted crotchet', 'they are equal', 'it depends on tempo'],
      'A dot adds half, so a dotted crotchet is one and a half.', 'A dotted crotchet is 1.5 crotchets; a minim is 2.',
      [{ v: 'q', dot: true }, { v: 'h' }]]
  ];
  RHYTHM.forEach(([q, a, d, trap, explain, rhythm], i) => add({
    tier: i < 4 ? 1 : i < 9 ? 2 : 3, topic: 'rhythm', kind: 'text',
    q, a, d1: d[0], d2: d[1], d3: d[2], trap, explain,
    rhythm: rhythm || null
  }));

  /* ---------- scales ---------- */
  const SCALES = [
    ['How many different notes are in a major scale before it repeats the first?', '7', ['8', '5', '12'],
      'Count the letters, not the octave.', 'Seven different notes; the eighth note is the first one again, an octave higher.'],
    ['In a major scale, between which degrees are the semitones?', '3–4 and 7–8', ['1–2 and 5–6', '2–3 and 5–6', '4–5 and 6–7'],
      'The pattern is tone tone semitone tone tone tone semitone.', 'Major: T T S T T T S. The semitones fall between the third and fourth degrees and between the seventh and the octave.'],
    ['In a natural minor scale, between which degrees are the semitones?', '2–3 and 5–6', ['3–4 and 7–8', '1–2 and 4–5', '6–7 and 7–8'],
      'Minor is the major pattern started from its sixth degree.', 'Natural minor: T S T T S T T. The semitones are between 2–3 and 5–6.'],
    ['How many sharps or flats does C major have?', 'none', ['1 sharp', '1 flat', '2 sharps'],
      'C major is the scale you get by playing only white keys.', 'C major is all naturals: no sharps, no flats.'],
    ['The relative minor of C major is...', 'A minor', ['C minor', 'E minor', 'G minor'],
      'It starts on the sixth degree of the major scale.', 'A minor shares C major\'s key signature and starts on A, the sixth degree.'],
    ['The relative minor of G major is...', 'E minor', ['B minor', 'D minor', 'G minor'],
      'Count down to the sixth degree.', 'E is the sixth degree of G major, so E minor shares its one sharp.'],
    ['A harmonic minor scale raises which degree?', 'the seventh', ['the third', 'the sixth', 'the fourth'],
      'It is done to make the leading tone pull harder.', 'Harmonic minor raises the seventh by a semitone, creating a leading tone a semitone below the tonic.'],
    ['What is the tonic of a scale?', 'the first and last note', ['the loudest note', 'the fifth degree', 'the key signature'],
      'It is the note the scale is named after.', 'The tonic is the home note: the scale starts and ends on it, and the key is named for it.']
  ];
  SCALES.forEach(([q, a, d, trap, explain], i) => add({
    tier: i < 2 ? 1 : i < 5 ? 2 : 3, topic: 'scales', kind: 'text',
    q, a, d1: d[0], d2: d[1], d3: d[2], trap, explain
  }));

  /* ---------- harmony ---------- */
  const HARMONY = [
    ['In C major, which chord is the dominant?', 'G major', ['F major', 'A minor', 'C major'],
      'The dominant is built on the fifth degree.', 'The fifth degree of C major is G, so the dominant chord is G major (G B D).'],
    ['In C major, which chord is the subdominant?', 'F major', ['G major', 'D minor', 'E minor'],
      'It is a fifth below the tonic, or a fourth above.', 'The fourth degree of C major is F, so the subdominant is F major (F A C).'],
    ['A perfect cadence moves from which chord to which?', 'V to I', ['I to V', 'IV to I', 'ii to V'],
      'It is the full stop of harmony.', 'V–I is the perfect (authentic) cadence: the dominant resolves to the tonic and the music feels finished.'],
    ['A plagal cadence moves from which chord to which?', 'IV to I', ['V to I', 'I to IV', 'vi to IV'],
      'It is the "amen" cadence.', 'IV–I is the plagal cadence. Softer than V–I, and the one sung at the end of a hymn.'],
    ['The leading tone of C major is...', 'B', ['G', 'D', 'F'],
      'It is a semitone below the tonic.', 'B is a semitone below C, so it leads back up to the tonic.'],
    ['In C major, the chord built on A is...', 'A minor', ['A major', 'A diminished', 'A seventh'],
      'The chord on the sixth degree of a major key is minor.', 'Degrees ii, iii and vi of a major key take minor triads. A–C–E is A minor.'],
    ['What does the Roman numeral I mean in a chord progression?', 'the chord on the first degree', ['the first inversion', 'the loudest chord', 'the first bar'],
      'Upper case means major, lower case minor.', 'Roman numerals name the scale degree the chord is built on; the case tells you whether the triad is major or minor.'],
    ['A deceptive cadence moves from V to which chord?', 'vi', ['I', 'IV', 'ii'],
      'It resolves, but not where you expect.', 'V–vi is the deceptive cadence: the dominant resolves to the minor sixth instead of the tonic.'],
    ['In C major, which chord is the mediant?', 'E minor', ['D minor', 'F major', 'A minor'],
      'It sits halfway between tonic and dominant.', 'The third degree of C major is E, so the mediant is E minor (E G B).']
  ];
  HARMONY.forEach(([q, a, d, trap, explain], i) => add({
    tier: i < 2 ? 1 : i < 6 ? 2 : 3, topic: 'harmony', kind: 'text',
    q, a, d1: d[0], d2: d[1], d3: d[2], trap, explain
  }));

  /* ---------- sight-reading and playing ---------- */
  const PRACTICE = [
    ['Before you play the first note of a piece, what should you check?', 'the key signature and the time signature',
      ['the title', 'the last bar', 'the tempo marking only'],
      'Both sit at the start of the first line.', 'The key signature tells you which notes are sharp or flat throughout; the time signature tells you how the bar divides.'],
    ['When sight-reading, where should your eyes be?', 'a little ahead of your hands',
      ['on your hands', 'on the last note you played', 'closed'],
      'Reading ahead is what makes the playing sound unhurried.', 'Look a bar or a beat ahead so the hands arrive already knowing where to go.'],
    ['What does "forte" mean?', 'loud', ['soft', 'fast', 'smooth'],
      'It is the Italian word for strong.', 'Forte (f) means loud. Piano (p) means soft, which is where the instrument gets its name.'],
    ['What does "piano" mean as a dynamic marking?', 'soft', ['loud', 'slow', 'the instrument'],
      'It is the opposite of forte.', 'Piano (p) means soft. The instrument is the pianoforte: soft-loud, because it could do both.'],
    ['What does the sustain pedal do?', 'holds the sound after you release the key',
      ['makes the sound louder', 'lowers the volume', 'changes the pitch'],
      'It lifts the dampers off the strings.', 'The right pedal lifts every damper, so the strings keep ringing after the key comes up.'],
    ['What does "legato" mean?', 'smoothly connected', ['short and detached', 'loud', 'fast'],
      'The opposite is staccato.', 'Legato means the notes run into one another, with no silence between them.'],
    ['What does "staccato" mean?', 'short and detached', ['smoothly connected', 'very soft', 'held longer'],
      'A dot above or below the note head.', 'Staccato notes are shortened, leaving silence between them.'],
    ['What does "crescendo" mean?', 'gradually louder', ['gradually softer', 'faster', 'slower'],
      'It is the same root as "increase".', 'Crescendo means growing louder; diminuendo or decrescendo means growing softer.'],
    ['Which hand usually plays the bass clef on a piano?', 'the left', ['the right', 'both equally', 'neither'],
      'The grand staff is split by pitch.', 'The left hand takes the bass staff, which is the lower half of the grand staff.'],
    ['What is a metronome for?', 'keeping a steady beat', ['tuning the piano', 'turning the pages', 'measuring loudness'],
      'It ticks, and you play to the tick.', 'A metronome marks a steady pulse in beats per minute, so a piece can be practised slowly and evenly.'],
    ['Why practise slowly?', 'so the fingers learn the right movement', ['because fast playing is bad', 'to save time', 'because the music is slow'],
      'Accuracy first, speed later.', 'Slow practice builds the correct movement; speed added to a wrong movement only makes the mistake faster.'],
    ['What is a phrase in music?', 'a musical sentence', ['a single note', 'a repeat sign', 'a key change'],
      'It is shaped like a sentence, with a beginning and an end.', 'A phrase is a short musical thought, often four or eight bars, that rises and falls like a spoken sentence.']
  ];
  PRACTICE.forEach(([q, a, d, trap, explain], i) => add({
    tier: i < 4 ? 1 : i < 9 ? 2 : 3, topic: 'playing', kind: 'text',
    q, a, d1: d[0], d2: d[1], d3: d[2], trap, explain
  }));

  /* Sight-reading as a topic of its own: the same staff, read in motion. */
  [[64, 'treble', 'second from the bottom'], [77, 'treble', 'top line'],
   [72, 'treble', 'third space'], [60, 'bass', 'ledger line above'],
   [57, 'bass', 'top line'], [43, 'bass', 'bottom line']].forEach(([midi, clef, where]) => {
    add({
      tier: 2, topic: 'sight', kind: 'note', midi, clef,
      q: 'Read this note without counting from the bottom. Which is it?',
      staff: { clef, notes: [midi] },
      play: [midi],
      a: letterOf(midi),
      d1: letterDistractors(midi)[0], d2: letterDistractors(midi)[1], d3: letterDistractors(midi)[2],
      trap: 'Sight-reading means recognising the position at a glance; counting is the fallback, not the method.',
      explain: letterOf(midi) + octaveOf(midi) + ' is the ' + where + ' of the ' + clef +
        ' staff. Learn the four anchor notes and read outwards from them.'
    });
  });

  /* ---------- pieces ----------
   *
   * Public-domain melodies, one hand, in order of difficulty. `m` is MIDI and
   * `b` is beats; nothing else is stored, so a piece is a line of numbers and
   * the page derives everything else. Tempo is a starting point, not a target:
   * the play stage waits for the learner rather than the clock.
   */
  const n = (m, b) => ({ m, b });

  const PIECES = [
    {
      id: 'cscale', title: 'C major scale', note: 'Eight notes, one octave. Right hand.',
      notes: [n(60, 1), n(62, 1), n(64, 1), n(65, 1), n(67, 1), n(69, 1), n(71, 1), n(72, 1)]
    },
    {
      id: 'hotcross', title: 'Hot Cross Buns', note: 'Three notes. The first tune most people learn.',
      notes: [n(64, 2), n(62, 2), n(60, 4), n(64, 2), n(62, 2), n(60, 4),
        n(60, 1), n(60, 1), n(60, 2), n(60, 2), n(62, 1), n(62, 1), n(62, 2), n(62, 2),
        n(64, 2), n(62, 2), n(60, 4)]
    },
    {
      id: 'auclair', title: 'Au clair de la lune', note: 'A French folk tune, still mostly stepwise.',
      notes: [n(60, 1), n(60, 1), n(60, 1), n(62, 1), n(64, 2), n(62, 2),
        n(60, 1), n(64, 1), n(62, 1), n(62, 1), n(60, 4)]
    },
    {
      id: 'mary', title: 'Mary Had a Little Lamb', note: 'The first tune with a leap in it.',
      notes: [n(64, 1), n(62, 1), n(60, 1), n(62, 1), n(64, 1), n(64, 1), n(64, 2),
        n(62, 1), n(62, 1), n(62, 2), n(64, 1), n(67, 1), n(67, 2),
        n(64, 1), n(62, 1), n(60, 1), n(62, 1), n(64, 1), n(64, 1), n(64, 1), n(64, 1),
        n(62, 1), n(62, 1), n(64, 1), n(62, 1), n(60, 4)]
    },
    {
      id: 'lightly', title: 'Lightly Row', note: 'Steps and one repeated note per phrase.',
      notes: [n(67, 1), n(64, 1), n(64, 2), n(65, 1), n(62, 1), n(62, 2),
        n(60, 1), n(62, 1), n(64, 1), n(65, 1), n(67, 1), n(67, 1), n(67, 2)]
    },
    {
      id: 'twinkle', title: 'Twinkle, Twinkle', note: 'A fifth, then a scale down. The whole tune in one page.',
      notes: [n(60, 1), n(60, 1), n(67, 1), n(67, 1), n(69, 1), n(69, 1), n(67, 2),
        n(65, 1), n(65, 1), n(64, 1), n(64, 1), n(62, 1), n(62, 1), n(60, 2)]
    },
    {
      id: 'frere', title: 'Frère Jacques', note: 'Four phrases; the last two drop below the staff.',
      notes: [n(60, 1), n(62, 1), n(64, 1), n(60, 1), n(60, 1), n(62, 1), n(64, 1), n(60, 1),
        n(64, 1), n(65, 1), n(67, 2), n(64, 1), n(65, 1), n(67, 2),
        n(67, 0.5), n(69, 0.5), n(67, 0.5), n(65, 0.5), n(64, 1), n(60, 1),
        n(67, 0.5), n(69, 0.5), n(67, 0.5), n(65, 0.5), n(64, 1), n(60, 1),
        n(60, 1), n(55, 1), n(60, 2), n(60, 1), n(55, 1), n(60, 2)]
    },
    {
      id: 'ode', title: 'Ode to Joy', note: 'Beethoven, in C. Four phrases, no note outside the staff.',
      notes: [n(64, 1), n(64, 1), n(65, 1), n(67, 1), n(67, 1), n(65, 1), n(64, 1), n(62, 1),
        n(60, 1), n(60, 1), n(62, 1), n(64, 1), n(64, 1.5), n(62, 0.5), n(62, 2),
        n(64, 1), n(64, 1), n(65, 1), n(67, 1), n(67, 1), n(65, 1), n(64, 1), n(62, 1),
        n(60, 1), n(60, 1), n(62, 1), n(64, 1), n(62, 1.5), n(60, 0.5), n(60, 2)]
    }
  ];

  window.PIANO_BANK = BANK;
  window.PIANO_PIECES = PIECES;
})();
