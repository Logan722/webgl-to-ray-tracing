# HW3 Transformation Math

Worked solutions for a written homework on rays, parametric lines, homogeneous coordinates, and concatenated 4x4 transformation matrices, with diagrams for the sketch questions.

## Overview

This is a math homework from my graphics class, solved step by step in a single PDF. It has three problems:

1. Given points A = [1, 1, 1, 1] and B = [2, -1, 3, 1] in homogeneous coordinates, define a ray from A toward B, write the line in parametric form, sketch it, and find where it crosses the XZ plane.
2. Build two matrices from a horizontal translation of 8 and a 30 degree rotation about Z, one that translates first and one that rotates first, and apply both to the point (-1, 2).
3. Take q' = Rz(90) S(2, 4, 1) q, collapse it into one matrix, apply it to two points A and B and a vector V, sketch the before and after, and use dot products to check whether V stays perpendicular to segment AB.

## What It Covers

**Problem 1: rays and the XZ plane**

- The direction is d = B - A = [1, -2, 2, 0]. The w component of 0 marks it as a vector, since a point minus a point gives a vector.
- The ray is r(α) = A + αd with α ≥ 0, and the full line uses the same formula for all real α: x = 1 + α, y = 1 - 2α, z = 1 + 2α, w = 1.
- Setting y = 0 gives α = 0.5. Since α is positive, the crossing is on the ray, at the point [1.5, 0, 2, 1].

**Problem 2: transformation order**

In v' = Mv the matrix closest to v acts first, so translate then rotate is M_A = Rz(30) T(8, 0, 0), and rotate then translate is M_B = T(8, 0, 0) Rz(30).

```
M_A = | 0.866  -0.5    0  6.928 |      M_B = | 0.866  -0.5    0  8 |
      | 0.5     0.866  0  4.0   |            | 0.5     0.866  0  0 |
      | 0       0      1  0     |            | 0       0      1  0 |
      | 0       0      0  1     |            | 0       0      0  1 |
```

In M_A the translation column itself gets rotated (8 cos 30 and 8 sin 30). Applied to [-1, 2, 0, 1], M_A gives (5.062, 5.232) and M_B gives (6.134, 1.232), so the order of the two operations changes the result.

**Problem 3: non-uniform scaling and perpendicularity**

The combined matrix is

```
M = Rz(90) S(2, 4, 1) = | 0  -4  0  0 |
                        | 2   0  0  0 |
                        | 0   0  1  0 |
                        | 0   0  0  1 |
```

- Points get w = 1 and vectors get w = 0: A = [0, 0.5, 0, 1], B = [0.5, 0, 0, 1], V = [0.5, 0.5, 0, 0].
- Before the transform, AB = [0.5, -0.5] and V · AB = 0.25 - 0.25 = 0, so V is normal to AB.
- After the transform, A' = [-2, 0, 0, 1], B' = [0, 1, 0, 1], and V' = [-2, 1, 0, 0]. The w of V' is still 0, so it is still a vector.
- A'B' = [2, 1] and V' · A'B' = -4 + 1 = -3, so V' is no longer perpendicular to A'B'.

The non-uniform scale stretches x by 2 and y by 4, and that distorts angles. Rotations and uniform scales keep right angles, but non-uniform scales do not. This is the reason surface normals have to be transformed with the inverse transpose of the model matrix instead of the model matrix itself, so they stay perpendicular to the surface for lighting.

## Files

- `HW3_Solutions_DanielOni.pdf`: full step by step solutions to all three problems, with the diagrams embedded.
- `sketch_1c.png`: 3D view of point A, the ray, and its intersection with the XZ plane at (1.5, 0, 2).
- `sketch_3d.png`: A, B, segment AB, and vector V before the transform, with a right angle marker.
- `sketch_3g.png`: A', B', and V' after the transform, with an arc showing the angle is no longer 90 degrees.
