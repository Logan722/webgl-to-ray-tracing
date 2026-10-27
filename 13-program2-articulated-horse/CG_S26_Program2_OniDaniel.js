"use strict";

// ============================================================
//  CLASS-STYLE GLOBALS  (following course code conventions)
// ============================================================

var canvas;
var gl;
var program;

// Uniform locations
var modelMatrixLoc;
var viewMatrixLoc;
var projectionMatrixLoc;
var nMatrixLoc;
var lightPositionLoc;
var ambientProductLoc, diffuseProductLoc, specularProductLoc, shininessLoc;

// Camera parameters
var camRadius = 12.0;
var camTheta  = 55.0;     // elevation (degrees from top)
var camPhi    = 45.0;     // azimuth   (degrees)

// Light position (world space, point light)
var lightPos = vec4(5.0, 10.0, 5.0, 1.0);

// Horse materials
var horseAmbient   = vec4(0.40, 0.25, 0.10, 1.0);
var horseDiffuse   = vec4(0.70, 0.45, 0.20, 1.0);
var horseSpecular  = vec4(0.25, 0.25, 0.25, 1.0);
var horseShininess = 15.0;

// Terrain materials
var terrainAmbient   = vec4(0.08, 0.28, 0.05, 1.0);
var terrainDiffuse   = vec4(0.18, 0.55, 0.15, 1.0);
var terrainSpecular  = vec4(0.05, 0.05, 0.05, 1.0);
var terrainShininess = 5.0;

// Light color
var lightAmbient  = vec4(0.30, 0.30, 0.30, 1.0);
var lightDiffuse  = vec4(1.00, 0.95, 0.80, 1.0);
var lightSpecular = vec4(1.00, 1.00, 1.00, 1.0);

// Horse world position / heading
var horseX       = 0.0;
var horseZ       = 0.0;
var horseHeading = 0.0;   // degrees about Y

// Joint angles (degrees)
var neckAngle  = -30.0;
var headAngle  =   5.0;
var tailAngle  = 145.0;
var flLegAngle =   0.0;   // front-left
var frLegAngle =   0.0;   // front-right
var blLegAngle =   0.0;   // back-left
var brLegAngle =   0.0;   // back-right

// Animation
var isAnimating = false;
var animTime    = 0.0;

// Geometry counts
var numCubeVerts    = 0;
var numTerrainVerts = 0;
var numLightCubeVerts = 0;

// VAOs
var cubeVAO;
var terrainVAO;
var lightCubeVAO;


// ============================================================
//  HELPER UTILITIES
//  Modern JavaScript — const / let / arrow functions
// ============================================================

/**
 * Chain-multiply an arbitrary number of mat4 matrices (left to right).
 * Wraps the course library's mult() for cleaner transform hierarchies.
 */
const chainMult = (...matrices) => {
    let result = matrices[0];
    for (let i = 1; i < matrices.length; i++) {
        result = mult(result, matrices[i]);
    }
    return result;
};

/**
 * Heightfield function — defines terrain elevation on the XZ-plane.
 * Returns Y for a given (x, z).
 */
const heightAt = (x, z) => {
    return 0.40 * Math.sin(0.50 * x) * Math.cos(0.50 * z)
         + 0.20 * Math.cos(0.70 * x + 0.40 * z)
         + 0.15 * Math.sin(0.35 * x - 0.55 * z);
};

/**
 * Compute an approximate surface normal at (x, z) via central differences.
 */
const terrainNormalAt = (x, z) => {
    const eps = 0.05;
    const hL = heightAt(x - eps, z);
    const hR = heightAt(x + eps, z);
    const hD = heightAt(x, z - eps);
    const hU = heightAt(x, z + eps);
    let nx = (hL - hR) / (2.0 * eps);
    let nz = (hD - hU) / (2.0 * eps);
    let ny = 1.0;
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    return vec4(nx / len, ny / len, nz / len, 0.0);
};

/**
 * Generate a unit cube (36 vertices) with per-face normals.
 * Returns { positions: vec4[], normals: vec4[] }
 */
