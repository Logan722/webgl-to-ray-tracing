# MMPX Paper Response

A structured response to "MMPX Style-Preserving Pixel-Art Magnification," a paper about scaling up pixel art without losing the original artist's style.

## Overview

This reading assignment for my graphics class was about pixel level fine tuning of textures for different artistic effects. The paper is "MMPX Style-Preserving Pixel-Art Magnification" by Morgan McGuire and Mara Gagiu, published in the Journal of Computer Graphics Techniques, Vol. 10, No. 2, 2021. The response follows a numbered question template, with each answer placed directly under its question so it stands out.

## What It Covers

The response is organized into five sections.

**I. Context and Source.** The title, the publication date (June 30, 2021), the full journal citation (pages 83 to 117), and the authors with their affiliations (University of Waterloo and NVIDIA). The summary describes MMPX as a 2x magnification filter for 8-bit and 16-bit sprites and fonts. It looks at the 3x3 neighborhood around each source pixel and uses pattern matching rules to choose the four output pixels, refining curves, diagonals, and intersections without adding new colors. The summary also notes the open source C++, JavaScript, and GLSL implementations and real time performance on hardware as small as a Raspberry Pi.

**II. Motivation and Content.**

- The problem: existing filters each fall short. Nearest neighbor stays sharp but jagged, bilinear and bicubic blur and invent colors, EPX rounds every corner, HQX adds colors and does not handle transparency, and XBR rounds corners and struggles with 1:1 diagonals.
- Why it matters: pixel art is still used on purpose in games like Celeste and Undertale, in retro consoles and emulators, and in fantasy consoles like PICO-8 and TIC-80, while modern displays are far higher resolution than the original hardware.
- Load time vs run time filters: load time filtering runs once per asset and can spend tens to hundreds of milliseconds on quality, while run time filtering runs every frame and has to finish in a few milliseconds on whatever hardware is available.

**III. Related Work.** Figure 5 is tied back to WebGL texture parameters. `NEAREST` for `TEXTURE_MIN_FILTER` and `TEXTURE_MAG_FILTER` gives the blocky result in the Nearest column, and `LINEAR` gives the blurred, color shifted result in the Bilinear column. MMPX is framed as a software filter that solves the same resampling problem the hardware filters solve, but with rules designed for pixel art.

**IV. Analysis and Discussion.**

- Best technique: MMPX, based on Figures 15 to 19. It keeps sharp corners and single pixel details, keeps the X intersection connected in the spritesheet, and handles text better than EPX or XBR.
- Fastest language (Table 1): GLSL, at about 0.005 ns per pixel on desktop, compared with 4.9 ns for C++ and 25.3 ns for JavaScript.
- Most efficient technique: Nearest overall, and EPX among the style preserving filters, at about 1.6 ns per pixel in desktop C++.
- Is MMPX worth it: yes. A full SNES frame (256x240 magnified to 512x480) finishes well under a millisecond in desktop C++ and in roughly 2 ms even in JavaScript on a Raspberry Pi.

**V. Summarize.** MMPX preserves style better than earlier options at similar cost, runs from one algorithm body across three targets, ships with reference versions of the filters it is compared against, and has been used in production in the quadplay fantasy console. The paper is also open about its limits, such as inconsistent results on light disks against dark backgrounds and slight wiggle on stripes thicker than 2:1.

## Files

- `CG_PaperReview_MMPX_DanielOni.docx`: the full question template with an answer under each question
