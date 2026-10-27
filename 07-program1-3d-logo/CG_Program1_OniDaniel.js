////////////////////////////////////////////////////////////////////////////////
// CG_Program1_OniDaniel.js
// CS 5382 Computer Graphics - Program 1: 3D Logo "DO"
// Daniel Oni
//
// Description: Creates a 3D logo with initials "DO" on a tapered pedestal
//              cylinder. Features 3D rotation, color themes, auto-rotate,
//              and a confetti toggle effect.
//
// Implementation Notes:
//   - Pedestal uses polar coordinates for base and top circles
//   - Letter "O" uses polar coordinates for inner/outer ring
//   - Letter "D" uses polar coords for curved portion + box for vertical bar
//   - All vertices defined in default clipping cube [-1, 1]
//   - Vertices loaded to GPU once; re-uploaded only on theme change (user input)
//   - Depth testing enabled for proper 3D rendering
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
// Global Variables
////////////////////////////////////////////////////////////////////////////////
var gl;
var canvas;
var program;

// Uniform locations
var uThetaXLoc, uThetaYLoc, uThetaZLoc;
var uExtraThetaYLoc;
var uTimeLoc, uConfettiAnimLoc;

// Rotation angles (controlled by sliders - for 3D view changes)
var sThetaX = -0.3;   // Initial slight tilt to show 3D
var sThetaY = 0.4;    // Initial slight turn

// Auto-rotate state (ON by default - assignment requires animated variation)
var autoRotate = true;
var autoRotateAngle = 0.0;
var autoRotateSpeed = 0.012;

// Confetti toggle
var showConfetti = false;

// Current color theme
var currentTheme = "gold";

// Vertex tracking: start index and count for each object's draw call
var pedestalStart, pedestalCount;
var letterDStart, letterDCount;
var letterOStart, letterOCount;
var confettiStart, confettiCount;

// Buffer reference (needed for theme-change re-upload)
var pointsBuffer;

////////////////////////////////////////////////////////////////////////////////
// Color Themes
////////////////////////////////////////////////////////////////////////////////
var themes = {
    gold: {
        pedestalSide:   [0.72, 0.53, 0.04],
        pedestalTop:    [0.85, 0.65, 0.13],
        pedestalBottom: [0.55, 0.41, 0.08],
        letterFront:    [1.0,  0.84, 0.0 ],
        letterSide:     [0.85, 0.65, 0.13],
        letterDark:     [0.70, 0.55, 0.0 ],
        background:     [0.12, 0.12, 0.18, 1.0]
    },
    ocean: {
        pedestalSide:   [0.0,  0.30, 0.60],
        pedestalTop:    [0.0,  0.40, 0.70],
        pedestalBottom: [0.0,  0.20, 0.50],
        letterFront:    [0.0,  0.85, 0.95],
        letterSide:     [0.0,  0.60, 0.75],
        letterDark:     [0.0,  0.45, 0.60],
        background:     [0.03, 0.03, 0.12, 1.0]
    },
    forest: {
        pedestalSide:   [0.45, 0.32, 0.18],
        pedestalTop:    [0.55, 0.40, 0.25],
        pedestalBottom: [0.35, 0.25, 0.12],
        letterFront:    [0.18, 0.72, 0.33],
        letterSide:     [0.12, 0.55, 0.24],
        letterDark:     [0.08, 0.42, 0.18],
        background:     [0.08, 0.10, 0.06, 1.0]
    },
    neon: {
        pedestalSide:   [0.30, 0.0,  0.50],
        pedestalTop:    [0.40, 0.0,  0.65],
        pedestalBottom: [0.20, 0.0,  0.35],
        letterFront:    [1.0,  0.08, 0.58],
        letterSide:     [0.80, 0.0,  0.80],
        letterDark:     [0.55, 0.0,  0.50],
        background:     [0.04, 0.0,  0.08, 1.0]
    }
};

