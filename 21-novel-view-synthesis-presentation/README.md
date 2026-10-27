# Novel View Synthesis Presentation

A 15 slide video presentation on novel view synthesis, tracing the research arc from NeRF (2020) to 3D Gaussian Splatting (2023) to GRay (2026).

## Overview

Most graphics work uses the traditional synthetic camera model: build the full 3D scene, then place a virtual camera to take a picture of it. Novel view synthesis takes the opposite approach. It learns a scene from a set of photos and then renders brand new viewpoints that were never photographed.

This presentation, the final research assignment for my graphics class, walks through three landmark papers:

- NeRF, ECCV 2020 (Mildenhall et al.)
- 3D Gaussian Splatting, SIGGRAPH 2023 (Kerbl et al.)
- GRay: Ray Tracing 3D Gaussians Near the Speed of Splats, PACMCGIT 2026 (Poirier-Ginter, Lalonde, and Drettakis)

The requirements were 12 to 16 slides and a 6 to 8 minute talk, with a title slide, an overview of the problem area, the motivation, methods, contribution, and evolution of each idea, the challenges still open in 2026, and citations to peer reviewed publications only, with no arXiv sources.

## What It Covers

1. **Title:** "Novel View Synthesis: From NeRFs to Gaussian Splats to Gaussian Ray Tracing."
2. **What problem are we solving:** the traditional synthetic camera compared with learning a scene from photos, with uses in VR, film, robotics, mapping, and digital twins.
3. **NeRF, the scene as a function:** F(x, y, z, θ, φ) maps to (RGB, density), and the MLP weights are the scene.
4. **How NeRF renders one pixel:** cast a ray, sample coarse and fine points, query the MLP, and composite with volume rendering.
5. **What NeRF got right and what it cost:** photorealistic views, view dependent effects, and a compact representation, against days of training, seconds per frame, and poor editability.
6. **How NeRFs evolved, 2021 to 2022:** Mip-NeRF (cone queries for anti-aliasing), Instant-NGP (multiresolution hash grid, training in seconds), and Mip-NeRF 360 (unbounded scenes).
7. **3D Gaussian Splatting:** explicit Gaussians with position, covariance, opacity, and spherical harmonic color, and no network in the render loop.
8. **How 3DGS renders a frame:** initialize from the SfM point cloud, project with an affine approximation, sort per 16 x 16 tile, alpha blend front to back, optimize, and use adaptive density control to split, clone, and prune.
9. **Why 3DGS took over:** 100+ FPS on a consumer GPU, training in minutes, and editable explicit primitives.
10. **What 3DGS left on the table:** popping from per tile sorting, affine projection errors, and pinhole only cameras. 3D Gaussian Ray Tracing (3DGRT) wraps Gaussians in proxies inside a BVH but is about nine times slower to optimize.
11. **GRay's scaling insight:** splatting cost grows with Gaussians per tile (O(n) per pixel), while ray tracing cost grows with actual hits (as low as O(log n)). Smaller, denser Gaussians slow splatting but speed up ray tracing.
12. **What GRay does:** dense initialization, oriented bounding box proxies, detached hybrid transparency, per pixel linked lists, weight based pruning with scale decay, and 15K iterations instead of 30K.
13. **The numbers:** a table over the 13 standard 3DGS scenes.

    | Method | FPS | Optimization Time | PSNR | LPIPS |
    |---|---|---|---|---|
    | 3DGS | 253 | 06:18 | 27.10 | 0.262 |
    | 3DGRT | 68 | 55:01 | 26.77 | 0.258 |
    | GRay | 248 | 05:40 | 26.47 | 0.236 |

14. **What is still open in 2026:** splatting still leads on PSNR and SSIM, ray tracing memory cost, inverse rendering and relighting, dynamic scenes, and unifying splatting with ray tracing.
15. **References:** nine peer reviewed sources from ECCV, ICCV, CVPR, ACM Transactions on Graphics (SIGGRAPH and SIGGRAPH Asia), and PACMCGIT, covering NeRF, Mip-NeRF, Instant NGP, Mip-NeRF 360, 3DGS, StopThePop, 3DGRT, 3DGUT, and GRay.

The speaker script follows the deck slide by slide and runs about seven minutes.

## Files

- `CG_S26_NovelViewSynthesis_OniDaniel.pptx`: the 15 slide deck
- `CG_S26_NovelViewSynthesis_Script_OniDaniel.docx`: the slide by slide speaker script
