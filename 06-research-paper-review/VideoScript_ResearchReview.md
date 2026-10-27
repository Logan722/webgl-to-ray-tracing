# Video Script — Current Research Literature Review
## Daniel Oni | CS 5382 Computer Graphics | Spring 2026
### Target Runtime: 2:30–3:30 (about 1:30 per paper)

---

## PAPER 1 — "One Noise to Rule Them All"

---

### [SLIDE 1 — Title]

Alright, so for this assignment I picked two papers. The first one is called "One Noise to Rule Them All" — yeah, it's a Lord of the Rings reference — and it was published in ACM Transactions on Graphics in 2024. I picked this one because it ties directly back to the Perlin Noise paper I presented earlier.

### [SLIDE 2 — The Problem & Approach]

So the basic problem is, ever since Perlin came up with his noise function in 1985, people have made a bunch of other noise types — Worley noise, Gabor noise, and a lot more. But each one is its own separate algorithm with different parameters. So if you're an artist making textures, you're kind of jumping between all these different tools.

What these researchers did was train a single diffusion model — similar to what's behind AI image generators — but instead of generating photos, it generates noise patterns. You basically tell it what kind of noise you want and it just makes it.

### [SLIDE 3 — What They Achieved]

The main results are that this one model can produce Perlin, Worley, Gabor, and other noise types without switching algorithms. It can also blend between different noise types within the same texture, which is something you can't really do with the traditional approach. And artists can control it pretty intuitively — just pick the noise type and scale you want.

So basically 40 years of handcrafted noise algorithms, and now one learned model can handle all of them.

### [SLIDE 4 — My Takeaways]

For me, this paper felt like a sequel to the Perlin paper. Perlin invented the noise function, and now these authors are asking "what if we just learn all of them at once?" Same idea, just using deep learning instead of handcrafted math.

I also thought it was interesting from a cybersecurity perspective — I see the same pattern in security where you're replacing a bunch of specialized tools with one general model. That trend of generalization over specialization shows up everywhere.

And it makes you wonder — if one model can replace all these noise algorithms, could the same thing happen with other procedural graphics tools?

---

## PAPER 2 — "Multi-Layer Gaussian Splatting for Immersive Anatomy Visualization"

---

### [SLIDE 5 — Transition / SLIDE 6 — Title]

Okay, the second paper is from the IEEE side. This one's called "Multi-Layer Gaussian Splatting for Immersive Anatomy Visualization," from IEEE TVCG, 2025. Very different topic — this is about medical VR.

### [SLIDE 7 — The Problem & Approach]

So doctors and med students want to look at CT scans in VR — like, rotate around a body, zoom in, peel back layers to see what's underneath. That's really useful for learning anatomy or planning surgery.

The problem is, traditional volume rendering is way too slow for mobile VR headsets like the Meta Quest. And regular 3D Gaussian Splatting — which has been getting a lot of attention lately — treats everything as one blob. You can't hide the skin to look at the bones or anything like that.

So what they did was organize the Gaussian splats into separate layers — skin, bone, organs, blood vessels — and you can toggle each one on and off in VR.

### [SLIDE 8 — What They Achieved]

The big thing is it actually runs in real time on a Meta Quest 3, which is a standalone headset — no desktop GPU needed. You can hide layers one at a time to explore the anatomy, and the visual quality is close to traditional volume rendering but at way less computational cost.

### [SLIDE 9 — My Takeaways]

This one connected to class for me because we've been building the rendering pipeline from scratch — vertices, shaders, buffers. This paper is kind of showing where that's headed: representations that skip polygons entirely and render from learned point clouds instead.

I also think about the access angle. This takes expensive medical visualization that normally needs a powerful workstation and puts it on a $500 headset. That could really help with medical education, especially in places that can't afford fancy lab setups.

And honestly, both papers have the same theme when you step back — using ML to take specialized tools and make them simpler and more accessible. One unifies noise, the other makes volume rendering portable. I think that's where a lot of graphics research is going.

### [SLIDE 10 — Closing]

Alright, that's my review. Thanks for watching.

---

### Timing Notes
- Paper 1 (Slides 1–4): ~1:20–1:40
- Paper 2 (Slides 5–9): ~1:20–1:40
- Total: ~2:40–3:20

### Tips
- Don't read this word for word — just use the bold headers as cues
- Pause briefly at the transition slide between papers
- The synthesis parts should feel like you're thinking out loud, not presenting
