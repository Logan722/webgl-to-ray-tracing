# HW 8: AI and Graphics

Three short papers on how AI is showing up in graphics: an AI art piece traced through the rendering pipeline, a comparison of point clouds, NeRFs, and Gaussian Splats, and a survey of new 3D world building tools.

## Overview

HW 8 for my graphics class was a reading and writing assignment with three separate questions, each submitted as its own PDF:

1. **Art, AI, and Storytelling:** pick an artist from the NVIDIA AI Art Gallery, describe the piece, and connect it to the classic graphics pipeline.
2. **Journalism with Modern Tools:** compare point clouds, NeRFs, and Gaussian Splats, explain how splats differ from photogrammetry, and answer whether geometric representations are actually required for rendering.
3. **New Tools for 3D World Building:** an open ended response after exploring tools such as Meta SAM 3D, Objaverse, and NVIDIA's spatial AI work.

## What It Covers

### Part 1: Art, AI, and Storytelling (1 page)

The paper covers Vanessa Rosa's *Little Martians: A Brief History of Consciousness in the Simulation* (2022). It walks through three steps of her workflow:

- Handmade ceramic heads are 3D scanned into meshes and rigged in Blender.
- NVIDIA Audio2Face drives the facial animation from an AI generated voice, predicting mesh deformations from audio.
- An AI style transfer pass runs on selected rendered frames, which then guide the look of the rest of the sequence.

The scanned mesh maps onto the classic pipeline (vertex shader, primitive assembly, rasterization, fragment shader). Audio2Face sits before the pipeline, generating the deformations that get drawn, and the style transfer sits after it, acting on the finished framebuffer like an image processing shader with a learned model.

### Part 2: Point Clouds, NeRFs, and Gaussian Splats (2 pages)

- **Point clouds and photogrammetry:** Structure from Motion recovers camera poses and a sparse point cloud, which is meshed (often with Poisson reconstruction) and textured from the photos.
- **NeRF:** a neural network maps a 3D position and view direction to color and density, and each pixel is rendered by marching a ray and accumulating samples. The geometry is implicit in the network weights.
- **3D Gaussian Splatting:** millions of explicit Gaussians, each with position, covariance, opacity, and spherical harmonic color, are projected to the image plane, sorted by depth, and rasterized in tiles.
- **Splats vs photogrammetry:** both start from an SfM point cloud, but splatting optimizes and blends Gaussians instead of building a mesh, with no UVs or texture atlas. It handles hair and foliage better but does not drop directly into a standard engine.
- **Is geometry required:** no. A renderer needs some representation it can sample or project, plus an algorithm that turns it into pixels. NeRF is a backward, ray marched approach and splatting is a forward, rasterization based one.

The paper closes with NVIDIA's 3DGUT work, which adds nonlinear cameras and secondary rays to splatting. The main source is the NYT R&D Gaussian Splatting guide, along with Kerbl et al. (SIGGRAPH 2023) and Wu et al. (CVPR 2025).

### Part 3: Tools for 3D World Building and Spatial AI (2 pages)

- **Meta SAM 3D:** SAM 3D Objects reconstructs a textured mesh from one selected object in an image, SAM 3D Body fits an animatable body model, and an Align step places both in a shared coordinate system.
- **Objaverse and Objaverse-XL:** 800K+ and 10M+ object datasets that explain where single image 3D models get their priors, and why their output can lean toward common internet content.
- **NVIDIA 3DGUT:** replaces EWA splatting with an Unscented Transform, supports fisheye and rolling shutter cameras, and pairs with 3DGRT to trace secondary rays for reflections.

Each section has a project link and a reaction. The paper closes with suggestions for future students: the Segment Anything Playground and Objaverse-XL on Hugging Face, framed by the idea that scenes can be triangles, fields, or splats.

## Files

- `HW8_AIArt_DanielOni.pdf`: Part 1, Art, AI, and Storytelling (1 page)
- `HW8_GaussianSplats_DanielOni.pdf`: Part 2, point clouds vs NeRFs vs Gaussian Splats (2 pages)
- `HW8_3DTools_DanielOni.pdf`: Part 3, tools for 3D world building and spatial AI (2 pages)
