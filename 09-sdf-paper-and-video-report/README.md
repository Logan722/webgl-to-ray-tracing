# SDF Paper Summary and Video Report

A one page research paper summary and a math report on signed distance functions (SDFs), covering a JCGT dataset paper and the derivation of the line segment SDF.

## Overview

This project for my graphics class is about implicit surfaces, and SDFs in particular. It has two parts:

1. A summary of no more than one page of "A Dataset and Explorer for 3D Signed Distance Functions" by Takikawa, Glassner, and McGuire (JCGT, Vol. 11, No. 2, 2022), following the How to Read a Research Paper approach.
2. A 1 to 2 page report on Inigo Quilez's video "Deriving the SDF of a Line Segment," with equations and an illustration, that connects class math (parametric lines, vector operations, coordinate free geometry) to how the line SDF is built.

## What It Covers

**The paper summary**

An SDF stores geometry as a function that takes any point in space and returns its distance to the nearest surface, negative inside and positive outside. The paper addresses the lack of a clean reference SDF dataset. Most work converted mesh datasets like ShapeNet into SDFs, which brings in holes, non-manifold edges, and numerical noise. The summary covers the three contributions:

- **The dataset.** 63 SDFs written analytically as GLSL functions that take a `vec3` and return a `float`, across animals, geometric primitives, manufactured objects, vehicles, fractals, and natural forms. Seven are animated. Each one is tagged as exact (satisfies the Eikonal equation |∇f| = 1) or conservative (returns a lower bound on the true distance).
- **The SDF Explorer.** A real time sphere tracing viewer that runs at 200 to 400 fps on an RTX 3090. Its interactive cutting plane shows the inside of the distance field with isocontours and the zero level set, which exposes problems like truncated fields. It has five shading modes, including normals, mean curvature, and ambient occlusion.
- **Batch sampling.** GPU compute shaders sample position, distance, and gradient across eight patterns (uniform random, near surface Gaussian, on surface, Metropolis, and others). A precomputed 4.3 GB NPZ dataset with Python and NumPy bindings is also provided.

It also weighs strengths (ground truth by construction, a useful diagnostic tool, practical ML integration) against limitations (only qualitative validation, hand crafted shapes instead of scanned ones, and some conservative SDFs).

**The video report**

The report walks through the line segment derivation for a segment from A to B and a query point P:

1. Build relative vectors `pa = P - A` and `ba = B - A`. No raw coordinates appear, so the same formula works in 2D and 3D.
2. Write any point on the infinite line as Q(t) = A + t·ba and find the t that minimizes |P - Q(t)|. Requiring the error to be perpendicular to the segment, (pa - t·ba) · ba = 0, gives t = dot(pa, ba) / dot(ba, ba). Dividing by `dot(ba, ba)` avoids a square root.
3. Clamp t to [0, 1] to restrict the line to the segment. This gives three cases: the projection falls behind A (closest point is A), lands on the segment, or passes B (closest point is B).
4. The distance is the length of `pa - ba * h`.

The result is four lines of GLSL:

```glsl
float sdSegment(vec3 p, vec3 a, vec3 b) {
    vec3 pa = p - a, ba = b - a;                      // relative vectors
    float h = clamp(dot(pa,ba)/dot(ba,ba), 0.0, 1.0); // project + clamp
    return length(pa - ba*h);                         // distance
}
```

The report includes a table that maps each piece of this code to a math operation and a class concept (vector subtraction, direction vector, dot product, projection, parametric constraint, rejection vector, Euclidean distance). It also ties together the three representation forms: the derivation starts from a parametric line, works in vector algebra, and ends with an implicit distance field. It closes with how SDFs combine with min for union, max for intersection, and max(-d1, d2) for subtraction.

## Files

- `SDF_Paper_Summary_DanielOni.docx`: the one page paper summary.
- `SDF_Video_Report_DanielOni.docx`: the line segment SDF video report with the derivation, GLSL code, and concept mapping table.
- `sdf_line_segment_diagram.png`: Figure 1 for the video report, showing the three cases of point to segment distance (t < 0, 0 ≤ t ≤ 1, t > 1).
- `SDF_Research_StudyGuide.md`: background notes on the paper, Quilez SDF primitives (sphere, box, capsule), CSG and smooth blending, and the vector math behind the derivation.
