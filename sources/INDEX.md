# Sources

Archived copies of external material the arcade relies on. A citation that
points at a URL instead of a file in this tree is a citation that will rot.

## calligraphy/

Chinese character data for `frontend/public/arcade/calligraphy-bank.js` and
`calligraphy-sketch.js`. Retrieved 2026-10-19.

| File | What it supplies | Origin |
|------|------------------|--------|
| `dictionary.txt` | character → pinyin, radical, decomposition, etymology hint | Make Me a Hanzi, `skishore/makemeahanzi`, `dictionary.txt` |
| `graphics.txt` | per-stroke SVG outlines, used only to cross-check stroke counts | Make Me a Hanzi, `skishore/makemeahanzi`, `graphics.txt` |
| `cedict.gz` | English glosses | CC-CEDICT, `cc-cedict.org`, daily dump |
| `cnchar-orders.json` | stroke names in writing order, and the stroke-name table | `cnchar-order`, `theajack/cnchar`, generated order table |
| `cnchar.order.min.js` | the same order data as shipped in the package | `cnchar-order` npm package |
| `xinhua-word.json` | 新华字典 entries: definitions, radicals, stroke counts | `pwxcoo/chinese-xinhua`, `data/word.json` |

Stroke skeletons (`medians`) come from the hanzi-writer data release of the
same Make Me a Hanzi dataset. That tree is not archived here because it is one
JSON file per character; the build reads it from `/tmp/calli/src` and the
per-character content is identical to `graphics.txt`'s stroke geometry, which
*is* archived.

Character selection is by frequency: the top 440 characters of the Jun Da
Modern Chinese character frequency list that have a complete record in all of
the above. The list itself is not archived — the selection is reproducible from
the archived files by taking every character they all cover, in frequency
order.

## How the bank is built

`/tmp/calli/build/build_bank.py` (bank) and `build_sketch.py` (sketches) are
scratch scripts, not part of the repo. The rules they enforce:

- A character is included only when Make Me a Hanzi, its graphics, cnchar's
  stroke order and CEDICT all agree on the stroke count. The build refuses a
  character rather than guessing an alignment.
- A gloss is chosen by matching the CEDICT reading to the character's pinyin,
  skipping proper nouns and cross-references. Sixteen very common characters
  carry a hand-written override, listed with its reason in `gloss.py`.
- A sketch is, in order of preference: the 84 hand-drawn sketches the arcade
  shipped first; a composition of the character's own decomposition tree, drawn
  component by component; the character's radical alone, only when that radical
  depicts something.
