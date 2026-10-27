////////////////////////////////////////////////////////////////////////////////
// CG_HW4_MeshTerrain_DanielOni.js
// CS 7382 - Computer Graphics, Spring 2026
//
// Mesh Terrain Generation and Rendering
// This file contains the terrain generation logic, surface normal computation,
// and height-based coloring. The HTML file is self-contained, but this JS
// mirrors the core logic for the OO design requirement.
////////////////////////////////////////////////////////////////////////////////

"use strict";


////////////////////////////////////////////////////////////////////////////////
// TerrainMesh Object
// Encapsulates mesh generation, including the height function, normal 
// computation, and color mapping. This follows an object-oriented design
// where the mesh data is generated once and stored for repeated rendering.
////////////////////////////////////////////////////////////////////////////////

var TerrainMesh = {

    gridSize: 60,       // Number of subdivisions per axis
    extentXZ: 1.0,      // Mesh spans [-extent, +extent] in X and Z

    ////////////////////////////////////////////////////////////////////////////
    // Height Function - layered sin/cos for interesting hilly terrain
    // This is NOT the hat function from class. Instead we layer multiple
    // sinusoidal waves at different frequencies and phases to get a natural
    // looking landscape with broad hills, medium ridges, and fine detail.
    ////////////////////////////////////////////////////////////////////////////
    height: function(x, z) {
        var h = 0.15 * Math.sin(2.5 * x) * Math.cos(2.5 * z);      // broad hills
        h += 0.08 * Math.sin(5.0 * x + 1.0) * Math.cos(4.0 * z - 0.5);  // medium ridges
        h += 0.04 * Math.sin(9.0 * x - 2.0) * Math.sin(8.0 * z + 1.5);  // fine detail
        h += 0.06 * Math.cos(1.5 * x + 0.5) * Math.sin(1.8 * z);        // gentle slope
        return h;
    },

    ////////////////////////////////////////////////////////////////////////////
    // Color based on normalized height
    // Gradient: dark green (valley) -> light green -> brown/tan -> light peaks
    ////////////////////////////////////////////////////////////////////////////
    colorFromHeight: function(y, minY, maxY) {
        var t = (y - minY) / (maxY - minY + 0.001);
        var r, g, b;

        if (t < 0.25) {
            r = 0.15 + 0.1 * t;   g = 0.4 + 0.3 * t;   b = 0.15;
        } else if (t < 0.5) {
            var s = (t - 0.25) / 0.25;
            r = 0.18 + 0.25 * s;  g = 0.5 + 0.15 * s;  b = 0.15 + 0.1 * s;
        } else if (t < 0.75) {
            var s = (t - 0.5) / 0.25;
            r = 0.45 + 0.2 * s;   g = 0.55 - 0.05 * s;  b = 0.25 + 0.1 * s;
        } else {
            var s = (t - 0.75) / 0.25;
            r = 0.65 + 0.25 * s;  g = 0.5 + 0.35 * s;   b = 0.35 + 0.45 * s;
        }
        return [r, g, b, 1.0];
    },

    ////////////////////////////////////////////////////////////////////////////
    // Generate the complete mesh
    // Returns positions, normals, colors, and index arrays for triangles
    // and wireframe rendering.
    //
    // The normal computation uses the cross product approach from the
    // Coordinate-Free Geometry lecture: given a triangle defined by three 
    // points, two edge vectors are computed and their cross product gives
    // the face normal. We accumulate face normals into each vertex and 
    // normalize at the end for smooth per-vertex normals.
    ////////////////////////////////////////////////////////////////////////////
    generate: function() {
        var rows = this.gridSize;
        var cols = this.gridSize;
        var ext  = this.extentXZ;
        var totalVerts = (rows + 1) * (cols + 1);

        // Generate positions
        var positions = [];
        var minY = Infinity, maxY = -Infinity;

        for (var r = 0; r <= rows; r++) {
            for (var c = 0; c <= cols; c++) {
                var x = -ext + (2.0 * ext * c) / cols;
                var z = -ext + (2.0 * ext * r) / rows;
                var y = this.height(x, z);
                positions.push(x, y, z);
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }

        // Generate triangle indices (CCW winding for correct outward normals)
        var triIndices = [];
        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                var tl = r * (cols + 1) + c;
                var tr = tl + 1;
                var bl = (r + 1) * (cols + 1) + c;
                var br = bl + 1;
                triIndices.push(tl, bl, tr);
                triIndices.push(tr, bl, br);
            }
        }

        // Compute per-vertex normals (accumulate face normals, then normalize)
        var normals = new Array(totalVerts * 3).fill(0.0);
        for (var i = 0; i < triIndices.length; i += 3) {
            var i0 = triIndices[i], i1 = triIndices[i+1], i2 = triIndices[i+2];
            var p0x = positions[i0*3], p0y = positions[i0*3+1], p0z = positions[i0*3+2];
            var p1x = positions[i1*3], p1y = positions[i1*3+1], p1z = positions[i1*3+2];
            var p2x = positions[i2*3], p2y = positions[i2*3+1], p2z = positions[i2*3+2];

            var e1x = p1x-p0x, e1y = p1y-p0y, e1z = p1z-p0z;
            var e2x = p2x-p0x, e2y = p2y-p0y, e2z = p2z-p0z;

            // Cross product: face normal
            var nx = e1y*e2z - e1z*e2y;
            var ny = e1z*e2x - e1x*e2z;
            var nz = e1x*e2y - e1y*e2x;

            // Accumulate into each vertex
            for (var vi = 0; vi < 3; vi++) {
                var idx = triIndices[i + vi];
                normals[idx*3] += nx;
                normals[idx*3+1] += ny;
                normals[idx*3+2] += nz;
            }
        }

        // Normalize
        for (var v = 0; v < totalVerts; v++) {
            var nx = normals[v*3], ny = normals[v*3+1], nz = normals[v*3+2];
            var len = Math.sqrt(nx*nx + ny*ny + nz*nz);
            if (len > 0.0001) {
                normals[v*3] /= len;
                normals[v*3+1] /= len;
                normals[v*3+2] /= len;
            }
        }

        // Assign colors based on height
        var colors = [];
        for (var v = 0; v < totalVerts; v++) {
            var col = this.colorFromHeight(positions[v*3+1], minY, maxY);
            colors.push(col[0], col[1], col[2], col[3]);
        }

        // Generate wireframe indices
        var wireIndices = [];
        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                var tl = r * (cols+1) + c;
                var tr = tl + 1;
                var bl = (r+1) * (cols+1) + c;
                wireIndices.push(tl, tr);
                wireIndices.push(tl, bl);
                wireIndices.push(tr, bl);
            }
            wireIndices.push(r*(cols+1)+cols, (r+1)*(cols+1)+cols);
        }
        for (var c = 0; c < cols; c++) {
            wireIndices.push(rows*(cols+1)+c, rows*(cols+1)+c+1);
        }

        return {
            positions:   new Float32Array(positions),
            normals:     new Float32Array(normals),
            colors:      new Float32Array(colors),
            triIndices:  new Uint32Array(triIndices),
            wireIndices: new Uint32Array(wireIndices),
            vertexCount: totalVerts
        };
    }
};
