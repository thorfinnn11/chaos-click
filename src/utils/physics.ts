/**
 * 2D Floating Physics Engine for Gravity Failure Mode
 * Simulates weightlessness, bounce collisions with screen bounds,
 * and mouse cursor repulsion forces.
 */

export interface PhysicsBody {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  width: number;
  height: number;
}

export class PhysicsWorld {
  public bodies: PhysicsBody[] = [];
  private animFrameId: number | null = null;
  private onUpdate: ((bodies: PhysicsBody[]) => void) | null = null;
  private mousePos: { x: number; y: number } | null = null;
  private isActive: boolean = false;

  constructor() {
    this.handleMouseMove = this.handleMouseMove.bind(this);
  }

  public initBodies(count: number = 3) {
    this.bodies = [];
    const screenW = typeof window !== 'undefined' ? window.innerWidth : 1000;
    const screenH = typeof window !== 'undefined' ? window.innerHeight : 800;

    for (let i = 0; i < count; i++) {
      const startX = (screenW / (count + 1)) * (i + 1) - 140;
      const startY = screenH * 0.45;

      this.bodies.push({
        id: `card-${i}`,
        x: startX,
        y: startY,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 2 - 1,
        rotation: (Math.random() - 0.5) * 10,
        vRot: (Math.random() - 0.5) * 1.5,
        width: 260,
        height: 140,
      });
    }
  }

  public start(onUpdate: (bodies: PhysicsBody[]) => void) {
    if (this.isActive) return;
    this.isActive = true;
    this.onUpdate = onUpdate;

    if (this.bodies.length === 0) {
      this.initBodies(3);
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('pointermove', this.handleMouseMove);
    }

    const tick = () => {
      if (!this.isActive) return;
      this.step();
      if (this.onUpdate) {
        this.onUpdate([...this.bodies]);
      }
      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  public stop() {
    this.isActive = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('pointermove', this.handleMouseMove);
    }
  }

  private handleMouseMove(e: PointerEvent) {
    this.mousePos = { x: e.clientX, y: e.clientY };
  }

  private step() {
    const screenW = typeof window !== 'undefined' ? window.innerWidth : 1000;
    const screenH = typeof window !== 'undefined' ? window.innerHeight : 800;
    const friction = 0.992;
    const bounce = 0.85;

    for (const body of this.bodies) {
      // Repulsion force from cursor
      if (this.mousePos) {
        const centerX = body.x + body.width / 2;
        const centerY = body.y + body.height / 2;
        const dx = centerX - this.mousePos.x;
        const dy = centerY - this.mousePos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 180 && dist > 1) {
          const force = (180 - dist) / 180 * 1.8;
          body.vx += (dx / dist) * force;
          body.vy += (dy / dist) * force;
          body.vRot += (Math.random() - 0.5) * 2;
        }
      }

      // Physics integration
      body.x += body.vx;
      body.y += body.vy;
      body.rotation += body.vRot;

      body.vx *= friction;
      body.vy *= friction;
      body.vRot *= friction;

      // Small ambient drifting float
      body.vy += Math.sin(Date.now() * 0.002 + body.x) * 0.08;

      // Wall bounce: left & right
      if (body.x < 15) {
        body.x = 15;
        body.vx = -body.vx * bounce;
        body.vRot *= -0.7;
      } else if (body.x + body.width > screenW - 15) {
        body.x = screenW - 15 - body.width;
        body.vx = -body.vx * bounce;
        body.vRot *= -0.7;
      }

      // Wall bounce: top & bottom
      if (body.y < 70) {
        body.y = 70;
        body.vy = -body.vy * bounce;
      } else if (body.y + body.height > screenH - 30) {
        body.y = screenH - 30 - body.height;
        body.vy = -body.vy * bounce;
      }
    }
  }
}
