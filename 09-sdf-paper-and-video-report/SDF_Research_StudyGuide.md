# Signed distance functions as implicit surfaces: a complete study guide

**Signed distance functions (SDFs) encode 3D geometry as a scalar field where every point in space stores its signed Euclidean distance to the nearest surface — positive outside, negative inside, zero on the boundary.** This elegant implicit representation has become foundational in neural 3D reconstruction, real-time rendering, and constructive solid geometry. The materials below span a curated SDF dataset paper, Inigo Quilez's canonical primitive formulas, a video derivation of the line segment SDF, and the vector math underpinning it all. Together, they equip a student to write both a structured paper summary and a math-focused report connecting course concepts to SDF generation.

---

## The Takikawa et al. paper: what it contributes and why it matters

Towaki Takikawa, Andrew Glassner, and Morgan McGuire published "A Dataset and Explorer for 3D Signed Distance Functions" in JCGT (vol. 11, no. 2, 2022) to address a critical infrastructure gap. While datasets like ImageNet and ShapeNet propelled breakthroughs in image recognition and 3D deep learning respectively, **no equivalent reference dataset existed for signed distance functions**. Researchers studying neural implicit representations (DeepSDF, Neural Radiance Fields, NGLOD) had to convert mesh datasets into SDFs — a process plagued by non-manifold geometry, non-watertight surfaces, and quantization artifacts. This paper solves that problem with three contributions.

**Contribution 1 — The SDF Dataset.** The authors curated **63 analytically defined SDFs** encoded as standalone GLSL shader functions, each implementing a single `sdf(vec3) → float` interface. The shapes span six categories: *Animal* (dinosaur, elephant, jellyfish, tardigrade, and others), *Geometry* (sphere, torus, tetrahedron, Bézier surface), *Manufactured* (teapot, castle, gear, grand piano), *Vehicle* (cybertruck, jet fighter, lamborghini), *Fractal* (Mandelbulb, Menger sponge, Sierpinski), and *Nature* (mountain, mushroom, tree). Seven shapes are animated. Each SDF is classified as either **exact** (satisfying the Eikonal equation |∇f| = 1) or **conservative** (returning a distance lower-bound). All shapes are normalized to fit within a **[-1, 1]³ cube** centered at the origin, with fronts facing +X and tops facing +Y.

**Contribution 2 — The SDF Explorer.** This open-source, real-time visualization tool (built on the G3D Innovation Engine) lets researchers interactively examine SDF fields. It achieves **200–400 fps on an RTX 3090** at 1920×1080 via sphere tracing. Its most powerful diagnostic feature is an **interactive cutting plane** that reveals the internal field structure: isocontours drawn at 1/64-unit intervals, the zero level set marked with a thick black line, yellow-to-blue gradients for positive values, and solid orange for the interior. This plane can detect truncated SDFs, discontinuities, and numerical precision issues invisible in surface-only rendering. Five shading modes are available: matcap, Gooch wrap shading, surface normal visualization, mean curvature coloring, and ambient occlusion.

**Contribution 3 — Batch Sampling System.** For deep learning pipelines, the Explorer provides GPU-accelerated compute shaders that sample SDFs at millions of points across **eight sampling patterns**: regular grid, jittered grid, uniform random, near-surface (Gaussian σ = 0.005), on-surface (via ray tracing), Metropolis importance sampling, curvature-weighted Metropolis, and 2D image slices. Output includes position, signed distance, and gradient (via 6-sample finite differences). A pre-computed **4.3 GB NPZ dataset** ships with three distributions per shape (uniform, near-surface, on-surface). PyBind11 bindings stream data directly into NumPy tensors, and headless EGL mode supports cloud computing.

**Paper methodology and validation.** The SDFs were sourced primarily from Shadertoy (many by Inigo Quilez), then isolated from rendering contexts, cleaned, normalized, and validated using the Explorer's cutting plane. Render times range from **0.1 ms** (simple primitives) to **14.5 ms** (the Girl model) at 1280×720 on an RTX Titan. Known artifacts are documented per shape — for instance, the Castle has low numerical precision on its dome, and the Snake uses a truncated conservative SDF that explains its slow render times. The dataset has since grown to 67 SDFs post-publication, and the project invites community contributions via pull requests.

### Guidance for the 1-page paper summary

Following "How to Read a Research Paper" methodology, structure the summary around these elements:

