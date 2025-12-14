import type { Vec2 } from "./math";
import { v, sub, normalize, add, mul, len } from "./math";
import type { RiderState } from "./physics";

/**
 * Available character types
 */
export const CHARACTER_TYPES = ["ball", "snowboarder", "skateboarder", "horse"] as const;
export type CharacterType = (typeof CHARACTER_TYPES)[number];

/**
 * Character metadata for display
 */
export interface CharacterInfo {
  id: CharacterType;
  name: string;
  description: string;
  emoji: string;
}

/**
 * Character information for UI display
 */
export const CHARACTERS: Record<CharacterType, CharacterInfo> = {
  ball: {
    id: "ball",
    name: "Classic Ball",
    description: "The original rider with a trailing flag",
    emoji: "🔴",
  },
  snowboarder: {
    id: "snowboarder",
    name: "Snowboarder",
    description: "Shredding the slopes in style",
    emoji: "🏂",
  },
  skateboarder: {
    id: "skateboarder",
    name: "Skateboarder",
    description: "Kickflipping through the lines",
    emoji: "🛹",
  },
  horse: {
    id: "horse",
    name: "Horse Rider",
    description: "Galloping majestically",
    emoji: "🏇",
  },
};

/**
 * Colors for each character
 */
export const CHARACTER_COLORS = {
  ball: {
    primary: "#ef4444",
    secondary: "#dc2626",
    accent: "#ffffff",
    flag: "#22c55e",
  },
  snowboarder: {
    primary: "#3b82f6",
    secondary: "#1d4ed8",
    board: "#f59e0b",
    skin: "#ffd4a3",
    jacket: "#0ea5e9",
    pants: "#1e293b",
    goggles: "#fbbf24",
  },
  skateboarder: {
    primary: "#8b5cf6",
    secondary: "#7c3aed",
    board: "#84cc16",
    wheels: "#71717a",
    skin: "#ffd4a3",
    shirt: "#f97316",
    pants: "#374151",
    helmet: "#ef4444",
  },
  horse: {
    body: "#92400e",
    mane: "#451a03",
    rider: "#1e40af",
    skin: "#ffd4a3",
    saddle: "#7c2d12",
    reins: "#78350f",
  },
} as const;

/**
 * Draw the classic ball rider with flag
 */
