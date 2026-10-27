# Pizza Pie WebGL Code — Complete Beginner's Guide

This document explains **every single part** of the pizza code, assuming you know absolutely nothing about WebGL, shaders, graphics programming, or even much about how websites work beyond basic HTML. By the end, you should understand every line well enough to modify it or write your own from scratch.

---

## THE BIG PICTURE: What Is This File?

This is a single `.html` file — the same kind of file that makes up every web page you've ever visited. But instead of showing text and images like a normal web page, this one draws graphics directly using your computer's **GPU** (Graphics Processing Unit — the chip that normally renders video games).

The technology that lets a web page talk to the GPU is called **WebGL** (Web Graphics Library). Think of it like this:

- **HTML** = the skeleton of the page (it creates a "canvas" to draw on)
- **JavaScript** = the brain (it runs the logic, computes where things go, and tells the GPU what to draw)
- **GLSL** (GL Shading Language) = tiny programs that run *on the GPU itself*, processing each point and each pixel at blazing speed

The file has three main sections, and they all live inside one HTML file:

1. **Vertex Shader** (GLSL) — tells the GPU *where* each point goes on screen
2. **Fragment Shader** (GLSL) — tells the GPU *what color* each pixel should be
3. **JavaScript** — the main program that sets everything up and issues drawing commands

---

## SECTION 1: THE VERTEX SHADER (Lines 4–16)

```glsl
#version 300 es

in vec4 aPosition;
uniform float uPntSize;

void main()
{
  gl_Position = aPosition;
  gl_PointSize = uPntSize;
}
```

### What is a "vertex"?

A **vertex** (plural: "vertices") is just a **point in space**. If you want to draw a triangle, you need 3 vertices (the 3 corners). If you want to draw a line, you need 2 vertices (the 2 endpoints). Every shape in computer graphics is built from vertices.

### What is a "shader"?

A **shader** is a tiny program that runs on the GPU. It gets called *once for every vertex* (or once for every pixel, depending on the type). The vertex shader's job is: "Given this vertex's data, where should it appear on screen?"

### Line by line:

**`#version 300 es`** — This tells the GPU "I'm writing in GLSL version 3.00 for embedded systems (ES)." This is the version used by WebGL 2.0. It's like saying "I'm writing in Python 3" — you need to declare which version of the language you're using.

**`in vec4 aPosition;`** — This declares an **input variable** called `aPosition`. 

- `in` means "this value comes IN from the JavaScript code" (the CPU side sends it to the GPU)
- `vec4` means it's a **vector with 4 numbers**: (x, y, z, w). Even though our pizza is 2D (we only care about x and y), the GPU always works with 4D coordinates internally. When we only send x and y from JavaScript, z defaults to 0 and w defaults to 1.
- `aPosition` is the name. The `a` prefix is a convention meaning "attribute" — a value that changes per-vertex (each vertex has its own position).

**`uniform float uPntSize;`** — This declares a **uniform variable** called `uPntSize`.

- `uniform` means "this value is the SAME for every vertex in a single draw call." Unlike `aPosition` which is different for each vertex, `uPntSize` stays constant. Think of it like a setting you dial in before drawing.
- `float` means it's a single decimal number (like 26.0 or 12.0).
- `uPntSize` is the name. The `u` prefix is a convention meaning "uniform." This will control how big our topping dots are.

**`void main() { ... }`** — Every shader must have a `main()` function. This is what the GPU runs for each vertex.

**`gl_Position = aPosition;`** — This is the key line. `gl_Position` is a **built-in** output variable that the GPU requires you to set. It tells the GPU "put this vertex HERE on screen." We're just passing through whatever position JavaScript gave us, with no changes. (In more advanced programs, you'd apply transformations here like rotation or scaling.)

**`gl_PointSize = uPntSize;`** — Another built-in variable. When you draw `gl.POINTS`, this controls how many pixels wide each point appears. We set it from JavaScript so we can make pepperoni big (26 pixels) and olives smaller (16 pixels).

---

## SECTION 2: THE FRAGMENT SHADER (Lines 18–30)

```glsl
#version 300 es

precision mediump float;
uniform vec4 uColor;
out vec4  fColor;

void main()
{
    fColor = uColor;
}
```

### What is a "fragment"?

