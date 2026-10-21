/* Lessons for the chemistry arcade: one short teaching page per topic.
 *
 * Written, not derived from the question bank. A lesson built from the bank's
 * answers would be a spoiler; a lesson built from its explanations would be
 * answers with the questions stripped off. What teaches is the idea, stated
 * once, with a worked example the bank does not ask about.
 *
 * Same shape as the physics lessons: why it matters, the rule, the reasoning
 * in two or three beats, a worked example, and one line to remember.
 */
window.CHEMISTRY_LESSONS = {
  atoms: {
    title: 'Atoms',
    why: 'Everything in chemistry is explained by three particles, their charges, and where they sit.',
    rule: 'Protons are positive and sit in the nucleus. Neutrons are neutral and sit beside them. Electrons are negative and occupy shells around the nucleus.',
    beats: [
      'The atomic number is the number of protons. It is what makes an element that element — change it and you have a different element.',
      'In a neutral atom the electrons balance the protons, so the charges cancel. An ion is an atom that has gained or lost electrons and no longer balances.',
      'Nearly all the mass is in the nucleus, because electrons weigh almost nothing. Nearly all the volume is the electron shells.'
    ],
    example: {
      q: 'A sodium atom has atomic number 11 and mass number 23. How many protons, neutrons and electrons does the neutral atom have?',
      steps: [
        'Protons = atomic number = 11.',
        'Neutrons = mass number − protons = 23 − 11 = 12.',
        'Neutral atom, so electrons = protons = 11.'
      ],
      a: '11 protons, 12 neutrons, 11 electrons'
    },
    remember: 'Atomic number counts protons; mass number counts protons plus neutrons.',
    trap: 'Using the mass number as the proton count, or forgetting the neutral atom has equal electrons.',
    figs: [
      {
        cap: 'The nucleus holds protons and neutrons; the electrons sit in shells around it. Nearly all the mass is in the middle.',
        svg: `<svg viewBox="0 0 240 130" role="img" aria-label="An atom with a nucleus and two electron shells">
          <circle cx="120" cy="64" r="48" fill="none" stroke="#6d7194" stroke-width="1.5" stroke-dasharray="4 4"/>
          <circle cx="120" cy="64" r="26" fill="none" stroke="#6d7194" stroke-width="1.5" stroke-dasharray="4 4"/>
          <circle cx="112" cy="58" r="7" fill="#e5484d"/>
          <circle cx="128" cy="58" r="7" fill="#e5484d"/>
          <circle cx="112" cy="72" r="7" fill="#6d7194"/>
          <circle cx="128" cy="72" r="7" fill="#6d7194"/>
          <circle cx="120" cy="16" r="5" fill="#2f6fd0"/>
          <circle cx="168" cy="64" r="5" fill="#2f6fd0"/>
          <circle cx="120" cy="112" r="5" fill="#2f6fd0"/>
          <circle cx="72" cy="64" r="5" fill="#2f6fd0"/>
          <circle cx="154" cy="30" r="4" fill="#1f4f9c"/>
          <circle cx="154" cy="98" r="4" fill="#1f4f9c"/>
          <circle cx="86" cy="98" r="4" fill="#1f4f9c"/>
          <circle cx="86" cy="30" r="4" fill="#1f4f9c"/>
          <text x="120" y="126" text-anchor="middle" font-size="9" fill="#6d7194">red = proton, grey = neutron, blue = electron</text>
        </svg>`
      },
      {
        cap: 'Atomic number and mass number are two different counts. Neutrons are the difference.',
        svg: `<svg viewBox="0 0 240 130" role="img" aria-label="A bar showing protons and neutrons making up the mass number">
          <text x="20" y="34" font-size="10" fill="#6d7194">mass 23</text>
          <rect x="20" y="42" width="120" height="26" fill="#e5484d" rx="3"/>
          <text x="80" y="60" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">11 protons</text>
          <rect x="140" y="42" width="60" height="26" fill="#6d7194" rx="3"/>
          <text x="170" y="60" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">12 n</text>
          <text x="20" y="92" font-size="10" fill="#6d7194">atomic number 11 = protons only</text>
          <line x1="20" y1="98" x2="140" y2="98" stroke="#e5484d" stroke-width="2"/>
          <text x="20" y="118" font-size="10" fill="#1f4f9c">electrons = 11 when neutral</text>
        </svg>`
      }
    ]
  },

  periodic: {
    title: 'The periodic table',
    why: 'The table is not a list to memorise. Position tells you how an element behaves, because position is a picture of its outer shell.',
    rule: 'The group number (the column) is the number of outer electrons. The period (the row) is the number of shells.',
    beats: [
      'Group 1, the alkali metals: one outer electron, so they lose it easily and react fiercely.',
      'Group 7, the halogens: seven outer electrons, one short of a full shell, so they grab one.',
      'Group 0, the noble gases: a full outer shell already, so they do not react. That full shell is the goal the others are all reaching for.'
    ],
    example: {
      q: 'An element is in Group 2, Period 3. How many outer electrons and how many shells does it have?',
      steps: [
        'Group 2 means two outer electrons.',
        'Period 3 means three shells.'
      ],
      a: '2 outer electrons, 3 shells'
    },
    remember: 'Group = outer electrons. Period = shells. Full shell = unreactive.',
    trap: 'Reading the group number as the shell count, or the other way round.',
    figs: [
      {
        cap: 'The column is the outer electrons. The row is how many shells you fill to hold them.',
        svg: `<svg viewBox="0 0 240 140" role="img" aria-label="A grid of the periodic table with group and period marked">
          <rect x="40" y="24" width="160" height="96" fill="none" stroke="#191c3a" stroke-width="2.5" rx="4"/>
          <line x1="40" y1="56" x2="200" y2="56" stroke="#6d7194" stroke-width="1"/>
          <line x1="40" y1="88" x2="200" y2="88" stroke="#6d7194" stroke-width="1"/>
          <line x1="80" y1="24" x2="80" y2="120" stroke="#6d7194" stroke-width="1"/>
          <line x1="120" y1="24" x2="120" y2="120" stroke="#6d7194" stroke-width="1"/>
          <line x1="160" y1="24" x2="160" y2="120" stroke="#6d7194" stroke-width="1"/>
          <text x="120" y="16" text-anchor="middle" font-size="10" font-weight="700" fill="#1f4f9c">group → outer electrons</text>
          <text x="30" y="76" text-anchor="middle" font-size="10" font-weight="700" fill="#b3261e" transform="rotate(-90 30 76)">period → shells</text>
          <rect x="80" y="56" width="40" height="32" fill="#dbeafe" stroke="#2f6fd0" stroke-width="2"/>
          <text x="100" y="77" text-anchor="middle" font-size="11" font-weight="800" fill="#1f4f9c">2</text>
        </svg>`
      },
      {
        cap: 'Group 1 gives one away, Group 7 takes one, Group 0 is already full and does nothing.',
        svg: `<svg viewBox="0 0 240 130" role="img" aria-label="Outer shells for groups 1, 7 and 0">
          <circle cx="42" cy="60" r="26" fill="none" stroke="#191c3a" stroke-width="2.5"/>
          <circle cx="42" cy="60" r="7" fill="#191c3a"/>
          <circle cx="42" cy="34" r="4" fill="#2f6fd0"/>
          <text x="42" y="104" text-anchor="middle" font-size="10" font-weight="700" fill="#1f4f9c">Gp 1</text>
          <text x="42" y="120" text-anchor="middle" font-size="9" fill="#6d7194">loses 1</text>
          <circle cx="120" cy="60" r="26" fill="none" stroke="#191c3a" stroke-width="2.5"/>
          <circle cx="120" cy="60" r="7" fill="#191c3a"/>
          <circle cx="120" cy="34" r="4" fill="#2f6fd0"/>
          <circle cx="138" cy="45" r="4" fill="#2f6fd0"/>
          <circle cx="146" cy="64" r="4" fill="#2f6fd0"/>
          <circle cx="138" cy="83" r="4" fill="#2f6fd0"/>
          <circle cx="120" cy="86" r="4" fill="#2f6fd0"/>
          <circle cx="102" cy="83" r="4" fill="#2f6fd0"/>
          <circle cx="94" cy="64" r="4" fill="#2f6fd0"/>
          <text x="120" y="104" text-anchor="middle" font-size="10" font-weight="700" fill="#1f4f9c">Gp 7</text>
          <text x="120" y="120" text-anchor="middle" font-size="9" fill="#6d7194">gains 1</text>
          <circle cx="198" cy="60" r="26" fill="none" stroke="#191c3a" stroke-width="2.5"/>
          <circle cx="198" cy="60" r="7" fill="#191c3a"/>
          <circle cx="198" cy="34" r="4" fill="#2f6fd0"/>
          <circle cx="216" cy="45" r="4" fill="#2f6fd0"/>
          <circle cx="224" cy="64" r="4" fill="#2f6fd0"/>
          <circle cx="216" cy="83" r="4" fill="#2f6fd0"/>
          <circle cx="198" cy="86" r="4" fill="#2f6fd0"/>
          <circle cx="180" cy="83" r="4" fill="#2f6fd0"/>
          <circle cx="172" cy="64" r="4" fill="#2f6fd0"/>
          <circle cx="180" cy="45" r="4" fill="#2f6fd0"/>
          <text x="198" y="104" text-anchor="middle" font-size="10" font-weight="700" fill="#146b48">Gp 0</text>
          <text x="198" y="120" text-anchor="middle" font-size="9" fill="#6d7194">full</text>
        </svg>`
      }
    ]
  },

  bonding: {
    title: 'Bonding',
    why: 'Atoms bond to get a full outer shell. How they get there — giving, taking, or sharing — decides what the substance is like.',
    rule: 'Metal + non-metal gives ionic bonding (electrons transferred). Non-metal + non-metal gives covalent bonding (electrons shared).',
    beats: [
      'In ionic bonding a metal loses electrons to become a positive ion, and a non-metal gains them to become a negative ion. Opposite charges hold the lattice together.',
      'In covalent bonding two non-metals share a pair of electrons. Neither atom becomes an ion; the molecule is held by the shared pair.',
      'Ionic compounds conduct when molten or dissolved, because the ions are free to move. Covalent molecular substances usually do not, because there are no ions to carry the charge.'
    ],
    example: {
      q: 'Magnesium (a metal) bonds with oxygen (a non-metal). What kind of bond forms, and what happens to the electrons?',
      steps: [
        'Metal plus non-metal means ionic.',
        'Magnesium loses two electrons to become Mg²⁺.',
        'Oxygen gains those two to become O²⁻.'
      ],
      a: 'Ionic: magnesium gives two electrons to oxygen'
    },
    remember: 'Metal meets non-metal, electrons move. Non-metal meets non-metal, electrons are shared.',
    trap: 'Calling a shared pair ionic, or saying a covalent substance forms ions.',
    figs: [
      {
        cap: 'Ionic: an electron leaves the metal and lands on the non-metal, and the two ions then attract.',
        svg: `<svg viewBox="0 0 240 130" role="img" aria-label="An electron transferring from a metal atom to a non-metal atom">
          <circle cx="56" cy="60" r="26" fill="#fde2e1" stroke="#191c3a" stroke-width="2.5"/>
          <circle cx="56" cy="60" r="6" fill="#191c3a"/>
          <text x="56" y="104" text-anchor="middle" font-size="11" font-weight="800" fill="#b3261e">Mg</text>
          <text x="56" y="120" text-anchor="middle" font-size="9" fill="#b3261e">→ Mg²⁺</text>
          <circle cx="184" cy="60" r="26" fill="#dbeafe" stroke="#191c3a" stroke-width="2.5"/>
          <circle cx="184" cy="60" r="6" fill="#191c3a"/>
          <text x="184" y="104" text-anchor="middle" font-size="11" font-weight="800" fill="#1f4f9c">O</text>
          <text x="184" y="120" text-anchor="middle" font-size="9" fill="#1f4f9c">→ O²⁻</text>
          <path d="M82 44 q38 -22 76 0" fill="none" stroke="#e5484d" stroke-width="2.5"/>
          <path d="M158 44 l-10 -2 l4 9 z" fill="#e5484d"/>
          <text x="120" y="26" text-anchor="middle" font-size="10" font-weight="700" fill="#b3261e">2 e⁻</text>
        </svg>`
      },
      {
        cap: 'Covalent: the pair sits between the atoms and belongs to both. Nothing becomes an ion.',
        svg: `<svg viewBox="0 0 240 130" role="img" aria-label="Two atoms sharing a pair of electrons">
          <circle cx="86" cy="62" r="28" fill="none" stroke="#191c3a" stroke-width="2.5"/>
          <circle cx="154" cy="62" r="28" fill="none" stroke="#191c3a" stroke-width="2.5"/>
          <circle cx="112" cy="54" r="4" fill="#2f6fd0"/>
          <circle cx="128" cy="70" r="4" fill="#2f6fd0"/>
          <text x="86" y="66" text-anchor="middle" font-size="12" font-weight="800" fill="#191c3a">H</text>
          <text x="154" y="66" text-anchor="middle" font-size="12" font-weight="800" fill="#191c3a">H</text>
          <text x="120" y="116" text-anchor="middle" font-size="10" fill="#6d7194">shared pair — a single covalent bond</text>
        </svg>`
      }
    ]
  },

  reactions: {
    title: 'Reactions',
    why: 'Most of this topic is a small set of products and the tests that identify them.',
    rule: 'Acid + metal → salt + hydrogen. Acid + carbonate → salt + water + carbon dioxide.',
    beats: [
      'Hydrogen burns with a squeaky pop when a lit splint is put in it.',
      'Carbon dioxide turns limewater milky — that is the test, and it is the same test whatever produced the gas.',
      'Burning a metal in oxygen gives that metal\'s oxide. Magnesium burns with a bright white flame to give white magnesium oxide.'
    ],
    example: {
      q: 'Hydrochloric acid is added to zinc. What gas is produced, and how would you test for it?',
      steps: [
        'Acid plus metal gives a salt and hydrogen.',
        'Test: hold a lit splint at the mouth of the tube.',
        'A squeaky pop confirms hydrogen.'
      ],
      a: 'Hydrogen — it pops with a lit splint'
    },
    remember: 'Acid + metal gives hydrogen; acid + carbonate gives carbon dioxide; limewater tests for CO₂.',
    trap: 'Testing for hydrogen with limewater, or naming water as the gas.',
    figs: [
      {
        cap: 'Acid on metal makes hydrogen; acid on carbonate makes carbon dioxide. Two different tests.',
        svg: `<svg viewBox="0 0 240 130" role="img" aria-label="Two test tubes, one with a lit splint and one with limewater">
          <path d="M44 30 v56 a16 16 0 0 0 32 0 V30" fill="#e8faf1" stroke="#191c3a" stroke-width="2.5"/>
          <rect x="44" y="62" width="32" height="24" fill="#9fd8c2"/>
          <line x1="60" y1="62" x2="60" y2="14" stroke="#e5484d" stroke-width="2.5"/>
          <circle cx="60" cy="12" r="4" fill="#f5b301"/>
          <text x="60" y="118" text-anchor="middle" font-size="9" fill="#146b48">pop!</text>
          <text x="60" y="130" text-anchor="middle" font-size="8" fill="#6d7194">acid + metal</text>
          <path d="M164 30 v56 a16 16 0 0 0 32 0 V30" fill="#fffdf8" stroke="#191c3a" stroke-width="2.5"/>
          <rect x="164" y="52" width="32" height="34" fill="#fffdf8"/>
          <path d="M164 66 h32" stroke="#191c3a" stroke-width="1.5"/>
          <text x="180" y="118" text-anchor="middle" font-size="9" fill="#191c3a">milky</text>
          <text x="180" y="130" text-anchor="middle" font-size="8" fill="#6d7194">CO₂ + limewater</text>
        </svg>`
      },
      {
        cap: 'Both reactions swap partners. The acid\'s hydrogen pairs with the other half to make a salt.',
        svg: `<svg viewBox="0 0 240 130" role="img" aria-label="An equation diagram showing acid plus metal giving salt plus hydrogen">
          <rect x="14" y="34" width="52" height="28" rx="6" fill="#fde2e1" stroke="#191c3a" stroke-width="2"/>
          <text x="40" y="53" text-anchor="middle" font-size="11" font-weight="700" fill="#191c3a">acid</text>
          <text x="76" y="53" text-anchor="middle" font-size="13" fill="#6d7194">+</text>
          <rect x="86" y="34" width="52" height="28" rx="6" fill="#dbeafe" stroke="#191c3a" stroke-width="2"/>
          <text x="112" y="53" text-anchor="middle" font-size="11" font-weight="700" fill="#191c3a">metal</text>
          <text x="148" y="53" text-anchor="middle" font-size="13" fill="#6d7194">→</text>
          <rect x="158" y="20" width="52" height="26" rx="6" fill="#e8faf1" stroke="#191c3a" stroke-width="2"/>
          <text x="184" y="38" text-anchor="middle" font-size="11" font-weight="700" fill="#191c3a">salt</text>
          <text x="184" y="72" text-anchor="middle" font-size="13" fill="#6d7194">+</text>
          <rect x="158" y="82" width="52" height="26" rx="6" fill="#fff3cd" stroke="#191c3a" stroke-width="2"/>
          <text x="184" y="100" text-anchor="middle" font-size="11" font-weight="700" fill="#191c3a">H₂</text>
        </svg>`
      }
    ]
  },

  acids: {
    title: 'Acids and alkalis',
    why: 'pH is a scale of how many hydrogen ions are free in the water.',
    rule: 'Acids release H⁺ in water. Alkalis release OH⁻. pH 7 is neutral; below 7 is acidic, above 7 is alkaline.',
    beats: [
      'The scale runs 0 to 14 and each step is a factor of ten in ion concentration, not a fixed amount.',
      'Universal indicator gives a colour: red through orange and yellow for acids, green at 7, blue through purple for alkalis.',
      'An alkali is not the same as a base. A base neutralises an acid; an alkali is a base that dissolves in water.'
    ],
    example: {
      q: 'A solution has a pH of 3. Is it acidic or alkaline, and what ion is responsible?',
      steps: [
        'Below 7, so acidic.',
        'Acids release hydrogen ions, H⁺.'
      ],
      a: 'Acidic, because of H⁺ ions'
    },
    remember: 'Below 7 acidic (H⁺), above 7 alkaline (OH⁻), 7 neutral.',
    trap: 'Saying an acid releases OH⁻, or that every base is an alkali.',
    figs: [
      {
        cap: 'The pH scale with universal indicator colours. Each step is ten times the ion concentration.',
        svg: `<svg viewBox="0 0 240 120" role="img" aria-label="A pH scale from 0 to 14 with indicator colours">
          <rect x="14" y="40" width="212" height="26" rx="6" fill="none" stroke="#191c3a" stroke-width="2.5"/>
          <rect x="16" y="42" width="28" height="22" fill="#d32f2f"/>
          <rect x="44" y="42" width="28" height="22" fill="#f57c00"/>
          <rect x="72" y="42" width="28" height="22" fill="#fbc02d"/>
          <rect x="100" y="42" width="28" height="22" fill="#7cb342"/>
          <rect x="128" y="42" width="28" height="22" fill="#26a69a"/>
          <rect x="156" y="42" width="28" height="22" fill="#3949ab"/>
          <rect x="184" y="42" width="28" height="22" fill="#6a1b9a"/>
          <rect x="212" y="42" width="12" height="22" fill="#4a148c"/>
          <text x="28" y="80" text-anchor="middle" font-size="9" fill="#6d7194">0</text>
          <text x="112" y="80" text-anchor="middle" font-size="9" fill="#6d7194">7</text>
          <text x="212" y="80" text-anchor="middle" font-size="9" fill="#6d7194">14</text>
          <text x="60" y="100" text-anchor="middle" font-size="10" font-weight="700" fill="#b3261e">acid (H⁺)</text>
          <text x="182" y="100" text-anchor="middle" font-size="10" font-weight="700" fill="#1f4f9c">alkali (OH⁻)</text>
          <text x="112" y="100" text-anchor="middle" font-size="9" fill="#146b48">neutral</text>
        </svg>`
      },
      {
        cap: 'Acid plus alkali gives salt plus water. The ions that made it acidic and alkaline cancel.',
        svg: `<svg viewBox="0 0 240 130" role="img" aria-label="Acid plus alkali neutralising to salt and water">
          <circle cx="52" cy="56" r="26" fill="#fde2e1" stroke="#191c3a" stroke-width="2.5"/>
          <text x="52" y="60" text-anchor="middle" font-size="10" font-weight="700" fill="#b3261e">H⁺</text>
          <text x="52" y="100" text-anchor="middle" font-size="10" fill="#6d7194">acid</text>
          <text x="92" y="60" text-anchor="middle" font-size="14" fill="#6d7194">+</text>
          <circle cx="134" cy="56" r="26" fill="#dbeafe" stroke="#191c3a" stroke-width="2.5"/>
          <text x="134" y="60" text-anchor="middle" font-size="10" font-weight="700" fill="#1f4f9c">OH⁻</text>
          <text x="134" y="100" text-anchor="middle" font-size="10" fill="#6d7194">alkali</text>
          <text x="174" y="60" text-anchor="middle" font-size="14" fill="#6d7194">→</text>
          <circle cx="208" cy="56" r="26" fill="#e8faf1" stroke="#191c3a" stroke-width="2.5"/>
          <text x="208" y="52" text-anchor="middle" font-size="9" font-weight="700" fill="#146b48">salt</text>
          <text x="208" y="66" text-anchor="middle" font-size="9" font-weight="700" fill="#146b48">+ water</text>
          <text x="208" y="100" text-anchor="middle" font-size="10" fill="#6d7194">pH 7</text>
        </svg>`
      }
    ]
  },

  moles: {
    title: 'Moles and formula mass',
    why: 'A mole is just a counting unit — the chemist\'s dozen — so that masses can be turned into numbers of particles.',
    rule: 'Relative formula mass = the sum of every atom\'s relative atomic mass in the formula.',
    beats: [
      'Add up every atom, including the ones inside brackets and the ones a subscript multiplies.',
      'One mole of any substance is its formula mass in grams, and contains 6.02 × 10²³ particles.',
      'Moles = mass ÷ formula mass. This is how a weighed mass becomes a number you can balance an equation with.'
    ],
    example: {
      q: 'What is the relative formula mass of calcium carbonate, CaCO₃? (Ar: Ca = 40, C = 12, O = 16)',
      steps: [
        'Ca: 40',
        'C: 12',
        'O: 3 × 16 = 48',
        'Total: 40 + 12 + 48 = 100'
      ],
      a: '100'
    },
    remember: 'Add every atom in the formula. A subscript multiplies only the atom it follows.',
    trap: 'Reading CO₂ as one carbon and one oxygen, or ignoring a subscript outside brackets.',
    figs: [
      {
        cap: 'CaCO₃ broken into its atoms: one calcium, one carbon, three oxygens. Add the masses.',
        svg: `<svg viewBox="0 0 240 130" role="img" aria-label="Calcium carbonate split into atom masses">
          <circle cx="34" cy="44" r="17" fill="#dbeafe" stroke="#191c3a" stroke-width="2"/>
          <text x="34" y="49" text-anchor="middle" font-size="10" font-weight="800" fill="#191c3a">Ca</text>
          <text x="34" y="76" text-anchor="middle" font-size="10" fill="#6d7194">40</text>
          <circle cx="86" cy="44" r="17" fill="#e8faf1" stroke="#191c3a" stroke-width="2"/>
          <text x="86" y="49" text-anchor="middle" font-size="10" font-weight="800" fill="#191c3a">C</text>
          <text x="86" y="76" text-anchor="middle" font-size="10" fill="#6d7194">12</text>
          <circle cx="138" cy="44" r="17" fill="#fde2e1" stroke="#191c3a" stroke-width="2"/>
          <text x="138" y="49" text-anchor="middle" font-size="10" font-weight="800" fill="#191c3a">O</text>
          <text x="138" y="76" text-anchor="middle" font-size="10" fill="#6d7194">16</text>
          <circle cx="190" cy="44" r="17" fill="#fde2e1" stroke="#191c3a" stroke-width="2"/>
          <text x="190" y="49" text-anchor="middle" font-size="10" font-weight="800" fill="#191c3a">O</text>
          <text x="190" y="76" text-anchor="middle" font-size="10" fill="#6d7194">16</text>
          <circle cx="222" cy="100" r="14" fill="#fde2e1" stroke="#191c3a" stroke-width="2"/>
          <text x="222" y="104" text-anchor="middle" font-size="9" font-weight="800" fill="#191c3a">O</text>
          <text x="222" y="124" text-anchor="middle" font-size="9" fill="#6d7194">16</text>
          <text x="100" y="110" text-anchor="middle" font-size="12" font-weight="800" fill="#191c3a">40 + 12 + 16 + 16 + 16 = 100</text>
        </svg>`
      },
      {
        cap: 'A mole is a fixed count, like a dozen. One mole of anything weighs its formula mass in grams.',
        svg: `<svg viewBox="0 0 240 130" role="img" aria-label="One mole in grams equals formula mass for two substances">
          <rect x="24" y="30" width="80" height="54" rx="8" fill="#dbeafe" stroke="#191c3a" stroke-width="2.5"/>
          <text x="64" y="54" text-anchor="middle" font-size="11" font-weight="700" fill="#191c3a">water</text>
          <text x="64" y="72" text-anchor="middle" font-size="11" fill="#1f4f9c">18 g</text>
          <rect x="136" y="30" width="80" height="54" rx="8" fill="#e8faf1" stroke="#191c3a" stroke-width="2.5"/>
          <text x="176" y="54" text-anchor="middle" font-size="11" font-weight="700" fill="#191c3a">CaCO₃</text>
          <text x="176" y="72" text-anchor="middle" font-size="11" fill="#146b48">100 g</text>
          <text x="120" y="108" text-anchor="middle" font-size="10" fill="#6d7194">both hold 6.02 × 10²³ particles</text>
        </svg>`
      }
    ]
  },

  states: {
    title: 'States of matter',
    why: 'The three states differ only in how much energy the particles have and how tightly they are held.',
    rule: 'Solid: fixed shape and volume. Liquid: fixed volume, no fixed shape. Gas: neither fixed.',
    beats: [
      'In a solid the particles are packed in a fixed pattern and only vibrate. In a liquid they are still touching but free to slide. In a gas they are far apart and move fast.',
      'Melting and boiling add energy to overcome the forces between particles. The particles themselves do not change — only their arrangement and speed.',
      'The temperature stays flat while a substance melts or boils, because the energy is going into breaking the forces, not into raising the temperature.'
    ],
    example: {
      q: 'A substance has a fixed volume but takes the shape of its container. What state is it, and how are its particles arranged?',
      steps: [
        'Fixed volume, no fixed shape → liquid.',
        'Particles are close together but able to slide past one another.'
      ],
      a: 'A liquid: particles touching but free to move'
    },
    remember: 'Shape and volume: both fixed is solid, one fixed is liquid, neither is gas.',
    trap: 'Saying the particles melt, rather than the forces between them being overcome.',
    figs: [
      {
        cap: 'Solid: packed and vibrating. Liquid: still touching, free to slide. Gas: far apart and fast.',
        svg: `<svg viewBox="0 0 240 130" role="img" aria-label="Particle diagrams for solid, liquid and gas">
          <rect x="14" y="24" width="66" height="66" rx="8" fill="#fffdf8" stroke="#191c3a" stroke-width="2.5"/>
          <g fill="#2f6fd0">
            <circle cx="30" cy="40" r="5"/><circle cx="47" cy="40" r="5"/><circle cx="64" cy="40" r="5"/>
            <circle cx="30" cy="57" r="5"/><circle cx="47" cy="57" r="5"/><circle cx="64" cy="57" r="5"/>
            <circle cx="30" cy="74" r="5"/><circle cx="47" cy="74" r="5"/><circle cx="64" cy="74" r="5"/>
          </g>
          <text x="47" y="106" text-anchor="middle" font-size="10" font-weight="700" fill="#191c3a">solid</text>
          <rect x="88" y="24" width="66" height="66" rx="8" fill="#fffdf8" stroke="#191c3a" stroke-width="2.5"/>
          <g fill="#2f6fd0">
            <circle cx="104" cy="66" r="5"/><circle cx="122" cy="70" r="5"/><circle cx="140" cy="64" r="5"/>
            <circle cx="110" cy="82" r="5"/><circle cx="132" cy="82" r="5"/>
          </g>
          <text x="121" y="106" text-anchor="middle" font-size="10" font-weight="700" fill="#191c3a">liquid</text>
          <rect x="162" y="24" width="66" height="66" rx="8" fill="#fffdf8" stroke="#191c3a" stroke-width="2.5"/>
          <g fill="#2f6fd0">
            <circle cx="176" cy="40" r="4"/><circle cx="214" cy="48" r="4"/>
            <circle cx="192" cy="66" r="4"/><circle cx="208" cy="80" r="4"/>
          </g>
          <text x="195" y="106" text-anchor="middle" font-size="10" font-weight="700" fill="#191c3a">gas</text>
        </svg>`
      },
      {
        cap: 'The temperature flatlines while melting and boiling: the heat is going into the forces, not the reading.',
        svg: `<svg viewBox="0 0 240 130" role="img" aria-label="A heating curve with melting and boiling plateaus">
          <line x1="34" y1="106" x2="226" y2="106" stroke="#191c3a" stroke-width="2.5"/>
          <line x1="34" y1="106" x2="34" y2="16" stroke="#191c3a" stroke-width="2.5"/>
          <path d="M34 100 L78 62 L118 62 L158 34 L196 34 L222 18" fill="none" stroke="#2f6fd0" stroke-width="3"/>
          <text x="98" y="54" text-anchor="middle" font-size="9" font-weight="700" fill="#b3261e">melt</text>
          <text x="177" y="26" text-anchor="middle" font-size="9" font-weight="700" fill="#b3261e">boil</text>
          <text x="130" y="122" text-anchor="middle" font-size="9" fill="#6d7194">energy added →</text>
        </svg>`
      }
    ]
  },

  separating: {
    title: 'Separating mixtures',
    why: 'Each method works on one difference between the parts — size, boiling point, or how well they dissolve.',
    rule: 'Filtration separates an insoluble solid from a liquid. Distillation separates by boiling point. Evaporation recovers a dissolved solid.',
    beats: [
      'Filtration: the solid stays on the filter paper as the residue; the liquid passes through as the filtrate.',
      'Simple distillation boils off the liquid and condenses it, so you keep the liquid. Evaporation just drives it off, so you keep the solid.',
      'Chromatography separates dissolved substances by how far they travel up the paper — the ones that stick to the paper least travel furthest.'
    ],
    example: {
      q: 'You have a mixture of sand and salt water. How would you get dry sand and dry salt?',
      steps: [
        'Filter: sand stays on the paper as the residue, salt water passes through.',
        'Evaporate the filtrate to recover the salt.'
      ],
      a: 'Filter for the sand, then evaporate the filtrate for the salt'
    },
    remember: 'Filtration for what will not dissolve; distillation when you want the liquid back.',
    trap: 'Using distillation when the question asks you to keep the solid.',
    figs: [
      {
        cap: 'Filtration: the solid is caught as the residue, the liquid passes through as the filtrate.',
        svg: `<svg viewBox="0 0 240 130" role="img" aria-label="A filter funnel separating sand from salt water">
          <path d="M78 20 L162 20 L134 62 L134 104 L106 104 L106 62 Z" fill="#fffdf8" stroke="#191c3a" stroke-width="2.5"/>
          <path d="M84 26 L156 26 L130 58 L110 58 Z" fill="#d9c9a3"/>
          <circle cx="100" cy="34" r="3" fill="#8a6d3b"/><circle cx="120" cy="30" r="3" fill="#8a6d3b"/>
          <circle cx="140" cy="34" r="3" fill="#8a6d3b"/><circle cx="130" cy="42" r="3" fill="#8a6d3b"/>
          <rect x="106" y="104" width="28" height="18" fill="#dbeafe" stroke="#191c3a" stroke-width="2"/>
          <text x="182" y="34" font-size="9" fill="#6d7194">sand</text>
          <text x="182" y="46" font-size="9" fill="#6d7194">= residue</text>
          <text x="182" y="106" font-size="9" fill="#6d7194">salt water</text>
          <text x="182" y="118" font-size="9" fill="#6d7194">= filtrate</text>
        </svg>`
      },
      {
        cap: 'Distillation: boil the liquid off, then cool it back. You keep the liquid, not the solid.',
        svg: `<svg viewBox="0 0 240 130" role="img" aria-label="Simple distillation apparatus with a condenser">
          <path d="M26 44 v40 a18 18 0 0 0 36 0 V44" fill="#fde2e1" stroke="#191c3a" stroke-width="2.5"/>
          <rect x="26" y="64" width="36" height="20" fill="#e5484d" opacity="0.5"/>
          <path d="M44 44 v-10 h76 l20 34" fill="none" stroke="#191c3a" stroke-width="2.5"/>
          <rect x="126" y="62" width="52" height="16" rx="8" fill="#dbeafe" stroke="#191c3a" stroke-width="2.5"/>
          <path d="M186 70 h16 v22 h-16 z" fill="#dbeafe" stroke="#191c3a" stroke-width="2.5"/>
          <text x="44" y="118" text-anchor="middle" font-size="9" fill="#6d7194">heat</text>
          <text x="152" y="98" text-anchor="middle" font-size="9" fill="#6d7194">condenser</text>
          <text x="196" y="118" text-anchor="middle" font-size="9" fill="#1f4f9c">pure</text>
          <text x="196" y="130" text-anchor="middle" font-size="9" fill="#1f4f9c">liquid</text>
        </svg>`
      }
    ]
  },

  energetics: {
    title: 'Energy in reactions',
    why: 'Every reaction either gives heat out or takes it in, and the difference is where the energy sits before and after.',
    rule: 'Exothermic: energy is released, surroundings get warmer. Endothermic: energy is taken in, surroundings get cooler.',
    beats: [
      'Breaking bonds takes energy in; making bonds gives energy out. The overall sign is whichever is larger.',
      'Activation energy is the energy needed to get the reaction started, before any of it is released. A catalyst lowers it.',
      'Combustion and neutralisation are exothermic. Thermal decomposition and photosynthesis are endothermic.'
    ],
    example: {
      q: 'A reaction makes its container feel cold. Is it exothermic or endothermic, and where does the energy go?',
      steps: [
        'The surroundings lost heat, so the reaction took it in.',
        'That is endothermic.'
      ],
      a: 'Endothermic — energy is taken in from the surroundings'
    },
    remember: 'Exo gives out, endo takes in. Feel the container and you know which.',
    trap: 'Confusing activation energy with the overall energy change.',
    figs: [
      {
        cap: 'Exothermic: the products sit lower than the reactants, and the difference leaves as heat.',
        svg: `<svg viewBox="0 0 240 130" role="img" aria-label="An exothermic energy profile, products lower than reactants">
          <line x1="34" y1="106" x2="222" y2="106" stroke="#191c3a" stroke-width="2.5"/>
          <line x1="34" y1="106" x2="34" y2="14" stroke="#191c3a" stroke-width="2.5"/>
          <path d="M40 60 q26 -40 52 -40 q22 0 36 34 h50" fill="none" stroke="#2f6fd0" stroke-width="3"/>
          <line x1="34" y1="60" x2="80" y2="60" stroke="#6d7194" stroke-width="1" stroke-dasharray="4 4"/>
          <line x1="34" y1="94" x2="186" y2="94" stroke="#6d7194" stroke-width="1" stroke-dasharray="4 4"/>
          <text x="92" y="26" font-size="9" fill="#6d7194">activation energy</text>
          <line x1="200" y1="60" x2="200" y2="94" stroke="#e5484d" stroke-width="2.5"/>
          <path d="M200 94 l-4 -9 h8 z" fill="#e5484d"/>
          <text x="212" y="80" font-size="9" font-weight="700" fill="#b3261e">heat</text>
          <text x="120" y="122" text-anchor="middle" font-size="9" fill="#6d7194">exothermic</text>
        </svg>`
      },
      {
        cap: 'Endothermic: the products sit higher, so the reaction has taken energy in from around it.',
        svg: `<svg viewBox="0 0 240 130" role="img" aria-label="An endothermic energy profile, products higher than reactants">
          <line x1="34" y1="106" x2="222" y2="106" stroke="#191c3a" stroke-width="2.5"/>
          <line x1="34" y1="106" x2="34" y2="14" stroke="#191c3a" stroke-width="2.5"/>
          <path d="M40 88 q26 -44 52 -44 q22 0 36 34 h50" fill="none" stroke="#2f6fd0" stroke-width="3"/>
          <line x1="34" y1="88" x2="80" y2="88" stroke="#6d7194" stroke-width="1" stroke-dasharray="4 4"/>
          <line x1="34" y1="44" x2="186" y2="44" stroke="#6d7194" stroke-width="1" stroke-dasharray="4 4"/>
          <line x1="200" y1="88" x2="200" y2="44" stroke="#1e9e6a" stroke-width="2.5"/>
          <path d="M200 44 l-4 9 h8 z" fill="#1e9e6a"/>
          <text x="212" y="68" font-size="9" font-weight="700" fill="#146b48">in</text>
          <text x="120" y="122" text-anchor="middle" font-size="9" fill="#6d7194">endothermic</text>
        </svg>`
      }
    ]
  },

  organic: {
    title: 'Organic chemistry',
    why: 'Carbon forms chains, and the family a compound belongs to is read off its formula.',
    rule: 'Alkanes: CₙH₂ₙ₊₂, single bonds only. Alkenes: CₙH₂ₙ, one double bond.',
    beats: [
      'A hydrocarbon contains only carbon and hydrogen. Nothing else, or it is not a hydrocarbon.',
      'The prefix gives the number of carbons: meth- 1, eth- 2, prop- 3, but- 4. So CH₄ is methane and C₂H₆ is ethane.',
      'The alkane/alkene difference is one double bond. Alkenes decolourise bromine water; alkanes do not. That is the test.'
    ],
    example: {
      q: 'A hydrocarbon has the formula C₃H₆. Which family is it in, and what is its name?',
      steps: [
        'Check against the general formulas: CₙH₂ₙ with n = 3 gives C₃H₆.',
        'That is the alkene family.',
        'Three carbons with a double bond is propene.'
      ],
      a: 'An alkene — propene'
    },
    remember: 'Count the hydrogens against 2n+2 and 2n. The prefix names the carbons.',
    trap: 'Naming by carbon count alone without checking which family the formula fits.',
    figs: [
      {
        cap: 'Alkanes have single bonds; alkenes have one double bond. That one difference is the whole test.',
        svg: `<svg viewBox="0 0 240 130" role="img" aria-label="Ethane with a single bond and ethene with a double bond">
          <text x="60" y="18" text-anchor="middle" font-size="10" font-weight="700" fill="#191c3a">ethane C₂H₆</text>
          <circle cx="34" cy="52" r="13" fill="#191c3a"/>
          <text x="34" y="56" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">C</text>
          <circle cx="86" cy="52" r="13" fill="#191c3a"/>
          <text x="86" y="56" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">C</text>
          <line x1="47" y1="52" x2="73" y2="52" stroke="#191c3a" stroke-width="2.5"/>
          <text x="60" y="92" text-anchor="middle" font-size="9" fill="#6d7194">single bond</text>
          <text x="180" y="18" text-anchor="middle" font-size="10" font-weight="700" fill="#191c3a">ethene C₂H₄</text>
          <circle cx="154" cy="52" r="13" fill="#191c3a"/>
          <text x="154" y="56" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">C</text>
          <circle cx="206" cy="52" r="13" fill="#191c3a"/>
          <text x="206" y="56" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">C</text>
          <line x1="167" y1="47" x2="193" y2="47" stroke="#191c3a" stroke-width="2.5"/>
          <line x1="167" y1="57" x2="193" y2="57" stroke="#191c3a" stroke-width="2.5"/>
          <text x="180" y="92" text-anchor="middle" font-size="9" fill="#b3261e">double bond</text>
        </svg>`
      },
      {
        cap: 'Bromine water is the test: an alkene decolourises it, an alkane leaves it orange.',
        svg: `<svg viewBox="0 0 240 130" role="img" aria-label="Two tubes of bromine water, one decolourised by an alkene">
          <path d="M50 26 v62 a14 14 0 0 0 28 0 V26" fill="#f5b301" stroke="#191c3a" stroke-width="2.5"/>
          <text x="64" y="112" text-anchor="middle" font-size="10" font-weight="700" fill="#191c3a">+ alkane</text>
          <text x="64" y="126" text-anchor="middle" font-size="9" fill="#6d7194">stays orange</text>
          <path d="M162 26 v62 a14 14 0 0 0 28 0 V26" fill="#f4f1ea" stroke="#191c3a" stroke-width="2.5"/>
          <text x="176" y="112" text-anchor="middle" font-size="10" font-weight="700" fill="#191c3a">+ alkene</text>
          <text x="176" y="126" text-anchor="middle" font-size="9" fill="#146b48">goes colourless</text>
          <text x="120" y="20" text-anchor="middle" font-size="9" fill="#6d7194">bromine water</text>
        </svg>`
      }
    ]
  }
};