export function drawBallRider(
  ctx: CanvasRenderingContext2D,
  zoom: number,
  pos: Vec2,
  velocity: Vec2,
  frame: number
): void {
  const radius = 10;
  const colors = CHARACTER_COLORS.ball;

  // Draw motion blur trail
  const speed = len(velocity) * 60;
  if (speed > 1) {
    const trailLen = Math.min(speed * 2, 50);
    const dir = normalize(velocity);
    const gradient = ctx.createLinearGradient(
      pos.x,
      pos.y,
      pos.x - dir.x * trailLen,
      pos.y - dir.y * trailLen
    );
    gradient.addColorStop(0, "rgba(239, 68, 68, 0.3)");
    gradient.addColorStop(1, "rgba(239, 68, 68, 0)");

    ctx.strokeStyle = gradient;
    ctx.lineWidth = radius * 1.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(pos.x - dir.x * trailLen, pos.y - dir.y * trailLen);
    ctx.stroke();
  }

  // Main body
  ctx.fillStyle = colors.primary;
  ctx.strokeStyle = colors.secondary;
  ctx.lineWidth = 2 / zoom;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Face direction indicator
  if (speed > 0.5) {
    const faceDir = normalize(velocity);
    ctx.fillStyle = colors.accent;
    ctx.beginPath();
    ctx.arc(pos.x + faceDir.x * 4, pos.y + faceDir.y * 4, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Flag pole and flag
  const flagWave = Math.sin(frame * 0.3) * 2;
  const poleHeight = 20;
  
  ctx.strokeStyle = "#666666";
  ctx.lineWidth = 1.5 / zoom;
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y - radius);
  ctx.lineTo(pos.x, pos.y - radius - poleHeight);
  ctx.stroke();

  // Animated flag
  ctx.fillStyle = colors.flag;
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y - radius - poleHeight);
  ctx.quadraticCurveTo(
    pos.x + 8 + flagWave,
    pos.y - radius - poleHeight + 4,
    pos.x + 12 + flagWave * 0.5,
    pos.y - radius - poleHeight + 6
  );
  ctx.lineTo(pos.x, pos.y - radius - poleHeight + 10);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw snowboarder character
 */
export function drawSnowboarder(
  ctx: CanvasRenderingContext2D,
  zoom: number,
  pos: Vec2,
  velocity: Vec2,
  frame: number
): void {
  const colors = CHARACTER_COLORS.snowboarder;
  const speed = len(velocity) * 60;
  const dir = speed > 0.5 ? normalize(velocity) : v(1, 0);
  
  // Determine facing direction
  const facingRight = dir.x >= 0;
  const flip = facingRight ? 1 : -1;
  
  // Animation based on speed and frame
  const bounce = Math.sin(frame * 0.2) * (speed > 2 ? 1.5 : 0.5);
  const lean = Math.atan2(dir.y, Math.abs(dir.x)) * 0.5;

  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(lean);

  // Snow spray when moving fast
  if (speed > 5) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    for (let i = 0; i < 5; i++) {
      const spray = Math.random() * 10;
      const sx = -flip * (10 + spray);
      const sy = 5 + Math.random() * 5;
      ctx.beginPath();
      ctx.arc(sx, sy, 1 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Snowboard
  ctx.fillStyle = colors.board;
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1 / zoom;
  ctx.beginPath();
  ctx.ellipse(0, 8, 18, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Bindings
  ctx.fillStyle = "#333";
  ctx.fillRect(-6, 6, 4, 4);
  ctx.fillRect(2, 6, 4, 4);

  // Legs
  ctx.strokeStyle = colors.pants;
  ctx.lineWidth = 4 / zoom;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-4, 5);
  ctx.lineTo(-3, -2 + bounce);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(4, 5);
  ctx.lineTo(3, -2 + bounce);
  ctx.stroke();

  // Body/Jacket
  ctx.fillStyle = colors.jacket;
  ctx.beginPath();
  ctx.ellipse(0, -8 + bounce, 6, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Arms
  ctx.strokeStyle = colors.jacket;
  ctx.lineWidth = 3 / zoom;
  const armWave = Math.sin(frame * 0.15) * 3;
  ctx.beginPath();
  ctx.moveTo(-5, -8 + bounce);
  ctx.lineTo(-12 - armWave, -4 + bounce);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(5, -8 + bounce);
  ctx.lineTo(12 + armWave, -4 + bounce);
  ctx.stroke();

  // Head
  ctx.fillStyle = colors.skin;
  ctx.beginPath();
  ctx.arc(0, -18 + bounce, 5, 0, Math.PI * 2);
  ctx.fill();

  // Goggles
  ctx.fillStyle = colors.goggles;
  ctx.fillRect(-4, -20 + bounce, 8, 3);

  // Helmet
  ctx.fillStyle = colors.primary;
  ctx.beginPath();
  ctx.arc(0, -20 + bounce, 5, Math.PI, 0);
  ctx.fill();

  ctx.restore();
}

/**
 * Draw skateboarder character
 */
export function drawSkateboarder(
  ctx: CanvasRenderingContext2D,
  zoom: number,
  pos: Vec2,
  velocity: Vec2,
  frame: number
): void {
  const colors = CHARACTER_COLORS.skateboarder;
  const speed = len(velocity) * 60;
  const dir = speed > 0.5 ? normalize(velocity) : v(1, 0);
  
  const facingRight = dir.x >= 0;
  const flip = facingRight ? 1 : -1;
  const lean = Math.atan2(dir.y, Math.abs(dir.x)) * 0.4;
  const bounce = Math.sin(frame * 0.25) * (speed > 2 ? 1 : 0.3);

  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(lean);

  // Skateboard deck
  ctx.fillStyle = colors.board;
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1 / zoom;
  ctx.beginPath();
  ctx.roundRect(-14, 6, 28, 4, 2);
  ctx.fill();
  ctx.stroke();

  // Wheels
  ctx.fillStyle = colors.wheels;
  const wheelSpin = frame * 0.5;
  for (const wx of [-10, 10]) {
    ctx.beginPath();
    ctx.arc(wx, 12, 3, 0, Math.PI * 2);
    ctx.fill();
    // Wheel detail
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 0.5 / zoom;
    ctx.beginPath();
    ctx.moveTo(wx, 12 - 2);
    ctx.lineTo(wx, 12 + 2);
    ctx.stroke();
  }

  // Trucks
  ctx.fillStyle = "#888";
  ctx.fillRect(-12, 8, 6, 2);
  ctx.fillRect(6, 8, 6, 2);

  // Legs
  ctx.strokeStyle = colors.pants;
  ctx.lineWidth = 4 / zoom;
  ctx.lineCap = "round";
  // Back leg
  ctx.beginPath();
  ctx.moveTo(-5, 5);
  ctx.quadraticCurveTo(-6, -2, -4, -6 + bounce);
  ctx.stroke();
  // Front leg
  ctx.beginPath();
  ctx.moveTo(5, 5);
  ctx.quadraticCurveTo(4, -2, 2, -6 + bounce);
  ctx.stroke();

  // Body
  ctx.fillStyle = colors.shirt;
  ctx.beginPath();
  ctx.ellipse(0, -12 + bounce, 5, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Arms
  ctx.strokeStyle = colors.shirt;
  ctx.lineWidth = 3 / zoom;
  const armBalance = Math.sin(frame * 0.2) * 5;
  ctx.beginPath();
  ctx.moveTo(-4, -12 + bounce);
  ctx.lineTo(-10, -8 + bounce + armBalance);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(4, -12 + bounce);
  ctx.lineTo(10, -8 + bounce - armBalance);
  ctx.stroke();

  // Head
  ctx.fillStyle = colors.skin;
  ctx.beginPath();
  ctx.arc(0, -22 + bounce, 5, 0, Math.PI * 2);
  ctx.fill();

  // Helmet
  ctx.fillStyle = colors.helmet;
  ctx.beginPath();
  ctx.arc(0, -24 + bounce, 5, Math.PI * 1.2, Math.PI * 1.8);
  ctx.lineTo(4, -22 + bounce);
  ctx.lineTo(-4, -22 + bounce);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Draw horse rider character
 */
export function drawHorseRider(
  ctx: CanvasRenderingContext2D,
  zoom: number,
  pos: Vec2,
  velocity: Vec2,
  frame: number
): void {
  const colors = CHARACTER_COLORS.horse;
  const speed = len(velocity) * 60;
  const dir = speed > 0.5 ? normalize(velocity) : v(1, 0);
  
  const facingRight = dir.x >= 0;
  const flip = facingRight ? 1 : -1;
  const lean = Math.atan2(dir.y, Math.abs(dir.x)) * 0.3;
  
  // Galloping animation
  const gallop = speed > 2 ? Math.sin(frame * 0.4) : Math.sin(frame * 0.15);
  const bodyBob = gallop * 2;

  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(lean);
  ctx.scale(flip, 1);

  // Dust clouds when galloping
  if (speed > 8) {
    ctx.fillStyle = "rgba(139, 69, 19, 0.3)";
    for (let i = 0; i < 3; i++) {
      const dx = -20 - Math.random() * 15;
      const dy = 10 + Math.random() * 5;
      ctx.beginPath();
      ctx.arc(dx, dy, 2 + Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Back legs
  ctx.strokeStyle = colors.body;
  ctx.lineWidth = 4 / zoom;
  ctx.lineCap = "round";
  const backLegAngle = gallop * 0.4;
  ctx.beginPath();
  ctx.moveTo(-8, 5);
  ctx.lineTo(-10 + Math.sin(backLegAngle) * 5, 15);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-5, 5);
  ctx.lineTo(-7 + Math.sin(backLegAngle + 0.5) * 5, 15);
  ctx.stroke();

  // Front legs
  const frontLegAngle = gallop * 0.4 + Math.PI;
  ctx.beginPath();
  ctx.moveTo(8, 5);
  ctx.lineTo(10 + Math.sin(frontLegAngle) * 5, 15);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(5, 5);
  ctx.lineTo(7 + Math.sin(frontLegAngle + 0.5) * 5, 15);
  ctx.stroke();

  // Horse body
  ctx.fillStyle = colors.body;
  ctx.beginPath();
  ctx.ellipse(0, 0 + bodyBob, 15, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Saddle
  ctx.fillStyle = colors.saddle;
  ctx.beginPath();
  ctx.ellipse(0, -4 + bodyBob, 6, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Horse neck
  ctx.fillStyle = colors.body;
  ctx.beginPath();
  ctx.moveTo(10, -3 + bodyBob);
  ctx.quadraticCurveTo(18, -10 + bodyBob, 20, -18 + bodyBob);
  ctx.lineTo(14, -18 + bodyBob);
  ctx.quadraticCurveTo(12, -8 + bodyBob, 8, -3 + bodyBob);
  ctx.closePath();
  ctx.fill();

  // Horse head
  ctx.fillStyle = colors.body;
  ctx.beginPath();
  ctx.ellipse(22, -20 + bodyBob, 6, 4, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Mane
  ctx.strokeStyle = colors.mane;
  ctx.lineWidth = 3 / zoom;
  const maneWave = Math.sin(frame * 0.3) * 2;
  ctx.beginPath();
  ctx.moveTo(12, -15 + bodyBob);
  ctx.quadraticCurveTo(14 + maneWave, -22 + bodyBob, 18, -22 + bodyBob);
  ctx.stroke();

  // Tail
  ctx.beginPath();
  ctx.moveTo(-15, 0 + bodyBob);
  ctx.quadraticCurveTo(-22 + maneWave, 5 + bodyBob, -25 + maneWave * 0.5, 10 + bodyBob);
  ctx.stroke();

  // Reins
  ctx.strokeStyle = colors.reins;
  ctx.lineWidth = 1 / zoom;
  ctx.beginPath();
  ctx.moveTo(20, -16 + bodyBob);
  ctx.quadraticCurveTo(10, -10 + bodyBob, 0, -8 + bodyBob);
  ctx.stroke();

  // Rider legs
  ctx.strokeStyle = colors.rider;
  ctx.lineWidth = 3 / zoom;
  ctx.beginPath();
  ctx.moveTo(-2, -6 + bodyBob);
  ctx.lineTo(-4, 4 + bodyBob);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(2, -6 + bodyBob);
  ctx.lineTo(4, 4 + bodyBob);
  ctx.stroke();

  // Rider body
  ctx.fillStyle = colors.rider;
  ctx.beginPath();
  ctx.ellipse(0, -14 + bodyBob, 4, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rider arms (holding reins)
  ctx.strokeStyle = colors.rider;
  ctx.lineWidth = 2 / zoom;
  ctx.beginPath();
  ctx.moveTo(-3, -14 + bodyBob);
  ctx.lineTo(-2, -8 + bodyBob);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(3, -14 + bodyBob);
  ctx.lineTo(2, -8 + bodyBob);
  ctx.stroke();

  // Rider head
  ctx.fillStyle = colors.skin;
  ctx.beginPath();
  ctx.arc(0, -24 + bodyBob, 4, 0, Math.PI * 2);
  ctx.fill();

  // Riding helmet
  ctx.fillStyle = "#1e293b";
  ctx.beginPath();
  ctx.arc(0, -26 + bodyBob, 4, Math.PI, 0);
  ctx.fill();

  ctx.restore();
}

/**
 * Draw rider based on character type
 */
export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  zoom: number,
  rider: RiderState,
  characterType: CharacterType,
  velocity: Vec2
): void {
  const pos = rider.points[0]?.pos ?? v(0, 0);
  const frame = rider.frame;

  switch (characterType) {
    case "ball":
      drawBallRider(ctx, zoom, pos, velocity, frame);
      break;
    case "snowboarder":
      drawSnowboarder(ctx, zoom, pos, velocity, frame);
      break;
    case "skateboarder":
      drawSkateboarder(ctx, zoom, pos, velocity, frame);
      break;
    case "horse":
      drawHorseRider(ctx, zoom, pos, velocity, frame);
      break;
    default:
      drawBallRider(ctx, zoom, pos, velocity, frame);
  }
}

/**
 * Draw character preview for selection UI (static pose)
 */
export function drawCharacterPreview(
  ctx: CanvasRenderingContext2D,
  characterType: CharacterType,
  x: number,
  y: number,
  size: number,
  frame: number
): void {
  ctx.save();
  
  const scale = size / 60; // Base character is ~60px
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  
  // Draw with gentle animation
  const velocity = v(0.05, 0); // Slight movement for animation
  
  switch (characterType) {
    case "ball":
      drawBallRider(ctx, 1, v(0, 0), velocity, frame);
      break;
    case "snowboarder":
      drawSnowboarder(ctx, 1, v(0, 0), velocity, frame);
      break;
    case "skateboarder":
      drawSkateboarder(ctx, 1, v(0, 0), velocity, frame);
      break;
    case "horse":
      drawHorseRider(ctx, 1, v(0, 0), velocity, frame);
      break;
  }
  
  ctx.restore();
}