- **Problem**: No standard SDF reference dataset existed; mesh-to-SDF conversion introduces artifacts
- **Approach**: Curate analytic GLSL SDFs with a visualization/sampling toolkit
- **Key results**: 63 SDFs across 6 categories, real-time Explorer with diagnostic cutting plane, 8 sampling patterns with Python integration, 4.3 GB pre-sampled dataset
- **Strengths**: Ground-truth by construction (analytic), extensible format, practical ML pipeline integration
- **Limitations**: Qualitative validation only (no quantitative benchmarks), shapes are mostly hand-crafted (not scanned), limited to orientable surfaces
- **Significance**: Enables reproducible SDF research, analogous to ImageNet's role for vision

---

## Inigo Quilez's distance function articles: the canonical SDF reference

Inigo Quilez's articles at iquilezles.org are the de facto standard reference for SDF primitives in the computer graphics community. His 3D article catalogs **28+ exact or bounded SDF primitives** in GLSL, while the 2D article covers **29+ primitives**. All code targets Shadertoy, where SDFs are rendered via sphere tracing (ray marching).

**The sphere SDF** is the simplest possible example: `length(p) - r`. The signed distance from any point **p** to a sphere of radius *r* centered at the origin is simply the Euclidean distance to the origin minus the radius. Points on the surface yield zero; interior points yield negative values; exterior points yield positive values.

**The box SDF** demonstrates a more sophisticated pattern. The formula `length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0)` where `q = abs(p) - b` exploits the box's 8-fold symmetry via `abs()`, then separates the distance into an exterior term (Euclidean distance using only positive excess components) and an interior term (Chebyshev-like closest-face distance). Quilez provides a dedicated YouTube derivation video for this primitive.

**The capsule/line segment SDF** is arguably the most important primitive for organic modeling. It uses vector projection with clamping — the same mathematical core taught in a graphics course. The 3D capsule formula subtracts a radius *r* from the segment distance, inflating the line into a rounded tube:

```
float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
    vec3 pa = p - a, ba = b - a;
    float h = clamp(dot(pa,ba)/dot(ba,ba), 0.0, 1.0);
    return length(pa - ba*h) - r;
}
```

**CSG operations combine SDFs algebraically.** Union uses `min(d1, d2)` — a point's distance to the combined shape equals whichever individual shape is closer. Intersection uses `max(d1, d2)` — the point must be outside both shapes for the value to be positive. Subtraction uses `max(-d1, d2)` — negating the first SDF flips its interior/exterior. Quilez notes these operations produce **exact exterior distances but only bounded interior distances**.

**Smooth blending** replaces sharp CSG edges with organic transitions. Quilez's polynomial smooth minimum `smin(a, b, k)` uses a blending parameter *k* (in distance units) to interpolate between shapes. His preferred quadratic formulation is: `h = max(k - abs(a-b), 0.0); return min(a,b) - h*h*0.25/k`. Smooth subtraction and intersection derive from smooth union via De Morgan-like identities. Additional operations include domain repetition (`mod` for infinite tiling), symmetry (`abs` for mirroring), elongation (`clamp` for stretching), and extrusion/revolution of 2D SDFs into exact 3D shapes.

---

## The YouTube video: deriving the line segment SDF from first principles

The video at youtube.com/watch?v=PMltMdi1Wzg is **Inigo Quilez's "Deriving the SDF of a Line Segment"**, published in early January 2020 as part of his SDF tutorial playlist. Quilez describes it as "an introductory one to computing the SDF of a Line Segment, which is one of the most (if not the most?) popular primitive when it comes to organic modeling (creatures, vegetation, etc.)." The video also covers extrusion of 2D SDFs to 3D at the end.

The derivation proceeds in coordinate-free vector math, using **parametric line representation** and **dot product projection** as its two core mathematical tools. A companion Shadertoy demo (shadertoy.com/view/3tdSDj) provides interactive visualization where each pixel's color encodes the SDF value, with isocontour lines showing equal-distance curves. The video intentionally keeps visuals minimal to focus on mathematical clarity.

This video is particularly valuable for the assignment because it bridges theory and implementation: it shows *why* the dot product gives the projection parameter, *why* clamping restricts from infinite line to finite segment, and *how* the resulting four-line GLSL function emerges naturally from the math.

---

## Mathematical foundations: from class concepts to the line segment SDF

