import React, { useEffect, useRef } from 'react';

interface CrtShaderCanvasProps {
  chaos: number; // 0 to 100
  degaussTrigger?: number; // timestamp or counter to trigger magnetic degauss wobble
  isFrozen?: boolean;
  verticalHoldRoll?: number;
}

/**
 * High-performance WebGL 3D CRT Shader Overlay
 * Renders convex cathode-ray tube glass barrel curvature, scanline phosphor grid,
 * chromatic aberration fringes, magnetic degauss coil wobble, and frozen vertical-hold drift.
 * Pointer-events none: renders strictly visually above content.
 */
export const CrtShaderCanvas: React.FC<CrtShaderCanvasProps> = ({
  chaos,
  degaussTrigger = 0,
  isFrozen = false,
  verticalHoldRoll = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: true, antialias: false });
    if (!gl) return;

    // Vertex Shader
    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = (a_position + 1.0) * 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment Shader: authentic CRT spherical warp & phosphor glow
    const fsSource = `
      precision mediump float;
      varying vec2 v_uv;
      uniform float u_time;
      uniform float u_chaos;
      uniform float u_degauss;
      uniform float u_frozen;
      uniform float u_roll;
      uniform vec2 u_resolution;

      vec2 curve(vec2 uv) {
        // Barrel warp calculation
        vec2 centered = uv - 0.5;
        float r2 = dot(centered, centered);
        // Distortion intensity increases slightly with chaos
        float k = 0.08 + (u_chaos * 0.22);
        vec2 warped = uv + centered * (r2 * k);
        return warped;
      }

      void main() {
        vec2 uv = v_uv;

        // Frozen state: slow vertical hold drift and scanline wobble
        if (u_frozen > 0.5) {
          uv.y += sin(u_time * 2.8) * 0.007 + sin(uv.x * 25.0 + u_time * 4.0) * 0.003;
        }

        // Vertical roll during thaw
        if (u_roll > 0.001) {
          uv.y = fract(uv.y + u_roll);
        }

        // Degauss magnetic ripple
        if (u_degauss > 0.001) {
          float wave = sin(uv.y * 30.0 + u_time * 25.0) * u_degauss * 0.035;
          uv.x += wave;
          uv.y += cos(uv.x * 25.0 + u_time * 20.0) * u_degauss * 0.02;
        }

        vec2 warpedUv = curve(uv);

        // Dark vignette cutoff outside curved glass perimeter
        if (warpedUv.x < 0.0 || warpedUv.x > 1.0 || warpedUv.y < 0.0 || warpedUv.y > 1.0) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.95);
          return;
        }

        // Phosphor shadow-mask tri-color grille effect
        float scanline = sin(warpedUv.y * u_resolution.y * 1.5) * 0.5 + 0.5;
        float maskStrength = 0.04 + (u_chaos * 0.16);

        // Chromatic split (amber & rust fringing)
        float splitAmount = 0.001 + (u_chaos * 0.007);
        float amberFringe = sin(warpedUv.x * 400.0) * splitAmount;

        // Faint amber phosphor tint
        vec3 phosphorTint = vec3(0.96, 0.62, 0.04); // #F59E0B
        
        // Vignette falloff
        float d = distance(warpedUv, vec2(0.5));
        float vignette = smoothstep(0.72, 0.2, d);

        // Alpha calculation: subtle at stage 0, heavier at stage 5
        float alpha = (0.02 + (u_chaos * 0.22)) * (1.0 - scanline * maskStrength);
        
        // Degauss flash color burst
        if (u_degauss > 0.01) {
          alpha += u_degauss * 0.18;
          phosphorTint = mix(phosphorTint, vec3(0.2, 0.8, 1.0), u_degauss * 0.4);
        }

        gl_FragColor = vec4(phosphorTint * vignette, alpha);
      }
    `;

    function createShader(glCtx: WebGLRenderingContext, type: number, source: string) {
      const shader = glCtx.createShader(type);
      if (!shader) return null;
      glCtx.shaderSource(shader, source);
      glCtx.compileShader(shader);
      if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        glCtx.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Quad geometry
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1,
      ]),
      gl.STATIC_DRAW
    );

    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uTimeLoc = gl.getUniformLocation(program, 'u_time');
    const uChaosLoc = gl.getUniformLocation(program, 'u_chaos');
    const uDegaussLoc = gl.getUniformLocation(program, 'u_degauss');
    const uFrozenLoc = gl.getUniformLocation(program, 'u_frozen');
    const uRollLoc = gl.getUniformLocation(program, 'u_roll');
    const uResLoc = gl.getUniformLocation(program, 'u_resolution');

    let startTime = performance.now();
    let degaussVal = 0;

    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    let prevDegaussTrigger = degaussTrigger;

    const render = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      
      // Check degauss trigger
      if (degaussTrigger !== prevDegaussTrigger) {
        prevDegaussTrigger = degaussTrigger;
        degaussVal = 1.0;
      }
      if (degaussVal > 0.001) {
        degaussVal *= 0.94; // Decays over ~400ms
      } else {
        degaussVal = 0;
      }

      gl.uniform1f(uTimeLoc, elapsed);
      gl.uniform1f(uChaosLoc, Math.min(1.0, chaos / 100));
      gl.uniform1f(uDegaussLoc, degaussVal);
      gl.uniform1f(uFrozenLoc, isFrozen ? 1.0 : 0.0);
      gl.uniform1f(uRollLoc, verticalHoldRoll);
      if (canvas) {
        gl.uniform2f(uResLoc, canvas.width, canvas.height);
      }

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      gl.deleteProgram(program);
    };
  }, [chaos, degaussTrigger]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[85] w-full h-full"
      style={{
        mixBlendMode: 'screen',
        opacity: Math.max(0.2, Math.min(1, 0.2 + (chaos / 100) * 0.8))
      }}
    />
  );
};