////////////////////////////////////////////////////////////////////////////////
// initShaders - Compile and link shaders (same pattern as class examples)
////////////////////////////////////////////////////////////////////////////////
function initShaders( gl, vertexShaderId, fragmentShaderId )
{
    var vertShdr;
    var fragShdr;

    var vertElem = document.getElementById( vertexShaderId );
    if ( !vertElem ) {
        alert( "Unable to load vertex shader " + vertexShaderId );
        return -1;
    }
    else {
        vertShdr = gl.createShader( gl.VERTEX_SHADER );
        gl.shaderSource( vertShdr, vertElem.textContent.replace(/^\s+|\s+$/g, '' ));
        gl.compileShader( vertShdr );
        if ( !gl.getShaderParameter(vertShdr, gl.COMPILE_STATUS) ) {
            var msg = "Vertex shader failed to compile.  The error log is:"
                + "<pre>" + gl.getShaderInfoLog( vertShdr ) + "</pre>";
            alert( msg );
            return -1;
        }
    }

    var fragElem = document.getElementById( fragmentShaderId );
    if ( !fragElem ) {
        alert( "Unable to load fragment shader " + fragmentShaderId );
        return -1;
    }
    else {
        fragShdr = gl.createShader( gl.FRAGMENT_SHADER );
        gl.shaderSource( fragShdr, fragElem.textContent.replace(/^\s+|\s+$/g, '' ) );
        gl.compileShader( fragShdr );
        if ( !gl.getShaderParameter(fragShdr, gl.COMPILE_STATUS) ) {
            var msg = "Fragment shader failed to compile.  The error log is:"
                + "<pre>" + gl.getShaderInfoLog( fragShdr ) + "</pre>";
            alert( msg );
            return -1;
        }
    }

    var program = gl.createProgram();
    gl.attachShader( program, vertShdr );
    gl.attachShader( program, fragShdr );
    gl.linkProgram( program );

    if ( !gl.getProgramParameter(program, gl.LINK_STATUS) ) {
        var msg = "Shader program failed to link.  The error log is:"
            + "<pre>" + gl.getProgramInfoLog( program ) + "</pre>";
        alert( msg );
        return -1;
    }

    return program;
}


////////////////////////////////////////////////////////////////////////////////
// Vertex Generation Helpers
////////////////////////////////////////////////////////////////////////////////

// Add a single triangle (3 vertices) to the vertex array
// Each vertex: x, y, z, w, r, g, b  (7 floats)
function addTriangle(arr, p1, p2, p3, color) {
    arr.push(p1[0], p1[1], p1[2], 1.0,  color[0], color[1], color[2]);
    arr.push(p2[0], p2[1], p2[2], 1.0,  color[0], color[1], color[2]);
    arr.push(p3[0], p3[1], p3[2], 1.0,  color[0], color[1], color[2]);
}

// Add a quad (2 triangles, 6 vertices) to the vertex array
// Vertices must be in order: p1-p2-p3-p4 forming a quad face
function addQuad(arr, p1, p2, p3, p4, color) {
    addTriangle(arr, p1, p2, p3, color);
    addTriangle(arr, p1, p3, p4, color);
}


