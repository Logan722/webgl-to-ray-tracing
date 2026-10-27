# Video Script — Daniel Oni
# Target: 2:30–3:00 | ~420 words at natural pace
# TIP: Don't memorize this. Read it a couple times, then talk through it naturally using just the bold headers as prompts.

---

## PART 1 — No slides, just you on camera (~60 seconds)

Hey everyone, I'm Daniel Oni. I'm a grad student here at SMU studying cybersecurity. I took this course because I've always been curious about what's actually happening behind the scenes when we see realistic graphics in games and movies — and the WebGL programming we've been doing has already been eye-opening, just seeing how much work goes into drawing a simple triangle.

Looking through Volume 1, two topics really stood out to me. First, **shading and illumination** — the whole progression from flat polygon shading all the way to ray tracing. It's kind of crazy that the fundamentals of simulating how light bounces off surfaces were figured out in the 70s and 80s. Second, **procedural texturing and Perlin Noise**, which ties directly into the paper I chose — the idea that you can generate realistic marble and wood from pure math instead of image files.

As for what stayed relevant across the full 50 years — I'd say **realism** and **efficiency**. The field has always been chasing more convincing visuals while figuring out how to do it faster and cheaper, whether that meant fitting into 60K of memory in the 60s or doing real-time ray tracing on a GPU today. Those two problems never really went away.

For me, the connection to my own work is direct — understanding shaders and the graphics pipeline is making me a stronger programmer, and reading these foundational papers gives me the context for why things work the way they do.

---

## PART 2 — Slides on screen (~90 seconds)

**[Title Slide]**
The paper I chose is "An Image Synthesizer" by Ken Perlin, published at SIGGRAPH in 1985. This is the paper that introduced Perlin Noise.

**[Research Problem Slide]**
The problem was straightforward: how do you create realistic natural textures — marble, wood, clouds — without relying on 2D images? Texture mapping at the time caused visible seams, distortion on curved surfaces, and ate up memory. And on top of that, the workflow was slow — every tweak meant rewriting and recompiling code.

**[Key Contributions Slide]**
Perlin made three contributions. First, the **Noise function** — a math function that generates smooth, natural-looking randomness you can layer to simulate things like fire, clouds, and water. Second, **solid texturing** — defining textures throughout 3D space instead of wrapping a flat image around a surface, which eliminated the seam problem entirely. Third, the **Pixel Stream Editor** — an interactive tool that let artists experiment with textures in under a minute instead of going through a full recompile cycle.

**[Why It Matters Slide]**
Perlin Noise ended up becoming one of the most important tools in graphics — it won an Academy Award in '97, it's built into every major shader language, and pretty much any time you see procedural terrain or clouds in a game or film, it traces back to this paper. What I think is cool is how one simple idea — a well-behaved random function — became a building block for so much.

Thanks for watching.

---

# Timing check:
# Part 1: ~190 words ≈ 60–70 sec
# Part 2: ~230 words ≈ 85–95 sec
# Total: ~420 words ≈ 2:30–2:50