const generateUnitCube = () => {
    const positions = [];
    const normals   = [];

    const v = [
        vec4(-0.5, -0.5,  0.5, 1.0),   // 0  front-bottom-left
        vec4(-0.5,  0.5,  0.5, 1.0),   // 1  front-top-left
        vec4( 0.5,  0.5,  0.5, 1.0),   // 2  front-top-right
        vec4( 0.5, -0.5,  0.5, 1.0),   // 3  front-bottom-right
        vec4(-0.5, -0.5, -0.5, 1.0),   // 4  back-bottom-left
        vec4(-0.5,  0.5, -0.5, 1.0),   // 5  back-top-left
        vec4( 0.5,  0.5, -0.5, 1.0),   // 6  back-top-right
        vec4( 0.5, -0.5, -0.5, 1.0),   // 7  back-bottom-right
    ];

    const addFace = (a, b, c, d, n) => {
        positions.push(v[a], v[b], v[c]);   // tri 1
        normals.push(n, n, n);
        positions.push(v[a], v[c], v[d]);   // tri 2
        normals.push(n, n, n);
    };

    addFace(1, 0, 3, 2, vec4( 0,  0,  1, 0));  // +Z  front
    addFace(2, 3, 7, 6, vec4( 1,  0,  0, 0));  // +X  right
    addFace(6, 5, 1, 2, vec4( 0,  1,  0, 0));  // +Y  top
    addFace(3, 0, 4, 7, vec4( 0, -1,  0, 0));  // -Y  bottom
    addFace(5, 4, 0, 1, vec4(-1,  0,  0, 0));  // -X  left
    addFace(4, 5, 6, 7, vec4( 0,  0, -1, 0));  // -Z  back

    return { positions, normals };
};

/**
 * Generate the terrain mesh as triangles on the XZ-plane.
 * Returns { positions: vec4[], normals: vec4[] }
 */
const generateTerrain = (gridSize = 40, extent = 8.0) => {
    const positions = [];
    const normals   = [];
    const step = (2.0 * extent) / gridSize;

    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const x0 = -extent + i * step;
            const z0 = -extent + j * step;
            const x1 = x0 + step;
            const z1 = z0 + step;

            const p00 = vec4(x0, heightAt(x0, z0), z0, 1.0);
            const p10 = vec4(x1, heightAt(x1, z0), z0, 1.0);
            const p01 = vec4(x0, heightAt(x0, z1), z1, 1.0);
            const p11 = vec4(x1, heightAt(x1, z1), z1, 1.0);

            const n00 = terrainNormalAt(x0, z0);
            const n10 = terrainNormalAt(x1, z0);
            const n01 = terrainNormalAt(x0, z1);
            const n11 = terrainNormalAt(x1, z1);

            // Triangle 1:  p00 — p10 — p01
            positions.push(p00, p10, p01);
            normals.push(n00, n10, n01);

            // Triangle 2:  p10 — p11 — p01
            positions.push(p10, p11, p01);
            normals.push(n10, n11, n01);
        }
    }
    return { positions, normals };
};

/**
 * Upload material (light × material products) to shader uniforms.
 */
const setMaterial = (matAmb, matDiff, matSpec, matShine) => {
    const ap = mult(lightAmbient,  matAmb);
    const dp = mult(lightDiffuse,  matDiff);
    const sp = mult(lightSpecular, matSpec);
    gl.uniform4fv(ambientProductLoc,  flatten(ap));
    gl.uniform4fv(diffuseProductLoc,  flatten(dp));
    gl.uniform4fv(specularProductLoc, flatten(sp));
    gl.uniform1f(shininessLoc, matShine);
};

/**
 * Draw one instance of the cube VAO with the supplied model matrix.
 * Computes and uploads the normal matrix automatically.
 */
const drawPart = (viewMat, modelMat) => {
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMat));
    const nMat = normalMatrix(mult(viewMat, modelMat), true);
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(nMat));
    gl.drawArrays(gl.TRIANGLES, 0, numCubeVerts);
};

/**
 * Walk-cycle animation update (called each frame while animating).
 */