////////////////////////////////////////////////////////////////////////////////
// Generate Pedestal (Frustum Cylinder using Polar Coordinates)
//
// The pedestal is a cylinder with different radii at top and bottom.
// Base is parallel to the XZ-plane (y = yBottom).
// Points along circumference computed with polar coordinates:
//     x = radius * cos(theta)
//     z = radius * sin(theta)
// Surfaces: side (TRIANGLE pairs), bottom cap, top cap - all closed.
////////////////////////////////////////////////////////////////////////////////
function generatePedestal(theme) {
    var verts = [];

    var bottomR     = 0.48;     // Larger radius at base
    var topR        = 0.35;     // Smaller radius at top (accommodates centered letters)
    var yBottom     = -0.65;    // Base of pedestal (parallel to XZ-plane)
    var yTop        = -0.15;    // Top of pedestal
    var numSegments = 36;       // 36 vertices along circumference for smooth look
    var angleStep   = 2.0 * Math.PI / numSegments;

    var sideColor   = theme.pedestalSide;
    var topColor    = theme.pedestalTop;
    var bottomColor = theme.pedestalBottom;

    for (var i = 0; i < numSegments; i++) {
        var angle1 = i * angleStep;
        var angle2 = (i + 1) * angleStep;

        // Bottom circle points using polar coordinates
        var bx1 = bottomR * Math.cos(angle1);
        var bz1 = bottomR * Math.sin(angle1);
        var bx2 = bottomR * Math.cos(angle2);
        var bz2 = bottomR * Math.sin(angle2);

        // Top circle points using polar coordinates (smaller radius)
        var tx1 = topR * Math.cos(angle1);
        var tz1 = topR * Math.sin(angle1);
        var tx2 = topR * Math.cos(angle2);
        var tz2 = topR * Math.sin(angle2);

        // Color shading variation based on angle for visual depth
        var shade = 0.82 + 0.18 * Math.cos(angle1);
        var sColor = [sideColor[0]*shade, sideColor[1]*shade, sideColor[2]*shade];

        // ---- Side face: two triangles per segment ----
        addTriangle(verts,
            [bx1, yBottom, bz1], [bx2, yBottom, bz2], [tx2, yTop, tz2],
            sColor);
        addTriangle(verts,
            [bx1, yBottom, bz1], [tx2, yTop, tz2], [tx1, yTop, tz1],
            sColor);

        // ---- Bottom cap (triangle fan as individual triangles) ----
        addTriangle(verts,
            [0, yBottom, 0], [bx2, yBottom, bz2], [bx1, yBottom, bz1],
            bottomColor);

        // ---- Top cap ----
        addTriangle(verts,
            [0, yTop, 0], [tx1, yTop, tz1], [tx2, yTop, tz2],
            topColor);
    }

    return verts;
}


////////////////////////////////////////////////////////////////////////////////
// Generate 3D Box (6 faces, 12 triangles, 36 vertices)
// Used for the vertical bar of letter "D"
// Parameters: two opposite corners (x1,y1,z1) and (x2,y2,z2)
////////////////////////////////////////////////////////////////////////////////
function generateBox(x1, y1, z1, x2, y2, z2, frontColor, sideColor, topColor) {
    var verts = [];

    // Front face (z = z2)
    addQuad(verts,
        [x1, y1, z2], [x2, y1, z2], [x2, y2, z2], [x1, y2, z2],
        frontColor);

    // Back face (z = z1) - reversed winding for outward-facing normal
    addQuad(verts,
        [x2, y1, z1], [x1, y1, z1], [x1, y2, z1], [x2, y2, z1],
        frontColor);

    // Right face (x = x2)
    addQuad(verts,
        [x2, y1, z2], [x2, y1, z1], [x2, y2, z1], [x2, y2, z2],
        sideColor);

    // Left face (x = x1)
    addQuad(verts,
        [x1, y1, z1], [x1, y1, z2], [x1, y2, z2], [x1, y2, z1],
        sideColor);

    // Top face (y = y2)
    addQuad(verts,
        [x1, y2, z2], [x2, y2, z2], [x2, y2, z1], [x1, y2, z1],
        topColor);

    // Bottom face (y = y1)
    addQuad(verts,
        [x1, y1, z1], [x2, y1, z1], [x2, y1, z2], [x1, y1, z2],
        sideColor);

    return verts;
}


