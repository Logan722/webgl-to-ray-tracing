# Program 2 — Presentation Study Guide

> Use this to prepare for in-class demo day.  
> Keep this open in a VS Code tab next to your code so you can reference line numbers while presenting.

---

## What the Program Does (Big Picture)

The program renders a 3D articulated horse figure standing on a rolling hills terrain. The horse has 7 joints that can each be controlled independently with sliders, or animated together with a walk cycle. The scene is lit with a single movable point light using Phong (per-fragment) shading. The camera orbits the horse using spherical coordinates with a perspective projection.

Everything runs in a single HTML + JS file pair with no server required. The shaders are inline in the HTML. The only external dependencies are MVnew.js and initShaders.js from class.

---

## How the Perspective Projection Works

**If someone asks: "How does your projection work?"**

I use `perspective(55.0, aspect, 0.1, 100.0)` from MVnew.js. The 55 is the vertical field of view in degrees. The function builds a 4x4 matrix that maps the view frustum (a pyramid-shaped region of space) to the clip cube. The key thing the matrix does is set the [3][2] entry to -1, which causes the GPU to divide the x and y coordinates by the z depth during the perspective divide stage. That is what makes far-away things look smaller.

The near plane is at 0.1 and far plane at 100.0. Anything closer than 0.1 or further than 100.0 gets clipped. I picked these values so the terrain (which extends about 8 units in each direction) and the horse are always inside the frustum as I orbit the camera.

**Where in the code:** Look at the `render()` function in the JS file:
```js
var projMatrix = perspective(55.0, canvas.width / canvas.height, 0.1, 100.0);
```

---

## How the Camera Works

**If someone asks: "How do you control the camera?"**

The camera orbits around the horse using spherical coordinates. I have three numbers: camRadius (how far away), camTheta (elevation angle — 0 would be directly above, 90 would be at ground level), and camPhi (orbit angle around Y). Every frame I convert these into an x, y, z eye position using the standard spherical-to-Cartesian conversion:

```
eye.x = center.x + radius * sin(theta) * cos(phi)
eye.y = center.y + radius * cos(theta)
eye.z = center.z + radius * sin(theta) * sin(phi)
```

Then I pass the eye position, the look-at point (which is the horse), and up = (0,1,0) into `lookAt()` from MVnew.js. That function builds a view matrix that rotates and translates world space into camera space. The camera always points at the horse, so if the horse walks forward, the camera follows.

**How lookAt() works internally:** It computes a right-hand coordinate frame using cross products. It builds the view direction `v = normalize(at - eye)`, a perpendicular axis `n = normalize(v × up)`, and a corrected up vector `u = normalize(n × v)`. Then it negates v (because the camera looks down -Z in eye space) and packs these three basis vectors plus the dot-product translations into a mat4.

---

## How the Articulated Figure Transforms Work

**If someone asks: "Explain how the horse joints work" — this is the most important section.**

Every part of the horse is a scaled unit cube. I do not store separate geometry for the body, neck, head, legs, or tail. It is all the same cube VAO, just drawn multiple times with a different model matrix each time.

### The World Transform

All parts start with a shared world transform: translate to (horseX, horseY, horseZ) then rotateY by the heading angle. The Y comes from the heightfield function, so the horse sits on top of the terrain wherever it is.

```js
var world = chainMult(
    translate(horseX, horseY, horseZ),
    rotateY(horseHeading)
);
```

### Pivot Points — Why Order Matters

This is the core concept. A unit cube centered at the origin rotates around its center. But a horse leg does not rotate at its center — it rotates at the hip joint. So the trick is:

1. Translate to the pivot point (the hip location on the body).
2. Apply the joint rotation (rotateZ by the leg angle).
3. Translate by half the leg length downward so the top edge of the cube is at the pivot.
4. Scale the cube to leg proportions.

Remember: in code this reads left to right, but the vertex sees it right to left. So scale happens first (shapes the cube into a leg), then translate (moves it so the top is at origin), then rotate (swings it around the hip), then translate (places the hip on the body).

```js
// Example: front-left leg
drawPart(viewMatrix, chainMult(
    world,
    translate(legFX, hipY, legZ),     // 1. pivot point
    rotateZ(flLegAngle),              // 2. joint rotation
    translate(0, -legUL * 0.5, 0),    // 3. offset so top is at pivot
    scale(legUW, legUL, legUW)        // 4. shape the cube
));
```

### Parent-Child: Neck and Head

The head inherits the entire neck transform chain. In the code, the head's model matrix starts with: world transform, then neckPivot, then rotateZ(neckAngle) — that is everything the neck does. Then on top of that, it adds translate to the top of the neck, rotateZ(headAngle), translate to extend forward, and scale to head shape. Because the head starts with the neck's rotation, tilting the neck automatically tilts the head too. That is hierarchical modeling in action.

```js
// Head inherits neck rotation
drawPart(viewMatrix, chainMult(
    world, neckPivot,
    rotateZ(neckAngle),          // neck's rotation
    translate(0, neckL, 0),      // top of neck
    rotateZ(headAngle),          // head's own rotation
    translate(headW * 0.35, 0, 0),
    scale(headW, headH, headD)
));
```

---

## How the Terrain Mesh Works

