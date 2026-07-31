"""Generate facts.json — the catalog of math facts practice games draw from.

Run: python -m games.data.seed.generate_facts
Writes: src/games/data/seed/facts.json
"""

import json
from pathlib import Path

HERE = Path(__file__).parent


def multiplication_facts() -> list[dict]:
	"""All 2×2 .. 12×12 (skips ×0 and ×1 as trivial)."""
	out = []
	for a in range(2, 13):
		for b in range(2, 13):
			out.append({
				"fact_id": f"mult_{a}x{b}",
				"fact_type": "mult",
				"operands": [a, b],
				"answer": str(a * b),
				# hardness: bigger operands = harder
				"tier": 1 if max(a, b) <= 5 else 2 if max(a, b) <= 9 else 3,
			})
	return out


def division_facts() -> list[dict]:
	"""Division inverses of multiplication (product ÷ smaller = larger etc.)."""
	seen = set()
	out = []
	for a in range(2, 13):
		for b in range(2, 13):
			p = a * b
			for divisor in (a, b):
				key = (p, divisor)
				if key in seen:
					continue
				seen.add(key)
				quotient = p // divisor
				out.append({
					"fact_id": f"div_{p}÷{divisor}",
					"fact_type": "div",
					"operands": [p, divisor],
					"answer": str(quotient),
					"tier": 1 if max(divisor, quotient) <= 5 else 2 if max(divisor, quotient) <= 9 else 3,
				})
	return out


def fraction_equivalence_facts() -> list[dict]:
	"""Pairs of equivalent fractions kids should recognize."""
	base_pairs = [
		# halves
		("1/2", "2/4"), ("1/2", "3/6"), ("1/2", "4/8"), ("1/2", "5/10"),
		# thirds
		("1/3", "2/6"), ("1/3", "3/9"), ("2/3", "4/6"), ("2/3", "6/9"),
		# quarters
		("1/4", "2/8"), ("1/4", "3/12"), ("3/4", "6/8"), ("3/4", "9/12"),
		# fifths
		("1/5", "2/10"), ("2/5", "4/10"), ("3/5", "6/10"), ("4/5", "8/10"),
		# sixths / eighths / tenths cross-matches
		("1/6", "2/12"), ("5/6", "10/12"),
		("1/8", "2/16"), ("3/8", "6/16"),
	]
	out = []
	for a, b in base_pairs:
		out.append({
			"fact_id": f"frac_eq_{a}={b}",
			"fact_type": "frac_eq",
			"operands": [a, b],
			"answer": "true",
			"tier": 1 if "/2" in a or "/4" in a else 2,
		})
	return out


def fraction_comparison_facts() -> list[dict]:
	"""Pairs to compare — same denominator, common numerator, and mixed."""
	pairs = [
		# same denominator (easy)
		("1/4", "3/4", ">"), ("2/5", "4/5", "<"), ("3/8", "5/8", "<"),
		("2/6", "5/6", "<"), ("1/3", "2/3", "<"),
		# same numerator (medium — bigger denom = smaller fraction)
		("1/2", "1/3", ">"), ("1/4", "1/6", ">"), ("1/3", "1/5", ">"),
		("2/3", "2/5", ">"), ("3/4", "3/8", ">"),
		# mixed (hard — needs benchmarking to 1/2)
		("2/3", "3/5", ">"), ("3/8", "2/5", "<"), ("5/8", "3/4", "<"),
		("4/9", "5/10", "<"), ("3/7", "4/8", "<"),
	]
	out = []
	for a, b, rel in pairs:
		out.append({
			"fact_id": f"frac_cmp_{a}{rel}{b}",
			"fact_type": "frac_cmp",
			"operands": [a, b],
			"answer": rel,
			"tier": 1 if a.split("/")[1] == b.split("/")[1]
				else 2 if a.split("/")[0] == b.split("/")[0]
				else 3,
		})
	return out


def main() -> None:
	facts = (
		multiplication_facts()
		+ division_facts()
		+ fraction_equivalence_facts()
		+ fraction_comparison_facts()
	)
	out_path = HERE / "facts.json"
	out_path.write_text(json.dumps({"facts": facts, "count": len(facts)}, indent=2))
	print(f"Wrote {len(facts)} facts → {out_path}")
	# Breakdown
	from collections import Counter
	c = Counter(f["fact_type"] for f in facts)
	for t, n in c.items():
		print(f"  {t}: {n}")


if __name__ == "__main__":
	main()
