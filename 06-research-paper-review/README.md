# HW2 Research Paper Review

Slides, an article list, and video scripts reviewing graphics research, from Ken Perlin's 1985 noise paper to recent work in ACM Transactions on Graphics and IEEE TVCG.

## Overview

This folder holds two research reviews done for my graphics class.

The first looks back at the SIGGRAPH seminal papers volume and covers one foundational paper, Ken Perlin's "An Image Synthesizer." It includes a 4 slide deck, a one page overview with the full citation, abstract, and main contributions, and a script for a short video.

The second (HW2) covers current research. It includes an article list of 8 recent papers from ACM Transactions on Graphics (TOG) and IEEE Transactions on Visualization and Computer Graphics (TVCG), each with a citation, keywords, and a one sentence summary. Two of those papers, one from each journal, are reviewed in a 10 slide deck with a matching video script.

## What It Covers

### Perlin, "An Image Synthesizer" (SIGGRAPH 1985)

Published in Computer Graphics, Vol. 19, No. 3, pp. 287 to 296. The paper tackles realistic natural textures without stored 2D images, which at the time caused seams, distortion on curved surfaces, and heavy memory use. Its three main contributions:

- **The noise function**: a fast, controllable source of smooth randomness that can be layered at different scales to model marble, wood, fire, clouds, and water
- **Solid texturing**: textures defined as functions over all of 3D space, so an object looks carved from a block of material and the seam problem goes away
- **Pixel Stream Editor**: an interactive, high level environment for composing texture functions without a rewrite, recompile, and rerun cycle

The deck also notes the 1997 Academy Award for Technical Achievement that Perlin noise received.

### Article list (2024 to 2025)

The 8 papers are grouped into three clusters:

- **Procedural noise and texturing**: a learned unified noise model, multi-dimensional procedural wave noise, and the Mokume dataset for inverse modeling of solid wood textures
- **Real-time and neural rendering**: LightFormer for neural global illumination in dynamic scenes, CoARF++ content-aware radiance fields, and multi-layer Gaussian splatting for anatomy
- **Rendering efficiency**: MNSS neural supersampling on mobile GPUs, and texture size reduction through symmetric overlap and texture carving

### Paper 1: "One Noise to Rule Them All" (ACM TOG, 2024)

Maesumi et al. train a single denoising diffusion model to generate many types of procedural noise, including Perlin and Gabor noise, that are normally separate algorithms with their own parameters. The model is conditioned on the kind of noise wanted, can blend between noise types across one texture, and gives artists control without hand tuning each function. The paper also shows improved results in inverse procedural material design. The review ties it back to Perlin's original noise function.

### Paper 2: "Multi-Layer Gaussian Splatting for Immersive Anatomy Visualization" (IEEE TVCG, 2025)

Kleinbeck et al. target VR viewing of CT scans. Traditional volume rendering is too expensive for standalone headsets, and standard Gaussian splatting represents the volume as a single layer that cannot be peeled apart. The paper organizes the splats into separate anatomical layers, such as skin, bone, and organs, that can be toggled on and off at real-time frame rates on compute-constrained mobile headsets. The review connects this to the polygon based pipeline built in class, since splatting renders without polygons.

## Files

- `ArticleList_DanielOni.pdf`: the 8 paper article list with citations, keywords, and summaries
- `ResearchReview_DanielOni.pptx`: 10 slide deck reviewing the two papers
- `VideoScript_ResearchReview.md`: script for the two paper review video
- `earlier-seminal-paper-perlin/PerlinNoise_PaperOverview.pptx`: 4 slide deck on the Perlin paper
- `earlier-seminal-paper-perlin/PaperOverview_PerlinNoise.pdf`: one page overview with citation, abstract, and contributions
- `earlier-seminal-paper-perlin/VideoScript_Final.md`: script for the Perlin video

The recorded videos are not included in this folder.
