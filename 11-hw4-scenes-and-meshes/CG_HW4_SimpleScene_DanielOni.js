////////////////////////////////////////////////////////////////////////////////
// CG_HW4_SimpleScene_DanielOni.js
// CS 7382 - Computer Graphics, Spring 2026
//
// Walking Stick-Figure Person with Jointed Arms and Legs
// This file contains the matrix math helpers, shape creation, and rendering
// logic for the stick figure scene. The HTML file is self-contained, but this
// JS mirrors the logic for the OO design requirement.
////////////////////////////////////////////////////////////////////////////////

"use strict";


////////////////////////////////////////////////////////////////////////////////
// 4x4 Matrix Helper Functions (column-major for WebGL)
//
// We build transformation matrices on the CPU side and concatenate them 
// for the joint hierarchy. This is the key idea from the Instance Transform
// lecture: M = T * R * S applied per body part, with parent transforms 
// propagating down the joint chain.
////////////////////////////////////////////////////////////////////////////////

function mat4_identity() {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
}

function mat4_translate(tx, ty, tz) {
    return new Float32Array([
        1,  0,  0,  0,
        0,  1,  0,  0,
        0,  0,  1,  0,
        tx, ty, tz, 1
    ]);
}

function mat4_rotateZ(angleRad) {
    var c = Math.cos(angleRad);
    var s = Math.sin(angleRad);
    return new Float32Array([
         c, s, 0, 0,
        -s, c, 0, 0,
         0, 0, 1, 0,
         0, 0, 0, 1
    ]);
}

function mat4_scale(sx, sy, sz) {
    return new Float32Array([
        sx, 0,  0,  0,
        0,  sy, 0,  0,
        0,  0,  sz, 0,
        0,  0,  0,  1
    ]);
}

function mat4_multiply(a, b) {
    var result = new Float32Array(16);
    for (var col = 0; col < 4; col++) {
        for (var row = 0; row < 4; row++) {
            var sum = 0.0;
            for (var k = 0; k < 4; k++) {
                sum += a[k * 4 + row] * b[col * 4 + k];
            }
            result[col * 4 + row] = sum;
        }
    }
    return result;
}

function mat4_chain() {
    var result = arguments[0];
    for (var i = 1; i < arguments.length; i++) {
        result = mat4_multiply(result, arguments[i]);
    }
    return result;
}


////////////////////////////////////////////////////////////////////////////////
// Shape Factory Functions
// These create VAOs for unit shapes centered at origin.
// We reuse the same shape geometry with different instance transforms (the
// uniform model matrix) to draw each body part at a different size/position.
////////////////////////////////////////////////////////////////////////////////

function createRectangleVAO(gl, program) {
    var vertices = new Float32Array([
        -0.5, -0.5,  0.0, 1.0,
         0.5, -0.5,  0.0, 1.0,
         0.5,  0.5,  0.0, 1.0,
        -0.5,  0.5,  0.0, 1.0
    ]);

    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    var aPosition = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(aPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPosition);

    gl.bindVertexArray(null);
    return { vao: vao, count: 4 };
}

function createCircleVAO(gl, program) {
    var N = 36;
    var verts = [];
    verts.push(0.0, 0.0, 0.0, 1.0);  // center
    for (var i = 0; i <= N; i++) {
        var angle = (2.0 * Math.PI * i) / N;
        verts.push(0.5 * Math.cos(angle), 0.5 * Math.sin(angle), 0.0, 1.0);
    }
    var vertices = new Float32Array(verts);

    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    var aPosition = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(aPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPosition);

    gl.bindVertexArray(null);
    return { vao: vao, count: N + 2 };
}


////////////////////////////////////////////////////////////////////////////////
// StickFigure Object
// Encapsulates the figure's state and drawing logic.
// Joint hierarchy:
//   Root (figureX, figureY)
//     -> Torso, Head
//     -> Left Arm (shoulder) -> Left Forearm
//     -> Right Arm (shoulder) -> Right Forearm
//     -> Left Leg (hip) -> Left Shin -> Left Foot
//     -> Right Leg (hip) -> Right Shin -> Right Foot
////////////////////////////////////////////////////////////////////////////////

