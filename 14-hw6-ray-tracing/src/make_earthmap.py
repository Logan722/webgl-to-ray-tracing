"""
Generate a procedural earth-like equirectangular texture.

Produces earthmap.jpg (1024 x 512) in the current working directory.
Uses layered value noise to create ocean/land masks, then colors
continents with low-frequency biome variation (green/tan) and adds
polar ice caps and subtle atmospheric haze.
"""

import numpy as np
from PIL import Image

W, H = 1024, 512
rng = np.random.default_rng(7)


def value_noise_2d(w, h, octaves=5, persistence=0.5, lacunarity=2.0, wrap_x=True, seed=0):
    """Periodic value noise in the x direction (longitude wraps)."""
    local_rng = np.random.default_rng(seed)
    result = np.zeros((h, w), dtype=np.float32)
    amplitude = 1.0
    total_amp = 0.0
    frequency = 2  # start with one full cycle across longitude

    for _ in range(octaves):
        fx = frequency
        fy = max(1, frequency // 2)
        # Grid of random values; duplicate first column so it wraps seamlessly in x.
        grid = local_rng.random((fy + 1, fx + 1)).astype(np.float32)
        if wrap_x:
            grid[:, -1] = grid[:, 0]

        # Bilinear upsample to full resolution.
        xs = np.linspace(0, fx, w, endpoint=False)
        ys = np.linspace(0, fy, h, endpoint=False)
        x0 = np.floor(xs).astype(int)
        y0 = np.floor(ys).astype(int)
        x1 = np.minimum(x0 + 1, fx)
        y1 = np.minimum(y0 + 1, fy)
        tx = (xs - x0).astype(np.float32)
        ty = (ys - y0).astype(np.float32)

        # Smoothstep for friendlier interpolation.
        tx = tx * tx * (3 - 2 * tx)
        ty = ty * ty * (3 - 2 * ty)

        a = grid[y0[:, None], x0[None, :]]
        b = grid[y0[:, None], x1[None, :]]
        c = grid[y1[:, None], x0[None, :]]
        d = grid[y1[:, None], x1[None, :]]

        top = a + (b - a) * tx[None, :]
        bot = c + (d - c) * tx[None, :]
        layer = top + (bot - top) * ty[:, None]

        result += layer * amplitude
        total_amp += amplitude
        amplitude *= persistence
        frequency = int(frequency * lacunarity)

    return result / total_amp


# Continent mask.
land_noise = value_noise_2d(W, H, octaves=6, persistence=0.55, seed=1)
# Shift threshold so continents cover roughly 30% of the surface.
sea_level = np.quantile(land_noise, 0.70)
land_mask = (land_noise > sea_level).astype(np.float32)

# Elevation (land only) and biome variation.
elev = value_noise_2d(W, H, octaves=5, persistence=0.5, seed=2)
biome = value_noise_2d(W, H, octaves=4, persistence=0.5, seed=3)

# Latitude weight for ice caps and equatorial warmth.
lat = np.linspace(-1.0, 1.0, H, dtype=np.float32)[:, None]  # -1 south, +1 north
ice_mask = (np.abs(lat) > 0.82).astype(np.float32)
# Soften the ice edge.
ice_mask = np.clip((np.abs(lat) - 0.78) / 0.12, 0.0, 1.0)

# Start with ocean colors: deeper blue away from continents.
ocean_shallow = np.array([0.15, 0.38, 0.58], dtype=np.float32)
ocean_deep    = np.array([0.04, 0.14, 0.33], dtype=np.float32)
# Depth cue from land_noise (distance below sea level).
depth = np.clip((sea_level - land_noise) / (sea_level + 1e-6), 0.0, 1.0)
ocean_color = ocean_deep * depth[..., None] + ocean_shallow * (1 - depth[..., None])

# Land colors: desert/tan at mid-latitudes, green elsewhere, rocky grey at high elevation.
desert  = np.array([0.78, 0.68, 0.42], dtype=np.float32)
forest  = np.array([0.18, 0.42, 0.18], dtype=np.float32)
plains  = np.array([0.38, 0.50, 0.22], dtype=np.float32)
rock    = np.array([0.45, 0.40, 0.35], dtype=np.float32)

aridness = np.clip(1.0 - np.abs(lat) * 1.2, 0.0, 1.0)  # warmer near equator
aridness = aridness * biome + (1 - biome) * (1 - np.abs(lat))
aridness = np.clip(aridness, 0.0, 1.0)[..., None]

base_land = forest * (1 - aridness) + desert * aridness
# Blend plains in based on mid-biome values.
mid_biome = (1 - np.abs(biome - 0.5) * 2)[..., None]
base_land = base_land * (1 - 0.4 * mid_biome) + plains * (0.4 * mid_biome)
# Rocky highlands where elevation is high.
high = np.clip((elev - 0.55) / 0.4, 0.0, 1.0)[..., None]
land_color = base_land * (1 - high) + rock * high

# Compose land over ocean using the mask.
lm = land_mask[..., None]
image = ocean_color * (1 - lm) + land_color * lm

# Ice caps on top.
ice_color = np.array([0.95, 0.97, 1.0], dtype=np.float32)
image = image * (1 - ice_mask[..., None]) + ice_color * ice_mask[..., None]

# Subtle cloud wisps.
clouds = value_noise_2d(W, H, octaves=5, persistence=0.5, seed=5)
cloud_alpha = np.clip((clouds - 0.55) * 2.0, 0.0, 0.45)[..., None]
image = image * (1 - cloud_alpha) + np.array([1, 1, 1], dtype=np.float32) * cloud_alpha

# Clamp and save.
image = np.clip(image, 0.0, 1.0)
out = (image * 255).astype(np.uint8)
Image.fromarray(out).save("earthmap.jpg", quality=92)
print("Wrote earthmap.jpg:", out.shape)
