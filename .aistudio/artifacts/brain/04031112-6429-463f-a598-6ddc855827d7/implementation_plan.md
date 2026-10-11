# Implementation Plan: Advanced CRT Shader, Generative Audio, Biometric Mirror & Real-Time Panopticon

This plan elevates **Halcyon // Chaos Click** into an engineering tour-de-force while strictly preserving all existing game logic, state, and click progression rules.

---

## 1. Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT ARCHITECTURE                             │
│                                                                        │
│   ┌────────────────────┐   read-only    ┌──────────────────────────┐   │
│   │ Existing App Logic │───────────────▶│ Visual & Audio Systems   │   │
│   │ (App.tsx, Stage,   │                │ - WebGL CRT Postprocessor│   │
│   │  Chaos Value)      │                │ - Web Audio Drone Synth  │   │
│   └────────────────────┘                │ - Biometric Dither Cam   │   │
│             │                           └──────────────────────────┘   │
│             │ broadcast worker telemetry                               │
│             ▼                                                          │
│   ┌────────────────────┐                                               │
│   │ Panopticon Client  │◀──────────────┐                               │
│   │ (WebSocket Hook)   │               │                               │
│   └────────────────────┘               │ bidirectional live events     │
└─────────────┬──────────────────────────┼───────────────────────────────┘
              │                          │
              ▼                          ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     FULL-STACK SERVER (server.ts)                      │
│                                                                        │
│  - Express + Vite middleware dev server                                │
│  - WebSocket server engine                                             │
│  - Global Workforce Telemetry Aggregator (Collective Chaos Meter,      │
│    live click pulses, anonymous worker heartbeats, synchronized alarms)│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Key Advanced Systems to Implement

### A. Full WebGL 3D CRT Shader & Degaussing Tube (`src/components/CrtShaderCanvas.tsx`)
- **Shader Pipeline:** A lightweight, high-performance raw WebGL fragment shader canvas rendered over the viewport (`pointer-events: none`).
- **Barrel Curvature & Spherical Bulge:** Mathematically warps screen coordinate UVs to create authentic convex glass curvature:
  $$\text{uv}' = \text{uv} + (\text{uv} - 0.5) \cdot \|\text{uv} - 0.5\|^2 \cdot k$$
- **Phosphor Persistence & Afterglow:** Simulates P22/P31 phosphor decay trails that smear bright elements when moving.
- **Degaussing Distortion Coil:** An interactive physical "Degauss" magnetic coil effect triggering magnetic wobble, color fringing, and chromatic convergence ripples on click spikes or via a dedicated instrument button.

### B. Procedural Web Audio Ambient Drone & Mains-Hum Synthesizer (`src/utils/droneSynthesizer.ts`)
- **Calm Corporate Mode (Stage 0):** Faint warm binaural pink noise filtered with gentle high-pass curves and calming subtle acoustic harmonics.
- **Harmonic Degradation Engine:** Synthesizes two detuned low-frequency sine/saw oscillators (55Hz / 60Hz mains hum) using Web Audio `OscillatorNode`, `BiquadFilterNode`, and `GainNode`.
- **Geiger / Static Crackle Generator:** Procedural crackle generated directly via `AudioBufferSourceNode` with random brownian noise bursts proportional to `chaos / 100`.

### C. Biometric CRT Surveillance Mirror (`src/components/BiometricWebcamMirror.tsx`)
- **Privacy-Safe Client-Only Video Stream:** Requests local camera feed with user permission during "Presence Verification" or when clicking the Telescreen eye.
- **Phosphor Dither Filter:** Canvas-based 1-bit Bayer matrix dithering or ASCII character matrix rendering the user's face in monochromatic amber phosphor.
- **In-World Integration:** Embedded seamlessly into the right-hand inspection terminal or Telescreen bank without breaking layout flow.

### D. Full-Stack Real-time Panopticon Network (`server.ts` & `src/utils/socketPanopticon.ts`)
- **Full-Stack Server Conversion:** Set up Express with Vite middlewares mounted in dev (`tsx server.ts`).
- **Global Workforce Telemetry:**
  - Displays a live ticker: *"Worker #4089 in Frankfurt clicked Comply"*, *"Worker #1042 triggered Meltdown"*.
  - Global Hive Entropy: aggregate real-time chaos contributed by all connected browser sessions.
  - Broadcasts collective "Mandatory Calisthenics" or "Security Lockdowns" when collective entropy surpasses thresholds.

---

## 3. Implementation Steps

1. **Server Setup:**
   - Add `server.ts` running Express + `ws` with Vite middleware.
   - Update `package.json` dev script: `"dev": "tsx server.ts"`.
2. **Audio & Shader Modules:**
   - Implement `droneSynthesizer.ts` and hook its intensity strictly to the existing `chaos` state in a read-only way.
   - Implement `CrtShaderCanvas.tsx` as a transparent hardware-accelerated overlay component.
3. **Biometric Mirror Component:**
   - Create `BiometricWebcamMirror.tsx` with a toggleable surveillance monitor panel.
4. **Panopticon Telemetry:**
   - Connect client events to the WebSocket server without modifying internal gameplay state handlers.
5. **Verification & Testing:**
   - Compile and verify dev server build, ensuring zero regression of existing click rules and visual guidelines.
