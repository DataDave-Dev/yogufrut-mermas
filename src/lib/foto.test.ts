import { describe, expect, test } from "vitest";
import { detectarTipoFoto } from "./foto";

const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(16).fill(0)]);

describe("detectarTipoFoto", () => {
  test("JPEG", () => expect(detectarTipoFoto(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg"));
  test("PNG", () => expect(detectarTipoFoto(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("image/png"));
  test("WebP", () => {
    const riff = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50];
    expect(detectarTipoFoto(bytes(...riff))).toBe("image/webp");
  });
  test("PDF disfrazado de imagen", () => expect(detectarTipoFoto(bytes(0x25, 0x50, 0x44, 0x46))).toBeNull());
});
