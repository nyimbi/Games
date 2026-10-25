/* Lessons for the five maths games.
 *
 * Written, not generated from the question pools. A lesson derived from a
 * pool would be a spoiler -- it would hand over the answers -- and one derived
 * from the explanations would be a list of answers with the questions
 * stripped off. What teaches is the idea stated once, a worked example the
 * game does not ask about, and the mistake that usually goes with it.
 *
 * Every example uses numbers the games do not drill, so reading the lesson is
 * never a rehearsal of a question the learner is about to meet.
 *
 * Shape, shared with physics-lessons.js and piano-lessons.js:
 *   { title, why, rule, beats[], example{q, steps[], a}, remember, trap,
 *     figs[{cap, svg}] }
 */
(function () {
  'use strict';

  const INK = '#191c3a', MUTED = '#6d7194', ACCENT = '#ffb703';
  const mono = 'font-family="ui-monospace,Menlo,monospace"';

  /* A row of counters, used wherever "how many" is the point. */
  function dots(n, marked) {
    const m = marked || 0;
    let out = '';
    for (let i = 0; i < n; i++) {
      out += `<circle cx="${14 + (i % 10) * 20}" cy="${18 + Math.floor(i / 10) * 20}" r="7"
        fill="${i < m ? ACCENT : '#fffdf8'}" stroke="${INK}" stroke-width="1.6"/>`;
    }
    return out;
  }

  const BONDS = {
    parts: {
      title: 'A whole and its two parts',
      why: 'A number bond is one whole split two ways. Once you can see 10 as 7 and 3, you can find the missing piece without counting, which is what makes arithmetic fast later.',
      rule: 'The whole stays the same. Only the split moves. If you know one part, the other is the whole minus that part.',
      beats: [
        'Every whole has many splits. 10 is 10 and 0, 9 and 1, 8 and 2, and so on down to 0 and 10. Eleven ways for 10, and the number of ways is always one more than the whole.',
        'A split has two directions. 7 and 3 make 10, so 10 take away 7 is 3, and 10 take away 3 is 7. The same fact, read two ways.',
        'The halves are the split that is even on both sides. 10 splits into 5 and 5, and that is why 5 + 5 is the one bond people remember without counting.'
      ],
      example: {
        q: 'A whole is 13. One part is 8. What is the other?',
        steps: [
          'The whole is 13 and one part is 8.',
          'The other part is 13 − 8.',
          '13 − 8 = 5, so the split is 8 and 5.'
        ],
        a: '5 — the parts are 8 and 5'
      },
      remember: 'Whole minus part gives the other part.',
      trap: 'Counting up from the part you can see instead of subtracting. Counting works for small numbers and stops working at 20, which is exactly where the game gets hard.',
      figs: [{
        cap: 'The whole 13, split 8 and 5',
        svg: `<svg viewBox="0 0 300 96" role="img" aria-label="A whole of 13 split into 8 and 5">
          <rect x="96" y="10" width="108" height="26" rx="8" fill="${ACCENT}" stroke="${INK}" stroke-width="2"/>
          <text x="150" y="29" text-anchor="middle" ${mono} font-size="14" font-weight="800" fill="${INK}">13</text>
          <line x1="150" y1="36" x2="76" y2="60" stroke="${INK}" stroke-width="2"/>
          <line x1="150" y1="36" x2="224" y2="60" stroke="${INK}" stroke-width="2"/>
          <rect x="40" y="62" width="72" height="26" rx="8" fill="#fffdf8" stroke="${INK}" stroke-width="2"/>
          <text x="76" y="81" text-anchor="middle" ${mono} font-size="14" font-weight="800" fill="${INK}">8</text>
          <rect x="188" y="62" width="72" height="26" rx="8" fill="#fffdf8" stroke="${INK}" stroke-width="2"/>
          <text x="224" y="81" text-anchor="middle" ${mono} font-size="14" font-weight="800" fill="${INK}">5</text>
        </svg>`
      }]
    },
    ten: {
      title: 'Bonds to ten',
      why: 'Ten is the hinge of the whole number system, because we count in tens. Every fact that makes ten is a fact you will use inside every bigger sum.',
      rule: 'The pairs that make 10 are 1+9, 2+8, 3+7, 4+6 and 5+5, and each one backwards.',
      beats: [
        'There are only five pairs to learn, not ten facts, because order does not change the total. 3 + 7 and 7 + 3 are one fact seen from two sides.',
        'The pattern is that the first part goes up by one while the second goes down by one. Once you know 4 + 6, the next is 5 + 5 without any counting.',
        'This is why 8 + 5 is easy once you know it: 8 needs 2 to reach 10, and 5 is 2 and 3, so 8 + 5 is 13.'
      ],
      example: {
        q: 'What must be added to 7 to reach 10, and how does that help with 7 + 6?',
        steps: [
          '7 needs 3 to reach 10.',
          '6 is 3 and 3, so take the 3 that completes the ten.',
          '7 + 3 = 10, and 3 are left, so 7 + 6 = 13.'
        ],
        a: '3 completes the ten, and 7 + 6 = 13'
      },
      remember: 'Ten is the bridge: reach it first, then add what is left.',
      trap: 'Counting on fingers from the larger number. It works, but it hides the fact that makes ten useful, and it gets slow at exactly the point where speed starts to matter.',
      figs: [{
        cap: 'Two fives make ten',
        svg: `<svg viewBox="0 0 300 60" role="img" aria-label="Ten counters in two groups of five">
          <g>${dots(5)}</g>
          <g transform="translate(120,0)">${dots(5)}</g>
          <text x="150" y="52" text-anchor="middle" ${mono} font-size="11" font-weight="800" fill="${MUTED}">5 + 5 = 10</text>
        </svg>`
      }]
    },
    teen: {
      title: 'Bonds above ten',
      why: 'Bonds to 20 are the same idea as bonds to 10, with a ten already in the whole. Seeing the ten inside a teen number is what turns counting into arithmetic.',
      rule: 'Every teen number is 10 plus something. 14 is 10 and 4, so a bond to 14 can be found by working with the 4.',
      beats: [
        'Teen numbers are named backwards in English: fourteen is four-ten. That is not a quirk, it is the structure. 14 = 10 + 4.',
        'To find the partner of 6 in 14, take the 4 that sits on top of the ten: 6 needs 4 to reach 10, then 4 more to reach 14. So the partner is 8.',
        'Once the ten is visible, a bond above ten is a bond to ten plus a small addition. Nothing new is learned; the same five pairs do the work.'
      ],
      example: {
        q: 'A whole is 17. One part is 9. What is the other part?',
        steps: [
          '17 is 10 and 7.',
          '9 needs 1 to reach 10, and then 7 more to reach 17.',
          '1 + 7 = 8, so the other part is 8.'
        ],
        a: '8 — the parts are 9 and 8'
      },
      remember: 'Split the teen into a ten and a bit; the ten does the work.',
      trap: 'Treating 17 as one lump. A learner who cannot see the 10 and the 7 inside it has to count, and counting is what this level is designed to replace.',
      figs: [{
        cap: '17 seen as a ten and a seven',
        svg: `<svg viewBox="0 0 300 92" role="img" aria-label="17 shown as a full ten and seven more">
          <rect x="16" y="16" width="112" height="60" rx="8" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="5 4"/>
          <text x="72" y="12" text-anchor="middle" ${mono} font-size="10" font-weight="800" fill="${MUTED}">ten</text>
          <g>${dots(10)}</g>
          <rect x="152" y="16" width="112" height="60" rx="8" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="5 4"/>
          <text x="208" y="12" text-anchor="middle" ${mono} font-size="10" font-weight="800" fill="${MUTED}">seven</text>
          <g transform="translate(152,0)">${dots(7)}</g>
        </svg>`
      }]
    },
    missing: {
      title: 'Finding the missing part',
      why: 'Most real arithmetic is a missing part, not a sum: you know the total and one piece and need the other. That is a subtraction wearing a bond\'s clothes.',
      rule: 'Missing part = whole − known part. And because addition is commutative, the missing part is the same whichever side it sits on.',
      beats: [
        'The question "8 + ? = 15" and the question "15 − 8 = ?" have the same answer. Recognising that saves learning a second set of facts.',
        'Check by adding back. If you think the missing part is 7, then 8 + 7 must be 15. A bond is self-checking, which a plain sum is not.',
        'The missing part is never bigger than the whole. An answer larger than the whole means the subtraction was done the wrong way round, and that check catches most errors.'
      ],
      example: {
        q: '12 + ? = 20. What is missing, and how do you check it?',
        steps: [
          'The whole is 20 and the known part is 12.',
          'Missing part = 20 − 12 = 8.',
          'Check by adding back: 12 + 8 = 20.'
        ],
        a: '8, because 12 + 8 = 20'
      },
      remember: 'Add back to check. A bond always closes.',
      trap: 'Subtracting the whole from the part, which gives a negative answer. The whole is always the number you take away from.',
      figs: [{
        cap: 'The missing part is what closes the bond',
        svg: `<svg viewBox="0 0 300 96" role="img" aria-label="Twelve plus a missing part makes twenty">
          <rect x="96" y="10" width="108" height="26" rx="8" fill="${ACCENT}" stroke="${INK}" stroke-width="2"/>
          <text x="150" y="29" text-anchor="middle" ${mono} font-size="14" font-weight="800" fill="${INK}">20</text>
          <line x1="150" y1="36" x2="76" y2="60" stroke="${INK}" stroke-width="2"/>
          <line x1="150" y1="36" x2="224" y2="60" stroke="${INK}" stroke-width="2"/>
          <rect x="40" y="62" width="72" height="26" rx="8" fill="#fffdf8" stroke="${INK}" stroke-width="2"/>
          <text x="76" y="81" text-anchor="middle" ${mono} font-size="14" font-weight="800" fill="${INK}">12</text>
          <rect x="188" y="62" width="72" height="26" rx="8" fill="#fffdf8" stroke="${INK}" stroke-width="2" stroke-dasharray="5 4"/>
          <text x="224" y="81" text-anchor="middle" ${mono} font-size="14" font-weight="800" fill="${MUTED}">?</text>
        </svg>`
      }]
    }
  };

  const ADDITION = {
    place: {
      title: 'Place value',
      why: 'Every written sum works because a digit means something different depending on where it sits. Ones, tens and hundreds are not labels, they are the whole reason the column method works.',
      rule: 'Add like with like. Ones go with ones, tens with tens, hundreds with hundreds. Never add a tens digit to a ones digit.',
      beats: [
        'In 47, the 4 means forty and the 7 means seven. Writing 47 is shorthand for 40 + 7, and the column method just keeps that split visible.',
        'Adding 47 and 25 column by column gives 7 + 5 in the ones and 4 + 2 in the tens: 12 and 60, which is 72. That is the same sum as adding the numbers whole.',
        'The answer to a sum is never smaller than either part, because both are positive. An answer that is smaller means a column was read as the wrong place value.'
      ],
      example: {
        q: 'What does the 3 mean in 356, and what is 356 + 200?',
        steps: [
          '356 is 300 + 50 + 6, so the 3 means three hundred.',
          '200 is two hundred and nothing else.',
          'Adding the hundreds: 300 + 200 = 500, so 356 + 200 = 556.'
        ],
        a: 'The 3 is three hundred; 356 + 200 = 556'
      },
      remember: 'A digit is worth its face value times its place.',
      trap: 'Adding the digits of different columns, so 47 + 25 becomes 6 and 12 rather than 72. The columns are different units and cannot be mixed.',
      figs: [{
        cap: '356 is three hundreds, five tens and six ones',
        svg: `<svg viewBox="0 0 300 88" role="img" aria-label="356 broken into hundreds tens and ones">
          <rect x="14" y="18" width="70" height="52" rx="6" fill="${ACCENT}" stroke="${INK}" stroke-width="2"/>
          <text x="49" y="50" text-anchor="middle" ${mono} font-size="18" font-weight="800" fill="${INK}">300</text>
          <rect x="96" y="18" width="70" height="52" rx="6" fill="#fffdf8" stroke="${INK}" stroke-width="2"/>
          <text x="131" y="50" text-anchor="middle" ${mono} font-size="18" font-weight="800" fill="${INK}">50</text>
          <rect x="178" y="18" width="70" height="52" rx="6" fill="#fffdf8" stroke="${INK}" stroke-width="2"/>
          <text x="213" y="50" text-anchor="middle" ${mono} font-size="18" font-weight="800" fill="${INK}">6</text>
          <g ${mono} font-size="9" font-weight="800" fill="${MUTED}">
            <text x="49" y="12" text-anchor="middle">hundreds</text>
            <text x="131" y="12" text-anchor="middle">tens</text>
            <text x="213" y="12" text-anchor="middle">ones</text>
          </g>
        </svg>`
      }]
    },
    carrying: {
      title: 'Carrying',
      why: 'When a column adds to ten or more, the extra ten has to go somewhere. Carrying is that ten moving one place to the left, and it is the only part of addition that people get wrong.',
      rule: 'Write the ones digit in the column and carry the tens digit into the next column to the left. Carry one for every ten.',
      beats: [
        '7 + 5 = 12. Twelve is one ten and two ones, so write the 2 and carry the 1 into the tens column. The 12 has not been thrown away, it has been unpacked.',
        'The carried digit is worth ten times more in its new column, which is exactly right, because it is a ten.',
        'Carry into an empty column when the sum overflows the number: 96 + 8 is 4 in the ones and 10 in the tens, which is 104 — a new hundreds column appears.'
      ],
      example: {
        q: 'What is 68 + 47, column by column?',
        steps: [
          'Ones: 8 + 7 = 15. Write 5, carry 1.',
          'Tens: 6 + 4 + 1 carried = 11. Write 1, carry 1.',
          'There is no next column, so the carried 1 becomes a new hundreds digit: 115.'
        ],
        a: '115'
      },
      remember: 'Carry one for every ten, and the carry is worth ten.',
      trap: 'Writing the whole 15 in the ones column. The column holds one digit; the ten belongs one place to the left.',
      figs: [{
        cap: '8 + 7 = 15: write 5, carry 1',
        svg: `<svg viewBox="0 0 300 110" role="img" aria-label="Column addition of 68 and 47 showing the carry">
          <g ${mono} font-size="17" font-weight="800" fill="${INK}">
            <text x="96" y="28" text-anchor="end">1</text>
            <text x="140" y="28" text-anchor="end">6</text>
            <text x="176" y="28" text-anchor="end">8</text>
            <text x="140" y="52" text-anchor="end">4</text>
            <text x="176" y="52" text-anchor="end">7</text>
          </g>
          <line x1="88" y1="60" x2="184" y2="60" stroke="${INK}" stroke-width="2"/>
          <g ${mono} font-size="17" font-weight="800" fill="${INK}">
            <text x="140" y="84" text-anchor="end">1</text>
            <text x="176" y="84" text-anchor="end">5</text>
          </g>
          <text x="214" y="84" ${mono} font-size="11" font-weight="800" fill="${MUTED}">= 115</text>
          <text x="96" y="18" text-anchor="middle" ${mono} font-size="9" font-weight="800" fill="${MUTED}">carry</text>
        </svg>`
      }]
    },
    inverse: {
      title: 'Addition and subtraction undo each other',
      why: 'Subtraction is not a second skill to learn. It is addition read backwards, and knowing that halves what there is to remember and gives you a way to check every answer.',
      rule: 'If a + b = c, then c − b = a and c − a = b. One fact, three sentences.',
      beats: [
        '8 + 5 = 13, so 13 − 5 = 8 and 13 − 8 = 5. You already know the subtraction because you know the addition.',
        'This is why checking a sum by subtracting is reliable: the check is a different operation on the same numbers, so a mistake in the sum shows up as a mismatch.',
        'The inverse is what makes missing-number questions answerable. "8 + ? = 13" is "13 − 8", and nothing new needs to be learned.'
      ],
      example: {
        q: 'You calculate 74 + 38 = 112. Check it.',
        steps: [
          'Subtract one part from the total: 112 − 38.',
          '112 − 38 = 74.',
          'That matches the other part, so the sum is right.'
        ],
        a: '112 − 38 = 74, so 74 + 38 = 112 is correct'
      },
      remember: 'Subtract to check a sum.',
      trap: 'Checking an addition by adding again. The same mistake repeats, and the check agrees with the error.',
      figs: [{
        cap: 'One fact family, four sentences',
        svg: `<svg viewBox="0 0 300 104" role="img" aria-label="The fact family of 8 5 and 13">
          <g ${mono} font-size="13" font-weight="800" fill="${INK}">
            <text x="150" y="26" text-anchor="middle">8 + 5 = 13</text>
            <text x="150" y="50" text-anchor="middle">5 + 8 = 13</text>
            <text x="150" y="74" text-anchor="middle">13 − 5 = 8</text>
            <text x="150" y="98" text-anchor="middle">13 − 8 = 5</text>
          </g>
          <line x1="60" y1="34" x2="240" y2="34" stroke="${MUTED}" stroke-width="1.2" stroke-dasharray="4 4"/>
          <line x1="60" y1="58" x2="240" y2="58" stroke="${MUTED}" stroke-width="1.2" stroke-dasharray="4 4"/>
        </svg>`
      }]
    },
    estimating: {
      title: 'Rounding to check',
      why: 'A calculator answers what you typed, not what you meant. Rounding gives you a second, independent answer in your head, and that is what catches a wrong key.',
      rule: 'Round each number to the nearest ten or hundred, add the rounded numbers, and expect the real answer to be close to that.',
      beats: [
        '47 + 38 rounds to 50 + 40 = 90. The real answer, 85, is close to 90 and on the low side because both numbers were rounded up.',
        'The estimate is not the answer. It is a guardrail: an answer of 8.5 or 850 when you expected 85 is a decimal point or a column error.',
        'Round to the nearest, not always up. 47 rounds to 50 because it is nearer 50 than 40, and 38 rounds to 40 for the same reason.'
      ],
      example: {
        q: 'Estimate 312 + 487, then say whether 799 is plausible.',
        steps: [
          '312 rounds to 300; 487 rounds to 500.',
          '300 + 500 = 800.',
          '799 is within a couple of the estimate, so it is plausible.'
        ],
        a: 'About 800, so 799 is plausible'
      },
      remember: 'Estimate first, calculate second, compare.',
      trap: 'Rounding both numbers the same way and trusting the estimate as exact. Two roundings can be off in the same direction, so the estimate is a range, not a value.',
      figs: [{
        cap: '47 and 38 sit near 50 and 40',
        svg: `<svg viewBox="0 0 300 84" role="img" aria-label="A number line showing 47 near 50 and 38 near 40">
          <line x1="24" y1="54" x2="276" y2="54" stroke="${INK}" stroke-width="2"/>
          <g ${mono} font-size="10" font-weight="800" fill="${MUTED}">
            <text x="24" y="72" text-anchor="middle">30</text>
            <text x="108" y="72" text-anchor="middle">40</text>
            <text x="192" y="72" text-anchor="middle">50</text>
            <text x="276" y="72" text-anchor="middle">60</text>
          </g>
          <circle cx="170" cy="54" r="6" fill="${ACCENT}" stroke="${INK}" stroke-width="2"/>
          <text x="170" y="40" text-anchor="middle" ${mono} font-size="10" font-weight="800" fill="${INK}">47</text>
          <circle cx="94" cy="54" r="6" fill="${ACCENT}" stroke="${INK}" stroke-width="2"/>
          <text x="94" y="40" text-anchor="middle" ${mono} font-size="10" font-weight="800" fill="${INK}">38</text>
        </svg>`
      }]
    }
  };

  const SUBTRACTION = {
    takeaway: {
      title: 'Taking away and finding the difference',
      why: 'Subtraction answers two different questions, and telling them apart is what stops a learner subtracting the wrong number. Either you remove some and ask what is left, or you compare two amounts.',
      rule: 'Take away: start with the larger, remove, count what is left. Difference: compare two amounts and report the gap.',
      beats: [
        'Nine sweets, eat four: how many left? That is take-away, and the answer is 5. Nine sweets and four sweets: how many more in the first pile? That is difference, and it is also 5.',
        'The arithmetic is the same, which is why the answer is the same. The difference is in what the numbers mean, and in which one you start from.',
        'Both are written a − b, and the answer is never negative if you have read the question correctly. A negative result means the numbers were the wrong way round.'
      ],
      example: {
        q: 'A shelf holds 15 books and 9 are taken. Separately, a boy has 15 marbles and his sister has 9. Which is a take-away and which is a difference?',
        steps: [
          'The shelf: books are removed, so it is take-away. 15 − 9 = 6 left.',
          'The marbles: nothing is removed, two amounts are compared. 15 − 9 = 6 more.',
          'Same sum, different question, same answer.'
        ],
        a: 'Take-away for the shelf, difference for the marbles; both 6'
      },
      remember: 'Take-away removes; difference compares.',
      trap: 'Reading a difference question as take-away and removing something that was never there. The numbers are the same, so the arithmetic still works — but the meaning does not.',
      figs: [{
        cap: 'Take-away removes; difference measures the gap',
        svg: `<svg viewBox="0 0 300 108" role="img" aria-label="Nine counters with four crossed out, and two rows compared">
          <g>${dots(9, 4)}</g>
          <text x="112" y="52" ${mono} font-size="10" font-weight="800" fill="${MUTED}">9 − 4 = 5</text>
          <g transform="translate(180,0)">
            <circle cx="7" cy="18" r="6" fill="${INK}"/><circle cx="27" cy="18" r="6" fill="${INK}"/>
            <circle cx="47" cy="18" r="6" fill="${INK}"/><circle cx="67" cy="18" r="6" fill="${INK}"/>
            <circle cx="7" cy="40" r="6" fill="${MUTED}"/><circle cx="27" cy="40" r="6" fill="${MUTED}"/>
          </g>
          <text x="240" y="52" ${mono} font-size="10" font-weight="800" fill="${MUTED}">gap 2</text>
        </svg>`
      }]
    },
    borrowing: {
      title: 'Borrowing',
      why: 'You cannot take 8 ones from 3 ones. Borrowing is not a trick to get round that; it is unpacking one ten into ten ones, which changes how the number is written and not what it is worth.',
      rule: 'When the top digit is too small, take one from the column to its left and add ten to this column. The value of the number is unchanged.',
      beats: [
        '53 − 28: you cannot do 3 − 8. Take one ten from the 5, which leaves 4 tens, and add it to the ones: 13 − 8 = 5. Then 4 − 2 = 2, so the answer is 25.',
        'The number has not changed. 53 and (4 tens + 13 ones) are the same amount, written differently, the way 53p and 53 pennies are the same money.',
        'Borrow from a zero by going one more column left: 302 − 145 borrows from the hundreds because the tens column has nothing to give.'
      ],
      example: {
        q: 'What is 402 − 137?',
        steps: [
          'Ones: 2 − 7 needs a borrow. The tens column is 0, so borrow from the hundreds: 402 becomes 3 hundreds, 9 tens, 12 ones.',
          'Ones: 12 − 7 = 5. Tens: 9 − 3 = 6. Hundreds: 3 − 1 = 2.',
          'The answer is 265.'
        ],
        a: '265'
      },
      remember: 'Borrowing moves value between columns; it never creates or destroys any.',
      trap: 'Borrowing without reducing the column you borrowed from, which silently adds ten to the answer. The borrowed ten has to come out of somewhere.',
      figs: [{
        cap: '53 as 4 tens and 13 ones',
        svg: `<svg viewBox="0 0 300 96" role="img" aria-label="Borrowing one ten to make thirteen ones">
          <g ${mono} font-size="15" font-weight="800" fill="${INK}">
            <text x="60" y="30" text-anchor="middle">5</text><text x="120" y="30" text-anchor="middle">3</text>
            <text x="60" y="54" text-anchor="middle">4</text><text x="120" y="54" text-anchor="middle">13</text>
          </g>
          <path d="M92 34 l14 -6 v12 z" fill="${ACCENT}" stroke="${INK}" stroke-width="1.4"/>
          <text x="196" y="44" ${mono} font-size="11" font-weight="800" fill="${MUTED}">same value,</text>
          <text x="196" y="60" ${mono} font-size="11" font-weight="800" fill="${MUTED}">new spelling</text>
        </svg>`
      }]
    },
    counting: {
      title: 'Counting on',
      why: 'For numbers that are close together, counting up from the smaller to the larger is faster and less error-prone than borrowing, because there is nothing to unpack.',
      rule: 'For a − b where the two are close, count from b up to a. The count is the answer.',
      beats: [
        '83 − 79 is awkward by borrowing. Counting on: 79 to 80 is 1, 80 to 83 is 3, so the answer is 4.',
        'Counting on is subtraction read as a difference, which is why it suits close numbers: the gap is what you are measuring, and it is small.',
        'The two methods must agree. If borrowing gives 4 and counting on gives 4, the answer is checked without a second calculation.'
      ],
      example: {
        q: 'What is 206 − 198?',
        steps: [
          'The numbers are close, so count on from 198.',
          '198 to 200 is 2; 200 to 206 is 6.',
          '2 + 6 = 8, so 206 − 198 = 8.'
        ],
        a: '8'
      },
      remember: 'Close numbers: count the gap, do not borrow.',
      trap: 'Counting on but forgetting the round number in the middle, which loses the tens. The jump from 198 to 200 is part of the gap, not a rest stop.',
      figs: [{
        cap: '79 to 83 is a gap of four',
        svg: `<svg viewBox="0 0 300 78" role="img" aria-label="A number line from 79 to 83 with the jumps marked">
          <line x1="30" y1="46" x2="270" y2="46" stroke="${INK}" stroke-width="2"/>
          <path d="M30 40 q60 -26 120 0" fill="none" stroke="${ACCENT}" stroke-width="2.5"/>
          <path d="M150 40 q60 -26 120 0" fill="none" stroke="${ACCENT}" stroke-width="2.5"/>
          <g ${mono} font-size="11" font-weight="800" fill="${INK}">
            <text x="30" y="66" text-anchor="middle">79</text>
            <text x="150" y="66" text-anchor="middle">80</text>
            <text x="270" y="66" text-anchor="middle">83</text>
          </g>
          <g ${mono} font-size="10" font-weight="800" fill="${MUTED}">
            <text x="90" y="24" text-anchor="middle">+1</text>
            <text x="210" y="24" text-anchor="middle">+3</text>
          </g>
        </svg>`
      }]
    },
    checking: {
      title: 'Checking a subtraction',
      why: 'Every subtraction can be undone by adding, which makes it one of the few operations you can check completely rather than approximately.',
      rule: 'If a − b = c, then c + b = a. Add the answer back to what you subtracted and you must land on where you started.',
      beats: [
        '74 − 38 = 36. Check: 36 + 38 = 74. The check is a different operation, so a mistake in the subtraction cannot hide in it.',
        'A check that uses the same operation repeats the same mistake. Subtracting twice proves nothing; adding back proves the result.',
        'The check also catches a borrowing error, because a missed borrow changes the answer by exactly ten and the addition will not close.'
      ],
      example: {
        q: 'A learner answers 500 − 246 = 264. Is it right?',
        steps: [
          'Add the answer back: 264 + 246.',
          '264 + 246 = 510.',
          '510 is not 500, so the answer is wrong — by ten, which points at the borrowing in the tens column.'
        ],
        a: 'No: 264 + 246 = 510, so the true answer is 254'
      },
      remember: 'Add back to check a take-away.',
      trap: 'Checking by subtracting again. It agrees with the error and gives false confidence.',
      figs: [{
        cap: 'The check runs the other way',
        svg: `<svg viewBox="0 0 300 88" role="img" aria-label="Subtraction and addition as opposite arrows">
          <g ${mono} font-size="14" font-weight="800" fill="${INK}">
            <text x="60" y="48" text-anchor="middle">74</text>
            <text x="150" y="48" text-anchor="middle">36</text>
            <text x="240" y="48" text-anchor="middle">38</text>
          </g>
          <path d="M84 42 h44" stroke="${INK}" stroke-width="2"/><path d="M128 42 l-9 -5 v10 z" fill="${INK}"/>
          <text x="106" y="32" text-anchor="middle" ${mono} font-size="10" font-weight="800" fill="${MUTED}">−38</text>
          <path d="M216 60 h-44" stroke="${ACCENT}" stroke-width="2.5"/><path d="M172 60 l9 -5 v10 z" fill="${ACCENT}"/>
          <text x="194" y="78" text-anchor="middle" ${mono} font-size="10" font-weight="800" fill="${MUTED}">+38</text>
        </svg>`
      }]
    }
  };

  const TIMES = {
    meaning: {
      title: 'Multiplication is repeated addition',
      why: 'Times tables look like a hundred facts to memorise. They are not: each one is a number added to itself a set number of times, and seeing that turns the table back into arithmetic.',
      rule: 'a × b means b groups of a, or a added to itself b times. The total is the same either way round.',
      beats: [
        '4 × 3 is three groups of four: 4 + 4 + 4 = 12. It is also four groups of three, which is why the answer is the same and why half the table is redundant.',
        'This is the reason the tables are symmetric about the diagonal. 7 × 8 and 8 × 7 are one fact, so the 100 entries in a 10 × 10 grid are really 55.',
        'The array picture is the honest one: a rectangle of dots, a rows by b columns. Multiplication is counting a rectangle without counting.'
      ],
      example: {
        q: 'Why is 6 × 7 the same as 7 × 6, using an array?',
        steps: [
          'Six rows of seven dots is a rectangle 6 tall and 7 wide.',
          'Turn the page a quarter turn: it is now 7 tall and 6 wide.',
          'Turning the page does not change how many dots there are.'
        ],
        a: 'The same rectangle, read from the other side'
      },
      remember: 'A times table is a rectangle, not a list.',
      trap: 'Learning the table as a chant without the array. The chant is fast until a fact is forgotten, and then there is nothing to fall back on.',
      figs: [{
        cap: '6 × 7 as a rectangle of dots',
        svg: `<svg viewBox="0 0 300 120" role="img" aria-label="A six by seven array of dots">
          ${[0, 1, 2, 3, 4, 5].map(r => [0, 1, 2, 3, 4, 5, 6].map(c =>
            `<circle cx="${68 + c * 22}" cy="${18 + r * 17}" r="5.5" fill="${ACCENT}" stroke="${INK}" stroke-width="1.3"/>`).join('')).join('')}
          <text x="150" y="116" text-anchor="middle" ${mono} font-size="10" font-weight="800" fill="${MUTED}">6 rows of 7 = 42</text>
        </svg>`
      }]
    },
    commutative: {
      title: 'Order does not matter',
      why: 'Halving what has to be learned is worth knowing about. Multiplication is commutative, so 9 × 3 and 3 × 9 are one fact, and the harder table can often be read off the easier one.',
      rule: 'a × b = b × a. Only addition and multiplication have this property; subtraction and division do not.',
      beats: [
        'If you know the 2 times table you know every fact with a 2 in it, from either side. The same for 5 and 10, which are the easy ones.',
        'The property fails for subtraction: 9 − 3 is 6 but 3 − 9 is −6. It fails for division too. Only × and + are safe to reorder.',
        'In practice you turn the sum round to put the easier number second: 9 × 3 is three nines, but 3 × 9 is nine threes, and neither is easier — the point is that you get to choose.'
      ],
      example: {
        q: 'You know 8 × 4 = 32 but not 4 × 8. What do you know?',
        steps: [
          'Multiplication is commutative, so 4 × 8 = 8 × 4.',
          '8 × 4 = 32.',
          'So 4 × 8 = 32 without any new work.'
        ],
        a: '32'
      },
      remember: 'Turn the sum round to suit yourself.',
      trap: 'Assuming the property holds everywhere. It does not for subtraction or division, and applying it there gives a sign error or a reciprocal.',
      figs: [{
        cap: 'The same rectangle, turned',
        svg: `<svg viewBox="0 0 300 118" role="img" aria-label="A three by four array turned into a four by three array">
          ${[0, 1, 2].map(r => [0, 1, 2, 3].map(c =>
            `<circle cx="${42 + c * 20}" cy="${26 + r * 20}" r="6" fill="${ACCENT}" stroke="${INK}" stroke-width="1.3"/>`).join('')).join('')}
          <text x="86" y="104" text-anchor="middle" ${mono} font-size="10" font-weight="800" fill="${MUTED}">3 × 4</text>
          <path d="M148 58 h26" stroke="${INK}" stroke-width="2"/><path d="M174 58 l-9 -5 v10 z" fill="${INK}"/>
          ${[0, 1, 2, 3].map(r => [0, 1, 2].map(c =>
            `<circle cx="${212 + c * 20}" cy="${14 + r * 20}" r="6" fill="${ACCENT}" stroke="${INK}" stroke-width="1.3"/>`).join('')).join('')}
          <text x="232" y="104" text-anchor="middle" ${mono} font-size="10" font-weight="800" fill="${MUTED}">4 × 3</text>
        </svg>`
      }]
    },
    patterns: {
      title: 'Patterns in the tables',
      why: 'Every table has a visible pattern, and the patterns are what make the table memorable. A fact with a reason is kept; a fact chanted is lost.',
      rule: 'The nines add to nine in every answer; the fives end in 0 or 5; the tens add a zero; the twos are the doubles.',
      beats: [
        'Nine times table: 9, 18, 27, 36, 45, 54, 63, 72, 81. The digits of each answer add to 9, and the tens go up by one while the ones go down by one.',
        'Five times table: every answer ends in 0 or 5, and the sequence is the tens table halved. Ten times is the number with a zero, which is why the fives sit between them.',
        'The square numbers sit on the diagonal: 1, 4, 9, 16, 25. The difference between consecutive squares is the odd numbers, 3, 5, 7, 9 — a pattern that explains itself.'
      ],
      example: {
        q: 'What is 9 × 7, using the digit rule?',
        steps: [
          'One less than 7 is 6, which is the tens digit: 9 × 7 is sixty-something.',
          'The digits add to 9, so the ones digit is 9 − 6 = 3.',
          'The answer is 63.'
        ],
        a: '63'
      },
      remember: 'A pattern you can say is a fact you can recover.',
      trap: 'Trusting the nine-digit rule past 9 × 10. It holds for the single-digit nines and then needs restating; the rule is about that table, not about nines in general.',
      figs: [{
        cap: 'The nines: tens up, ones down',
        svg: `<svg viewBox="0 0 300 96" role="img" aria-label="The nine times table with digits summing to nine">
          <g ${mono} font-size="12" font-weight="800" fill="${INK}">
            ${[0, 1, 2, 3, 4].map(i => `<text x="${40 + i * 56}" y="30" text-anchor="middle">9×${i + 1}</text>`).join('')}
            ${[0, 1, 2, 3, 4].map(i => `<text x="${40 + i * 56}" y="56" text-anchor="middle">${9 * (i + 1)}</text>`).join('')}
          </g>
          <g ${mono} font-size="9" font-weight="800" fill="${MUTED}">
            ${[0, 1, 2, 3, 4].map(i => `<text x="${40 + i * 56}" y="76" text-anchor="middle">${Math.floor(9 * (i + 1) / 10)}+${9 * (i + 1) % 10}</text>`).join('')}
          </g>
        </svg>`
      }]
    },
    inverse: {
      title: 'Division undoes multiplication',
      why: 'The tables and division are one body of knowledge, not two. Every fact you learn in a table is a division fact as well, which is why the division game is really the times table read backwards.',
      rule: 'If a × b = c, then c ÷ b = a and c ÷ a = b. A table fact is a division fact with the question moved.',
      beats: [
        '6 × 7 = 42, so 42 ÷ 7 = 6 and 42 ÷ 6 = 7. Three sentences, one fact.',
        'This is why division with a remainder exists: 43 is not in the sevens table, so 43 ÷ 7 is 6 remainder 1 — the largest table fact below 43, and what is left over.',
        'Checking a division is multiplication: 43 ÷ 7 = 6 r 1 checks as 7 × 6 + 1 = 43. Nothing else needs to be known.'
      ],
      example: {
        q: 'What is 56 ÷ 8, and how does the table give it?',
        steps: [
          'Ask which number times 8 makes 56.',
          'The eights table has 8 × 7 = 56.',
          'So 56 ÷ 8 = 7.'
        ],
        a: '7'
      },
      remember: 'Division is the table with the answer missing.',
      trap: 'Treating division as a separate set of facts to memorise. It is the same facts, so learning it twice is wasted effort.',
      figs: [{
        cap: 'One fact family for 6, 7 and 42',
        svg: `<svg viewBox="0 0 300 104" role="img" aria-label="The fact family of 6 7 and 42">
          <g ${mono} font-size="13" font-weight="800" fill="${INK}">
            <text x="150" y="26" text-anchor="middle">6 × 7 = 42</text>
            <text x="150" y="50" text-anchor="middle">7 × 6 = 42</text>
            <text x="150" y="74" text-anchor="middle">42 ÷ 7 = 6</text>
            <text x="150" y="98" text-anchor="middle">42 ÷ 6 = 7</text>
          </g>
        </svg>`
      }]
    }
  };

  const DIVISION = {
    sharing: {
      title: 'Sharing and grouping',
      why: 'Division answers two different questions, and the difference decides which number is the divisor. Sharing asks how many each gets; grouping asks how many groups.',
      rule: 'Sharing: a known number of groups, unknown size. Grouping: a known group size, unknown count. Both are a ÷ b.',
      beats: [
        'Twelve cookies on four plates: how many per plate? That is sharing, and the answer is 3. Twelve cookies into bags of four: how many bags? That is grouping, and the answer is also 3.',
        'The two models give the same answer because they are the same rectangle read two ways, which is the same reason multiplication is commutative.',
        'The model matters when a remainder appears. Twelve shared on five plates leaves two that cannot be split; twelve bagged in fives leaves two that do not fill a bag.'
      ],
      example: {
        q: 'Twenty-four pencils. One child takes them four at a time; another shares them between four children. Are the answers the same?',
        steps: [
          'Grouping: 24 ÷ 4 = 6 groups of four.',
          'Sharing: 24 ÷ 4 = 6 pencils each.',
          'Same number, different meaning — 6 groups in one case, 6 per child in the other.'
        ],
        a: 'Both 6, but one counts groups and the other counts per person'
      },
      remember: 'Same arithmetic, different question: how many groups, or how many each.',
      trap: 'Assuming the two models always agree about the remainder. Twelve shared on five plates gives each plate two with two left over; twelve bagged in fives gives two full bags and two loose. The leftover means something different in each.',
      figs: [{
        cap: 'Twelve shared on four plates',
        svg: `<svg viewBox="0 0 300 96" role="img" aria-label="Twelve counters shared onto four plates">
          ${[0, 1, 2, 3].map(p => `<g transform="translate(${16 + p * 70},0)">
            <circle cx="30" cy="48" r="27" fill="none" stroke="${INK}" stroke-width="2"/>
            ${[0, 1, 2].map(d => `<circle cx="${20 + (d % 2) * 20}" cy="${d === 2 ? 58 : 38}" r="6.5" fill="${ACCENT}" stroke="${INK}" stroke-width="1.4"/>`).join('')}
          </g>`).join('')}
          <text x="150" y="90" text-anchor="middle" ${mono} font-size="10" font-weight="800" fill="${MUTED}">12 ÷ 4 = 3 each</text>
        </svg>`
      }]
    },
    inverse: {
      title: 'Division is multiplication backwards',
      why: 'The times tables and division are one body of knowledge. Learning division as a separate set of facts doubles the work for no gain.',
      rule: 'a ÷ b = c exactly when b × c = a. To divide, ask which number times the divisor makes the dividend.',
      beats: [
        '56 ÷ 8: ask which number times 8 makes 56. The eights table says 7, so the answer is 7.',
        'This makes every division checkable by multiplication, which is a genuinely independent check rather than a repetition.',
        'It also explains why dividing by zero is impossible: no number times zero makes anything but zero, so there is no answer to find.'
      ],
      example: {
        q: 'What is 72 ÷ 9, and how do you check it?',
        steps: [
          'Which number times 9 makes 72?',
          'The nines table has 9 × 8 = 72.',
          'Check: 8 × 9 = 72.'
        ],
        a: '8'
      },
      remember: 'To divide, ask what multiplies to it.',
      trap: 'Searching the table for the dividend instead of the divisor. 72 ÷ 9 is not "which 72 is in the nines table", it is "how many nines make 72".',
      figs: [{
        cap: '72 ÷ 9 asks what times 9 makes 72',
        svg: `<svg viewBox="0 0 300 92" role="img" aria-label="A division question rewritten as a multiplication question">
          <g ${mono} font-size="15" font-weight="800" fill="${INK}">
            <text x="150" y="30" text-anchor="middle">72 ÷ 9 = ?</text>
            <text x="150" y="62" text-anchor="middle">9 × ? = 72</text>
            <text x="150" y="88" text-anchor="middle" fill="${ACCENT}">? = 8</text>
          </g>
        </svg>`
      }]
    },
    remainder: {
      title: 'Remainders',
      why: 'Most divisions in real life do not come out even. A remainder is not a failure to finish; it is the part that does not make a whole group.',
      rule: 'a ÷ b = q remainder r, where q is the largest count of b that fits in a and r is what is left, with 0 ≤ r < b.',
      beats: [
        '43 ÷ 7: the sevens table goes 7, 14, 21, 28, 35, 42, 49. The largest below 43 is 42, which is six sevens, and 43 − 42 = 1. So 43 ÷ 7 = 6 r 1.',
        'The remainder is always smaller than the divisor. If it were bigger, another group would fit, which means the quotient was too small.',
        'Check by multiplying back: 7 × 6 + 1 = 43. The multiplication and the remainder together rebuild the dividend.'
      ],
      example: {
        q: 'What is 100 ÷ 8?',
        steps: [
          'The eights table: 8 × 12 = 96, and 8 × 13 = 104, which is too big.',
          'So the quotient is 12, and 100 − 96 = 4 remain.',
          'Check: 8 × 12 + 4 = 100.'
        ],
        a: '12 remainder 4'
      },
      remember: 'Remainder is smaller than the divisor, always.',
      trap: 'Reporting a remainder equal to or larger than the divisor, which means another group would have fitted. It is the arithmetic equivalent of an unfinished job.',
      figs: [{
        cap: '43 in sevens: six full groups and one left',
        svg: `<svg viewBox="0 0 300 84" role="img" aria-label="Forty-three counters in groups of seven with one left">
          ${[0, 1, 2, 3, 4, 5].map(g => `<rect x="${12 + g * 44}" y="16" width="38" height="34" rx="6"
            fill="none" stroke="${INK}" stroke-width="2"/>
            <text x="${31 + g * 44}" y="38" text-anchor="middle" ${mono} font-size="12" font-weight="800" fill="${INK}">7</text>`).join('')}
          <circle cx="282" cy="33" r="7" fill="${ACCENT}" stroke="${INK}" stroke-width="1.6"/>
          <text x="150" y="72" text-anchor="middle" ${mono} font-size="10" font-weight="800" fill="${MUTED}">6 groups of 7, remainder 1</text>
        </svg>`
      }]
    },
    checking: {
      title: 'Checking a division',
      why: 'A division can be checked exactly, because multiplication undoes it. The check catches a wrong quotient, a lost remainder, and a remainder that was too large.',
      rule: 'quotient × divisor + remainder = dividend. If that does not come back to where you started, the answer is wrong.',
      beats: [
        '43 ÷ 7 = 6 r 1 checks as 7 × 6 + 1 = 43. Both the quotient and the remainder are in the check, so neither can be wrong silently.',
        'Forgetting the remainder in the check is the common error: 7 × 6 = 42, which is not 43, and a learner who drops the remainder concludes the answer is wrong when it is right.',
        'The check also catches the remainder being too large. If r ≥ b, then q was one too small and the multiplication will not close.'
      ],
      example: {
        q: 'A learner says 95 ÷ 6 = 15 r 5. Check it.',
        steps: [
          '6 × 15 = 90.',
          '90 + 5 = 95, which is the dividend.',
          'The answer is correct. Note that 5 < 6, so the remainder is legal.'
        ],
        a: 'Correct: 6 × 15 + 5 = 95'
      },
      remember: 'Multiply back and add the remainder.',
      trap: 'Checking with the remainder left out, which fails a correct answer. The remainder is part of the answer and part of the check.',
      figs: [{
        cap: 'The check rebuilds the dividend',
        svg: `<svg viewBox="0 0 300 88" role="img" aria-label="Quotient times divisor plus remainder equals dividend">
          <g ${mono} font-size="12" font-weight="800" fill="${INK}">
            <text x="150" y="26" text-anchor="middle">6 × 15 + 5</text>
            <text x="150" y="50" text-anchor="middle">= 90 + 5</text>
            <text x="150" y="76" text-anchor="middle" fill="${ACCENT}">= 95</text>
          </g>
        </svg>`
      }]
    }
  };

  window.MATHS_LESSONS = {
    'number-bonds': {
      topics: [
        { id: 'parts', name: 'Whole and parts' },
        { id: 'ten', name: 'Bonds to 10' },
        { id: 'teen', name: 'Above 10' },
        { id: 'missing', name: 'Missing part' }
      ],
      lessons: BONDS
    },
    'addition-quest': {
      topics: [
        { id: 'place', name: 'Place value' },
        { id: 'carrying', name: 'Carrying' },
        { id: 'inverse', name: 'Undoing' },
        { id: 'estimating', name: 'Estimating' }
      ],
      lessons: ADDITION
    },
    'subtraction-safari': {
      topics: [
        { id: 'takeaway', name: 'Take away' },
        { id: 'borrowing', name: 'Borrowing' },
        { id: 'counting', name: 'Counting on' },
        { id: 'checking', name: 'Checking' }
      ],
      lessons: SUBTRACTION
    },
    'times-table-academy': {
      topics: [
        { id: 'meaning', name: 'What × means' },
        { id: 'commutative', name: 'Order' },
        { id: 'patterns', name: 'Patterns' },
        { id: 'inverse', name: 'Undoing' }
      ],
      lessons: TIMES
    },
    'division-diner': {
      topics: [
        { id: 'sharing', name: 'Sharing' },
        { id: 'inverse', name: 'Undoing' },
        { id: 'remainder', name: 'Remainders' },
        { id: 'checking', name: 'Checking' }
      ],
      lessons: DIVISION
    }
  };
})();
