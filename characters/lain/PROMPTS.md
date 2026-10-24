# Lain mascot — the two prompts

Two sheets, two messages, one fresh chat. Send **DIRECTIONS** first, check the result, then
attach it and send **EXPRESSIONS**. Use route A if the image tool has a transparent-background
setting; use route B if it can only return opaque images.

Save the results as:

```
characters/lain/directions.png
characters/lain/reactions.png
```

---

## Route A — the tool can return a transparent background

Turn that option **on** before sending. If the first sheet comes back sitting on a painted
grey-and-white checkerboard, stop and switch to route B: that pattern cannot be removed.

### Message 1 — DIRECTIONS

```
Generate a 3x3 grid sprite sheet of a chibi Lain Iwakura from Serial Experiments Lain: short
dark brown hair cut as an asymmetrical bob with blunt straight bangs, a small silver hair clip
on one side, large muted brown eyes, pale skin, and a dark school uniform with a white collar
and a red necktie.

Muted 1990s anime cel style: clean thin dark outlines with subtle weight variation, large
expressive eyes each with a small bright catchlight, soft muted blush, and a restrained,
desaturated palette of browns, warm greys and deep navy. Two or three tones per colour with
minimal soft cel shading, and hair drawn as distinct clumped strands with a few loose tips
rather than a smooth blob. Quiet, distant, slightly curious expression. Understated and
precise, but still charming and appealing. Not flat, not plain, not minimal. No photorealism,
no heavy 3D gloss, no airbrushed gradients, no 3D rendering.

This sheet is NINE HEAD DIRECTIONS, not expressions -- the face keeps the same calm, distant
expression in every cell and only the direction the head is TURNED changes.

LAYOUT: 3 columns by 3 rows, evenly spaced, fully transparent background. Each drawing is head
plus upper shoulders, centred in its cell, same character and same head size in all nine cells.

FRAMING: a PORTRAIT BUST. Head, neck and shoulders only. NO arms, NO hands, NO legs, NO lower
body. The shoulders are the lowest thing in the cell.

PROPORTIONS: a BIG HEAD chibi that still has a real body. The head is large and dominant, and
the shoulders are roughly TWO THIRDS the width of the head -- narrower than the head, but
clearly there. Do NOT draw a floating head.

THE RULE THAT MATTERS MOST: draw the BODY ONCE and reuse it. The neck, chest and shoulders must
be the EXACT SAME SHAPE in the EXACT SAME POSITION in all nine cells, identical pixels if you
can. The body always faces the viewer. Do NOT redraw the body in profile when the head turns.
Only the head rotates, on top of an unchanging body. The white collar and red necktie must sit
in exactly the same place in every cell.

MARGINS -- this is what goes wrong most often, so follow it literally: each character must sit
ENTIRELY INSIDE its own cell with a wide empty gap on all four sides. Draw it at roughly 75% of
the cell height, centred, leaving clear empty space above the head AND below the shoulders. The
shoulders must STOP WELL SHORT of the bottom edge of the cell -- do not let the body run off the
bottom or bleed into the cell underneath. Nothing may touch or cross a cell boundary. Shrink the
character equally in every cell if that is what it takes.

Turn the whole head clearly, do not just move the eyes: looking left swings the face left and
brings the far cheek, the hair clip side and the side of the bob into view.
Row 1: up-left, up, up-right. Row 2: left, straight at the viewer, right.
Row 3: down-left, down, down-right.

NO hearts, NO sparkles, NO "zzz", NO spiral eyes -- no floating symbols of any kind.
No text, no labels, no borders, no drop shadows, no background colour.
Square image, at least 1024x1024, PNG WITH A REAL ALPHA CHANNEL. The background must be
genuinely transparent, not white.
```

### Message 2 — EXPRESSIONS (attach the directions sheet)

```
The attached image is a 3x3 head-direction sprite sheet. Produce the MATCHING EXPRESSIONS sheet
for that same character. The character is a chibi Lain Iwakura from Serial Experiments Lain:
short dark brown hair cut as an asymmetrical bob with blunt straight bangs, a small silver hair
clip on one side, large muted brown eyes, pale skin, and a dark school uniform with a white
collar and a red necktie. Copy the character from the attached image exactly: the same colours,
the same asymmetrical bob and blunt bangs, the same silver clip on the same side, the same white
collar and red tie, the same thin dark line weight. Every detail visible in the attached sheet
must appear here too. Do not restyle, simplify or redraw her.

Muted 1990s anime cel style, the same style as the attached sheet: clean thin dark outlines,
minimal soft cel shading, restrained desaturated palette.

NOT head directions. The character faces STRAIGHT AT THE VIEWER in all nine cells, head
perfectly straight. The only thing that changes between cells is the FACE, plus one small
floating symbol in three of them.

CRITICAL: same art style, same palette, same line weight, same proportions, and EXACTLY THE SAME
SIZE AND POSITION IN THE CELL as the attached sheet. The chest and shoulders must be the same
drawing, the same width, and the same height off the bottom of the cell as in the attached
sheet, identical in all nine cells here. If the two sheets do not line up the character visibly
jumps, so match them.

Wide margin on all four sides, nothing touching a cell edge including the floating symbols, and
clear empty space below the shoulders.

The nine expressions, left to right, top to bottom:
1. Eyes closed as two soft downward-curving arcs. Calm. No symbol.
2. Same closed arc eyes, faint blush, plus one clearly visible SMALL MUTED RED HEART floating in
   the empty space above the head.
3. Same closed arc eyes, plus THREE SMALL PALE YELLOW SPARKLE STARS above the head.
4. Eyes wide open and very round, brows slightly raised, mouth a small flat O of quiet surprise.
5. Eyes open a little wider than usual with a faint bright glint, the smallest suggestion of a
   smile -- delighted, but still restrained.
6. Eyes closed arcs, stronger blush on both cheeks.
7. Eyes closed sleeping curves, plus a small pale blue "z z z" above the head.
8. Both eyes drawn as faint spiral swirls, small wavy mouth. Slightly dizzy.
9. Eyes closed arcs, mouth open in a small quiet smile -- the most she ever smiles.

No text, no labels, no borders, no drop shadows, no background colour.
Square image, at least 1024x1024, PNG WITH A REAL ALPHA CHANNEL. The background must be
genuinely transparent, not white.
```

---

## Route B — the tool cannot return a transparent background

Change nothing else; only these two substitutions per sheet.

Replace `fully transparent background` in LAYOUT with:

```
a solid flat pure bright green (#00FF00) background filling the whole cell
```

Replace the closing two lines (`No text, no labels ... genuinely transparent, not white.`) with:

```
No text, no labels, no borders, no drop shadows. The background is one flat uniform pure bright
green (#00FF00) covering the entire canvas edge to edge, with no gradient, texture, pattern or
checkerboard, and nothing else on it. Square image, at least 1024x1024.
```

For the EXPRESSIONS sheet, also add this straight after the character description:

```
Draw it on the same solid pure bright green (#00FF00) background described below.
```

Then remove the green before building:

```bash
python3 <skill-dir>/scripts/key.py characters/lain/directions.png --in-place
python3 <skill-dir>/scripts/key.py characters/lain/reactions.png --in-place
```

Never ask for transparency and green together, and never key out white -- her pale skin and the
white collar would go with it.