This section provides the detailed mathematical treatment needed for the 1–2 page report connecting course material to SDF generation.

### Three ways to represent geometry

**Explicit form** (y = f(x)) directly computes one coordinate from others. A line becomes y = mx + b; a parabola becomes y = x². This form cannot represent vertical lines, multi-valued surfaces, or closed shapes, and breaks under rotation. It is the simplest but most limited representation.

**Implicit form** (f(x, y, z) = 0) defines the surface as the zero-level set of a scalar function. A sphere becomes x² + y² + z² − r² = 0. The critical advantage is **inside/outside classification**: the sign of f immediately tells you which side of the surface a point lies on. SDFs are a special case of implicit representation where |f(**p**)| equals the true Euclidean distance to the nearest surface point. Not every implicit function is an SDF — for instance, x² + y² − r² = 0 defines a circle implicitly, but its value at a point is *not* the distance. The true circle SDF is √(x² + y²) − r.

**Parametric form** (P(t) = P₀ + t**d**) generates surface points by varying parameters. A line segment from **A** to **B** becomes **P**(t) = **A** + t(**B** − **A**) for t ∈ [0, 1], where t = 0 gives **A**, t = 1 gives **B**, and t = 0.5 gives the midpoint. This form excels at point generation but cannot directly test inside/outside.

**The key insight** is that the line segment SDF derivation *begins* with the parametric form, then *uses* vector operations to convert it into an implicit distance field — bridging all three representations.

### Vector operations as the computational engine

**Vector subtraction** creates relative direction vectors. **B** − **A** gives the segment direction; **P** − **A** gives the direction from endpoint A to the query point. These relative vectors are the foundation of coordinate-free computation — no absolute x, y, z values appear.

**The dot product** (**a** · **b** = |**a**||**b**|cos θ) measures alignment between vectors. When **a** · **b** > 0, vectors point roughly the same direction; when zero, they are perpendicular; when negative, they oppose. The algebraic definition (a₁b₁ + a₂b₂ + a₃b₃) connects to the geometric one through the law of cosines. A crucial special case is **a** · **a** = |**a**|², giving squared length without a square root.

**Vector projection** is the mathematical heart of the line segment SDF. Projecting vector **a** onto vector **b** finds the component of **a** in **b**'s direction. The scalar projection parameter is:

> **t = (a · b) / (b · b)**

This formula emerges from requiring the error vector (**a** − t**b**) to be perpendicular to **b**: setting (**a** − t**b**) · **b** = 0 and solving gives t = (**a** · **b**)/(**b** · **b**). Division by **b** · **b** (rather than |**b**|) avoids a square root and naturally normalizes the parameter.

**Coordinate-free geometry** means defining operations through intrinsic relationships (dot products, vector differences) rather than axis-specific coordinates. The line segment SDF uses *only* relative vectors **pa** = **P** − **A** and **ba** = **B** − **A** plus dot products — no x, y, z components are referenced. This is why the same four-line formula works identically in 2D and 3D: change `vec2` to `vec3` and nothing else changes.

### Step-by-step derivation of the line segment SDF

**Given:** Segment endpoints **A** and **B**; query point **P**.
**Goal:** Compute the minimum Euclidean distance from **P** to the nearest point on segment AB.

**Step 1 — Parametric setup.** Any point on the line through A and B is **Q**(t) = **A** + t(**B** − **A**). For t ∈ [0, 1], this traces the segment.

**Step 2 — Define relative vectors.** Let **pa** = **P** − **A** and **ba** = **B** − **A**. These encode all needed geometric relationships without absolute coordinates.

**Step 3 — Express distance as a function of t.** The squared distance from **P** to the line point **Q**(t) is:

> D(t) = |**pa** − t · **ba**|² = (**pa** · **pa**) − 2t(**pa** · **ba**) + t²(**ba** · **ba**)

This is a **quadratic in t** that opens upward (since **ba** · **ba** > 0), guaranteeing a unique minimum.

**Step 4 — Minimize via calculus.** Setting dD/dt = 0:

> −2(**pa** · **ba**) + 2t(**ba** · **ba**) = 0

Solving yields the **projection parameter**:

> **t = dot(pa, ba) / dot(ba, ba)**

This is exactly the scalar projection of **pa** onto **ba**. The numerator measures how much of the A-to-P vector aligns with the segment direction; the denominator normalizes by the segment's squared length.

