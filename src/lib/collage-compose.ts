"use client";

import { COLLAGE_MIME_TYPE, MAX_COLLAGE_BYTES } from "@/lib/config";
import {
  collageGridLayout,
  POSTER_COLORS,
  POSTER_TEXT_DEFAULTS,
  POSTER_TYPOGRAPHY,
  SVG_FLOWERS,
} from "@/lib/collage-style";

export { collageGrid } from "@/lib/collage-style";

export type CollageComposeInput = {
  blobs: Blob[];
  title?: string;
  subtitle?: string;
};

const FRAME_WIDTH = 1080;
const DESIGN_WIDTH = 1000;
const SCALE = FRAME_WIDTH / DESIGN_WIDTH;

function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gagal memuat foto"));
    };
    image.src = url;
  });
}

function loadSvgImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gagal memuat dekorasi"));
    };
    image.src = url;
  });
}

function toJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Gagal membuat kolase"));
      },
      COLLAGE_MIME_TYPE,
      quality,
    );
  });
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function drawCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const offsetX = x + (width - drawWidth) / 2;
  const offsetY = y + (height - drawHeight) / 2;
  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

function resolveFamily(cssVariable: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(cssVariable)
    .trim();
  return value || fallback;
}

async function ensureFonts(titleFamily: string, bodyFamily: string) {
  if (typeof document === "undefined" || !document.fonts) return;
  try {
    await document.fonts.ready;
    await Promise.all([
      document.fonts.load(`76px ${titleFamily}`),
      document.fonts.load(`12px ${bodyFamily}`),
    ]);
  } catch {
    return;
  }
}

function drawSpacedText(
  context: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  spacing: number,
) {
  const characters = Array.from(text);
  if (characters.length === 0) return;
  const widths = characters.map((char) => context.measureText(char).width);
  const total =
    widths.reduce((sum, width) => sum + width, 0) +
    spacing * Math.max(0, characters.length - 1);
  let x = centerX - total / 2;
  const previousAlign = context.textAlign;
  context.textAlign = "left";
  characters.forEach((char, index) => {
    context.fillText(char, x, y);
    x += widths[index] + spacing;
  });
  context.textAlign = previousAlign;
}

