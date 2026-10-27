// =====================================================================
// CG_S26_Program3_OniDaniel.js
//
// Texture showcase: a reflective cube-mapped sphere, a mode-switching
// textured cube (image / procedural wood / webcam with effects), and a
// procedural brick platform. Phong-lit, slider-driven orbit camera.
//
// The scaffolding (globals, init, geometry, camera, render loop) follows
// the class style from shadedSphere2.js, Ex_01_HelloSlider.html, and
// the WebcamStarter examples.
// =====================================================================

"use strict";

// --------- WebGL state ---------
var canvas;
var gl;
var programEnv;     // env-mapped sphere program
var programTex;     // textured / procedural objects program

// --------- Geometry buffers / VAOs ---------
var sphereVAO, sphereCount;
var cubeVAO,   cubeCount;
var slabVAO,   slabCount;

// --------- Textures ---------
var cubeMapTex;     // samplerCube for sphere reflection
var imageTex;       // sampler2D for uploaded image
var webcamTex;      // sampler2D for webcam frames
var webcamReady = false;
var video;

// --------- Camera (orbit) ---------
var theta  = 35.0;       // horizontal orbit angle, degrees
var phi    = 20.0;       // vertical tilt angle, degrees
var radius = 7.0;        // distance from look-at point
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);
var eye;                 // computed each frame

// --------- Lighting ---------
var lightPosition  = vec4(3.0, 5.0, 4.0, 1.0);
var lightAmbient   = vec4(0.25, 0.25, 0.25, 1.0);
var lightDiffuse   = vec4(1.00, 1.00, 1.00, 1.0);
var lightSpecular  = vec4(1.00, 1.00, 1.00, 1.0);

// Material for the textured/procedural objects (modulates the texture color)
var matAmbient   = vec4(1.0, 1.0, 1.0, 1.0);
var matDiffuse   = vec4(1.0, 1.0, 1.0, 1.0);
var matSpecular  = vec4(0.4, 0.4, 0.4, 1.0);
var matShininess = 30.0;

// Material for the reflective sphere (tints the ambient base behind reflection)
var sphereAmbient   = vec4(0.10, 0.12, 0.18, 1.0);
var sphereSpecular  = vec4(1.0, 1.0, 1.0, 1.0);
var sphereShininess = 80.0;
var reflectivity    = 0.85;

// --------- UI state ---------
var cubeMode  = "webcam"; // "image", "wood", "webcam"
var webcamEffect = "none";  // "none", "gray", "edges", "sepia"

// =====================================================================
// GEOMETRY GENERATORS (student-written, class style)
// =====================================================================

// ---- Sphere from subdivided tetrahedron (adapted from shadedSphere2.js) --
// Returns { positions, normals, texCoords } arrays.
function buildSphere(subdiv) {
    var positions = [];
    var normals   = [];
    var texCoords = [];

    var va = vec4( 0.0,         0.0,      -1.0,      1.0);
    var vb = vec4( 0.0,         0.942809, 0.333333, 1.0);
    var vc = vec4(-0.816497,   -0.471405, 0.333333, 1.0);
    var vd = vec4( 0.816497,   -0.471405, 0.333333, 1.0);

    function emitTri(a, b, c) {
        positions.push(a, b, c);
        // For a unit sphere centered at origin, the position IS the normal direction
        normals.push(vec4(a[0], a[1], a[2], 0.0));
        normals.push(vec4(b[0], b[1], b[2], 0.0));
        normals.push(vec4(c[0], c[1], c[2], 0.0));
        // Spherical UVs (used only if a texture mode targeted the sphere)
        texCoords.push(sphereUV(a), sphereUV(b), sphereUV(c));
    }
    function sphereUV(p) {
        var u = 0.5 + Math.atan2(p[2], p[0]) / (2.0 * Math.PI);
        var v = 0.5 - Math.asin(p[1]) / Math.PI;
        return vec2(u, v);
    }
    function divide(a, b, c, n) {
        if (n > 0) {
            var ab = normalize(mix(a, b, 0.5), true);
            var ac = normalize(mix(a, c, 0.5), true);
            var bc = normalize(mix(b, c, 0.5), true);
            divide(a, ab, ac, n - 1);
            divide(ab, b, bc, n - 1);
            divide(bc, c, ac, n - 1);
            divide(ab, bc, ac, n - 1);
        } else {
            emitTri(a, b, c);
        }
    }
    divide(va, vb, vc, subdiv);
    divide(vd, vc, vb, subdiv);
    divide(va, vd, vb, subdiv);
    divide(va, vc, vd, subdiv);

    return { positions: positions, normals: normals, texCoords: texCoords };
}