const updateAnimation = () => {
    animTime += 0.04;

    const legSwing = 25.0;   // degrees
    flLegAngle =  legSwing * Math.sin(animTime);
    brLegAngle =  legSwing * Math.sin(animTime);            // diagonal pair
    frLegAngle =  legSwing * Math.sin(animTime + Math.PI);
    blLegAngle =  legSwing * Math.sin(animTime + Math.PI);  // other pair

    // Subtle head / neck bob
    neckAngle = -30.0 + 3.0 * Math.sin(2.0 * animTime);
    headAngle =   5.0 + 2.0 * Math.cos(2.0 * animTime);
    tailAngle = 145.0 + 5.0 * Math.sin(3.0 * animTime);

    // Move horse forward along its heading
    const speed = 0.03;
    horseX += speed * Math.cos(radians(horseHeading));
    horseZ -= speed * Math.sin(radians(horseHeading));

    // Clamp to terrain bounds
    const bound = 6.5;
    horseX = Math.max(-bound, Math.min(bound, horseX));
    horseZ = Math.max(-bound, Math.min(bound, horseZ));
};


// ============================================================
//  CLASS-STYLE INITIALIZATION  (window.onload, initShaders, etc.)
// ============================================================

window.onload = function init()
{
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.55, 0.75, 0.95, 1.0);   // sky blue
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // ---- Generate geometry (helpers) ----
    var cubeData    = generateUnitCube();
    var terrainData = generateTerrain(40, 8.0);

    numCubeVerts    = cubeData.positions.length;
    numTerrainVerts = terrainData.positions.length;

    // ---- Cube VAO ----
    cubeVAO = gl.createVertexArray();
    gl.bindVertexArray(cubeVAO);

    var cPosBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cPosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(cubeData.positions), gl.STATIC_DRAW);
    var posLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(posLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(posLoc);

    var cNrmBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cNrmBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(cubeData.normals), gl.STATIC_DRAW);
    var nrmLoc = gl.getAttribLocation(program, "aNormal");
    gl.vertexAttribPointer(nrmLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(nrmLoc);

    // ---- Terrain VAO ----
    terrainVAO = gl.createVertexArray();
    gl.bindVertexArray(terrainVAO);

    var tPosBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tPosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(terrainData.positions), gl.STATIC_DRAW);
    gl.vertexAttribPointer(posLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(posLoc);

    var tNrmBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tNrmBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(terrainData.normals), gl.STATIC_DRAW);
    gl.vertexAttribPointer(nrmLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(nrmLoc);

    // ---- Small cube for light marker ----
    lightCubeVAO = gl.createVertexArray();
    gl.bindVertexArray(lightCubeVAO);

    // Reuse same cube data — just different VAO binding
    var lcPosBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, lcPosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(cubeData.positions), gl.STATIC_DRAW);
    gl.vertexAttribPointer(posLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(posLoc);

    var lcNrmBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, lcNrmBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(cubeData.normals), gl.STATIC_DRAW);
    gl.vertexAttribPointer(nrmLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(nrmLoc);

    numLightCubeVerts = cubeData.positions.length;

    // Unbind VAO
    gl.bindVertexArray(null);

    // ---- Uniform locations ----
    modelMatrixLoc      = gl.getUniformLocation(program, "uModelMatrix");
    viewMatrixLoc       = gl.getUniformLocation(program, "uViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");
    nMatrixLoc          = gl.getUniformLocation(program, "uNormalMatrix");
    lightPositionLoc    = gl.getUniformLocation(program, "uLightPosition");
    ambientProductLoc   = gl.getUniformLocation(program, "uAmbientProduct");
    diffuseProductLoc   = gl.getUniformLocation(program, "uDiffuseProduct");
    specularProductLoc  = gl.getUniformLocation(program, "uSpecularProduct");
    shininessLoc        = gl.getUniformLocation(program, "uShininess");


    // ---- Event handlers (class style) ----

    // Camera
    document.getElementById("camRadius").oninput = function(e){ camRadius = parseFloat(e.target.value); };
    document.getElementById("camTheta").oninput  = function(e){ camTheta  = parseFloat(e.target.value); };
    document.getElementById("camPhi").oninput    = function(e){ camPhi    = parseFloat(e.target.value); };

    // Horse position
    document.getElementById("horseX").oninput       = function(e){ horseX       = parseFloat(e.target.value); };
    document.getElementById("horseZ").oninput        = function(e){ horseZ       = parseFloat(e.target.value); };
    document.getElementById("horseHeading").oninput  = function(e){ horseHeading = parseFloat(e.target.value); };

    // Joints
    document.getElementById("neckAngle").oninput = function(e){ neckAngle = parseFloat(e.target.value); };
    document.getElementById("headAngle").oninput = function(e){ headAngle = parseFloat(e.target.value); };
    document.getElementById("tailAngle").oninput = function(e){ tailAngle = parseFloat(e.target.value); };
    document.getElementById("flLeg").oninput     = function(e){ flLegAngle = parseFloat(e.target.value); };
    document.getElementById("frLeg").oninput     = function(e){ frLegAngle = parseFloat(e.target.value); };
    document.getElementById("blLeg").oninput     = function(e){ blLegAngle = parseFloat(e.target.value); };
    document.getElementById("brLeg").oninput     = function(e){ brLegAngle = parseFloat(e.target.value); };

    // Light
    document.getElementById("lightX").oninput = function(e){ lightPos[0] = parseFloat(e.target.value); };
    document.getElementById("lightY").oninput = function(e){ lightPos[1] = parseFloat(e.target.value); };
    document.getElementById("lightZ").oninput = function(e){ lightPos[2] = parseFloat(e.target.value); };

    // Animation buttons
    document.getElementById("walkBtn").onclick = function(){ isAnimating = true; };
    document.getElementById("stopBtn").onclick = function(){ isAnimating = false; };

    // Reset button
    document.getElementById("resetBtn").onclick = function(){
        camRadius = 12.0; camTheta = 55.0; camPhi = 45.0;
        horseX = 0.0; horseZ = 0.0; horseHeading = 0.0;
        neckAngle = -30.0; headAngle = 5.0; tailAngle = 145.0;
        flLegAngle = 0.0; frLegAngle = 0.0; blLegAngle = 0.0; brLegAngle = 0.0;
        lightPos = vec4(5.0, 10.0, 5.0, 1.0);
        isAnimating = false; animTime = 0.0;

        // sync sliders
        document.getElementById("camRadius").value    = camRadius;
        document.getElementById("camTheta").value     = camTheta;
        document.getElementById("camPhi").value       = camPhi;
        document.getElementById("horseX").value       = horseX;
        document.getElementById("horseZ").value       = horseZ;
        document.getElementById("horseHeading").value = horseHeading;
        document.getElementById("neckAngle").value    = neckAngle;
        document.getElementById("headAngle").value    = headAngle;
        document.getElementById("tailAngle").value    = tailAngle;
        document.getElementById("flLeg").value        = flLegAngle;
        document.getElementById("frLeg").value        = frLegAngle;
        document.getElementById("blLeg").value        = blLegAngle;
        document.getElementById("brLeg").value        = brLegAngle;
        document.getElementById("lightX").value       = lightPos[0];
        document.getElementById("lightY").value       = lightPos[1];
        document.getElementById("lightZ").value       = lightPos[2];
    };

    render();
};


