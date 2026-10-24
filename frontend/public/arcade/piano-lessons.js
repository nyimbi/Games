/* Lessons for the piano course.
 *
 * Same shape as the science lessons, and the same rule applies: a lesson is
 * written for the screen that teaches, not derived from the bank. The worked
 * example deliberately uses notes the bank never asks about, so reading the
 * lesson cannot hand over an answer.
 *
 * Each lesson carries two inline SVG figures. They are drawn on a 320x150
 * grid so they scale to a phone without reflowing, and they are real
 * diagrams -- a staff with its lines labelled, a keyboard with its key names --
 * not decoration.
 */
(function () {
  'use strict';

  const INK = '#191c3a', PAPER = '#fffdf8', MUTED = '#6d7194', ACCENT = '#c1272d';
  const mono = 'font-family="ui-monospace,Menlo,monospace"';

  /* A staff of five lines with the given notes drawn on it. `notes` are
     {step, label} where step counts lines and spaces from the bottom line
     (0 = bottom line, 1 = space above it, and so on; negative is below).
     Kept here rather than in the engine because a lesson figure is fixed
     content: it should not move when the engine's layout changes. */
  function staffSvg(opts) {
    const { notes = [], clef = 'treble', caption = '', w = 320, h = 150 } = opts;
    const left = 46, right = w - 20, top = 42, gap = 12;
    const lines = [0, 1, 2, 3, 4].map(i =>
      `<line x1="${left}" y1="${top + i * gap}" x2="${right}" y2="${top + i * gap}" stroke="${INK}" stroke-width="1.4"/>`).join('');
    const clefMark = clef === 'treble'
      ? `<text x="${left - 34}" y="${top + gap * 4 + 6}" ${mono} font-size="46" fill="${INK}">𝄞</text>`
      : `<text x="${left - 34}" y="${top + gap * 4 + 4}" ${mono} font-size="38" fill="${INK}">𝄢</text>`;
    const span = notes.length ? notes[notes.length - 1].step : 8;
    const dots = notes.map((n, i) => {
      const x = left + 62 + i * (notes.length > 1 ? Math.min(52, (right - left - 90) / (notes.length - 1)) : 0);
      const y = top + gap * 4 - n.step * (gap / 2);
      const ledger = n.step < 0 || n.step > 8
        ? `<line x1="${x - 11}" y1="${y}" x2="${x + 11}" y2="${y}" stroke="${INK}" stroke-width="1.4"/>` : '';
      // A figure that says "C minor: C E♭ G" has to show the flat, or it is a
      // picture of three notes with the one fact the caption is about missing.
      const sign = n.sign
        ? `<text x="${x - 20}" y="${y + 4}" ${mono} font-size="13" font-weight="800" fill="${INK}">${n.sign}</text>` : '';
      const label = n.label
        ? `<text x="${x}" y="${h - 6}" text-anchor="middle" ${mono} font-size="10" font-weight="700" fill="${MUTED}">${n.label}</text>` : '';
      return `${ledger}${sign}<ellipse cx="${x}" cy="${y}" rx="6.4" ry="4.6" fill="${INK}" transform="rotate(-14 ${x} ${y})"/>${label}`;
    }).join('');
    const cap = caption ? `<text x="${w / 2}" y="16" text-anchor="middle" ${mono} font-size="10" font-weight="800" fill="${INK}">${caption}</text>` : '';
    return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${caption}">${cap}${lines}${clefMark}${dots}</svg>`;
  }

  /* A slice of keyboard. `from` and `to` are MIDI; white keys are laid out by
     their letter and black keys sit between them, which is what makes the
     two-then-three pattern visible. */
  function keysSvg(opts) {
    const { from = 60, to = 72, mark = [], labels = true, w = 320, h = 130 } = opts;
    const whites = [], blacks = [];
    for (let m = from; m <= to; m++) {
      const p = ((m % 12) + 12) % 12;
      if ([1, 3, 6, 8, 10].indexOf(p) < 0) whites.push(m);
    }
    const kw = (w - 20) / whites.length, kh = h - 46;
    let html = '';
    whites.forEach((m, i) => {
      const x = 10 + i * kw, on = mark.indexOf(m) >= 0;
      html += `<rect x="${x}" y="20" width="${kw - 2}" height="${kh}" rx="3" fill="${on ? ACCENT : PAPER}" stroke="${INK}" stroke-width="1.4"/>`;
      if (labels) {
        const nm = ['C', 'D', 'E', 'F', 'G', 'A', 'B'][[0, 2, 4, 5, 7, 9, 11].indexOf(((m % 12) + 12) % 12)];
        html += `<text x="${x + (kw - 2) / 2}" y="${20 + kh - 8}" text-anchor="middle" ${mono} font-size="10" font-weight="800" fill="${on ? PAPER : MUTED}">${nm}</text>`;
      }
      blacks.push({ m, x: x + kw - 2 });
    });
    blacks.forEach(({ m, x }) => {
      const p = ((m % 12) + 12) % 12;
      const on = mark.indexOf(m) >= 0;
      html += `<rect x="${x - kw * 0.31}" y="20" width="${kw * 0.62}" height="${kh * 0.6}" rx="2.5" fill="${on ? ACCENT : INK}" stroke="${INK}" stroke-width="1.2"/>`;
    });
    return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="keyboard"><g>${html}</g></svg>`;
  }

  const LESSONS = {
    names: {
      title: 'Reading the notes',
      why: 'A staff is a ruler for pitch. The lines and spaces are fixed positions, and every position has a letter. Once you can name one position without counting, the others come from it.',
      rule: 'The lines and spaces of a staff are named with letters that repeat every seven steps. In treble clef the bottom line is E; in bass clef it is G.',
      beats: [
        'The treble clef is a G clef: its spiral wraps the second line from the bottom, so that line is G. Everything else counts from there.',
        'The bass clef is an F clef: its two dots bracket the second line from the top, so that line is F.',
        'Lines and spaces alternate. A note on the fourth line is a third above the note in the third space, not a second.',
        'Learn four anchors per clef and read outwards. Counting from the bottom every time is slow and it is the habit that keeps beginners from reading fluently.'
      ],
      example: {
        q: 'Name the note on the fourth line of the treble staff.',
        steps: [
          'Start at the second line from the bottom, which the clef marks as G.',
          'Move up one line at a time, skipping the space between: G on line 2, B on line 3, D on line 4.',
          'Check the letters: line 2 to line 4 is two lines, which is four letter steps, so G to D is right.'
        ],
        a: 'D'
      },
      remember: 'The clef marks one line. Everything else is a step away from it.',
      trap: 'Reading the space above a line instead of the line itself. A note head is either on a line or in a space, and the two are a second apart.',
      figs: [
        { cap: 'Treble staff: the clef wraps the second line, which is G', svg: staffSvg({ clef: 'treble', notes: [{ step: 2, label: 'G' }], caption: 'G — second line' }) },
        { cap: 'The same nine positions named', svg: staffSvg({ clef: 'treble', notes: [{ step: 0, label: 'E' }, { step: 2, label: 'G' }, { step: 4, label: 'B' }, { step: 6, label: 'D' }, { step: 8, label: 'F' }], caption: 'lines: E G B D F' }) }
      ]
    },

    staff: {
      title: 'The grand staff',
      why: 'Piano music is written on two staves at once, because a piano spans more pitch than one staff can show without ledger lines everywhere. The two staves are one system, joined by a brace, and middle C sits exactly between them.',
      rule: 'Treble clef on top for the right hand, bass clef below for the left. Middle C is the ledger line between the two.',
      beats: [
        'Five lines, four spaces, per staff. Notes that fall outside are written on ledger lines, which are short lines added above or below.',
        'Middle C (C4) belongs to both staves: it is one ledger line below the treble staff and one above the bass staff. That is the seam between the hands.',
        'The right hand reads the treble staff, the left the bass. The convention exists because the hands are usually a hand-span apart in pitch, not because of any rule about which hand is cleverer.',
        'A note can be written on either staff if it is in range; composers choose the staff that needs fewer ledger lines.'
      ],
      example: {
        q: 'Where is D4 written?',
        steps: [
          'D4 is a step above middle C.',
          'Middle C is one ledger line below the treble staff.',
          'A step above the ledger line is the space just below the bottom line of the staff.'
        ],
        a: 'In the space below the treble staff.'
      },
      remember: 'Middle C is the hinge: below the treble staff, above the bass staff, the same note.',
      trap: 'Treating the two staves as separate instruments. They are one system and share one middle C.',
      figs: [
        { cap: 'Treble staff with middle C below it', svg: staffSvg({ clef: 'treble', notes: [{ step: -2, label: 'C4' }], caption: 'middle C on a ledger line' }) },
        { cap: 'Bass staff with middle C above it', svg: staffSvg({ clef: 'bass', notes: [{ step: 10, label: 'C4' }], caption: 'the same C, from the other side' }) }
      ]
    },

    rhythm: {
      title: 'Note values and time',
      why: 'Rhythm is arithmetic you can hear. Every note value is half the one before it, so a bar of music is a sum, and the time signature tells you what that sum has to equal.',
      rule: 'A semibreve is four crotchets; a minim is two; a quaver is half of one. The time signature says how many of which value fill a bar.',
      beats: [
        'Each step down the tree halves the value and doubles the count: 1 semibreve = 2 minims = 4 crotchets = 8 quavers = 16 semiquavers.',
        'A dot adds half the note\'s own value. A dotted crotchet is one and a half beats, not two.',
        'The top number of a time signature is how many beats per bar; the bottom number is which note value gets one beat. 4/4 means four crotchets; 6/8 means six quavers, usually felt as two groups of three.',
        'A rest has a value too. Silence is written, not left blank.'
      ],
      example: {
        q: 'How many quavers fill a 3/4 bar?',
        steps: [
          'The bottom 4 says a crotchet is the beat, and the top 3 says three of them per bar.',
          'So the bar is three crotchets.',
          'Each crotchet is two quavers, so three crotchets are six quavers.'
        ],
        a: 'Six quavers.'
      },
      remember: 'Every note value is half the one before it. Count in the value the bottom number names.',
      trap: 'Reading 6/8 as six even beats. It is six quavers, but it is felt as two beats of three.',
      figs: [
        { cap: 'The value tree', svg: `<svg viewBox="0 0 320 150" role="img" aria-label="note value tree"><g ${mono} font-size="11" font-weight="800" fill="${INK}"><text x="14" y="30">semibreve</text><text x="150" y="30">4 beats</text><text x="14" y="64">minim</text><text x="150" y="64">2 beats</text><text x="14" y="98">crotchet</text><text x="150" y="98">1 beat</text><text x="14" y="132">quaver</text><text x="150" y="132">½ beat</text></g><g stroke="${INK}" stroke-width="1.4"><path d="M120 26h20M120 60h20M120 94h20M120 128h20"/><path d="M140 26v102"/></g><g fill="${ACCENT}"><rect x="248" y="20" width="58" height="12" rx="2"/><rect x="248" y="54" width="29" height="12" rx="2"/><rect x="248" y="88" width="15" height="12" rx="2"/><rect x="248" y="122" width="8" height="12" rx="2"/></g></svg>` },
        { cap: 'One 4/4 bar, filled four ways', svg: `<svg viewBox="0 0 320 150" role="img" aria-label="bars"><g stroke="${INK}" stroke-width="1.6" fill="none"><line x1="20" y1="40" x2="300" y2="40"/><line x1="20" y1="100" x2="300" y2="100"/><line x1="20" y1="34" x2="20" y2="106"/><line x1="300" y1="34" x2="300" y2="106"/></g><g fill="${INK}"><circle cx="60" cy="70" r="7"/><circle cx="140" cy="70" r="7"/><circle cx="220" cy="70" r="7"/><circle cx="60" cy="126" r="5"/><circle cx="90" cy="126" r="5"/><circle cx="120" cy="126" r="5"/><circle cx="150" cy="126" r="5"/><circle cx="180" cy="126" r="5"/><circle cx="210" cy="126" r="5"/><circle cx="240" cy="126" r="5"/><circle cx="270" cy="126" r="5"/></g><g ${mono} font-size="9" fill="${MUTED}"><text x="60" y="150" text-anchor="middle">3 minims? no — 2</text></g></svg>` }
      ]
    },

    keys: {
      title: 'The keyboard',
      why: 'The piano keyboard is a map. The pattern of two black keys and three black keys repeats every octave, and every white key name can be found from that pattern without counting from the end.',
      rule: 'Black keys come in groups of two and three. The white key to the left of a group of two is C; the white key to the left of a group of three is F.',
      beats: [
        'Seven white keys and five black keys per octave, twelve keys in all.',
        'E–F and B–C have no black key between them because those pairs are already a semitone apart.',
        'A black key has two names: C♯ is the same key as D♭. Which name you use depends on the key you are in, not on the key itself.',
        'Fingers are numbered 1 to 5 from the thumb. Five-finger position on C puts the thumb on C and the little finger on G.'
      ],
      example: {
        q: 'Find D on the keyboard without counting from the left end.',
        steps: [
          'Look for a group of two black keys.',
          'The white key immediately left of that group is C.',
          'The white key immediately right of that C is D.'
        ],
        a: 'D is the white key between the two black keys of the group of two.'
      },
      remember: 'Group of two: C is to its left. Group of three: F is to its left.',
      trap: 'Assuming the black keys are evenly spaced. They are grouped 2-3, and that grouping is the whole map.',
      figs: [
        { cap: 'One octave from C to C', svg: keysSvg({ from: 60, to: 72, mark: [60], labels: true, w: 320, h: 120 }) },
        { cap: 'C, E and G marked: the C major triad', svg: keysSvg({ from: 60, to: 72, mark: [60, 64, 67], labels: false, w: 320, h: 120 }) }
      ]
    },

    intervals: {
      title: 'Intervals',
      why: 'An interval is the distance between two notes, and it is what gives a melody its shape. The same interval sounds the same in every key, which is why a tune can be moved up or down and still be the same tune.',
      rule: 'Count both notes to name the number; count semitones to name the quality. C up to E is a third because it spans three letter names, and a major third because it is four semitones.',
      beats: [
        'The number comes from the letters: C–E spans C, D, E, so it is a third. C–E♭ also spans three letters, so it is also a third, but a minor one.',
        'The quality comes from the semitone count. Major third: 4 semitones. Minor third: 3. Perfect fifth: 7. Tritone: 6.',
        'Perfect intervals are the fourth, fifth and octave. They do not come in major and minor versions, they come in perfect, augmented and diminished.',
        'Intervals add up: a third plus a third is a fifth, if the notes line up.'
      ],
      example: {
        q: 'What interval is C up to A?',
        steps: [
          'Letters: C, D, E, F, G, A — six letters, so it is a sixth.',
          'Semitones: C to A is 9 semitones.',
          '9 semitones above the root is a major sixth.'
        ],
        a: 'A major sixth.'
      },
      remember: 'Letters give the number, semitones give the quality. Both are needed.',
      trap: 'Counting semitones only. Seven semitones is a fifth from C, but from F♯ it is a different letter span.',
      figs: [
        { cap: 'A third, on the staff', svg: staffSvg({ clef: 'treble', notes: [{ step: 0, label: 'third' }, { step: 2, label: '' }], caption: 'line to line: a third' }) },
        { cap: 'A fifth, the same way', svg: staffSvg({ clef: 'treble', notes: [{ step: 0, label: 'fifth' }, { step: 4, label: '' }], caption: 'line to line, two apart: a fifth' }) }
      ]
    },

    scales: {
      title: 'Scales and key signatures',
      why: 'A scale is a recipe of tones and semitones, and a key signature is that recipe applied to a particular starting note. Learn one pattern and you can build all twelve major scales.',
      rule: 'Major: tone, tone, semitone, tone, tone, tone, semitone. The key signature lists the sharps or flats the pattern requires.',
      beats: [
        'Start on any note, apply the pattern, and you have that major scale. C major needs no accidentals because the white keys already fit the pattern.',
        'Sharps appear in a fixed order: F C G D A E B. Flats appear in the reverse order: B E A D G C F.',
        'The circle of fifths is the map: each step clockwise adds a sharp, each step anticlockwise adds a flat.',
        'Every major key has a relative minor that shares its signature, starting a minor third below the tonic.'
      ],
      example: {
        q: 'Build the D major scale.',
        steps: [
          'Start on D and apply tone tone semitone tone tone tone semitone.',
          'D to E is a tone, E to F♯ is a tone, F♯ to G is a semitone.',
          'G to A, A to B, B to C♯ are tones; C♯ to D is a semitone.'
        ],
        a: 'D E F♯ G A B C♯ D — two sharps, F♯ and C♯.'
      },
      remember: 'T T S T T T S. The sharps arrive F C G D A E B; the flats arrive backwards.',
      trap: 'Counting the key signature as a number of accidentals rather than as a set. Two sharps means F♯ and C♯ specifically, not any two sharps.',
      figs: [
        { cap: 'The major pattern', svg: `<svg viewBox="0 0 320 150" role="img" aria-label="major scale pattern"><g ${mono} font-size="10" font-weight="800" fill="${INK}"><text x="10" y="40">T</text><text x="52" y="40">T</text><text x="94" y="40">S</text><text x="136" y="40">T</text><text x="178" y="40">T</text><text x="220" y="40">T</text><text x="262" y="40">S</text></g><g stroke="${INK}" stroke-width="1.4"><path d="M6 56h300"/><path d="M6 50v12M48 50v12M90 50v12M132 50v12M174 50v12M216 50v12M258 50v12M300 50v12"/></g><g ${mono} font-size="11" font-weight="800" fill="${ACCENT}"><text x="6" y="86">C</text><text x="48" y="86">D</text><text x="90" y="86">E</text><text x="132" y="86">F</text><text x="174" y="86">G</text><text x="216" y="86">A</text><text x="258" y="86">B</text><text x="294" y="86">C</text></g><text x="160" y="124" text-anchor="middle" ${mono} font-size="10" fill="${MUTED}">semitones fall at E–F and B–C</text></svg>` },
        { cap: 'Two sharps: F♯ and C♯', svg: keysSvg({ from: 60, to: 72, mark: [66, 61], labels: true, w: 320, h: 120 }) }
      ]
    },

    chords: {
      title: 'Chords',
      why: 'A chord is two or more notes sounded together, and a triad is the simplest useful one: a root, a third and a fifth. The third decides whether the chord sounds bright or dark, which is why it is the note to check first.',
      rule: 'A major triad is a major third then a minor third. A minor triad is a minor third then a major third. Same three notes, different order, different chord.',
      beats: [
        'Major triad: root, root+4 semitones, root+7. Minor: root, root+3, root+7.',
        'Diminished: root, root+3, root+6. Augmented: root, root+4, root+8.',
        'The root names the chord; the lowest note names the inversion. C–E–G is root position, E–G–C is first inversion, G–C–E is second inversion.',
        'Adding a seventh gives the chord its colour. A dominant seventh takes a minor seventh above the root.'
      ],
      example: {
        q: 'What notes are in an A minor triad?',
        steps: [
          'Start on A.',
          'A minor third up is C.',
          'A perfect fifth up from A is E.'
        ],
        a: 'A, C, E.'
      },
      remember: 'Root, third, fifth. The third sets the quality.',
      trap: 'Naming a chord by its lowest note. The lowest note names the inversion, not the chord.',
      figs: [
        { cap: 'C major: C E G', svg: keysSvg({ from: 60, to: 72, mark: [60, 64, 67], labels: true, w: 320, h: 120 }) },
        { cap: 'C minor: C E♭ G', svg: keysSvg({ from: 60, to: 72, mark: [60, 63, 67], labels: true, w: 320, h: 120 }) }
      ]
    },

    harmony: {
      title: 'Harmony in a key',
      why: 'Chords in a key are numbered by the scale degree they are built on, and those numbers are how musicians talk about progressions without naming a key. A cadence is a progression that ends a phrase, and which cadence it is decides whether the music sounds finished.',
      rule: 'In a major key the chords on I, IV and V are major; ii, iii and vi are minor; vii is diminished. V to I sounds finished; anything else sounds unfinished.',
      beats: [
        'Upper-case Roman numerals are major chords, lower-case are minor. In C major: I = C, ii = Dm, iii = Em, IV = F, V = G, vi = Am, vii° = Bdim.',
        'The dominant (V) contains the leading tone, a semitone below the tonic. That semitone is why V–I sounds like a full stop.',
        'The perfect cadence is V–I. The plagal cadence is IV–I, softer. The deceptive cadence is V–vi, which resolves somewhere unexpected.',
        'A half cadence ends on V and leaves the phrase hanging, which is what makes it useful in the middle of a piece.'
      ],
      example: {
        q: 'In G major, what chord is the dominant, and what notes are in it?',
        steps: [
          'The fifth degree of G major is D.',
          'A triad on D in G major is D–F♯–A.',
          'F♯ is in the key signature of G major, so the chord is D major.'
        ],
        a: 'D major: D, F♯, A.'
      },
      remember: 'V is built on the fifth degree and contains the leading tone. That is what makes it pull home.',
      trap: 'Assuming every chord on a white key is major. In C major, the chords on D, E and A are minor, and the one on B is diminished.',
      figs: [
        { cap: 'The chords of C major', svg: `<svg viewBox="0 0 320 150" role="img" aria-label="chords of C major"><g ${mono} font-size="13" font-weight="900" fill="${INK}"><text x="14" y="46">I</text><text x="58" y="46">ii</text><text x="102" y="46">iii</text><text x="146" y="46">IV</text><text x="190" y="46">V</text><text x="234" y="46">vi</text><text x="278" y="46">vii°</text></g><g ${mono} font-size="10" fill="${MUTED}"><text x="10" y="72">C</text><text x="50" y="72">Dm</text><text x="94" y="72">Em</text><text x="138" y="72">F</text><text x="182" y="72">G</text><text x="226" y="72">Am</text><text x="270" y="72">Bdim</text></g><g stroke="${ACCENT}" stroke-width="2" fill="none"><path d="M196 96q26-22 52 0" marker-end="url(#ar)"/></g><defs><marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0l10 5-10 5z" fill="${ACCENT}"/></marker></defs><text x="222" y="124" text-anchor="middle" ${mono} font-size="10" fill="${ACCENT}">V → I</text></svg>` },
        { cap: 'V contains the leading tone, a semitone below the tonic', svg: staffSvg({ clef: 'treble', notes: [{ step: 0, label: 'B' }, { step: 1, label: 'C' }], caption: 'B leads up to C' }) }
      ]
    },

    sight: {
      title: 'Sight-reading',
      why: 'Sight-reading is not reading faster. It is reading ahead, so that the hands are already moving towards a note before the eye arrives at it. The skill is anticipation, and it is built by looking a beat further than feels comfortable.',
      rule: 'Before playing, read the key signature and the time signature. While playing, keep the eyes one bar ahead of the hands.',
      beats: [
        'Check the key signature first: it tells you which notes are altered for the whole piece.',
        'Check the time signature second: it tells you how the bar divides, which is how you keep count.',
        'Look for the shape of the line before the individual notes. A run of steps looks different from a leap, and the shape is read faster than the letters.',
        'When you make a mistake, keep going. Stopping to correct is the habit that stops sight-reading working.'
      ],
      example: {
        q: 'You open a piece in 3/4 with two sharps. What do you check before the first note?',
        steps: [
          'Two sharps means F♯ and C♯ throughout, unless a natural sign cancels one.',
          '3/4 means three crotchet beats per bar, counted one-two-three.',
          'The first note tells you where the melody starts; the key signature tells you what it is called.'
        ],
        a: 'Key signature (F♯, C♯), time signature (three crotchet beats), and the first note.'
      },
      remember: 'Eyes ahead of hands. Keep going through mistakes.',
      trap: 'Reading one note at a time at the speed of the hands. That is practising, not sight-reading.',
      figs: [
        { cap: 'Look at the shape before the letters', svg: staffSvg({ clef: 'treble', notes: [{ step: 0, label: '' }, { step: 1, label: '' }, { step: 2, label: '' }, { step: 3, label: '' }, { step: 4, label: '' }], caption: 'a run of steps' }) },
        { cap: 'A leap looks different at a glance', svg: staffSvg({ clef: 'treble', notes: [{ step: 0, label: '' }, { step: 4, label: '' }, { step: 1, label: '' }, { step: 5, label: '' }], caption: 'two leaps' }) }
      ]
    },

    playing: {
      title: 'Playing',
      why: 'The point of all of this is to make a sound. Playing well is mostly two habits: finding the key before pressing it, and keeping a steady pulse even when a note goes wrong.',
      rule: 'Sit so the forearms are level with the keys. Curve the fingers, keep the wrist loose, and press with the fingertip rather than the flat of the finger.',
      beats: [
        'The thumb is finger 1. Five-finger position on C puts fingers 1 to 5 on C D E F G.',
        'Keep the hand shape: a rounded arch, as if holding a small ball. A collapsed knuckle takes the strength out of the finger.',
        'Press from the finger, not from the arm. The arm supplies weight, the finger supplies the movement.',
        'Practise slowly enough to be right. Speed added to a wrong movement is just a faster mistake.'
      ],
      example: {
        q: 'You are playing a five-finger C position and the music asks for A. What do you do?',
        steps: [
          'A is outside the five-finger position, which stops at G.',
          'Lift the thumb under the hand to reach A, or shift the whole hand up one key.',
          'For a beginner, shifting the hand keeps the shape; the thumb-under comes later.'
        ],
        a: 'Shift the hand up, keeping the same finger pattern.'
      },
      remember: 'Right note first, then steady pulse, then speed. In that order.',
      trap: 'Practising fast from the start. The hands learn whatever they repeat, including the mistakes.',
      figs: [
        { cap: 'Five-finger position on C', svg: keysSvg({ from: 60, to: 67, mark: [60, 62, 64, 65, 67], labels: true, w: 320, h: 120 }) },
        { cap: 'Fingers 1 to 5, thumb to little finger', svg: `<svg viewBox="0 0 320 150" role="img" aria-label="finger numbers"><g fill="${PAPER}" stroke="${INK}" stroke-width="1.6"><rect x="34" y="60" width="30" height="56" rx="15"/><rect x="72" y="40" width="30" height="76" rx="15"/><rect x="110" y="30" width="30" height="86" rx="15"/><rect x="148" y="40" width="30" height="76" rx="15"/><rect x="186" y="60" width="30" height="56" rx="15"/><rect x="224" y="86" width="62" height="40" rx="18"/></g><g ${mono} font-size="14" font-weight="900" fill="${ACCENT}"><text x="49" y="94" text-anchor="middle">1</text><text x="87" y="84" text-anchor="middle">2</text><text x="125" y="78" text-anchor="middle">3</text><text x="163" y="84" text-anchor="middle">4</text><text x="201" y="94" text-anchor="middle">5</text></g><text x="160" y="146" text-anchor="middle" ${mono} font-size="10" fill="${MUTED}">right hand, thumb to little finger</text></svg>` }
      ]
    }
  };

  window.PIANO_LESSONS = LESSONS;
})();
