# WebGL to Ray Tracing

A collection of computer graphics projects from my graphics class at SMU (Spring 2026), in the order they were completed. It starts with 2D primitives in WebGL 2.0 and moves through 3D transformations, perspective cameras, hierarchical models, lighting models, texture mapping and image processing shaders, and finishes with a C++ ray tracer and research write-ups on neural rendering.

Each folder holds one project with its source code or documents and a README covering what the project does, how it works, and how to run it.

![Program 3 texture showcase](19-program3-texture-showcase/CG_S26_Program3_OniDaniel_Preview.png)

## The Projects

### Getting started with WebGL
| Folder | What it is |
|---|---|
| [01-pizza-pie](01-pizza-pie) | A pizza drawn with polar coordinates, using points, triangle fans and lines |
| [02-homage-to-the-square](02-homage-to-the-square) | Nested squares in the style of Josef Albers, all from one shader pair with uniforms |
| [03-cone](03-cone) | Turning a rotating 3D triangle into a cone with `TRIANGLE_FAN` |
| [04-move-that-point-butterfly](04-move-that-point-butterfly) | A single point tracing the butterfly curve, with speed and size sliders |
| [05-tetrahedron-slider](05-tetrahedron-slider) | A tetrahedron that slides around the XZ-plane while the axes stay put |

### Transformations and viewing
| Folder | What it is |
|---|---|
| [07-program1-3d-logo](07-program1-3d-logo) | My initials as a 3D logo on a pedestal, with falling confetti done in the shader |
| [08-hw3-transformation-math](08-hw3-transformation-math) | Homogeneous coordinates, rays, and why non-uniform scaling breaks normals |
| [10-3d-city-scene](10-3d-city-scene) | A dusk city skyline from one cube mesh, with perspective projection and an orbit camera |
| [11-hw4-scenes-and-meshes](11-hw4-scenes-and-meshes) | A walking stick figure with hierarchical joints, plus a sin/cos terrain mesh |

### Lighting and articulated models
| Folder | What it is |
|---|---|
| [12-hw5-lighting-models](12-hw5-lighting-models) | Gouraud, Phong and Cook-Torrance on the same sphere, switchable from a dropdown |
| [13-program2-articulated-horse](13-program2-articulated-horse) | A horse with seven joints walking on rolling hills under Phong lighting |
| [14-hw6-ray-tracing](14-hw6-ray-tracing) | A C++ ray tracer with a checker texture, a generated earth texture, and a custom box shape |

### Textures and image processing
| Folder | What it is |
|---|---|
| [15-texture-lab-webcam-grid](15-texture-lab-webcam-grid) | A live webcam feed tiled 4 by 4 using texture coordinates and `REPEAT` wrapping |
| [16-webcam-mosaic-filter](16-webcam-mosaic-filter) | A pixelation filter on the webcam, done entirely in the fragment shader |
| [17-hw7-webcam-textures](17-hw7-webcam-textures) | Webcam tiling, a color channel picker, and blending two textures together |
| [19-program3-texture-showcase](19-program3-texture-showcase) | An environment-mapped sphere, a cube with image, wood and webcam modes, and a brick platform |

### Research and writing
| Folder | What it is |
|---|---|
| [06-research-paper-review](06-research-paper-review) | Slides and a script reviewing papers on procedural noise and Gaussian splatting |
| [09-sdf-paper-and-video-report](09-sdf-paper-and-video-report) | A paper summary on signed distance functions and a walkthrough of the line segment SDF |
| [18-mmpx-paper-response](18-mmpx-paper-response) | My answers on a paper about pixel art magnification |
| [20-hw8-ai-and-graphics](20-hw8-ai-and-graphics) | Three short papers on AI art, Gaussian splats versus NeRFs, and new 3D tools |
| [21-novel-view-synthesis-presentation](21-novel-view-synthesis-presentation) | A deck on how novel view synthesis went from NeRF to Gaussian splatting to GRay |

## Running the Programs

Every WebGL program uses WebGL 2.0 with the shaders written right in the HTML. Most folders already have everything they need, including the class helper files `initShaders.js` and `MVnew.js` when a program uses them. The HW 7 files load `../Common/initShaders.js`, which is why there is a `Common` folder at the top of the repo.

The easiest way to run anything is to start a small server from the top of the repo and open the page from there:

```
python -m http.server 8000
```

Then go to `http://localhost:8000/` and click into a folder. The webcam programs will not get camera access if you open them straight from the file system, so the server is not optional for those. VS Code Live Server works too.

The ray tracer has its own build steps in its folder.

## Notes

- The preview images in each folder were captured from the programs running in a headless browser. The webcam previews use a test camera feed, so they show a test pattern instead of a person.
- Three programs include small bug fixes (the HW 5 matrix upload, the mosaic filter frame check, and a reserved word in the HW 7 Part B shader). Each fix is described in that folder's README.
