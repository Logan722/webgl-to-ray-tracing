"use strict";			// Enforce typing in javascript

var canvas;			    // Drawing surface
var gl;				    // Graphics context

var theta = [0, 0, 0];	// Rotation angles for x, y and z axes

var rotSpeed = 0.008;
var axis = 1;			// Currently active axis of rotation
var xAxis = 0;			//  index into theta to indicate rotation angle around X
var yAxis = 1;			//  index into theta to indicate rotation angle around Y
var zAxis = 2;          //  index into theta to indicate rotation angle around Z
var flag = false;       // Rotation Toggle control

var thetaLoc;			// Holds shader uniform variable location
var cBuffer;
var vBuffer;
var colorLoc;

   // DEFINE CONE VERTICES - MODIFIED: generate cone using polar coordinates
   var numSegments = 36;      // number of slices around the circle
   var apexY = 0.5;           // tip of cone (Y)
   var baseY = -0.3;          // base of cone (Y)
   var baseRadius = 0.4;      // radius of the base circle

   // Side fan: 1 apex + (numSegments+1) circle verts to close
   // Base fan: 1 center + (numSegments+1) circle verts to close
   var numSideVerts = 1 + numSegments + 1;
   var numBaseVerts = 1 + numSegments + 1;

   // Build points and colors using loops with polar coordinates
   var pointsArr = [];
   var colorsArr = [];

   // --- SIDE of cone (TRIANGLE_FAN from apex) ---
   pointsArr.push(0.0, apexY, 0.0);          // V0: apex center of fan
   colorsArr.push(1.0, 1.0, 0.0, 1.0);       // Yellow tip

   for (var i = 0; i <= numSegments; i++) {
       var angle = (2.0 * Math.PI * i) / numSegments;
       pointsArr.push(baseRadius * Math.cos(angle), baseY, baseRadius * Math.sin(angle));
       var t = i / numSegments;
       colorsArr.push(
           0.5 + 0.5 * Math.cos(2.0 * Math.PI * t),
           0.5 + 0.5 * Math.cos(2.0 * Math.PI * t + 2.094),
           0.5 + 0.5 * Math.cos(2.0 * Math.PI * t + 4.189),
           1.0
       );
   }

   // --- BASE cap (TRIANGLE_FAN from center, reverse winding) ---
   pointsArr.push(0.0, baseY, 0.0);          // center of base
   colorsArr.push(0.2, 0.2, 0.2, 1.0);       // Dark gray center

   for (var i = 0; i <= numSegments; i++) {
       var angle = (2.0 * Math.PI * (numSegments - i)) / numSegments;
       pointsArr.push(baseRadius * Math.cos(angle), baseY, baseRadius * Math.sin(angle));
       var t = (numSegments - i) / numSegments;
       colorsArr.push(
           0.3 + 0.3 * Math.cos(2.0 * Math.PI * t),
           0.3 + 0.3 * Math.cos(2.0 * Math.PI * t + 2.094),
           0.3 + 0.3 * Math.cos(2.0 * Math.PI * t + 4.189),
           1.0
       );
   }

   var points = new Float32Array(pointsArr);

   // DEFINE CONE COLOR ATTRIBUTES - MODIFIED: built above with vertex loop
   var colors = new Float32Array(colorsArr);

window.onload = function init()
{
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Load points into vertex array attribute buffer
    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation( program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc );

    // Load colors into color array atrribute buffer
    cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

    colorLoc = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    thetaLoc = gl.getUniformLocation(program, "uTheta");

    //event listeners for buttons

    document.getElementById( "xButton" ).onclick = function () {
        axis = xAxis;
    };
    document.getElementById( "yButton" ).onclick = function () {
        axis = yAxis;
    };
    document.getElementById( "zButton" ).onclick = function () {
        axis = zAxis;
    };
    document.getElementById("ButtonT").onclick = function(){flag = !flag;};
    document.getElementById("Button0").onclick = function(){
        theta[xAxis] = 0;
        theta[yAxis] = 0;
        theta[zAxis] = 0;
        axis = yAxis;
    };

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor( 1.0, 1.0, 0.0, 1.0);

    render();
}

function render()
{
    gl.clearColor( 0.5, 0.5, 0.5, 1.0);
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Controls
    if(flag) {
        theta[axis] += rotSpeed;
    }
    gl.uniform3fv(thetaLoc, theta);   // send every frame so Reset shows even while paused

    // DRAW CONE - MODIFIED: two TRIANGLE_FAN calls
    gl.drawArrays(gl.TRIANGLE_FAN, 0, numSideVerts);              // cone sides
    gl.drawArrays(gl.TRIANGLE_FAN, numSideVerts, numBaseVerts);    // base cap


    requestAnimationFrame(render);	// Call to browser to refresh display
}
