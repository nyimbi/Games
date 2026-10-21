/* Lessons for the physics arcade: one short teaching page per topic.
 *
 * These are written, not generated from the question bank. A lesson derived
 * from the bank's answers would be a spoiler -- it would hand the learner the
 * answer to every question it drew from -- and a lesson derived from the
 * explanations would be a list of answers with the questions stripped off.
 * What teaches is the idea, stated once, with a worked example that is not in
 * the bank, and the one mistake that most often goes with it.
 *
 * Each lesson has: what it is for (why), the rule, two or three beats that
 * carry the reasoning, a worked example, and a single line to remember. The
 * example uses numbers the bank does not ask about.
 */
window.PHYSICS_LESSONS = {
  forces: {
    title: 'Forces',
    why: 'A force is a push or a pull, and almost every question about motion starts by asking what the forces add up to.',
    rule: 'The forces on an object combine into one resultant. If they cancel, the object keeps doing what it was doing. If they do not, it accelerates.',
    beats: [
      'Forces in the same direction add. Two forces of 8 N and 6 N pulling the same way act like one force of 14 N.',
      'Forces in opposite directions subtract. 12 N right and 5 N left leave 7 N right — the direction goes to the larger force.',
      'Mass and weight are not the same thing. Mass is how much matter (kg) and does not change. Weight is the pull of gravity on it (N), W = mg, and it changes on the Moon.'
    ],
    example: {
      q: 'A 4 kg box is pushed right with 20 N while friction pushes left with 8 N. What is its acceleration?',
      steps: [
        'Resultant force: 20 − 8 = 12 N to the right.',
        'Use F = ma: 12 = 4 × a, so a = 3 m/s².'
      ],
      a: '3 m/s² to the right'
    },
    figs: [
      {
        cap: 'Forces that fight subtract. 20 N right against 8 N left leaves 12 N right.',
        svg: `<svg viewBox="0 0 240 120" role="img" aria-label="A box with a 20 newton arrow right and an 8 newton arrow left">
          <rect x="88" y="44" width="64" height="40" rx="6" fill="#fffdf8" stroke="#191c3a" stroke-width="2.5"/>
          <text x="120" y="70" text-anchor="middle" font-size="13" font-weight="700" fill="#191c3a">4 kg</text>
          <line x1="152" y1="64" x2="222" y2="64" stroke="#2f6fd0" stroke-width="3"/>
          <path d="M222 64 l-10 -6 v12 z" fill="#2f6fd0"/>
          <text x="187" y="52" text-anchor="middle" font-size="12" font-weight="700" fill="#1f4f9c">20 N</text>
          <line x1="88" y1="64" x2="42" y2="64" stroke="#e5484d" stroke-width="3"/>
          <path d="M42 64 l10 -6 v12 z" fill="#e5484d"/>
          <text x="64" y="52" text-anchor="middle" font-size="12" font-weight="700" fill="#b3261e">8 N</text>
          <text x="120" y="108" text-anchor="middle" font-size="11" fill="#6d7194">resultant 12 N →</text>
        </svg>`
      },
      {
        cap: 'Forces that cancel leave nothing over, so the object keeps its motion — it does not stop.',
        svg: `<svg viewBox="0 0 240 120" role="img" aria-label="A box with equal and opposite arrows, balanced">
          <rect x="92" y="40" width="56" height="36" rx="6" fill="#fffdf8" stroke="#191c3a" stroke-width="2.5"/>
          <line x1="148" y1="58" x2="200" y2="58" stroke="#2f6fd0" stroke-width="3"/>
          <path d="M200 58 l-9 -5 v10 z" fill="#2f6fd0"/>
          <line x1="92" y1="58" x2="40" y2="58" stroke="#2f6fd0" stroke-width="3"/>
          <path d="M40 58 l9 -5 v10 z" fill="#2f6fd0"/>
          <text x="176" y="46" text-anchor="middle" font-size="11" font-weight="700" fill="#1f4f9c">10 N</text>
          <text x="64" y="46" text-anchor="middle" font-size="11" font-weight="700" fill="#1f4f9c">10 N</text>
          <text x="120" y="100" text-anchor="middle" font-size="11" font-weight="700" fill="#1e9e6a">resultant 0 N</text>
        </svg>`
      }
    ],
    remember: 'Add the forces that agree, subtract the ones that fight, then divide by the mass.',
    trap: 'Adding a force and a mass, or using weight where mass belongs.'
  },

  motion: {
    title: 'Motion',
    why: 'Speed, distance and time are the same three quantities rearranged. Nearly every motion question is one of those rearrangements.',
    rule: 'speed = distance ÷ time. Acceleration = change in velocity ÷ time.',
    beats: [
      'Cover the quantity you want in the triangle (d over s×t) and what is left is the formula: d = s × t, s = d ÷ t, t = d ÷ s.',
      'Acceleration is about *change* in speed, not speed. A car cruising at 30 m/s is not accelerating; a car going from 5 to 20 m/s is.',
      'Change in velocity = final − initial. The time is how long the change took, not the total journey.'
    ],
    example: {
      q: 'A train slows from 30 m/s to 10 m/s in 5 s. What is its acceleration?',
      steps: [
        'Change in velocity: 10 − 30 = −20 m/s.',
        'Divide by the time: −20 ÷ 5 = −4 m/s².'
      ],
      a: '−4 m/s² (a deceleration of 4 m/s²)'
    },
    figs: [
      {
        cap: 'The distance–time triangle: cover the quantity you want and what is left is the formula.',
        svg: `<svg viewBox="0 0 240 130" role="img" aria-label="A triangle with d on top and s and t below, the formula triangle for speed">
          <path d="M120 12 L218 116 L22 116 Z" fill="#fffdf8" stroke="#191c3a" stroke-width="2.5" stroke-linejoin="round"/>
          <line x1="71" y1="64" x2="169" y2="64" stroke="#191c3a" stroke-width="2"/>
          <line x1="120" y1="64" x2="120" y2="116" stroke="#191c3a" stroke-width="2"/>
          <text x="120" y="50" text-anchor="middle" font-size="18" font-weight="800" fill="#191c3a">d</text>
          <text x="95" y="96" text-anchor="middle" font-size="18" font-weight="800" fill="#1f4f9c">s</text>
          <text x="145" y="96" text-anchor="middle" font-size="18" font-weight="800" fill="#1f4f9c">t</text>
        </svg>`
      },
      {
        cap: 'A steep line is a fast object; a flat line is a stopped one. The slope is the speed.',
        svg: `<svg viewBox="0 0 240 130" role="img" aria-label="Two distance-time lines, one steep and one flat">
          <line x1="34" y1="106" x2="220" y2="106" stroke="#191c3a" stroke-width="2.5"/>
          <line x1="34" y1="106" x2="34" y2="18" stroke="#191c3a" stroke-width="2.5"/>
          <text x="26" y="24" text-anchor="end" font-size="10" fill="#6d7194">d</text>
          <text x="214" y="122" text-anchor="end" font-size="10" fill="#6d7194">t</text>
          <line x1="34" y1="106" x2="130" y2="30" stroke="#2f6fd0" stroke-width="3"/>
          <text x="140" y="40" font-size="11" font-weight="700" fill="#1f4f9c">fast</text>
          <line x1="34" y1="106" x2="200" y2="90" stroke="#1e9e6a" stroke-width="3"/>
          <text x="186" y="82" font-size="11" font-weight="700" fill="#146b48">slow</text>
          <line x1="34" y1="72" x2="200" y2="72" stroke="#e5484d" stroke-width="3" stroke-dasharray="7 5"/>
          <text x="186" y="64" text-anchor="end" font-size="11" font-weight="700" fill="#b3261e">stopped</text>
        </svg>`
      }
    ],
    remember: 'Distance over time for speed; change in speed over time for acceleration.',
    trap: 'Using the final speed as the change, or dividing by the wrong time.'
  },

  energy: {
    title: 'Energy',
    why: 'Energy is never made or destroyed, only moved and stored. The formulas below are the stores you will be asked about.',
    rule: 'Gravitational potential energy = mgh. Kinetic energy = ½mv². Energy transferred = power × time.',
    beats: [
      'Lifting something stores energy in gravity: mgh, with h in metres and g = 9.8 m/s² on Earth.',
      'Anything moving carries kinetic energy: ½mv². It is the *square* of the speed that matters — doubling speed quadruples the energy.',
      'Power is energy per second. A 60 W lamp running for 10 s transfers 600 J. Watch the units: 4 minutes is 240 s, and 1 kJ = 1000 J.'
    ],
    example: {
      q: 'A 3 kg ball is dropped from 5 m. How fast is it going just before it lands? (ignore air resistance)',
      steps: [
        'All the stored energy becomes kinetic: mgh = ½mv².',
        'The mass cancels: gh = ½v², so v² = 2 × 9.8 × 5 = 98.',
        'v = √98 ≈ 9.9 m/s.'
      ],
      a: '≈ 9.9 m/s'
    },
    figs: [
      {
        cap: 'Falling: the store of gravitational energy empties as the store of kinetic energy fills. The total stays put.',
        svg: `<svg viewBox="0 0 240 140" role="img" aria-label="A ball falling from a height, with energy bars for potential and kinetic">
          <line x1="24" y1="22" x2="118" y2="22" stroke="#191c3a" stroke-width="2.5"/>
          <circle cx="71" cy="40" r="9" fill="#2f6fd0"/>
          <line x1="71" y1="52" x2="71" y2="104" stroke="#6d7194" stroke-width="1.5" stroke-dasharray="4 4"/>
          <circle cx="71" cy="112" r="9" fill="#1e9e6a"/>
          <text x="84" y="48" font-size="11" fill="#6d7194">5 m</text>
          <rect x="140" y="60" width="16" height="60" fill="#2f6fd0" rx="3"/>
          <rect x="164" y="106" width="16" height="14" fill="#1e9e6a" rx="3"/>
          <text x="148" y="54" text-anchor="middle" font-size="10" fill="#1f4f9c">gpe</text>
          <text x="172" y="54" text-anchor="middle" font-size="10" fill="#146b48">ke</text>
          <rect x="194" y="60" width="16" height="60" fill="#2f6fd0" rx="3"/>
          <rect x="218" y="90" width="16" height="30" fill="#1e9e6a" rx="3"/>
          <text x="214" y="54" text-anchor="middle" font-size="9" fill="#6d7194">later</text>
        </svg>`
      },
      {
        cap: 'Doubling the speed quadruples the kinetic energy, because v is squared.',
        svg: `<svg viewBox="0 0 240 130" role="img" aria-label="Two bars showing kinetic energy rising as the square of speed">
          <line x1="40" y1="106" x2="220" y2="106" stroke="#191c3a" stroke-width="2.5"/>
          <rect x="62" y="88" width="42" height="18" fill="#2f6fd0" rx="3"/>
          <text x="83" y="82" text-anchor="middle" font-size="11" font-weight="700" fill="#1f4f9c">v</text>
          <text x="83" y="122" text-anchor="middle" font-size="10" fill="#6d7194">1 unit</text>
          <rect x="146" y="34" width="42" height="72" fill="#2f6fd0" rx="3"/>
          <text x="167" y="28" text-anchor="middle" font-size="11" font-weight="700" fill="#1f4f9c">2v</text>
          <text x="167" y="122" text-anchor="middle" font-size="10" fill="#6d7194">4 units</text>
        </svg>`
      }
    ],
    remember: 'Energy moves between stores; it is never used up. Convert minutes to seconds before multiplying by power.',
    trap: 'Forgetting to square the speed, or leaving the time in minutes.'
  },

  electricity: {
    title: 'Circuits',
    why: 'Three quantities — charge, current and voltage — are tied together by Ohm\'s law and by the definition of current.',
    rule: 'Current = charge ÷ time. Ohm\'s law: V = IR.',
    beats: [
      'Current is the rate charge flows: 1 A is 1 coulomb per second. So Q = It.',
      'Voltage pushes the current; resistance opposes it. V = IR ties the three together.',
      'Rearrange before substituting. Want the current? I = V ÷ R. Want the resistance? R = V ÷ I.'
    ],
    example: {
      q: 'A 12 V supply drives 3 A through a resistor. What is its resistance, and how much charge flows in 20 s?',
      steps: [
        'R = V ÷ I = 12 ÷ 3 = 4 Ω.',
        'Q = I × t = 3 × 20 = 60 C.'
      ],
      a: '4 Ω and 60 C'
    },
    figs: [
      {
        cap: 'A simple circuit: the cell pushes, the resistor opposes, the ammeter reads the flow.',
        svg: `<svg viewBox="0 0 240 130" role="img" aria-label="A circuit loop with a cell, a resistor and an ammeter">
          <rect x="40" y="24" width="160" height="82" fill="none" stroke="#191c3a" stroke-width="2.5" rx="6"/>
          <line x1="104" y1="16" x2="104" y2="32" stroke="#191c3a" stroke-width="4"/>
          <line x1="120" y1="20" x2="120" y2="28" stroke="#191c3a" stroke-width="2.5"/>
          <text x="112" y="12" text-anchor="middle" font-size="10" fill="#6d7194">cell</text>
          <rect x="150" y="16" width="34" height="16" fill="#fffdf8" stroke="#191c3a" stroke-width="2.5" rx="3"/>
          <text x="167" y="10" text-anchor="middle" font-size="10" fill="#6d7194">R</text>
          <circle cx="56" cy="65" r="14" fill="#fffdf8" stroke="#191c3a" stroke-width="2.5"/>
          <text x="56" y="70" text-anchor="middle" font-size="12" font-weight="700" fill="#1f4f9c">A</text>
          <path d="M84 65 h22" stroke="#2f6fd0" stroke-width="2.5"/>
          <path d="M106 65 l-7 -4 v8 z" fill="#2f6fd0"/>
          <text x="120" y="96" text-anchor="middle" font-size="10" fill="#6d7194">current flows round</text>
        </svg>`
      },
      {
        cap: 'Ohm\'s law as a triangle. V on top, I and R below — cover one to get its formula.',
        svg: `<svg viewBox="0 0 240 130" role="img" aria-label="The V equals I R triangle">
          <path d="M120 12 L218 116 L22 116 Z" fill="#fffdf8" stroke="#191c3a" stroke-width="2.5" stroke-linejoin="round"/>
          <line x1="71" y1="64" x2="169" y2="64" stroke="#191c3a" stroke-width="2"/>
          <line x1="120" y1="64" x2="120" y2="116" stroke="#191c3a" stroke-width="2"/>
          <text x="120" y="50" text-anchor="middle" font-size="18" font-weight="800" fill="#191c3a">V</text>
          <text x="95" y="96" text-anchor="middle" font-size="18" font-weight="800" fill="#1f4f9c">I</text>
          <text x="145" y="96" text-anchor="middle" font-size="18" font-weight="800" fill="#1f4f9c">R</text>
        </svg>`
      }
    ],
    remember: 'V = IR, Q = It. Pick the rearrangement before you touch the numbers.',
    trap: 'Multiplying where the formula divides, or mixing up current and charge.'
  },

  waves: {
    title: 'Waves',
    why: 'A wave has a frequency, a wavelength and a speed, and they are locked together by one equation.',
    rule: 'speed = frequency × wavelength. Frequency = 1 ÷ period.',
    beats: [
      'Frequency is how many waves pass per second (Hz). Period is how long one wave takes (s). They are reciprocals: 50 Hz means 0.02 s per wave.',
      'Wavelength is the distance from one crest to the next, in metres.',
      'Speed is how fast the wave moves: v = fλ. Change the frequency and the wavelength gives way, keeping the speed fixed in a given medium.'
    ],
    example: {
      q: 'A wave has a period of 0.05 s and a wavelength of 6 m. What is its speed?',
      steps: [
        'Frequency from the period: f = 1 ÷ 0.05 = 20 Hz.',
        'Speed: v = fλ = 20 × 6 = 120 m/s.'
      ],
      a: '120 m/s'
    },
    figs: [
      {
        cap: 'Wavelength is crest to crest. The period is the time for one whole wave to pass.',
        svg: `<svg viewBox="0 0 240 130" role="img" aria-label="A sine wave with wavelength and period marked">
          <line x1="16" y1="70" x2="228" y2="70" stroke="#6d7194" stroke-width="1.5" stroke-dasharray="4 4"/>
          <path d="M20 70 q20 -40 40 0 t40 0 t40 0 t40 0 t40 0" fill="none" stroke="#2f6fd0" stroke-width="3"/>
          <line x1="60" y1="30" x2="140" y2="30" stroke="#e5484d" stroke-width="2"/>
          <path d="M60 30 l8 -4 v8 z" fill="#e5484d"/>
          <path d="M140 30 l-8 -4 v8 z" fill="#e5484d"/>
          <text x="100" y="24" text-anchor="middle" font-size="11" font-weight="700" fill="#b3261e">wavelength λ</text>
          <line x1="60" y1="70" x2="60" y2="40" stroke="#1e9e6a" stroke-width="1.5"/>
          <line x1="140" y1="70" x2="140" y2="40" stroke="#1e9e6a" stroke-width="1.5"/>
          <text x="100" y="112" text-anchor="middle" font-size="11" fill="#6d7194">one period = one full wave</text>
        </svg>`
      },
      {
        cap: 'Short wavelength means more waves per second, so a higher frequency — at the same speed.',
        svg: `<svg viewBox="0 0 240 130" role="img" aria-label="A long wavelength wave above a short wavelength wave">
          <path d="M20 40 q40 -28 80 0 t80 0" fill="none" stroke="#2f6fd0" stroke-width="3"/>
          <text x="204" y="44" text-anchor="end" font-size="10" fill="#1f4f9c">low f</text>
          <path d="M20 94 q20 -24 40 0 t40 0 t40 0 t40 0" fill="none" stroke="#e5484d" stroke-width="3"/>
          <text x="204" y="98" text-anchor="end" font-size="10" fill="#b3261e">high f</text>
        </svg>`
      }
    ],
    remember: 'Period and frequency are reciprocals; v = fλ does the rest.',
    trap: 'Using the period where the frequency belongs, or the other way round.'
  },

  light: {
    title: 'Light',
    why: 'Light travels in straight lines, bounces predictably, and carries colour.',
    rule: 'The angle of incidence equals the angle of reflection — both measured from the normal, not from the mirror.',
    beats: [
      'The normal is the dashed line at 90° to the mirror. Every angle in a reflection question is measured from it.',
      'The incident and reflected rays are equal about the normal, so the angle *between* them is twice the angle of incidence.',
      'White light contains all the colours. A filter subtracts: a red filter passes red and absorbs the rest, so a red object looks red and a blue one looks black under it.'
    ],
    example: {
      q: 'A ray hits a mirror at 25° to the normal. What is the angle between the incident ray and the reflected ray?',
      steps: [
        'Angle of reflection = angle of incidence = 25°.',
        'The angle between the rays is the two added: 25 + 25 = 50°.'
      ],
      a: '50°'
    },
    figs: [
      {
        cap: 'The normal is the dashed line. Both angles are measured from it — never from the mirror.',
        svg: `<svg viewBox="0 0 240 140" role="img" aria-label="A ray reflecting off a mirror, angles measured from the normal">
          <line x1="20" y1="116" x2="220" y2="116" stroke="#191c3a" stroke-width="3"/>
          <line x1="120" y1="18" x2="120" y2="116" stroke="#6d7194" stroke-width="1.5" stroke-dasharray="5 4"/>
          <line x1="58" y1="52" x2="120" y2="116" stroke="#2f6fd0" stroke-width="3"/>
          <path d="M96 92 l-11 -5 l6 -6 z" fill="#2f6fd0"/>
          <line x1="120" y1="116" x2="182" y2="52" stroke="#e5484d" stroke-width="3"/>
          <path d="M158 77 l-5 10 l-5 -5 z" fill="#e5484d"/>
          <path d="M120 88 a28 28 0 0 0 -12 -17" fill="none" stroke="#1f4f9c" stroke-width="1.6"/>
          <path d="M120 88 a28 28 0 0 1 12 -17" fill="none" stroke="#b3261e" stroke-width="1.6"/>
          <text x="101" y="80" text-anchor="middle" font-size="11" font-weight="700" fill="#1f4f9c">i</text>
          <text x="139" y="80" text-anchor="middle" font-size="11" font-weight="700" fill="#b3261e">r</text>
          <text x="126" y="22" font-size="10" fill="#6d7194">normal</text>
          <text x="120" y="134" text-anchor="middle" font-size="10" fill="#6d7194">mirror</text>
        </svg>`
      },
      {
        cap: 'A red filter passes red and absorbs the rest, so a blue object under it has no light left to reflect.',
        svg: `<svg viewBox="0 0 240 130" role="img" aria-label="White light through a red filter onto red and blue objects">
          <text x="12" y="66" font-size="11" font-weight="700" fill="#191c3a">white</text>
          <rect x="66" y="30" width="10" height="70" fill="#e5484d" stroke="#191c3a" stroke-width="2"/>
          <text x="71" y="22" text-anchor="middle" font-size="9" fill="#b3261e">filter</text>
          <line x1="46" y1="64" x2="66" y2="64" stroke="#191c3a" stroke-width="3"/>
          <path d="M66 64 l-9 -4 v8 z" fill="#191c3a"/>
          <line x1="78" y1="64" x2="140" y2="64" stroke="#e5484d" stroke-width="3"/>
          <path d="M140 64 l-9 -4 v8 z" fill="#e5484d"/>
          <circle cx="160" cy="44" r="12" fill="#e5484d" stroke="#191c3a" stroke-width="2"/>
          <text x="178" y="48" font-size="10" fill="#191c3a">red</text>
          <circle cx="160" cy="92" r="12" fill="#191c3a" stroke="#191c3a" stroke-width="2"/>
          <text x="178" y="96" font-size="10" fill="#191c3a">blue → black</text>
        </svg>`
      }
    ],
    remember: 'Angles from the normal. The angle between the rays is double the angle of incidence.',
    trap: 'Measuring from the mirror surface instead of the normal.'
  },

  heat: {
    title: 'Heat',
    why: 'Heating something takes energy, and the amount depends on the mass, the material and how far the temperature rises.',
    rule: 'Energy = mass × specific heat capacity × temperature change. K = °C + 273.',
    beats: [
      'Specific heat capacity is the energy to raise 1 kg of a material by 1 °C. Water is high at 4200 J/kg°C, which is why it takes so long to boil.',
      'A temperature *change* is the same number in °C and in K — a rise of 10 °C is a rise of 10 K.',
      'Absolute zero is 0 K = −273 °C. To convert a temperature (not a change), add or subtract 273.'
    ],
    example: {
      q: 'How much energy raises 3 kg of water by 5 °C? (c = 4200 J/kg°C)',
      steps: [
        'E = mcΔθ.',
        'E = 3 × 4200 × 5 = 63 000 J.'
      ],
      a: '63 000 J, or 63 kJ'
    },
    figs: [
      {
        cap: 'Energy in is mass × specific heat capacity × temperature rise. Bigger mass or bigger rise, more energy.',
        svg: `<svg viewBox="0 0 240 130" role="img" aria-label="A beaker being heated with a thermometer">
          <path d="M84 30 v70 a22 22 0 0 0 22 22 h28 a22 22 0 0 0 22 -22 V30" fill="#dbeafe" stroke="#191c3a" stroke-width="2.5"/>
          <path d="M86 74 h70 v26 a20 20 0 0 1 -20 20 h-30 a20 20 0 0 1 -20 -20 z" fill="#7fb2ee"/>
          <line x1="120" y1="18" x2="120" y2="86" stroke="#e5484d" stroke-width="3"/>
          <circle cx="120" cy="90" r="6" fill="#e5484d"/>
          <text x="132" y="40" font-size="10" fill="#6d7194">thermometer</text>
          <path d="M52 112 q6 -14 0 -26 q-6 -12 0 -24" fill="none" stroke="#e5484d" stroke-width="2.5"/>
          <path d="M36 112 q6 -14 0 -26 q-6 -12 0 -24" fill="none" stroke="#e5484d" stroke-width="2.5"/>
          <text x="120" y="14" text-anchor="middle" font-size="10" fill="#6d7194">E = mcΔθ</text>
        </svg>`
      },
      {
        cap: 'While ice melts the temperature stays flat: the energy is going into breaking the forces, not into the thermometer.',
        svg: `<svg viewBox="0 0 240 130" role="img" aria-label="A heating curve with a flat plateau during melting">
          <line x1="34" y1="106" x2="220" y2="106" stroke="#191c3a" stroke-width="2.5"/>
          <line x1="34" y1="106" x2="34" y2="18" stroke="#191c3a" stroke-width="2.5"/>
          <text x="28" y="24" text-anchor="end" font-size="10" fill="#6d7194">θ</text>
          <text x="214" y="122" text-anchor="end" font-size="10" fill="#6d7194">energy in</text>
          <path d="M34 100 L92 54 L146 54 L196 26" fill="none" stroke="#2f6fd0" stroke-width="3"/>
          <line x1="92" y1="54" x2="92" y2="106" stroke="#6d7194" stroke-width="1.2" stroke-dasharray="4 4"/>
          <line x1="146" y1="54" x2="146" y2="106" stroke="#6d7194" stroke-width="1.2" stroke-dasharray="4 4"/>
          <text x="119" y="46" text-anchor="middle" font-size="10" font-weight="700" fill="#b3261e">melting</text>
        </svg>`
      }
    ],
    remember: 'mcΔθ for the energy; ±273 for the scale. A change is the same in both scales.',
    trap: 'Adding 273 to a temperature change, which is already the same in both scales.'
  },

  pressure: {
    title: 'Pressure',
    why: 'The same force spread over a smaller area presses harder. That one sentence answers most of this topic.',
    rule: 'Pressure = force ÷ area (N/m², or pascals). In a liquid: P = ρgh.',
    beats: [
      'Spread the force over a bigger area and the pressure falls — snowshoes, wide tyres, a sharp knife in reverse.',
      '1 N/m² is 1 pascal. A force in newtons over an area in square metres needs no conversion.',
      'Under a liquid the pressure grows with depth: P = ρgh, using the liquid\'s density and the depth below the surface, not the volume.'
    ],
    example: {
      q: 'A box weighs 240 N and stands on a face of 0.4 m². What pressure does it exert?',
      steps: [
        'P = F ÷ A.',
        'P = 240 ÷ 0.4 = 600 Pa.'
      ],
      a: '600 Pa'
    },
    figs: [
      {
        cap: 'Same force, smaller area, larger pressure. That is why a nail goes in and a snowshoe does not.',
        svg: `<svg viewBox="0 0 240 130" role="img" aria-label="A force on a wide area and the same force on a narrow area">
          <rect x="20" y="46" width="76" height="10" fill="#191c3a"/>
          <line x1="58" y1="20" x2="58" y2="44" stroke="#2f6fd0" stroke-width="3"/>
          <path d="M58 44 l-5 -9 h10 z" fill="#2f6fd0"/>
          <text x="58" y="14" text-anchor="middle" font-size="10" fill="#1f4f9c">F</text>
          <rect x="20" y="56" width="76" height="34" fill="#fffdf8" stroke="#191c3a" stroke-width="2.5"/>
          <text x="58" y="112" text-anchor="middle" font-size="10" fill="#6d7194">wide: low P</text>
          <rect x="146" y="46" width="16" height="10" fill="#191c3a"/>
          <line x1="154" y1="20" x2="154" y2="44" stroke="#2f6fd0" stroke-width="3"/>
          <path d="M154 44 l-5 -9 h10 z" fill="#2f6fd0"/>
          <text x="154" y="14" text-anchor="middle" font-size="10" fill="#1f4f9c">F</text>
          <rect x="146" y="56" width="16" height="34" fill="#fffdf8" stroke="#191c3a" stroke-width="2.5"/>
          <text x="154" y="112" text-anchor="middle" font-size="10" fill="#b3261e">narrow: high P</text>
        </svg>`
      },
      {
        cap: 'Pressure in a liquid grows with depth only. The shape of the container does not matter.',
        svg: `<svg viewBox="0 0 240 130" role="img" aria-label="A tank with pressure arrows growing with depth">
          <path d="M56 24 h128 v88 h-128 z" fill="#dbeafe" stroke="#191c3a" stroke-width="2.5"/>
          <line x1="56" y1="52" x2="184" y2="52" stroke="#6d7194" stroke-width="1" stroke-dasharray="4 4"/>
          <line x1="56" y1="84" x2="184" y2="84" stroke="#6d7194" stroke-width="1" stroke-dasharray="4 4"/>
          <line x1="72" y1="40" x2="96" y2="40" stroke="#2f6fd0" stroke-width="3"/>
          <line x1="72" y1="68" x2="112" y2="68" stroke="#2f6fd0" stroke-width="3"/>
          <line x1="72" y1="100" x2="128" y2="100" stroke="#2f6fd0" stroke-width="3"/>
          <text x="196" y="58" font-size="9" fill="#6d7194">shallow</text>
          <text x="196" y="106" font-size="9" fill="#6d7194">deep</text>
        </svg>`
      }
    ],
    remember: 'Force over area. Under water, density × g × depth.',
    trap: 'Using the volume of liquid where the depth belongs.'
  },

  magnetism: {
    title: 'Magnetism',
    why: 'Magnets and currents are two views of the same thing: a current makes a magnetic field, and a magnetic field pushes a current.',
    rule: 'Force on a wire = B × I × L (when the wire is at right angles to the field).',
    beats: [
      'Like poles repel, unlike poles attract. Two north poles push apart.',
      'A current-carrying wire in a magnetic field feels a force — this is the motor effect, and it is why motors turn.',
      'Flux density B is measured in tesla (T). One tesla is one newton per ampere per metre of wire.'
    ],
    example: {
      q: 'A 0.5 m wire carries 4 A at right angles to a 0.3 T field. What force acts on it?',
      steps: [
        'F = BIL.',
        'F = 0.3 × 4 × 0.5 = 0.6 N.'
      ],
      a: '0.6 N'
    },
    figs: [
      {
        cap: 'Field lines run from north to south outside the magnet. Where they crowd, the field is strongest.',
        svg: `<svg viewBox="0 0 240 140" role="img" aria-label="A bar magnet with field lines from north to south">
          <rect x="86" y="56" width="34" height="30" fill="#e5484d" stroke="#191c3a" stroke-width="2.5"/>
          <rect x="120" y="56" width="34" height="30" fill="#2f6fd0" stroke="#191c3a" stroke-width="2.5"/>
          <text x="103" y="76" text-anchor="middle" font-size="13" font-weight="800" fill="#fff">N</text>
          <text x="137" y="76" text-anchor="middle" font-size="13" font-weight="800" fill="#fff">S</text>
          <path d="M88 58 q-40 -24 -26 -34 q26 -12 44 30" fill="none" stroke="#191c3a" stroke-width="1.8"/>
          <path d="M152 58 q40 -24 26 -34 q-26 -12 -44 30" fill="none" stroke="#191c3a" stroke-width="1.8"/>
          <path d="M88 84 q-40 24 -26 34 q26 12 44 -30" fill="none" stroke="#191c3a" stroke-width="1.8"/>
          <path d="M152 84 q40 24 26 34 q-26 12 -44 -30" fill="none" stroke="#191c3a" stroke-width="1.8"/>
          <text x="120" y="134" text-anchor="middle" font-size="10" fill="#6d7194">outside: N → S</text>
        </svg>`
      },
      {
        cap: 'A current at right angles to a field is pushed. Reverse the current and the push reverses.',
        svg: `<svg viewBox="0 0 240 130" role="img" aria-label="A wire in a magnetic field feeling a force">
          <rect x="20" y="20" width="200" height="88" fill="none" stroke="#6d7194" stroke-width="1.2" stroke-dasharray="4 4"/>
          <line x1="120" y1="26" x2="120" y2="102" stroke="#191c3a" stroke-width="3"/>
          <text x="128" y="118" text-anchor="middle" font-size="10" fill="#6d7194">wire</text>
          <line x1="40" y1="64" x2="200" y2="64" stroke="#2f6fd0" stroke-width="2.5"/>
          <path d="M200 64 l-10 -5 v10 z" fill="#2f6fd0"/>
          <text x="60" y="56" font-size="10" font-weight="700" fill="#1f4f9c">B field</text>
          <line x1="120" y1="64" x2="120" y2="34" stroke="#e5484d" stroke-width="3"/>
          <path d="M120 34 l-5 9 h10 z" fill="#e5484d"/>
          <text x="134" y="44" font-size="10" font-weight="700" fill="#b3261e">F = BIL</text>
        </svg>`
      }
    ],
    remember: 'F = BIL. Like poles repel; a current in a field feels a push.',
    trap: 'Adding the three quantities instead of multiplying them.'
  },

  space: {
    title: 'Space',
    why: 'Gravity is what shapes orbits, and weight depends on which world you are standing on.',
    rule: 'W = mg everywhere — only g changes. Earth\'s g is 9.8 m/s², the Moon\'s is about 1.6 m/s².',
    beats: [
      'Mass stays the same wherever you go. Weight changes because g changes: the same 50 kg astronaut weighs 490 N on Earth and 80 N on the Moon.',
      'Day and night come from Earth spinning on its axis, not from moving around the Sun. One orbit of the Sun takes a year.',
      'The four inner planets, in order: Mercury, Venus, Earth, Mars.'
    ],
    example: {
      q: 'A 70 kg astronaut stands on Mars, where g = 3.7 m/s². What is her weight there?',
      steps: [
        'W = mg.',
        'W = 70 × 3.7 = 259 N.'
      ],
      a: '259 N'
    },
    figs: [
      {
        cap: 'Day and night come from the spin, not the orbit. Half the Earth is lit at any moment.',
        svg: `<svg viewBox="0 0 240 140" role="img" aria-label="The Earth lit on one side by the Sun">
          <circle cx="176" cy="30" r="14" fill="#f5b301"/>
          <text x="176" y="14" text-anchor="middle" font-size="9" fill="#6d7194">Sun</text>
          <line x1="160" y1="42" x2="132" y2="64" stroke="#f5b301" stroke-width="2"/>
          <circle cx="96" cy="72" r="36" fill="#7fb2ee" stroke="#191c3a" stroke-width="2.5"/>
          <path d="M96 36 a36 36 0 0 1 0 72 z" fill="#2f6fd0"/>
          <text x="78" y="76" text-anchor="middle" font-size="9" fill="#191c3a">night</text>
          <text x="114" y="76" text-anchor="middle" font-size="9" fill="#fff">day</text>
          <path d="M96 108 a44 12 0 1 1 0.1 0" fill="none" stroke="#191c3a" stroke-width="1.6" stroke-dasharray="5 3"/>
          <path d="M136 102 l6 6 l-8 3" fill="none" stroke="#191c3a" stroke-width="1.6"/>
          <text x="96" y="134" text-anchor="middle" font-size="9" fill="#6d7194">spin once = a day</text>
        </svg>`
      },
      {
        cap: 'The same 50 kg, three different weights. Mass is the same everywhere; g is not.',
        svg: `<svg viewBox="0 0 240 130" role="img" aria-label="Bars comparing weight on Earth, Mars and the Moon">
          <line x1="34" y1="108" x2="228" y2="108" stroke="#191c3a" stroke-width="2.5"/>
          <rect x="46" y="28" width="34" height="80" fill="#2f6fd0" rx="3"/>
          <text x="63" y="22" text-anchor="middle" font-size="10" font-weight="700" fill="#1f4f9c">490 N</text>
          <text x="63" y="122" text-anchor="middle" font-size="9" fill="#6d7194">Earth</text>
          <rect x="114" y="76" width="34" height="32" fill="#e5484d" rx="3"/>
          <text x="131" y="70" text-anchor="middle" font-size="10" font-weight="700" fill="#b3261e">185 N</text>
          <text x="131" y="122" text-anchor="middle" font-size="9" fill="#6d7194">Mars</text>
          <rect x="182" y="95" width="34" height="13" fill="#1e9e6a" rx="3"/>
          <text x="199" y="89" text-anchor="middle" font-size="10" font-weight="700" fill="#146b48">80 N</text>
          <text x="199" y="122" text-anchor="middle" font-size="9" fill="#6d7194">Moon</text>
        </svg>`
      }
    ],
    remember: 'Mass is yours; weight is the planet\'s. Day and night are a spin, a year is an orbit.',
    trap: 'Using Earth\'s g on another world, or confusing a rotation with an orbit.'
  }
};