After the GPU figures out where all the vertices go and what shape they form (a triangle, a line, etc.), it needs to **fill in all the pixels** inside that shape. Each pixel that needs to be colored is called a **fragment**. The fragment shader runs once for *every single pixel* inside every shape you draw.

### Line by line:

**`#version 300 es`** — Same version declaration.

**`precision mediump float;`** — This tells the GPU how precisely to handle decimal numbers. `mediump` means "medium precision" — good enough for colors and positions, and faster than high precision. This line is **required** in WebGL 2.0 fragment shaders.

**`uniform vec4 uColor;`** — A uniform variable holding the color to paint everything with.

- `vec4` here means 4 numbers: **(Red, Green, Blue, Alpha)**. Each ranges from 0.0 to 1.0.
  - `[1.0, 0.0, 0.0, 1.0]` = pure red, fully opaque
  - `[0.0, 1.0, 0.0, 1.0]` = pure green, fully opaque
  - `[0.95, 0.82, 0.30, 1.0]` = the warm yellow we use for cheese
- `uniform` means it's the same for every pixel in a single draw call. That's why all the cheese is one color, all the crust is one color, etc. We change the uniform *between* draw calls to get different colors.

**`out vec4 fColor;`** — This declares the **output** of the shader. The `out` keyword means "this value goes OUT to the screen." Whatever you put in `fColor` becomes the actual pixel color on screen.

**`fColor = uColor;`** — Simply sets every pixel's color to whatever uniform color JavaScript told us to use. (In fancier programs, you might calculate lighting, textures, gradients, etc. here.)

---

## SECTION 3: THE JAVASCRIPT — initShaders Function (Lines 38–92)

This function is a utility taken directly from your class examples. Its job is to take the two shader source code strings (vertex + fragment), send them to the GPU, compile them, and link them together into a single **GPU program**.

You don't need to memorize this function — it's boilerplate that you reuse in every WebGL project. But here's what it does step by step:

1. **Find the vertex shader source code** in the HTML (the `<script id="vertex-shader">` tag) using `document.getElementById`
2. **Create a shader object** on the GPU with `gl.createShader(gl.VERTEX_SHADER)`
3. **Give it the source code** with `gl.shaderSource()`
4. **Compile it** with `gl.compileShader()` — this is like compiling C code; the GPU turns GLSL text into machine code it can run
5. **Check for errors** — if the GLSL has a typo, it shows an alert
6. **Repeat steps 1–5 for the fragment shader**
7. **Create a "program" object** — this is a linked pair of (vertex shader + fragment shader) that work together
8. **Attach both shaders** to the program and **link** them
9. **Return the program** so the rest of our code can use it

Think of it like this: you write two small programs (vertex shader and fragment shader), this function compiles them both and staples them together into one "GPU program" that's ready to run.

---

## SECTION 4: THE JAVASCRIPT — Main Program (Lines 95–330)

This is where all the actual pizza logic lives. Let's go through it piece by piece.

### 4a. Setting Up the Canvas and WebGL Context (Lines 96–106)

```javascript
canvas = document.getElementById( "gl-canvas" );
gl = canvas.getContext('webgl2');
if (!gl) { alert( "WebGL 2.0 isn't available" ); }
```

**What is a canvas?** Back in line 32, the HTML has `<canvas id="gl-canvas" width="512" height="512">`. This creates a 512×512 pixel rectangle on the web page — like an actual painter's canvas. It starts blank.

**`canvas.getContext('webgl2')`** — This is the magic line. It asks the browser: "Give me a WebGL 2.0 drawing context for this canvas." The `gl` object that comes back is your **entire interface to the GPU**. Every single drawing command goes through this `gl` object. If the browser doesn't support WebGL 2.0, you get `null` and the alert fires.

### 4b. Compiling Shaders (Lines 116–117)

```javascript
program = initShaders( gl, "vertex-shader", "fragment-shader" );
gl.useProgram( program );
```

This calls the `initShaders` function we described above, passing in the IDs of our two shader scripts. Then `gl.useProgram(program)` tells the GPU: "Use THIS program for all future drawing commands." It's like selecting which pen to draw with.

### 4c. Pizza Parameters (Lines 126–128)

```javascript
var NUM_SLICES = 8;
var R_CHEESE   = 0.78;
var R_CRUST    = 0.85;
```