**If someone asks: "How did you make the hills?"**

The terrain is a grid mesh on the XZ-plane. I divide a 16x16 unit area into a 40x40 grid, which gives 3200 cells and 6400 triangles. For each grid point (x, z), the Y height comes from a function that adds together three sine/cosine waves at different frequencies and amplitudes:

```js
y = 0.40 * sin(0.50*x) * cos(0.50*z)
  + 0.20 * cos(0.70*x + 0.40*z)
  + 0.15 * sin(0.35*x - 0.55*z)
```

Layering multiple frequencies like this avoids the perfectly uniform look you would get from a single sine wave. The normals at each vertex are computed using central differences — basically sampling the height at x+epsilon and x-epsilon to estimate the slope, then building a normal from that. This gives smooth, correct lighting across the whole terrain surface.

---

## How the Lighting Works

**If someone asks: "Explain your lighting model."**

I use Blinn-Phong per-fragment shading, same as shadedSphere2.js from class. The vertex shader computes the light direction L, eye direction E, and normal N in eye space, then passes them to the fragment shader. The fragment shader computes:

```glsl
H = normalize(L + E)              // halfway vector
Kd = max(dot(L, N), 0.0)          // diffuse intensity
Ks = pow(max(dot(N, H), 0.0), shininess)  // specular intensity
fColor = ambient + Kd*diffuse + Ks*specular
```

The light is a point light (w = 1.0 in the position vec4). It gets transformed into eye space in the vertex shader by multiplying `uViewMatrix * uLightPosition`. The horse and terrain each have different material properties — the horse is a warm brown with mild specular, and the terrain is green with almost no specular — which is why they respond to the light differently.

---

## The Normal Matrix — Why You Cannot Just Use the Model Matrix

**If someone asks: "Why do you need a separate normal matrix?"**

When you scale a cube to make it into a leg shape (say 0.22 x 0.80 x 0.22), the scaling is non-uniform. If you applied that same non-uniform scale to the normals, the normals would no longer be perpendicular to the surface. A normal that was pointing straight out from the top face would get squished and start pointing at a weird angle, which would make the lighting look wrong.

The fix is to use the **inverse-transpose** of the modelView matrix for normals. MVnew.js provides `normalMatrix()` which does this automatically. The mathematical reason it works is that the inverse-transpose undoes the distortion caused by non-uniform scaling while preserving the rotation.

```js
var nMat = normalMatrix(mult(viewMat, modelMat), true);
// true = return mat3 (upper-left 3x3 only)
```

---

## How the Walk Animation Works

**If someone asks: "How does the walk cycle work?"**

The animation uses a time variable that increments every frame. The leg angles are set using sine waves, with opposite legs using a pi-offset so they swing in opposite directions:

```js
flLegAngle =  legSwing * Math.sin(animTime);           // front-left
brLegAngle =  legSwing * Math.sin(animTime);           // back-right (same)
frLegAngle =  legSwing * Math.sin(animTime + Math.PI); // front-right (opposite)
blLegAngle =  legSwing * Math.sin(animTime + Math.PI); // back-left (opposite)
```

Front-left and back-right swing together (one diagonal pair), and front-right and back-left swing together (the other pair). This mimics a horse trot gait.

The neck has a subtle sine bob at double frequency, the tail sways at triple frequency, and the horse translates forward along its heading each frame. Its Y position is recalculated from the heightfield every frame, so it goes up and down over the hills naturally.

---

## Quick-Fire Q&A

**Q: Why separate uModelMatrix and uViewMatrix instead of a single modelView?**  
A: Because every body part of the horse has a different model matrix, but they all share the same view matrix. If I combined them, I would have to recompute the camera portion every time I draw a part. Separating them means I set the view matrix once per frame and only change the model matrix per part.

**Q: What is the heightfield function?**  
A: A mathematical function that takes an (x, z) position and returns a Y height. I layered three sine/cosine waves at different frequencies to get natural-looking hills. The terrain mesh evaluates this function at every grid point to set vertex heights.

**Q: How many triangles are in your scene?**  
A: The terrain is 40x40 grid cells, 2 triangles each = 3200 triangles. The horse is 9 cubes (body, neck, head, tail, 4 legs, light marker), 12 triangles each = 108. So roughly 3308 triangles total.

**Q: Why does the light position have w=1.0?**  
A: A w of 1.0 means it is a point light at a specific position in space. If w were 0.0, it would be a directional light (like the sun) where only the direction matters and the position is infinitely far away. The shader checks this and handles both cases.

**Q: What happens if the horse walks off the terrain?**  
A: The horse position is clamped to within 6.5 units of center. The terrain extends 8 units, so the horse always stays safely on the mesh.

**Q: Why rotateZ for the legs and not rotateX?**  
A: The horse faces along the X-axis by default. Legs swing forward and backward in the XY-plane, which means rotating around the Z-axis. If I used rotateX, the legs would swing side to side instead of forward and back.

**Q: What is chainMult()?**  
A: It is just a wrapper that chains together multiple `mult()` calls from MVnew.js. Instead of writing `mult(mult(mult(A, B), C), D)` which is hard to read, I write `chainMult(A, B, C, D)`. Same result, cleaner code.