var StickFigure = {
    // Figure position
    figureX: 0.0,
    figureY: -0.1,

    // Joint angles (degrees)
    leftArmAngle: 20.0,
    rightArmAngle: -20.0,
    leftLegAngle: 15.0,
    rightLegAngle: -15.0,

    // Body part sizes
    torsoW: 0.14,   torsoH: 0.24,
    headR:  0.10,
    armW:   0.05,   armH:   0.16,
    foreW:  0.04,   foreH:  0.14,
    thighW: 0.06,   thighH: 0.18,
    shinW:  0.05,   shinH:  0.16,

    // Colors
    shirtColor:    [0.25, 0.45, 0.82, 1.0],
    skinColor:     [0.94, 0.78, 0.65, 1.0],
    skinDarkColor: [0.90, 0.72, 0.58, 1.0],
    pantsColor:    [0.22, 0.22, 0.35, 1.0],
    pantsDarkColor:[0.18, 0.18, 0.28, 1.0],
    shoeColor:     [0.15, 0.15, 0.15, 1.0],
    eyeColor:      [0.10, 0.10, 0.10, 1.0],
    mouthColor:    [0.75, 0.35, 0.30, 1.0],

    // Draw the entire figure
    draw: function(drawRectFn, drawCircleFn) {
        var leftArmRad  = this.leftArmAngle  * Math.PI / 180.0;
        var rightArmRad = this.rightArmAngle * Math.PI / 180.0;
        var leftLegRad  = this.leftLegAngle  * Math.PI / 180.0;
        var rightLegRad = this.rightLegAngle * Math.PI / 180.0;

        var rootT = mat4_translate(this.figureX, this.figureY, 0.0);

        // Torso
        drawRectFn(mat4_chain(rootT, mat4_scale(this.torsoW, this.torsoH, 1.0)), this.shirtColor);

        // Head
        drawCircleFn(mat4_chain(rootT,
            mat4_translate(0.0, this.torsoH/2.0 + this.headR, 0.0),
            mat4_scale(this.headR*2, this.headR*2, 1.0)), this.skinColor);

        // Left arm chain
        var lShX = -this.torsoW/2.0 - this.armW/2.0;
        var lShY =  this.torsoH/2.0 - 0.02;
        var lArmBase = mat4_chain(rootT, mat4_translate(lShX, lShY, 0.0), mat4_rotateZ(leftArmRad));
        drawRectFn(mat4_chain(lArmBase, mat4_translate(0, -this.armH/2, 0), mat4_scale(this.armW, this.armH, 1)), this.skinColor);
        drawRectFn(mat4_chain(lArmBase, mat4_translate(0, -this.armH, 0), mat4_translate(0, -this.foreH/2, 0), mat4_scale(this.foreW, this.foreH, 1)), this.skinDarkColor);

        // Right arm chain
        var rShX = this.torsoW/2.0 + this.armW/2.0;
        var rShY = this.torsoH/2.0 - 0.02;
        var rArmBase = mat4_chain(rootT, mat4_translate(rShX, rShY, 0.0), mat4_rotateZ(rightArmRad));
        drawRectFn(mat4_chain(rArmBase, mat4_translate(0, -this.armH/2, 0), mat4_scale(this.armW, this.armH, 1)), this.skinColor);
        drawRectFn(mat4_chain(rArmBase, mat4_translate(0, -this.armH, 0), mat4_translate(0, -this.foreH/2, 0), mat4_scale(this.foreW, this.foreH, 1)), this.skinDarkColor);

        // Left leg chain
        var lHipX = -this.torsoW/4.0;
        var lHipY = -this.torsoH/2.0;
        var lLegBase = mat4_chain(rootT, mat4_translate(lHipX, lHipY, 0), mat4_rotateZ(leftLegRad));
        drawRectFn(mat4_chain(lLegBase, mat4_translate(0, -this.thighH/2, 0), mat4_scale(this.thighW, this.thighH, 1)), this.pantsColor);
        drawRectFn(mat4_chain(lLegBase, mat4_translate(0, -this.thighH, 0), mat4_translate(0, -this.shinH/2, 0), mat4_scale(this.shinW, this.shinH, 1)), this.pantsDarkColor);
        drawRectFn(mat4_chain(lLegBase, mat4_translate(0, -this.thighH - this.shinH, 0), mat4_translate(0.01, -0.02, 0), mat4_scale(0.07, 0.03, 1)), this.shoeColor);

        // Right leg chain
        var rHipX = this.torsoW/4.0;
        var rHipY = -this.torsoH/2.0;
        var rLegBase = mat4_chain(rootT, mat4_translate(rHipX, rHipY, 0), mat4_rotateZ(rightLegRad));
        drawRectFn(mat4_chain(rLegBase, mat4_translate(0, -this.thighH/2, 0), mat4_scale(this.thighW, this.thighH, 1)), this.pantsColor);
        drawRectFn(mat4_chain(rLegBase, mat4_translate(0, -this.thighH, 0), mat4_translate(0, -this.shinH/2, 0), mat4_scale(this.shinW, this.shinH, 1)), this.pantsDarkColor);
        drawRectFn(mat4_chain(rLegBase, mat4_translate(0, -this.thighH - this.shinH, 0), mat4_translate(0.01, -0.02, 0), mat4_scale(0.07, 0.03, 1)), this.shoeColor);

        // Eyes
        var eyeSize = 0.025;
        drawCircleFn(mat4_chain(rootT, mat4_translate(-0.03, this.torsoH/2+this.headR+0.01, 0), mat4_scale(eyeSize, eyeSize, 1)), this.eyeColor);
        drawCircleFn(mat4_chain(rootT, mat4_translate( 0.03, this.torsoH/2+this.headR+0.01, 0), mat4_scale(eyeSize, eyeSize, 1)), this.eyeColor);

        // Mouth
        drawRectFn(mat4_chain(rootT, mat4_translate(0, this.torsoH/2+this.headR-0.03, 0), mat4_scale(0.04, 0.012, 1)), this.mouthColor);
    }
};