Simple variables that define our pizza:

- **NUM_SLICES = 8** — our pizza has 8 slices. You could change this to 6, 10, 12, etc.
- **R_CHEESE = 0.78** — the radius of the cheese/sauce area
- **R_CRUST = 0.85** — the radius of the outer crust edge

**IMPORTANT: Why are these numbers less than 1.0?** WebGL's coordinate system goes from **-1.0 to +1.0** in both X and Y. The center of the screen is (0, 0). The right edge is x = +1.0, the left edge is x = -1.0, the top is y = +1.0, the bottom is y = -1.0. So a radius of 0.85 means the pizza crust goes 85% of the way from the center to the edge of the canvas. This is NOT in pixels — it's in this normalized -1 to +1 coordinate system.

```
        +1.0 (top)
          |
-1.0 ----+---- +1.0
(left)    |     (right)
        -1.0 (bottom)
```

---

## THE KEY MATH CONCEPT: POLAR COORDINATES

This is the most important concept in the entire program. Every vertex on the pizza's circumference is placed using **polar coordinates**.

### What are polar coordinates?

Normally we describe a point using **(x, y)** — that's called **Cartesian coordinates**. "Go 3 units right and 4 units up."

**Polar coordinates** describe a point using **(r, θ)** — a **radius** (how far from the center) and an **angle** (which direction). "Go 0.78 units outward at an angle of 45°."

### Why use polar coordinates for a pizza?

Because a pizza is a **circle**, and circles are trivially easy to describe in polar coordinates! Every point on a circle with radius R is at distance R from the center — only the angle changes. So to place 8 equally-spaced points around a circle, you just divide 360° into 8 equal parts (every 45°) and place a point at each angle.

### The Conversion Formula

The GPU doesn't understand polar coordinates — it needs (x, y). So you convert:

```
x = R × cos(angle)
y = R × sin(angle)
```

This is basic trigonometry. If you imagine a right triangle with the hypotenuse pointing from the origin at the given angle:
- **cos(angle)** gives you the horizontal (x) component
- **sin(angle)** gives you the vertical (y) component
- Multiplying by R scales it to the right distance

### Example: 8 slices

A full circle is **2π radians** (= 360°). With 8 slices, each slice spans `2π / 8 = π/4 radians` (= 45°).

| Slice boundary | Angle (radians) | Angle (degrees) | x = 0.78 × cos(θ) | y = 0.78 × sin(θ) |
|:-:|:-:|:-:|:-:|:-:|
| 0 | 0 | 0° | 0.780 | 0.000 |
| 1 | π/4 | 45° | 0.552 | 0.552 |
| 2 | π/2 | 90° | 0.000 | 0.780 |
| 3 | 3π/4 | 135° | -0.552 | 0.552 |
| 4 | π | 180° | -0.780 | 0.000 |
| 5 | 5π/4 | 225° | -0.552 | -0.552 |
| 6 | 3π/2 | 270° | 0.000 | -0.780 |
| 7 | 7π/4 | 315° | 0.552 | -0.552 |
| 8 | 2π | 360° | 0.780 | 0.000 |

Notice that slice 0 and slice 8 are the same point — the circle closes!

---

## 4d. BUILDING THE CHEESE BASE — TRIANGLE_FAN (Lines 140–148)

```javascript
var cheeseVerts = [];
cheeseVerts.push( 0.0, 0.0 );   // center of the pizza
for (var i = 0; i <= NUM_SLICES; i++)
{
    var angle = (2.0 * Math.PI * i) / NUM_SLICES;
    cheeseVerts.push( R_CHEESE * Math.cos(angle), R_CHEESE * Math.sin(angle) );
}
var cheesePoints = new Float32Array( cheeseVerts );
```

### What is TRIANGLE_FAN?

`TRIANGLE_FAN` is a **drawing mode** (also called a "primitive type"). It's one of the ways WebGL can connect vertices into shapes. Here's how it works:

- The **first vertex** is the "center" or "hub"
- Every subsequent pair of adjacent vertices forms a triangle with the center
- So vertices [C, A, B, D, E] create triangles: C-A-B, C-B-D, C-D-E

This is **perfect for a circle/pizza** because all slices share the center point!

