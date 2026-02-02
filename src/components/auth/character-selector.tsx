"use client";

import { useEffect, useRef } from "react";
import {
  CHARACTER_TYPES,
  CHARACTERS,
  drawCharacterPreview,
  type CharacterType,
} from "@/lib/linerider/characters";

interface CharacterSelectorProps {
  selectedCharacter: CharacterType;
  onSelect: (character: CharacterType) => void;
}

/**
 * Animated character preview canvas
 */
function CharacterPreview({
  character,
  isSelected,
  onClick,
}: {
  character: CharacterType;
  isSelected: boolean;
  onClick: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const animationRef = useRef<number | undefined>(undefined);
  // Track canvas error via ref to avoid setState in effect
  const canvasErrorRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      canvasErrorRef.current = true;
      return;
    }

    // Set up canvas for retina displays
    const dpr = window.devicePixelRatio || 1;
    const size = 80;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const animate = () => {
      ctx.clearRect(0, 0, size, size);

      // Draw background
      ctx.fillStyle = isSelected ? "#dbeafe" : "#f8fafc";
      ctx.beginPath();
      ctx.roundRect(0, 0, size, size, 8);
      ctx.fill();

      // Draw character centered
      drawCharacterPreview(
        ctx,
        character,
        size / 2,
        size / 2 + 5,
        50,
        frameRef.current
      );

      frameRef.current++;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [character, isSelected]);

  const info = CHARACTERS[character];

  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col items-center rounded-lg border-2 p-2 transition-all ${
        isSelected
          ? "border-blue-500 bg-blue-50 shadow-md"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      <canvas
        ref={canvasRef}
        className="rounded-md"
        style={{ imageRendering: "pixelated" }}
      />
      <span className="mt-1 text-xs font-medium text-slate-700">
        {info.name}
      </span>
      {isSelected && (
        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </button>
  );
}

export function CharacterSelector({
  selectedCharacter,
  onSelect,
}: CharacterSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">
        Choose Your Character
      </label>
      <div className="grid grid-cols-4 gap-2">
        {CHARACTER_TYPES.map((character) => (
          <CharacterPreview
            key={character}
            character={character}
            isSelected={selectedCharacter === character}
            onClick={() => onSelect(character)}
          />
        ))}
      </div>
      <p className="text-xs text-slate-500">
        {CHARACTERS[selectedCharacter].description}
      </p>
    </div>
  );
}