////////////////////////////////////////////////////////////////////////////////
// Generate Ring (full or partial) - Extruded in Z
//
// Used for letter "O" (full ring) and curved part of letter "D" (half ring).
// The ring outline uses polar coordinates:
//     x = cx + radius * cos(theta)
//     y = cy + radius * sin(theta)
// Extruded along Z-axis for depth.
// Surfaces: front face, back face, outer side, inner side (all closed).
// For partial rings, start/end edge caps are added for solid closure.
////////////////////////////////////////////////////////////////////////////////
function generateRing(cx, cy, outerR, innerR, depth,
                      startAngle, endAngle, segments,
                      frontColor, sideColor, darkColor) {
    var verts = [];
    var zFront = depth / 2;
    var zBack  = -depth / 2;
    var totalAngle = endAngle - startAngle;
    var angleStep  = totalAngle / segments;

    for (var i = 0; i < segments; i++) {
        var a1 = startAngle + i * angleStep;
        var a2 = startAngle + (i + 1) * angleStep;

        // Outer circle points (polar coordinates)
        var ox1 = cx + outerR * Math.cos(a1);
        var oy1 = cy + outerR * Math.sin(a1);
        var ox2 = cx + outerR * Math.cos(a2);
        var oy2 = cy + outerR * Math.sin(a2);

        // Inner circle points (polar coordinates)
        var ix1 = cx + innerR * Math.cos(a1);
        var iy1 = cy + innerR * Math.sin(a1);
        var ix2 = cx + innerR * Math.cos(a2);
        var iy2 = cy + innerR * Math.sin(a2);

        // ---- Front face (ring segment) ----
        addQuad(verts,
            [ox1, oy1, zFront], [ox2, oy2, zFront],
            [ix2, iy2, zFront], [ix1, iy1, zFront],
            frontColor);

        // ---- Back face (reversed winding) ----
        addQuad(verts,
            [ox2, oy2, zBack], [ox1, oy1, zBack],
            [ix1, iy1, zBack], [ix2, iy2, zBack],
            frontColor);

        // ---- Outer side face ----
        addQuad(verts,
            [ox1, oy1, zFront], [ox1, oy1, zBack],
            [ox2, oy2, zBack],  [ox2, oy2, zFront],
            sideColor);

        // ---- Inner side face (reversed for inward-facing normal) ----
        addQuad(verts,
            [ix2, iy2, zFront], [ix2, iy2, zBack],
            [ix1, iy1, zBack],  [ix1, iy1, zFront],
            darkColor);
    }

    // If this is a partial ring, cap the start and end edges for solid closure
    var isPartial = Math.abs(totalAngle - 2.0 * Math.PI) > 0.01;
    if (isPartial) {
        // Start edge cap
        var sa = startAngle;
        addQuad(verts,
            [cx + innerR * Math.cos(sa), cy + innerR * Math.sin(sa), zFront],
            [cx + outerR * Math.cos(sa), cy + outerR * Math.sin(sa), zFront],
            [cx + outerR * Math.cos(sa), cy + outerR * Math.sin(sa), zBack],
            [cx + innerR * Math.cos(sa), cy + innerR * Math.sin(sa), zBack],
            sideColor);

        // End edge cap
        var ea = endAngle;
        addQuad(verts,
            [cx + outerR * Math.cos(ea), cy + outerR * Math.sin(ea), zFront],
            [cx + innerR * Math.cos(ea), cy + innerR * Math.sin(ea), zFront],
            [cx + innerR * Math.cos(ea), cy + innerR * Math.sin(ea), zBack],
            [cx + outerR * Math.cos(ea), cy + outerR * Math.sin(ea), zBack],
            sideColor);
    }

    return verts;
}


////////////////////////////////////////////////////////////////////////////////
// Generate Letter "D"
//
// Composed of:
//   1. A vertical rectangular bar (3D box) on the left
//   2. A half-ring (semicircle from -PI/2 to PI/2) on the right,
//      using polar coordinates for the curved portion
// Both are extruded along Z for 3D depth.
////////////////////////////////////////////////////////////////////////////////
function generateLetterD(theme) {
    var verts = [];

    var frontColor = theme.letterFront;
    var sideColor  = theme.letterSide;
    var darkColor  = theme.letterDark;

    // Letter dimensions - designed to sit on pedestal top and stay within clipping cube
    var yBottom = -0.15;   // Sits on top of pedestal
    var yTop    =  0.40;   // Top of letter
    var depth   =  0.10;   // Extrusion depth in Z
    var zFront  =  depth / 2;
    var zBack   = -depth / 2;

    // Letters are shifted so that the combined "DO" bounding box is centered
    // at x=0. This ensures auto-rotate spins letters in place on the pedestal
    // rather than orbiting around the Y-axis off-center.
    var barLeft  = -0.4375;  // Left edge of vertical bar (shifted to center DO)
    var barRight = -0.3675;  // Right edge of vertical bar (where curve starts)

    // Center of the curved portion (vertically centered on the letter)
    var curveCX = barRight;
    var curveCY = (yBottom + yTop) / 2.0;   // = 0.125

    // Curve outer radius = half the bar height so the curve meets the bar
    // flush at the very top and bottom (no stubs sticking out)
    var curveOuterR = (yTop - yBottom) / 2.0;   // = 0.275
    var curveInnerR = curveOuterR - 0.08;        // Inner hole of the curve

    // 1. Vertical bar (3D box)
    var barVerts = generateBox(
        barLeft, yBottom, zBack,
        barRight, yTop, zFront,
        frontColor, sideColor, darkColor
    );
    verts = verts.concat(barVerts);

    // 2. Half-ring for the curved right side of "D"
    //    Polar coordinates: angle from -PI/2 (bottom) to PI/2 (top)
    var curveVerts = generateRing(
        curveCX, curveCY,
        curveOuterR, curveInnerR,
        depth,
        -Math.PI / 2, Math.PI / 2,
        24,            // 24 segments for smooth curve
        frontColor, sideColor, darkColor
    );
    verts = verts.concat(curveVerts);

    return verts;
}