// ---- Box geometry (used for both the textured cube and the platform slab) --
// Returns 36 vertices (6 faces, 2 triangles each) with positions, face
// normals, and per-face UVs in [0,1] x [0,1].
function buildBox(sx, sy, sz) {
    var hx = sx * 0.5, hy = sy * 0.5, hz = sz * 0.5;

    // 8 corner positions
    var p = [
        vec4(-hx, -hy,  hz, 1.0), // 0 front-bottom-left
        vec4( hx, -hy,  hz, 1.0), // 1 front-bottom-right
        vec4( hx,  hy,  hz, 1.0), // 2 front-top-right
        vec4(-hx,  hy,  hz, 1.0), // 3 front-top-left
        vec4(-hx, -hy, -hz, 1.0), // 4 back-bottom-left
        vec4( hx, -hy, -hz, 1.0), // 5 back-bottom-right
        vec4( hx,  hy, -hz, 1.0), // 6 back-top-right
        vec4(-hx,  hy, -hz, 1.0)  // 7 back-top-left
    ];

    var faces = [
        // [indices a,b,c,d, normal, uvA,uvB,uvC,uvD]
        { idx: [0,1,2,3], n: vec4(0,0, 1,0) }, // front
        { idx: [5,4,7,6], n: vec4(0,0,-1,0) }, // back
        { idx: [4,0,3,7], n: vec4(-1,0,0,0) }, // left
        { idx: [1,5,6,2], n: vec4( 1,0,0,0) }, // right
        { idx: [3,2,6,7], n: vec4(0, 1,0,0) }, // top
        { idx: [4,5,1,0], n: vec4(0,-1,0,0) }  // bottom
    ];
    var uvA = vec2(0,0), uvB = vec2(1,0), uvC = vec2(1,1), uvD = vec2(0,1);

    var positions = [], normals = [], texCoords = [];
    for (var i = 0; i < faces.length; i++) {
        var f = faces[i];
        var a = p[f.idx[0]], b = p[f.idx[1]], c = p[f.idx[2]], d = p[f.idx[3]];
        // Triangle 1: a,b,c
        positions.push(a, b, c);
        normals.push(f.n, f.n, f.n);
        texCoords.push(uvA, uvB, uvC);
        // Triangle 2: a,c,d
        positions.push(a, c, d);
        normals.push(f.n, f.n, f.n);
        texCoords.push(uvA, uvC, uvD);
    }
    return { positions: positions, normals: normals, texCoords: texCoords };
}

// ---- Wire a geometry object to a VAO bound to the given program -------
function makeVAO(prog, geom) {
    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // positions
    var pBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pBuf);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(geom.positions), gl.STATIC_DRAW);
    var pLoc = gl.getAttribLocation(prog, "aPosition");
    gl.vertexAttribPointer(pLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(pLoc);

    // normals
    var nBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuf);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(geom.normals), gl.STATIC_DRAW);
    var nLoc = gl.getAttribLocation(prog, "aNormal");
    gl.vertexAttribPointer(nLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(nLoc);

    // tex coords (only present in the textured program)
    var tcLoc = gl.getAttribLocation(prog, "aTexCoord");
    if (tcLoc !== -1) {
        var tBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, tBuf);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(geom.texCoords), gl.STATIC_DRAW);
        gl.vertexAttribPointer(tcLoc, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(tcLoc);
    }

    gl.bindVertexArray(null);
    return vao;
}