// ============================================================
//  RENDER LOOP  (class-style requestAnimationFrame pattern)
// ============================================================

function render()
{
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // ---- Animation update (helper) ----
    if (isAnimating) updateAnimation();

    // ---- Camera / View / Projection ----
    var lookAtPt = vec3(horseX, 1.2, horseZ);

    var eye = vec3(
        lookAtPt[0] + camRadius * Math.sin(radians(camTheta)) * Math.cos(radians(camPhi)),
        lookAtPt[1] + camRadius * Math.cos(radians(camTheta)),
        lookAtPt[2] + camRadius * Math.sin(radians(camTheta)) * Math.sin(radians(camPhi))
    );

    var viewMatrix = lookAt(eye, lookAtPt, vec3(0.0, 1.0, 0.0));
    var projMatrix = perspective(55.0, canvas.width / canvas.height, 0.1, 100.0);

    gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(viewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projMatrix));

    // Light position (world space — shader will transform to eye space)
    gl.uniform4fv(lightPositionLoc, flatten(lightPos));


    // =========================================================
    //  DRAW TERRAIN
    // =========================================================
    gl.bindVertexArray(terrainVAO);
    setMaterial(terrainAmbient, terrainDiffuse, terrainSpecular, terrainShininess);

    var terrainModel = mat4();   // identity — terrain is in world coords
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(terrainModel));
    var tnMat = normalMatrix(mult(viewMatrix, terrainModel), true);
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(tnMat));
    gl.drawArrays(gl.TRIANGLES, 0, numTerrainVerts);


    // =========================================================
    //  DRAW HORSE  (cube VAO, reused with different model mats)
    // =========================================================
    gl.bindVertexArray(cubeVAO);
    setMaterial(horseAmbient, horseDiffuse, horseSpecular, horseShininess);

    // ------ World transform for the horse ------
    var horseY = heightAt(horseX, horseZ);
    var world  = chainMult(
        translate(horseX, horseY, horseZ),
        rotateY(horseHeading)
    );

    // Horse body dimensions
    var bodyL = 2.0, bodyH = 0.8, bodyW = 0.7;
    var bodyY = 1.2;   // center of body above local ground

    // ------ Body ------
    drawPart(viewMatrix, chainMult(
        world,
        translate(0, bodyY, 0),
        scale(bodyL, bodyH, bodyW)
    ));

    // ------ Neck ------
    // Pivot at front-top of body
    var neckPivot = translate(0.85, bodyY + 0.25, 0);
    var neckL = 1.0, neckW = 0.30;

    drawPart(viewMatrix, chainMult(
        world, neckPivot,
        rotateZ(neckAngle),
        translate(0, neckL * 0.5, 0),    // bottom of cube at pivot
        scale(neckW, neckL, neckW)
    ));

    // ------ Head ------
    // Pivot at top of neck (in neck's rotated frame)
    var headW = 0.70, headH = 0.35, headD = 0.30;

    drawPart(viewMatrix, chainMult(
        world, neckPivot,
        rotateZ(neckAngle),
        translate(0, neckL, 0),          // top of neck
        rotateZ(headAngle),
        translate(headW * 0.35, 0, 0),   // extend head forward
        scale(headW, headH, headD)
    ));

    // ------ Tail ------
    // Pivot at back-top of body
    var tailPivot = translate(-1.0, bodyY + 0.20, 0);
    var tailL = 0.90, tailW = 0.12;

    drawPart(viewMatrix, chainMult(
        world, tailPivot,
        rotateZ(tailAngle),
        translate(0, tailL * 0.5, 0),
        scale(tailW, tailL, tailW)
    ));

    // ------ Legs ------
    var legUL = 0.80;    // upper leg length
    var legUW = 0.22;    // upper leg width
    var hipY  = bodyY - bodyH * 0.5;   // bottom of body

    // Leg attachment offsets (relative to body center, in XZ)
    var legFX = 0.65;    // front legs X
    var legBX = -0.65;   // back legs X
    var legZ  = 0.20;    // lateral offset

    // Front-left
    drawPart(viewMatrix, chainMult(
        world,
        translate(legFX, hipY, legZ),
        rotateZ(flLegAngle),
        translate(0, -legUL * 0.5, 0),
        scale(legUW, legUL, legUW)
    ));

    // Front-right
    drawPart(viewMatrix, chainMult(
        world,
        translate(legFX, hipY, -legZ),
        rotateZ(frLegAngle),
        translate(0, -legUL * 0.5, 0),
        scale(legUW, legUL, legUW)
    ));

    // Back-left
    drawPart(viewMatrix, chainMult(
        world,
        translate(legBX, hipY, legZ),
        rotateZ(blLegAngle),
        translate(0, -legUL * 0.5, 0),
        scale(legUW, legUL, legUW)
    ));

    // Back-right
    drawPart(viewMatrix, chainMult(
        world,
        translate(legBX, hipY, -legZ),
        rotateZ(brLegAngle),
        translate(0, -legUL * 0.5, 0),
        scale(legUW, legUL, legUW)
    ));


    // =========================================================
    //  DRAW LIGHT MARKER  (small bright cube at light position)
    // =========================================================
    gl.bindVertexArray(lightCubeVAO);
    // Bright yellow emissive look
    setMaterial(
        vec4(1.0, 1.0, 0.5, 1.0),
        vec4(1.0, 1.0, 0.3, 1.0),
        vec4(0.0, 0.0, 0.0, 1.0),
        1.0
    );
    var lightModel = chainMult(
        translate(lightPos[0], lightPos[1], lightPos[2]),
        scale(0.3, 0.3, 0.3)
    );
    drawPart(viewMatrix, lightModel);


    requestAnimationFrame(render);
}