////////////////////////////////////////////////////////////////////////////////
// Generate Letter "O"
//
// A full ring (torus cross-section) using polar coordinates.
// Outer and inner circles define the ring shape.
// Extruded along Z for 3D depth.
////////////////////////////////////////////////////////////////////////////////
function generateLetterO(theme) {
    var frontColor = theme.letterFront;
    var sideColor  = theme.letterSide;
    var darkColor  = theme.letterDark;

    // Position: to the right of "D", vertically centered same as "D"
    var yBottom = -0.15;
    var yTop    =  0.40;
    var cx      =  0.1825;                       // Horizontal center of "O" (shifted to center DO)
    var cy      = (yBottom + yTop) / 2.0;       // = 0.125
    var depth   =  0.10;

    // O ring sized to match D height for balanced appearance
    var outerR  = (yTop - yBottom) / 2.0 - 0.02;  // Slightly smaller than D height
    var innerR  = outerR - 0.08;                    // Same thickness as D curve

    // Full ring using polar coordinates (0 to 2*PI)
    var verts = generateRing(
        cx, cy,
        outerR, innerR,
        depth,
        0, 2.0 * Math.PI,
        24,            // 24 segments for smooth circle
        frontColor, sideColor, darkColor
    );

    return verts;
}


////////////////////////////////////////////////////////////////////////////////
// Generate Confetti
//
// Small colored triangles scattered around the scene for a festive effect.
// Positions are procedurally generated using a seed-based pattern.
////////////////////////////////////////////////////////////////////////////////
function generateConfetti() {
    var verts = [];
    var numPieces = 40;
    var size = 0.025;   // Small triangle size

    // Bright confetti colors
    var colors = [
        [1.0, 0.2, 0.3],   // Red
        [0.2, 0.8, 1.0],   // Cyan
        [1.0, 0.9, 0.1],   // Yellow
        [0.4, 1.0, 0.4],   // Green
        [1.0, 0.5, 0.0],   // Orange
        [0.8, 0.3, 1.0],   // Purple
        [1.0, 0.4, 0.7],   // Pink
        [0.3, 0.6, 1.0]    // Blue
    ];

    // Use a simple pseudorandom seed for repeatable positions
    var seed = 12345;
    function nextRand() {
        seed = (seed * 16807 + 0) % 2147483647;
        return (seed / 2147483647);
    }

    for (var i = 0; i < numPieces; i++) {
        // Random position within the scene
        var px = (nextRand() - 0.5) * 1.4;
        var py = (nextRand() - 0.3) * 1.2;
        var pz = (nextRand() - 0.5) * 0.8;

        // Random rotation angle for variety
        var angle = nextRand() * Math.PI * 2.0;

        // Pick a color
        var color = colors[i % colors.length];

        // Create a small triangle at this position (rotated randomly)
        var x1 = px + size * Math.cos(angle);
        var y1 = py + size * Math.sin(angle);
        var x2 = px + size * Math.cos(angle + 2.094);   // 120 degrees
        var y2 = py + size * Math.sin(angle + 2.094);
        var x3 = px + size * Math.cos(angle + 4.189);   // 240 degrees
        var y3 = py + size * Math.sin(angle + 4.189);

        addTriangle(verts,
            [x1, y1, pz], [x2, y2, pz], [x3, y3, pz],
            color);
    }

    return verts;
}