```
        B
       /|\
      / | \
     /  |  \
    A---C---D     C = center, A/B/D/E = edge points
     \  |  /      Triangles: C-A-B, C-B-D, C-D-E
      \ | /
       \|/
        E
```

### What the code does:

1. **Start an empty array** `cheeseVerts` — this will hold all the x,y numbers
2. **Push the center point** (0.0, 0.0) — the very middle of the pizza. This is the first vertex of the TRIANGLE_FAN, the "hub."
3. **Loop from i=0 to i=8** (that's 9 iterations, because `<=`):
   - Calculate the angle for this slice boundary: `angle = (2π × i) / 8`
   - When i=0: angle = 0 (pointing right)
   - When i=1: angle = π/4 (45°, pointing upper-right)
   - When i=8: angle = 2π (full circle, same as 0 — closes the loop)
   - Convert polar to cartesian: `x = 0.78 × cos(angle)`, `y = 0.78 × sin(angle)`
   - Push both x and y into the array
4. **Convert to Float32Array** — WebGL/the GPU can't use regular JavaScript arrays. It needs a **typed array** where every number is exactly a 32-bit float. `new Float32Array(cheeseVerts)` does this conversion.

The resulting array looks like (conceptually):
```
[0.0, 0.0,              ← center
 0.780, 0.000,          ← edge point at 0°
 0.552, 0.552,          ← edge point at 45°
 0.000, 0.780,          ← edge point at 90°
 -0.552, 0.552,         ← edge point at 135°
 ...and so on...
 0.780, 0.000]          ← edge point at 360° (closes the circle)
```

The TRIANGLE_FAN will connect these into 8 pizza-slice-shaped triangles, filling the entire circle with cheese-colored pixels.

---

## 4e. BUILDING THE CRUST RING — TRIANGLE_STRIP (Lines 153–163)

```javascript
var crustVerts = [];
for (var i = 0; i <= NUM_SLICES; i++)
{
    var angle = (2.0 * Math.PI * i) / NUM_SLICES;
    var cx = Math.cos(angle);
    var cy = Math.sin(angle);
    crustVerts.push( R_CHEESE * cx, R_CHEESE * cy );
    crustVerts.push( R_CRUST  * cx, R_CRUST  * cy );
}
var crustPoints = new Float32Array( crustVerts );
```

### What is TRIANGLE_STRIP?

`TRIANGLE_STRIP` is another drawing mode. Given vertices [A, B, C, D, E, F], it creates triangles: A-B-C, B-C-D, C-D-E, D-E-F. Each new vertex forms a triangle with the previous two. This is very efficient for drawing **ribbons or strips** of connected triangles.

### Why use it for the crust?

The crust is a **ring** — a band between the cheese edge (radius 0.78) and the crust outer edge (radius 0.85). To draw a ring, you place pairs of vertices: one on the inner circle and one on the outer circle, at the same angle. The TRIANGLE_STRIP connects them into a zigzag of triangles that form the ring.

```
    Outer: O0----O1----O2----O3
            |  / |  / |  / |
            | /  | /  | /  |
    Inner: I0----I1----I2----I3
    
    Vertex order: I0, O0, I1, O1, I2, O2, I3, O3
    Triangles formed: I0-O0-I1, O0-I1-O1, I1-O1-I2, O1-I2-O2, ...
```

### What the code does:

For each of the 9 points (0 through 8, to close the loop):
1. Calculate the angle at this position
2. Compute `cos(angle)` and `sin(angle)` once (to avoid computing them twice)
3. Push the **inner edge** point: `(R_CHEESE × cos, R_CHEESE × sin)` — on the cheese boundary
4. Push the **outer edge** point: `(R_CRUST × cos, R_CRUST × sin)` — on the crust boundary

The result is alternating inner/outer points that the TRIANGLE_STRIP connects into a solid ring.

---

## 4f. BUILDING THE SLICE LINES — LINES (Lines 168–177)

```javascript
var lineVerts = [];
for (var i = 0; i < NUM_SLICES; i++)
{
    var angle = (2.0 * Math.PI * i) / NUM_SLICES;
    lineVerts.push( 0.0, 0.0 );
    lineVerts.push( R_CRUST * Math.cos(angle), R_CRUST * Math.sin(angle) );
}
var linePoints = new Float32Array( lineVerts );
```

### What is LINES?

`gl.LINES` takes vertices in pairs and draws a straight line between each pair. Vertices [A, B, C, D] draw two lines: A→B and C→D.

### What the code does:

For each of the 8 slice boundaries:
1. Push the **center** (0, 0) — start of the line
2. Push the **crust edge** at this angle — end of the line

This draws 8 straight lines radiating from the center to the crust, like cutting a pizza into 8 slices. Notice the loop uses `< NUM_SLICES` (not `<=`) because we need exactly 8 lines, not 9.

---

## 4g. BUILDING THE TOPPINGS — POINTS (Lines 182–213)

### What is POINTS?

`gl.POINTS` draws a **square dot** at each vertex's position. The size of each dot is controlled by `gl_PointSize` in the vertex shader (which we set via the `uPntSize` uniform). This is the simplest drawing mode — each vertex = one dot.

### Pepperoni (Lines 182–189)

```javascript
var pepVerts = [];
for (var i = 0; i < NUM_SLICES; i++)
{
    var midAngle = (2.0 * Math.PI * (i + 0.5)) / NUM_SLICES;
    var pr = 0.45;
    pepVerts.push( pr * Math.cos(midAngle), pr * Math.sin(midAngle) );
}
```

The key trick: **`i + 0.5`** instead of just `i`. This puts each pepperoni in the **middle** of each slice rather than on the divider line. If slice 0 goes from 0° to 45°, then `i + 0.5 = 0.5` gives us an angle of 22.5° — right in the center of that slice. The radius `pr = 0.45` puts them about halfway between the center and the crust.

### Olives (Lines 195–201)

Same idea, but:
- Radius `0.22` — closer to the center
- Offset `i + 0.3` — slightly off-center within each slice (not overlapping pepperoni)

### Green Peppers (Lines 207–213)

Same idea, but:
- **`i += 2`** in the loop — only every OTHER slice gets a green pepper (4 total instead of 8)
- Radius `0.62` — closer to the crust
- Offset `i + 0.65` — different angular position to avoid overlap

---

## 4h. GETTING SHADER VARIABLE LOCATIONS (Lines 221–224)

```javascript
var aPosition = gl.getAttribLocation( program, "aPosition" );
var uColor_location  = gl.getUniformLocation(program, "uColor");
var uPntSize_Loc     = gl.getUniformLocation(program, "uPntSize");
```

Remember those variables we declared in the shaders (`aPosition`, `uColor`, `uPntSize`)? They live on the GPU. JavaScript can't directly access them by name — it needs a **location handle** (like a phone number) to communicate with them.

- **`gl.getAttribLocation(program, "aPosition")`** — asks the GPU: "In this program, where is the attribute called `aPosition`?" Returns a number (like 0) that we use later to send vertex data to it.
- **`gl.getUniformLocation(program, "uColor")`** — same thing, but for the uniform color variable.
- **`gl.getUniformLocation(program, "uPntSize")`** — same, for the point size uniform.

Think of these like looking up someone's phone number in a contacts list — you need the number before you can call them.

---

## 4i. CONFIGURING WebGL (Lines 232–241)

```javascript
gl.viewport( 0, 0, canvas.width, canvas.height );
gl.clearColor( 0.82, 0.16, 0.16, 1.0 );
gl.clear( gl.COLOR_BUFFER_BIT );
gl.uniform1f(uPntSize_Loc, 1.0);
```

**`gl.viewport(0, 0, 512, 512)`** — Maps the WebGL coordinate system (-1 to +1) onto the actual pixel area of the canvas (0 to 512). This tells WebGL: "When I say x = +1.0, that means the right edge of this 512-pixel-wide canvas."

**`gl.clearColor(0.82, 0.16, 0.16, 1.0)`** — Sets the "eraser color." Before drawing anything, we fill the entire canvas with this color. The values (0.82, 0.16, 0.16) make a rich red — like a tablecloth the pizza sits on.

**`gl.clear(gl.COLOR_BUFFER_BIT)`** — Actually performs the clear. Now the entire canvas is red.

**`gl.uniform1f(uPntSize_Loc, 1.0)`** — Sets the point size to 1.0 as a default. `uniform1f` means "set one float uniform." We'll change this later when drawing toppings.

---

## 4j. THE DRAW CALLS — The Buffer-Set-Draw Pattern

Now we get to actually drawing things. Every draw call follows the **exact same 4-step pattern**. This is the core WebGL workflow, and once you understand it, you understand how to draw anything.

### The Pattern (repeated for each shape):

```javascript
// STEP 1: Create a buffer on the GPU and fill it with our vertex data
var someBuffer = gl.createBuffer();
gl.bindBuffer( gl.ARRAY_BUFFER, someBuffer );
gl.bufferData( gl.ARRAY_BUFFER, somePoints, gl.STATIC_DRAW );

// STEP 2: Tell the GPU how to read the buffer
gl.vertexAttribPointer( aPosition, 2, gl.FLOAT, false, 0, 0 );
gl.enableVertexAttribArray( aPosition );

// STEP 3: Set the color (and optionally point size)
gl.uniform4fv(uColor_location, [R, G, B, A]);

// STEP 4: Draw!
gl.drawArrays( PRIMITIVE_TYPE, startIndex, vertexCount );
```

Let's break down each step in detail:

### STEP 1: Creating and Filling a GPU Buffer

```javascript
var cheeseBuffer = gl.createBuffer();
```
This creates an empty buffer **on the GPU's memory** (not your regular RAM). Think of it like allocating a blank sheet of paper on the GPU.

```javascript
gl.bindBuffer( gl.ARRAY_BUFFER, cheeseBuffer );
```
WebGL uses a "binding" system. This says: "Make `cheeseBuffer` the currently active buffer." All subsequent buffer operations will affect THIS buffer. It's like selecting which file you're currently editing — you can only edit one at a time.

```javascript
gl.bufferData( gl.ARRAY_BUFFER, cheesePoints, gl.STATIC_DRAW );
```
This copies the data from our `cheesePoints` Float32Array (which lives in regular CPU memory) **over to the GPU buffer**. `gl.STATIC_DRAW` is a hint telling the GPU "this data won't change" (as opposed to animation data that changes every frame), so the GPU can optimize storage.

### STEP 2: Telling the GPU How to Read the Buffer

```javascript
gl.vertexAttribPointer( aPosition, 2, gl.FLOAT, false, 0, 0 );
```
The buffer is just a long flat array of numbers. The GPU needs to know how to **interpret** them. This line says:
- `aPosition` — feed this data into the `aPosition` shader variable
- `2` — take **2 numbers at a time** (because our vertices are 2D: x, y)
- `gl.FLOAT` — each number is a 32-bit float
- `false` — don't normalize the values
- `0, 0` — no stride, no offset (the data is tightly packed with no gaps)

So if the buffer contains `[0.0, 0.0, 0.78, 0.0, 0.55, 0.55, ...]`, the GPU reads it as:
- Vertex 0: aPosition = (0.0, 0.0)
- Vertex 1: aPosition = (0.78, 0.0)
- Vertex 2: aPosition = (0.55, 0.55)
- ...and so on

```javascript
gl.enableVertexAttribArray( aPosition );
```
This "turns on" the attribute. It tells the GPU: "Yes, I really do want you to read `aPosition` from the buffer." (Attributes can be enabled/disabled.)

### STEP 3: Setting Uniforms (Color and Point Size)

```javascript
gl.uniform4fv(uColor_location, [0.95, 0.82, 0.30, 1.0]);
```
This sets the `uColor` uniform in the fragment shader. `uniform4fv` means "set a 4-float vector uniform." The color `[0.95, 0.82, 0.30, 1.0]` is a warm yellow (cheese color). This value will be the same for EVERY pixel drawn in the next draw call.

For point-based toppings, we also set:
```javascript
gl.uniform1f(uPntSize_Loc, 26.0);
```
This makes each point 26 pixels wide (for pepperoni). `uniform1f` = "set one float uniform."

### STEP 4: Drawing

```javascript
gl.drawArrays( gl.TRIANGLE_FAN, 0, cheesePoints.length / 2 );
```
This is the actual **"draw it now!"** command. The arguments:
- `gl.TRIANGLE_FAN` — the primitive type (how to connect the vertices)
- `0` — start at the first vertex in the buffer
- `cheesePoints.length / 2` — how many vertices to draw. We divide by 2 because the array holds PAIRS of numbers (x,y), so 18 numbers = 9 vertices.

---

## 4k. ALL SIX DRAW CALLS SUMMARIZED

Here's what each draw call does, in the order they're executed:

| # | What | Primitive | Color | Notes |
|:-:|:--|:--|:--|:--|
| 1 | Cheese base | TRIANGLE_FAN | Yellow [0.95, 0.82, 0.30] | Filled circle from center outward |
| 2 | Crust ring | TRIANGLE_STRIP | Golden brown [0.72, 0.50, 0.18] | Ring between cheese and outer edge |
| 3 | Slice lines | LINES | Dark brown [0.55, 0.35, 0.12] | 8 lines from center to crust |
| 4 | Pepperoni | POINTS (size 26) | Red [0.72, 0.11, 0.07] | 8 dots, one per slice |
| 5 | Olives | POINTS (size 16) | Dark [0.15, 0.15, 0.08] | 8 dots near center |
| 6 | Green peppers | POINTS (size 12) | Green [0.18, 0.60, 0.15] | 4 dots, every other slice |

**Order matters!** Later draw calls paint OVER earlier ones. That's why we draw cheese first (back), then crust on top of the cheese edge, then lines on top of everything, then toppings last (front).

---

## HOW TO MODIFY THIS TO MAKE YOUR OWN

Now that you understand every piece, here's how to change things:

**Change the number of slices:** Change `NUM_SLICES = 8` to any number from 6–12. Everything else adjusts automatically because all the loops use `NUM_SLICES`.

**Change the pizza size:** Adjust `R_CHEESE` and `R_CRUST`. Keep them under 1.0 or the pizza will be clipped by the canvas edge.

**Change colors:** Modify the `[R, G, B, A]` arrays in the `gl.uniform4fv` calls. Use values 0.0 to 1.0. You can use a color picker website and divide the RGB values by 255 to get the 0-1 range.

**Change background color:** Modify the `gl.clearColor(...)` call.

**Add more toppings:** Copy one of the topping blocks (e.g., the pepperoni section), change the radius, angle offset, and color. Add a new buffer/draw call section.

**Change topping sizes:** Modify the `gl.uniform1f(uPntSize_Loc, ...)` calls before each POINTS draw call.

**Change topping placement:** Adjust the radius variable (how far from center) and the `i + 0.5` offset (where within each slice).

**Use different primitive types:** Try `gl.LINE_LOOP` (connects all vertices in a loop — good for outlines), `gl.LINE_STRIP` (connected line segments), or `gl.TRIANGLES` (every 3 vertices = one separate triangle).

---

## GLOSSARY OF KEY TERMS

| Term | Plain English |
|:--|:--|
| **WebGL** | A browser API that lets JavaScript talk to the GPU to draw graphics |
| **GPU** | Graphics Processing Unit — the chip optimized for drawing millions of pixels fast |
| **Canvas** | An HTML element that provides a rectangular area for drawing |
| **Shader** | A small program that runs on the GPU (not the CPU) |
| **Vertex Shader** | Runs once per vertex; decides WHERE each point appears |
| **Fragment Shader** | Runs once per pixel; decides WHAT COLOR each pixel is |
| **GLSL** | The programming language shaders are written in |
| **Vertex** | A single point in space (x, y) or (x, y, z) |
| **Primitive** | The shape type: POINTS, LINES, TRIANGLES, TRIANGLE_FAN, TRIANGLE_STRIP |
| **Buffer** | A block of GPU memory holding vertex data |
| **Attribute** | A shader variable that changes per-vertex (e.g., position) |
| **Uniform** | A shader variable that stays the same for all vertices/pixels in one draw call |
| **vec4** | A GLSL data type holding 4 floating-point numbers |
| **Float32Array** | A JavaScript typed array where every element is a 32-bit float |
| **Polar Coordinates** | (radius, angle) — an alternative to (x, y) for describing positions |
| **Cartesian Coordinates** | (x, y) — the standard horizontal/vertical coordinate system |
| **Normalized Coordinates** | WebGL's -1.0 to +1.0 coordinate system (not pixels) |
| **drawArrays** | The WebGL command that actually draws vertices from a buffer |
| **clearColor / clear** | Set and apply a background color to the entire canvas |