export async function composeCollage(
  input: CollageComposeInput,
): Promise<Blob> {
  const layout = collageGridLayout(input.blobs.length);
  const images = await Promise.all(input.blobs.map(loadImage));
  const [flowerTop, flowerSide, flowerBottom] = await Promise.all([
    loadSvgImage(SVG_FLOWERS.top),
    loadSvgImage(SVG_FLOWERS.side),
    loadSvgImage(SVG_FLOWERS.bottom),
  ]);

  const titleFamily = resolveFamily(
    "--font-great-vibes",
    `"${POSTER_TYPOGRAPHY.title.family}", ${POSTER_TYPOGRAPHY.title.fallback}`,
  );
  const bodyFamily = resolveFamily(
    "--font-serif",
    `"${POSTER_TYPOGRAPHY.subtitle.family}", ${POSTER_TYPOGRAPHY.subtitle.fallback}`,
  );
  await ensureFonts(titleFamily, bodyFamily);

  const padTop = layout.padding.top * SCALE;
  const padX = layout.padding.left * SCALE;
  const padBottom = layout.padding.bottom * SCALE;
  const gapX = layout.gapX * SCALE;
  const gapY = layout.gapY * SCALE;
  const contentWidth = FRAME_WIDTH - padX * 2;
  const cardWidth =
    (contentWidth - gapX * (layout.cols - 1)) / layout.cols;
  const cardHeight = cardWidth / layout.aspect;
  const gridHeight =
    layout.rows * cardHeight + gapY * (layout.rows - 1);

  const titleSize = layout.titleSize * SCALE;
  const subtitleSize = POSTER_TYPOGRAPHY.subtitle.size * SCALE;
  const subtitleSpacing = POSTER_TYPOGRAPHY.subtitle.letterSpacing * SCALE;
  const subtitleMargin = 12 * SCALE;
  const headerTextHeight =
    titleSize * POSTER_TYPOGRAPHY.title.lineHeight +
    subtitleMargin +
    subtitleSize;
  const headerHeight = Math.max(
    layout.headerMinHeight * SCALE,
    headerTextHeight,
  );
  const headerMargin = layout.headerMarginBottom * SCALE;
  const gridTop = padTop + headerHeight + headerMargin;
  const neededHeight = gridTop + gridHeight + padBottom;
  const canvasHeight = Math.round(
    Math.max(layout.minHeight * SCALE, neededHeight),
  );

  const canvas = document.createElement("canvas");
  canvas.width = FRAME_WIDTH;
  canvas.height = canvasHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas tidak tersedia");

  context.fillStyle = POSTER_COLORS.paper;
  context.fillRect(0, 0, canvas.width, canvas.height);

  images.forEach((image, index) => {
    const column = index % layout.cols;
    const row = Math.floor(index / layout.cols);
    const cardX = padX + column * (cardWidth + gapX);
    const cardY = gridTop + row * (cardHeight + gapY);
    const childNumber = index + 1;
    const rotation =
      childNumber % 3 === 2 ? 0.6 : childNumber % 3 === 0 ? -0.5 : 0;
    const centerX = cardX + cardWidth / 2;
    const centerY = cardY + cardHeight / 2;

    context.save();
    context.translate(centerX, centerY);
    context.rotate((rotation * Math.PI) / 180);
    context.translate(-centerX, -centerY);

    context.shadowColor = "rgba(73, 59, 52, 0.157)";
    context.shadowBlur = 12 * SCALE;
    context.shadowOffsetX = 6 * SCALE;
    context.shadowOffsetY = 8 * SCALE;
    context.fillStyle = POSTER_COLORS.frame;
    roundedRect(context, cardX, cardY, cardWidth, cardHeight, 3 * SCALE);
    context.fill();

    context.shadowColor = "transparent";
    context.shadowBlur = 0;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;

    const cardPaddingX = layout.polaroidPadding.x * SCALE;
    const cardPaddingTop = layout.polaroidPadding.top * SCALE;
    const cardPaddingBottom =
      layout.polaroidPadding.bottom !== undefined
        ? layout.polaroidPadding.bottom * SCALE
        : (layout.polaroidPadding.bottomRatio ?? 0) * cardWidth;
    const imageX = cardX + cardPaddingX;
    const imageY = cardY + cardPaddingTop;
    const imageWidth = cardWidth - cardPaddingX * 2;
    const imageHeight = cardHeight - cardPaddingTop - cardPaddingBottom;

    context.save();
    context.beginPath();
    context.rect(imageX, imageY, imageWidth, imageHeight);
    context.clip();
    const placeholder = context.createLinearGradient(
      imageX,
      imageY,
      imageX + imageWidth,
      imageY + imageHeight,
    );
    placeholder.addColorStop(0, POSTER_COLORS.placeholderStart);
    placeholder.addColorStop(1, POSTER_COLORS.placeholderEnd);
    context.fillStyle = placeholder;
    context.fillRect(imageX, imageY, imageWidth, imageHeight);
    drawCover(context, image, imageX, imageY, imageWidth, imageHeight);
    context.restore();

    const numberSize = layout.numberSize * SCALE;
    const numberSpacing = POSTER_TYPOGRAPHY.number.letterSpacing * SCALE;
    context.fillStyle = POSTER_COLORS.number;
    context.font = `${numberSize}px ${bodyFamily}`;
    context.textBaseline = "middle";
    drawSpacedText(
      context,
      String(index + 1).padStart(2, "0"),
      centerX,
      cardY + cardHeight - layout.numberBottom * SCALE - numberSize / 2,
      numberSpacing,
    );

    context.restore();
  });

  const headerCenterY = padTop + headerHeight / 2;
  const titleY = headerCenterY - (subtitleSize + subtitleMargin) / 2;

  context.fillStyle = POSTER_COLORS.titleInk;
  context.font = `${titleSize}px ${titleFamily}`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(
    input.title ?? "",
    FRAME_WIDTH / 2,
    titleY,
    contentWidth * 0.75,
  );

  context.fillStyle = POSTER_COLORS.subtitle;
  context.font = `${subtitleSize}px ${bodyFamily}`;
  context.textBaseline = "middle";
  drawSpacedText(
    context,
    (input.subtitle ?? "").toUpperCase(),
    FRAME_WIDTH / 2,
    titleY +
      (titleSize * POSTER_TYPOGRAPHY.title.lineHeight) / 2 +
      subtitleMargin +
      subtitleSize / 2,
    subtitleSpacing,
  );

  const topWidth = FRAME_WIDTH * 0.16;
  context.drawImage(flowerTop, -FRAME_WIDTH * 0.01, 0, topWidth, topWidth);

  const sideWidth = FRAME_WIDTH * 0.14;
  const sideHeight = sideWidth * (300 / 180);
  context.drawImage(
    flowerSide,
    FRAME_WIDTH - FRAME_WIDTH * 0.11,
    canvasHeight * 0.42,
    sideWidth,
    sideHeight,
  );

  const bottomWidth = FRAME_WIDTH * 0.34;
  const bottomHeight = bottomWidth * (230 / 340);
  context.drawImage(
    flowerBottom,
    FRAME_WIDTH * 0.32,
    canvasHeight + canvasHeight * 0.02 - bottomHeight,
    bottomWidth,
    bottomHeight,
  );

  const footerSize = POSTER_TYPOGRAPHY.footer.size * SCALE;
  const footerSpacing = POSTER_TYPOGRAPHY.footer.letterSpacing * SCALE;
  context.fillStyle = POSTER_COLORS.footer;
  context.font = `${footerSize}px ${bodyFamily}`;
  context.textBaseline = "middle";
  drawSpacedText(
    context,
    POSTER_TEXT_DEFAULTS.footerNote,
    FRAME_WIDTH / 2,
    canvasHeight - (15 + POSTER_TYPOGRAPHY.footer.size / 2) * SCALE,
    footerSpacing,
  );

  let blob = await toJpeg(canvas, 0.92);
  for (
    let quality = 0.85;
    quality >= 0.4 && blob.size > MAX_COLLAGE_BYTES;
    quality -= 0.1
  ) {
    blob = await toJpeg(canvas, quality);
  }
  return blob;
}