// =====================================================================
// Procedural cube map face generation.
// Six 256x256 canvases are drawn in 2D with gradients to simulate a
// simple skybox. This avoids any image-file loading so the page works
// from a file:// URL with no local server, per the assignment spec.
// =====================================================================
function generateCubeMapFaces() {
    var size = 256;
    var faces = [];

    function makeCanvas(drawFn) {
        var c = document.createElement('canvas');
        c.width = size; c.height = size;
        var ctx = c.getContext('2d');
        drawFn(ctx, size);
        return c;
    }

    // +X face: warm sunset side
    faces.push(makeCanvas(function(ctx, s) {
        var g = ctx.createLinearGradient(0, 0, 0, s);
        g.addColorStop(0, '#7ec0ff');
        g.addColorStop(0.55, '#ffb070');
        g.addColorStop(1, '#5a3a2a');
        ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    }));
    // -X face: cooler side
    faces.push(makeCanvas(function(ctx, s) {
        var g = ctx.createLinearGradient(0, 0, 0, s);
        g.addColorStop(0, '#86c8ff');
        g.addColorStop(0.55, '#a0b8c8');
        g.addColorStop(1, '#3a4858');
        ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    }));
    // +Y face: sky top
    faces.push(makeCanvas(function(ctx, s) {
        var g = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s*0.7);
        g.addColorStop(0, '#cfe8ff');
        g.addColorStop(1, '#5a96d8');
        ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
        // a couple of soft cloud blobs
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath(); ctx.arc(s*0.3, s*0.4, s*0.12, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(s*0.7, s*0.6, s*0.16, 0, Math.PI*2); ctx.fill();
    }));
    // -Y face: ground
    faces.push(makeCanvas(function(ctx, s) {
        var g = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s*0.7);
        g.addColorStop(0, '#5a4830');
        g.addColorStop(1, '#2a2018');
        ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    }));
    // +Z face: front
    faces.push(makeCanvas(function(ctx, s) {
        var g = ctx.createLinearGradient(0, 0, 0, s);
        g.addColorStop(0, '#a8d4ff');
        g.addColorStop(0.6, '#d8c8a8');
        g.addColorStop(1, '#4a3a2a');
        ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    }));
    // -Z face: back
    faces.push(makeCanvas(function(ctx, s) {
        var g = ctx.createLinearGradient(0, 0, 0, s);
        g.addColorStop(0, '#9cc8ff');
        g.addColorStop(0.55, '#b8a890');
        g.addColorStop(1, '#3a2e22');
        ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    }));

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);
    var targets = [
        gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
        gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
        gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
    ];
    for (var i = 0; i < 6; i++) {
        gl.texImage2D(targets[i], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, faces[i]);
    }
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

    return tex;
}

// =====================================================================
// Webcam setup. getUserMedia works on file:// origins, so
// no local server is required. The texture is initialized as a 1x1
// placeholder so it is bind-safe before the first frame arrives.
// =====================================================================
function setupWebcam() {
    video = document.getElementById('webcamVideo');
    var statusEl = document.getElementById('webcam-status');

    webcamTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, webcamTex);
    // 1x1 gray placeholder - prevents undefined behavior before first frame
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                  new Uint8Array([128, 128, 128, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        statusEl.textContent = "Webcam status: getUserMedia not supported by this browser.";
        return;
    }
    navigator.mediaDevices.getUserMedia({ audio: false, video: { width: 512, height: 512 } })
        .then(function(stream) {
            video.srcObject = stream;
            video.onloadedmetadata = function() {
                video.play();
                webcamReady = true;
                statusEl.textContent = "Webcam status: live.";
            };
        })
        .catch(function(err) {
            statusEl.textContent = "Webcam status: blocked or unavailable (" + err.name + "). Other modes still work.";
        });
}