////////////////////////////////////////////////////////////////////////////////
// Build All Vertices and Upload to GPU
//
// Assembles all geometry, tracks draw-call ranges, and sends data to GPU.
// Called once on init and again when color theme changes.
////////////////////////////////////////////////////////////////////////////////
function buildAndUploadVertices() {
    var theme = themes[currentTheme];
    var allVerts = [];

    // ---- Pedestal ----
    var pedVerts = generatePedestal(theme);
    pedestalStart = 0;
    pedestalCount = pedVerts.length / 7;   // 7 floats per vertex
    allVerts = allVerts.concat(pedVerts);

    // ---- Letter "D" ----
    var dVerts = generateLetterD(theme);
    letterDStart = allVerts.length / 7;
    letterDCount = dVerts.length / 7;
    allVerts = allVerts.concat(dVerts);

    // ---- Letter "O" ----
    var oVerts = generateLetterO(theme);
    letterOStart = allVerts.length / 7;
    letterOCount = oVerts.length / 7;
    allVerts = allVerts.concat(oVerts);

    // ---- Confetti ----
    var confVerts = generateConfetti();
    confettiStart = allVerts.length / 7;
    confettiCount = confVerts.length / 7;
    allVerts = allVerts.concat(confVerts);

    // Upload to GPU buffer
    var points = new Float32Array(allVerts);
    gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);

    // Update background color to match theme
    gl.clearColor(theme.background[0], theme.background[1],
                  theme.background[2], theme.background[3]);
}


////////////////////////////////////////////////////////////////////////////////
// Initialization - window.onload
////////////////////////////////////////////////////////////////////////////////
window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    //
    // Grab the WebGL 2.0 context
    //
    gl = canvas.getContext('webgl2');
    if (!gl) { alert( "WebGL 2.0 isn't available" ); }

    ////////////////////////////////////////////////////////////////////////////////
    // Setup Event Handlers
    ////////////////////////////////////////////////////////////////////////////////

    // Slider: Rotate about X-axis (tilt the view up/down)
    document.getElementById("RotateX").oninput = function(event) {
        sThetaX = -(Math.PI / 180.0) * event.target.value;
    };

    // Slider: Rotate about Y-axis (turn the view left/right)
    document.getElementById("RotateY").oninput = function(event) {
        sThetaY = (Math.PI / 180.0) * event.target.value;
    };

    // Button: Toggle auto-rotation of letters on pedestal
    document.getElementById("btnAutoRotate").onclick = function() {
        autoRotate = !autoRotate;
        this.textContent = autoRotate ? "Stop Rotation" : "Auto-Rotate Letters";
        this.classList.toggle("active", autoRotate);
    };

    // Button: Toggle confetti effect
    document.getElementById("btnConfetti").onclick = function() {
        showConfetti = !showConfetti;
        this.textContent = showConfetti ? "Hide Confetti" : "Show Confetti";
        this.classList.toggle("active", showConfetti);
    };

    // Dropdown: Change color theme
    document.getElementById("themeSelect").onchange = function(event) {
        currentTheme = event.target.value;
        buildAndUploadVertices();   // Re-upload vertices with new colors
    };

    ////////////////////////////////////////////////////////////////////////////////
    // Load shaders and initialize attribute buffers
    ////////////////////////////////////////////////////////////////////////////////
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );


    ////////////////////////////////////////////////////////////////////////////////
    // Create GPU buffer and generate all vertex data
    ////////////////////////////////////////////////////////////////////////////////
    pointsBuffer = gl.createBuffer();
    buildAndUploadVertices();


    ////////////////////////////////////////////////////////////////////////////////
    // Associate shader attribute variables with our data buffer
    //
    // Vertex format: [x, y, z, w, r, g, b] = 7 floats per vertex
    // Stride = 7 * 4 bytes = 28 bytes
    ////////////////////////////////////////////////////////////////////////////////

    // aPosition: 4 components (x, y, z, w), starts at offset 0
    var aPosition = gl.getAttribLocation( program, "aPosition" );
    gl.vertexAttribPointer( aPosition, 4, gl.FLOAT, false,
        7 * Float32Array.BYTES_PER_ELEMENT, 0 );
    gl.enableVertexAttribArray( aPosition );

    // aColor: 3 components (r, g, b), starts at offset 4 floats = 16 bytes
    var aColor = gl.getAttribLocation( program, "aColor" );
    gl.vertexAttribPointer( aColor, 3, gl.FLOAT, false,
        7 * Float32Array.BYTES_PER_ELEMENT, 4 * Float32Array.BYTES_PER_ELEMENT );
    gl.enableVertexAttribArray( aColor );


    ////////////////////////////////////////////////////////////////////////////////
    // Get Locations of uniform variables
    ////////////////////////////////////////////////////////////////////////////////
    uThetaXLoc      = gl.getUniformLocation(program, "uThetaX");
    uThetaYLoc      = gl.getUniformLocation(program, "uThetaY");
    uThetaZLoc      = gl.getUniformLocation(program, "uThetaZ");
    uExtraThetaYLoc = gl.getUniformLocation(program, "uExtraThetaY");
    uTimeLoc        = gl.getUniformLocation(program, "uTime");
    uConfettiAnimLoc = gl.getUniformLocation(program, "uConfettiAnim");


    ////////////////////////////////////////////////////////////////////////////////
    // Configure WebGL settings
    ////////////////////////////////////////////////////////////////////////////////

    // Map canvas dimensions to framebuffer
    gl.viewport( 0, 0, canvas.width, canvas.height );

    // Enable depth testing for proper 3D rendering
    // (objects in front correctly occlude objects behind)
    gl.enable(gl.DEPTH_TEST);

    // Start the render loop
    render();
};


