// ----------------------------------------------------------------------------
// HW6 Ray Tracing - main.cc
// CS 7382/5382 Computer Graphics, Spring 2026
//
// Based on "Ray Tracing in One Weekend" by Peter Shirley, with these
// extensions:
//
//   * a checkered procedural texture on the ground plane
//   * an image-based texture (earthmap.jpg) on a feature sphere
//   * a box primitive built from six quads (custom geometry with
//     properly oriented surface normals, replacing the sphere as the
//     only hittable shape in the book)
//   * a varied field of small random spheres (lambertian, metal with
//     varied fuzz, dielectric glass, and a few hollow-glass bubbles)
//
// Compile example (Linux/Mac):
//   g++ -O3 -std=c++17 -o rt main.cc
//
// Run:
//   ./rt > image.ppm
// ----------------------------------------------------------------------------

#include "rtweekend.h"

#include "camera.h"
#include "hittable.h"
#include "hittable_list.h"
#include "material.h"
#include "quad.h"
#include "sphere.h"
#include "texture.h"


int main() {
    hittable_list world;

    // ---- Ground: large checkered plane made from a huge sphere ----
    auto checker = make_shared<checker_texture>(0.32, color(0.2, 0.3, 0.1), color(0.9, 0.9, 0.9));
    world.add(make_shared<sphere>(point3(0, -1000, 0), 1000, make_shared<lambertian>(checker)));

    // ---- Field of small random spheres ----
    for (int a = -11; a < 11; a++) {
        for (int b = -11; b < 11; b++) {
            auto choose_mat = random_double();
            point3 center(a + 0.9 * random_double(), 0.2, b + 0.9 * random_double());

            // Keep the random field clear of the three hero objects up front.
            if ((center - point3(0, 0.2, 0)).length() < 1.1) continue;
            if ((center - point3(-2.5, 0.2, 3.0)).length() < 1.1) continue;
            if ((center - point3(4.5, 0.2, -2.5)).length() < 1.1) continue;
            // Clear the area where the box will sit.
            if (center.x() > 1.7 && center.x() < 3.8 && center.z() > -0.8 && center.z() < 1.6) continue;

            shared_ptr<material> sphere_material;

            if (choose_mat < 0.75) {
                // ~75% diffuse, with saturated random albedo
                auto albedo = color::random() * color::random();
                sphere_material = make_shared<lambertian>(albedo);
                world.add(make_shared<sphere>(center, 0.2, sphere_material));
            } else if (choose_mat < 0.92) {
                // ~17% metal
                auto albedo = color::random(0.5, 1.0);
                auto fuzz = random_double(0, 0.5);
                sphere_material = make_shared<metal>(albedo, fuzz);
                world.add(make_shared<sphere>(center, 0.2, sphere_material));
            } else if (choose_mat < 0.97) {
                // ~5% solid glass
                sphere_material = make_shared<dielectric>(1.5);
                world.add(make_shared<sphere>(center, 0.2, sphere_material));
            } else {
                // ~3% hollow glass bubble: outer sphere + inner sphere with negative radius
                auto glass = make_shared<dielectric>(1.5);
                world.add(make_shared<sphere>(center, 0.2, glass));
                world.add(make_shared<sphere>(center, -0.15, glass));
            }
        }
    }

    // ---- Three hero spheres across the front ----
    // Arranged so that from the camera at (13, 2, 3) looking at origin, the
    // box sits clearly in the foreground and no hero object hides another.

    // Right-of-center: clear glass
    auto material_glass = make_shared<dielectric>(1.5);
    world.add(make_shared<sphere>(point3(0, 1, 0), 1.0, material_glass));

    // Far-left front: earth (image texture), placed in the foreground so the
    // continents and oceans read clearly from the camera's angle.
    auto earth_tex = make_shared<image_texture>("earthmap.jpg");
    auto earth_surface = make_shared<lambertian>(earth_tex);
    world.add(make_shared<sphere>(point3(-2.5, 1, 3.0), 1.0, earth_surface));

    // Back-right: polished silver metal, pushed back so the box reads clearly
    // in front of it.
    auto material_metal = make_shared<metal>(color(0.85, 0.85, 0.9), 0.05);
    world.add(make_shared<sphere>(point3(4.5, 1, -2.5), 1.0, material_metal));

    // ---- Custom geometry: a polished copper box built from 6 quads ----
    // The box() helper in quad.h returns a hittable_list of six quad sides,
    // each with its own outward-facing normal derived from cross(u, v).
    // Placed in front and to the right of the glass sphere so that both
    // are clearly visible, and where the copper box picks up reflected
    // color from the surrounding random spheres and the checker ground.
    auto copper = make_shared<metal>(color(0.75, 0.50, 0.25), 0.02);
    world.add(box(point3(2.0, 0.0, -0.5), point3(3.6, 1.4, 1.4), copper));

    // ---- Camera ----
    camera cam;

    cam.aspect_ratio      = 16.0 / 9.0;
    cam.image_width       = 800;
    cam.samples_per_pixel = 300;
    cam.max_depth         = 50;
    cam.background        = color(0.70, 0.80, 1.00);

    cam.vfov     = 20;
    cam.lookfrom = point3(13, 2, 3);
    cam.lookat   = point3(0, 0, 0);
    cam.vup      = vec3(0, 1, 0);

    cam.defocus_angle = 0.6;
    cam.focus_dist    = 10.0;

    cam.render(world);
}