// =====================================================================
// File reader for user-uploaded images. Decodes through an
// Image element and uploads as a 2D texture.
// =====================================================================
function setupFileReader() {
    imageTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, imageTex);
    // 1x1 placeholder so initial bind is valid
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                  new Uint8Array([200, 200, 200, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    document.getElementById('file-input').addEventListener('change', function(ev) {
        var file = ev.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
            var img = new Image();
            img.onload = function() {
                gl.bindTexture(gl.TEXTURE_2D, imageTex);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                cubeMode = "image";
                document.getElementById('mode-select').value = "image";
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// =====================================================================
// INIT (student-written, class style)
// =====================================================================
window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext('webgl2');
    if (!gl) { alert("WebGL 2.0 isn't available"); return; }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.05, 0.06, 0.10, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // Compile both programs from the same vertex shader source plus
    // their respective fragment shaders.
    programEnv = initShaders(gl, "vertex-shader", "fragment-shader-env");
    programTex = initShaders(gl, "vertex-shader", "fragment-shader-tex");

    // Build geometry and bind to VAOs (one VAO per program/object pair)
    var sphereGeom = buildSphere(4);
    sphereCount = sphereGeom.positions.length;
    sphereVAO   = makeVAO(programEnv, sphereGeom);

    var cubeGeom = buildBox(1.6, 1.6, 1.6);
    cubeCount = cubeGeom.positions.length;
    cubeVAO   = makeVAO(programTex, cubeGeom);

    var slabGeom = buildBox(8.0, 0.4, 6.0);
    slabCount = slabGeom.positions.length;
    slabVAO   = makeVAO(programTex, slabGeom);

    // Set up textures
    cubeMapTex = generateCubeMapFaces();
    setupFileReader();
    setupWebcam();

    // Wire UI
    setupUI();

    render();
};

// =====================================================================
// UI WIRING (student-written)
// =====================================================================
function setupUI() {
    function bindSlider(id, valId, decimals, onChange) {
        var s = document.getElementById(id);
        var v = document.getElementById(valId);
        s.oninput = function() {
            var num = parseFloat(s.value);
            v.textContent = num.toFixed(decimals);
            onChange(num);
        };
        v.textContent = parseFloat(s.value).toFixed(decimals);
    }

    bindSlider("theta-slider",  "theta-val",  0, function(x) { theta  = x; });
    bindSlider("phi-slider",    "phi-val",    0, function(x) { phi    = x; });
    bindSlider("radius-slider", "radius-val", 1, function(x) { radius = x; });
    bindSlider("lx-slider",     "lx-val",     1, function(x) { lightPosition[0] = x; });
    bindSlider("ly-slider",     "ly-val",     1, function(x) { lightPosition[1] = x; });
    bindSlider("lz-slider",     "lz-val",     1, function(x) { lightPosition[2] = x; });
    bindSlider("refl-slider",   "refl-val",   2, function(x) { reflectivity = x; });

    document.getElementById('mode-select').onchange = function(e) {
        cubeMode = e.target.value;
    };
    document.getElementById('effect-select').onchange = function(e) {
        webcamEffect = e.target.value;
    };
}

// =====================================================================
// CAMERA (student-written)
// theta = horizontal orbit (around Y axis), phi = vertical tilt.
// At theta=0, phi=0 the camera looks down -Z toward the origin.
// =====================================================================
function computeEye() {
    var t = radians(theta);
    var p = radians(phi);
    var x = radius * Math.cos(p) * Math.sin(t);
    var y = radius * Math.sin(p);
    var z = radius * Math.cos(p) * Math.cos(t);
    return vec3(x, y, z);
}

// =====================================================================
// RENDER (student-written)
// =====================================================================
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Update webcam texture if a new frame is available
    if (webcamReady && video && video.readyState >= video.HAVE_CURRENT_DATA) {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, webcamTex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    }

    eye = computeEye();
    var viewMatrix = lookAt(eye, at, up);
    var aspect = canvas.width / canvas.height;
    var projMatrix = perspective(45.0, aspect, 0.1, 100.0);

    drawSphere(viewMatrix, projMatrix);
    drawCube(viewMatrix, projMatrix);
    drawPlatform(viewMatrix, projMatrix);

    requestAnimationFrame(render);
}

// ---- Shared per-frame uniform setup --------------------------------------
function setCommonUniforms(prog, modelMatrix, viewMatrix, projMatrix) {
    var modelView = mult(viewMatrix, modelMatrix);
    var nMatrix      = normalMatrix(modelView, true);
    var worldNMatrix = normalMatrix(modelMatrix, true);

    gl.uniformMatrix4fv(gl.getUniformLocation(prog, "uModelMatrix"),
                        false, flatten(modelMatrix));
    gl.uniformMatrix4fv(gl.getUniformLocation(prog, "uViewMatrix"),
                        false, flatten(viewMatrix));
    gl.uniformMatrix4fv(gl.getUniformLocation(prog, "uProjectionMatrix"),
                        false, flatten(projMatrix));
    gl.uniformMatrix3fv(gl.getUniformLocation(prog, "uNormalMatrix"),
                        false, flatten(nMatrix));
    gl.uniformMatrix3fv(gl.getUniformLocation(prog, "uWorldNormalMatrix"),
                        false, flatten(worldNMatrix));
    gl.uniform4fv(gl.getUniformLocation(prog, "uLightPosition"),
                  flatten(lightPosition));
}

function drawSphere(viewMatrix, projMatrix) {
    gl.useProgram(programEnv);
    gl.bindVertexArray(sphereVAO);

    // Sphere is centered at origin, slightly above the platform, with radius 1.0
    var modelMatrix = mult(translate(-1.6, 1.05, 0.0), scale(1.0, 1.0, 1.0));
    setCommonUniforms(programEnv, modelMatrix, viewMatrix, projMatrix);

    var ambientProduct = mult(lightAmbient, sphereAmbient);
    var specularProduct = mult(lightSpecular, sphereSpecular);
    gl.uniform4fv(gl.getUniformLocation(programEnv, "uAmbientProduct"),
                  flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(programEnv, "uSpecularProduct"),
                  flatten(specularProduct));
    gl.uniform1f(gl.getUniformLocation(programEnv, "uShininess"), sphereShininess);
    gl.uniform1f(gl.getUniformLocation(programEnv, "uReflectivity"), reflectivity);
    gl.uniform3fv(gl.getUniformLocation(programEnv, "uEyeWorld"), flatten(eye));

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTex);
    gl.uniform1i(gl.getUniformLocation(programEnv, "uCubeMap"), 0);

    gl.drawArrays(gl.TRIANGLES, 0, sphereCount);
}

function drawCube(viewMatrix, projMatrix) {
    gl.useProgram(programTex);
    gl.bindVertexArray(cubeVAO);

    var modelMatrix = mult(translate(1.4, 1.0, 0.0),
                           rotate(20, vec3(0.0, 1.0, 0.0)));
    setCommonUniforms(programTex, modelMatrix, viewMatrix, projMatrix);

    var ambientProduct  = mult(lightAmbient,  matAmbient);
    var diffuseProduct  = mult(lightDiffuse,  matDiffuse);
    var specularProduct = mult(lightSpecular, matSpecular);
    gl.uniform4fv(gl.getUniformLocation(programTex, "uAmbientProduct"),
                  flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(programTex, "uDiffuseProduct"),
                  flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(programTex, "uSpecularProduct"),
                  flatten(specularProduct));
    gl.uniform1f(gl.getUniformLocation(programTex, "uShininess"), matShininess);

    // Resolve effective mode
    var mode = 0;
    if (cubeMode === "image") {
        mode = 0;
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, imageTex);
    } else if (cubeMode === "wood") {
        mode = 1;
    } else { // webcam
        if (webcamEffect === "none")       mode = 2;
        else if (webcamEffect === "gray")  mode = 3;
        else if (webcamEffect === "edges") mode = 4;
        else if (webcamEffect === "sepia") mode = 5;
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, webcamTex);
    }
    gl.uniform1i(gl.getUniformLocation(programTex, "uMode"), mode);
    gl.uniform1i(gl.getUniformLocation(programTex, "uImage"), 1);
    // Texel size (used by the Sobel kernel)
    var w = (cubeMode === "webcam" && video) ? (video.videoWidth  || 512) : 512;
    var h = (cubeMode === "webcam" && video) ? (video.videoHeight || 512) : 512;
    gl.uniform2f(gl.getUniformLocation(programTex, "uTexel"), 1.0 / w, 1.0 / h);

    gl.drawArrays(gl.TRIANGLES, 0, cubeCount);
}

function drawPlatform(viewMatrix, projMatrix) {
    gl.useProgram(programTex);
    gl.bindVertexArray(slabVAO);

    var modelMatrix = translate(0.0, 0.0, 0.0);
    setCommonUniforms(programTex, modelMatrix, viewMatrix, projMatrix);

    var ambientProduct  = mult(lightAmbient,  matAmbient);
    var diffuseProduct  = mult(lightDiffuse,  matDiffuse);
    var specularProduct = mult(lightSpecular, matSpecular);
    gl.uniform4fv(gl.getUniformLocation(programTex, "uAmbientProduct"),
                  flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(programTex, "uDiffuseProduct"),
                  flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(programTex, "uSpecularProduct"),
                  flatten(specularProduct));
    gl.uniform1f(gl.getUniformLocation(programTex, "uShininess"), 8.0);

    gl.uniform1i(gl.getUniformLocation(programTex, "uMode"), 6); // brick mode
    gl.uniform1i(gl.getUniformLocation(programTex, "uImage"), 1);
    gl.uniform2f(gl.getUniformLocation(programTex, "uTexel"), 1.0/512.0, 1.0/512.0);

    gl.drawArrays(gl.TRIANGLES, 0, slabCount);
}
