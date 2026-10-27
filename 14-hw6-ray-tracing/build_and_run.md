# Build and Run

This project is a single-binary C++17 ray tracer. All of the sources are in
the `src/` folder as header files plus one `main.cc`. The image is written to
standard output as a PPM file, so you redirect that to an output file and then
convert it to JPG.

The scene uses an image texture called `earthmap.jpg` which is already in the
`src/` folder. It was generated procedurally by `make_earthmap.py` (see the
writeup for details). If you ever need to regenerate it, there is a command
for that at the bottom of this file.

## Linux or macOS

Open a terminal in the `src/` folder and run:

```
g++ -O3 -std=c++17 -o rt main.cc
./rt > image.ppm
```

The `-O3` flag is important. Without it the render is several times slower.

Then convert the PPM to JPG. On macOS this works with ImageMagick if you have
it installed:

```
magick image.ppm image.jpg
```

If you do not have ImageMagick, the free GIMP app opens PPM files and lets you
export them as JPG.

## Windows (Visual Studio)

From a Developer Command Prompt, cd into the `src/` folder and run:

```
cl /O2 /std:c++17 /EHsc main.cc /Fe:rt.exe
rt.exe > image.ppm
```

To convert the PPM to JPG, the simplest option is to open `image.ppm` in
IrfanView or GIMP and export it as JPG.

## Windows (WSL)

If you have WSL installed, the Linux instructions above work unchanged from
inside the WSL shell.

## Rendering settings

The settings that control render quality are all near the bottom of `main.cc`
in the `camera cam;` block:

```
cam.image_width       = 800;
cam.samples_per_pixel = 300;
cam.max_depth         = 50;
```

Lowering samples_per_pixel to something like 30 or 50 is useful when you are
testing a change to the scene. The render time scales almost linearly with
samples_per_pixel.

## Regenerating the earth texture

If you want to regenerate `earthmap.jpg` from scratch, you need Python 3 with
numpy and Pillow installed. Then run:

```
python3 make_earthmap.py
```

It produces a new `earthmap.jpg` in the current folder. The random seed in the
script is fixed, so the output is reproducible. Changing the seed gives a
different planet.