////////////////////////////////////////////////////////////////////////////////
// Render Loop
//
// Draws all objects with appropriate transformations.
// The vertex shader applies rotation matrices based on uniform values.
// Different uniform values are set per draw call:
//   - Pedestal: scene rotation only (uExtraThetaY = 0)
//   - Letters:  scene rotation + auto-rotate (uExtraThetaY = angle)
//   - Confetti: same as letters (rotates with letters)
////////////////////////////////////////////////////////////////////////////////
function render()
{
    // Clear both color and depth buffers
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    // Update auto-rotation angle if enabled
    if (autoRotate) {
        autoRotateAngle += autoRotateSpeed;
    }

    // ---- Draw Pedestal ----
    // Scene rotation only, no extra letter rotation, no confetti animation
    gl.uniform1f(uThetaXLoc, sThetaX);
    gl.uniform1f(uThetaYLoc, sThetaY);
    gl.uniform1f(uThetaZLoc, 0.0);
    gl.uniform1f(uExtraThetaYLoc, 0.0);         // Pedestal stays still
    gl.uniform1f(uConfettiAnimLoc, 0.0);         // Not confetti
    gl.uniform1f(uTimeLoc, 0.0);
    gl.drawArrays( gl.TRIANGLES, pedestalStart, pedestalCount );

    // ---- Draw Letter "D" ----
    // Scene rotation + auto-rotate for letters
    gl.uniform1f(uExtraThetaYLoc, autoRotateAngle);  // Letters rotate on pedestal
    gl.drawArrays( gl.TRIANGLES, letterDStart, letterDCount );

    // ---- Draw Letter "O" ----
    gl.drawArrays( gl.TRIANGLES, letterOStart, letterOCount );

    // ---- Draw Confetti (if toggled on) ----
    // Reset extra rotation so confetti stays fixed in the scene
    if (showConfetti) {
        var t = Date.now() * 0.001;               // Time in seconds
        gl.uniform1f(uExtraThetaYLoc, 0.0);       // Confetti doesn't spin with letters
        gl.uniform1f(uConfettiAnimLoc, 1.0);       // Enable falling animation
        gl.uniform1f(uTimeLoc, t);                  // Pass current time
        gl.drawArrays( gl.TRIANGLES, confettiStart, confettiCount );
    }

    // Request next frame
    requestAnimationFrame(render);
}
