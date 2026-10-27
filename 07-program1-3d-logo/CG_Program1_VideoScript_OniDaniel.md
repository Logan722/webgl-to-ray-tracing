# Video Presentation Script — CG Program 1
### Daniel Oni | CS 5382 | ~2 minutes

---

## INTRO — Show the running program [0:00–0:15]

> "Hey everyone, I'm Daniel Oni and this is my 3D Logo project for CS 5382. My initials are D-O, so I've got a 3D 'D' and 'O' sitting on a tapered pedestal cylinder. You can see the letters are auto-rotating on the pedestal right now, there's falling confetti, and I've got sliders to tilt and turn the whole scene in 3D."

**[ACTION: Move the sliders to show different viewing angles]**

---

## QUICK DEMO OF INTERACTIONS [0:15–0:40]

> "I've got three different interaction types. First, these two sliders — one tilts on the X-axis, the other turns on Y. That gives full 3D viewing."

**[ACTION: Drag both sliders]**

> "Second, buttons — this one toggles the letter auto-rotation on and off..."

**[ACTION: Click Stop Rotation, then click again]**

> "...and this one toggles the confetti, which actually falls and drifts."

**[ACTION: Click Show Confetti / Hide Confetti]**

> "And third, a dropdown for color themes."

**[ACTION: Switch to Ocean, then Neon, then back to Gold]**

---

## FEATURE DEEP DIVE #1 — Letter Centering Problem [0:40–1:15]

> "So the feature I want to focus on is how the letters spin on the pedestal while the pedestal stays still. In the vertex shader, I have a uniform called uExtraThetaY. When I draw the pedestal, I set it to zero — no extra rotation. When I draw the letters, I set it to the current auto-rotate angle. Same shader, different uniform values."

**[ACTION: Show the render function in the JS file, highlight the two drawArrays calls with different uniform values]**

> "But here's the challenge I ran into — the letters were orbiting around the pedestal instead of spinning in place. The reason was that my D and O weren't centered at x equals zero. Since the Y-axis rotation spins around x equals zero, anything off-center orbits. I had to calculate the combined bounding box of both letters, find the midpoint, and shift everything so the center lands exactly at zero. Once I did that, the spin looked right."

---

## FEATURE DEEP DIVE #2 — Confetti Animation in the Shader [1:15–1:45]

> "The other thing I'm proud of is the confetti. The assignment says don't re-upload vertices in the render loop, so the confetti positions are baked into the buffer. Instead, I animate them in the vertex shader using a time uniform. Each confetti piece uses its own position as a seed to get a unique fall speed. It falls down, and when it goes below the scene, it wraps back to the top. The vertex data never changes — only the time uniform updates each frame."

**[ACTION: Show the confetti section of the vertex shader — the uIsConfetti/uConfettiTime logic]**

---

## WRAP UP [1:45–2:00]

> "So the big takeaways — use uniforms to separate different objects' behavior in the same shader, center your geometry if it's going to rotate, and you can do animation without touching the vertex buffer by using time-based math in the shader. Thanks for watching!"

---

### Tips for recording:
- Keep the program running and visible the whole time
- Use split screen: program on one side, code on the other for the deep dives
- Don't rush the slider/button demos — let the audience see each change
- Practice once out loud to make sure it fits ~2 minutes