**Step 5 — Clamp to the segment.** For an infinite line, unclamped t gives the closest point. For a finite segment, clamp: **h = clamp(t, 0, 1)**. Three cases arise:

- t < 0 → **P** is "behind" **A**; closest point is **A** (h = 0)
- 0 ≤ t ≤ 1 → perpendicular foot falls on the segment; use t directly
- t > 1 → **P** is "past" **B**; closest point is **B** (h = 1)

**Step 6 — Compute distance.** The vector from the closest segment point to **P** is **pa** − **ba** · h. The distance is:

> **d = length(pa − ba · h) = √((pa − ba · h) · (pa − ba · h))**

This completes the derivation. The entire computation requires **2 dot products, 1 division, 1 clamp, and 1 square root** — optimal for GPU execution.

### From math to code: line-by-line mapping

The GLSL implementation maps directly to the derivation:

```glsl
float sdSegment(vec3 p, vec3 a, vec3 b) {
    vec3 pa = p - a, ba = b - a;          // Step 2: relative vectors
    float h = clamp(dot(pa,ba)/dot(ba,ba), 0.0, 1.0);  // Steps 4-5: project + clamp
    return length(pa - ba*h);             // Step 6: Euclidean distance
}
```

| GLSL expression | Math operation | Course concept |
|---|---|---|
| `p - a` | **P** − **A** = **pa** | Vector subtraction |
| `b - a` | **B** − **A** = **ba** | Direction vector of segment |
| `dot(pa,ba)` | **pa** · **ba** | Dot product measuring alignment |
| `dot(ba,ba)` | \|**ba**\|² | Squared length (avoids sqrt) |
| `dot(pa,ba)/dot(ba,ba)` | t = projection parameter | Vector projection onto segment |
| `clamp(..., 0.0, 1.0)` | Restrict t to [0,1] | Parametric constraint to finite segment |
| `pa - ba*h` | **P** − **Q**_closest | Rejection vector (perpendicular component) |
| `length(...)` | \|**pa** − h · **ba**\| | Euclidean distance (implicit → scalar field) |

Note that a bare line segment has no interior — `sdSegment` always returns ≥ 0 (unsigned distance). To create a closed shape like a capsule, subtract a radius: `sdCapsule = sdSegment(p,a,b) - r`. This "inflates" the segment into a rounded tube with a true signed interior.

### Essential SDF properties

A true signed distance function satisfies: **f(x) = 0** on the surface, **f(x) > 0** outside, **f(x) < 0** inside, and **|∇f| = 1** everywhere (the Eikonal equation). The gradient ∇f points toward the nearest surface point's outward normal, giving surface normals for free via finite differences. Combining SDFs through `min` (union), `max` (intersection), and `max(-f₁, f₂)` (subtraction) enables constructive solid geometry, while smooth minimum functions like Quilez's polynomial `smin` create organic blends between shapes at the cost of violating the Eikonal equation in the blend region.

---

## Practical guidance for the two deliverables

### For deliverable A (1-page paper summary)

Structure around five paragraphs: (1) the problem — no standard SDF dataset exists, mesh conversion is lossy; (2) the dataset — 63 analytic GLSL SDFs across 6 categories, normalized to [-1,1]³; (3) the Explorer — real-time sphere-traced visualization with a diagnostic cutting plane revealing field structure, isocontours, and artifacts; (4) the sampling system — 8 GPU-accelerated patterns, Python/NumPy integration, 4.3 GB pre-sampled NPZ files; (5) assessment — strengths include ground-truth quality and ML pipeline integration, limitations include qualitative-only validation and hand-crafted (not scanned) shapes.

### For deliverable B (1-2 page math report)

Open with the three representation forms (explicit, implicit, parametric) and position SDFs as a special implicit form where values equal signed distance. Then present the full line segment SDF derivation as the central example, emphasizing how each step maps to a course concept: vector subtraction creates relative vectors, dot product enables projection, clamping restricts the parametric domain, and length computes Euclidean distance. Include the code-to-math table above. Close with SDF combination operations and the observation that coordinate-free geometry makes the formula dimension-independent. Consider including a diagram showing point **P**, segment **AB**, the projection foot, the clamped closest point, and the resulting distance vector for the three cases (t < 0, 0 ≤ t ≤ 1, t > 1).