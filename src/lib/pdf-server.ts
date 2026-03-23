class DOMMatrixNodeStub {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
  is2D: boolean;
  isIdentity: boolean;

  constructor(init?: Iterable<number> | ArrayLike<number>) {
    const values = init ? Array.from(init).slice(0, 6) : [];
    this.a = values[0] ?? 1;
    this.b = values[1] ?? 0;
    this.c = values[2] ?? 0;
    this.d = values[3] ?? 1;
    this.e = values[4] ?? 0;
    this.f = values[5] ?? 0;
    this.is2D = true;
    this.isIdentity =
      this.a === 1 &&
      this.b === 0 &&
      this.c === 0 &&
      this.d === 1 &&
      this.e === 0 &&
      this.f === 0;
  }

  get m11() { return this.a; }
  set m11(value: number) { this.a = value; }
  get m12() { return this.b; }
  set m12(value: number) { this.b = value; }
  get m21() { return this.c; }
  set m21(value: number) { this.c = value; }
  get m22() { return this.d; }
  set m22(value: number) { this.d = value; }
  get m41() { return this.e; }
  set m41(value: number) { this.e = value; }
  get m42() { return this.f; }
  set m42(value: number) { this.f = value; }

  multiplySelf(): this {
    return this;
  }

  preMultiplySelf(): this {
    return this;
  }

  translateSelf(tx: number = 0, ty: number = 0): this {
    this.e += tx;
    this.f += ty;
    return this;
  }

  scaleSelf(scaleX: number = 1, scaleY: number = scaleX): this {
    this.a *= scaleX;
    this.d *= scaleY;
    return this;
  }

  rotateSelf(): this {
    return this;
  }

  invertSelf(): this {
    return this;
  }

  translate(tx: number = 0, ty: number = 0): this {
    return this.translateSelf(tx, ty);
  }

  scale(scaleX: number = 1, scaleY: number = scaleX): this {
    return this.scaleSelf(scaleX, scaleY);
  }
}

class ImageDataNodeStub {
  data: Uint8ClampedArray;
  width: number;
  height: number;

  constructor(
    dataOrWidth: Uint8ClampedArray | number,
    width?: number,
    height?: number
  ) {
    if (typeof dataOrWidth === 'number') {
      this.width = dataOrWidth;
      this.height = width ?? dataOrWidth;
      this.data = new Uint8ClampedArray(this.width * this.height * 4);
      return;
    }

    this.data = dataOrWidth;
    this.width = width ?? 0;
    this.height = height ?? 0;
  }
}

class Path2DNodeStub {
  addPath(): void {}
  closePath(): void {}
  moveTo(): void {}
  lineTo(): void {}
  bezierCurveTo(): void {}
  rect(): void {}
}

let globalsReady = false;

export function ensurePdfJsGlobals(): void {
  if (globalsReady) {
    return;
  }

  if (typeof globalThis.DOMMatrix === 'undefined') {
    globalThis.DOMMatrix = DOMMatrixNodeStub as unknown as typeof DOMMatrix;
  }

  if (typeof globalThis.ImageData === 'undefined') {
    globalThis.ImageData = ImageDataNodeStub as unknown as typeof ImageData;
  }

  if (typeof globalThis.Path2D === 'undefined') {
    globalThis.Path2D = Path2DNodeStub as unknown as typeof Path2D;
  }

  globalsReady = true;
}

export async function extractTextFromPdfBuffer(
  arrayBuffer: ArrayBuffer
): Promise<string> {
  ensurePdfJsGlobals();

  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: new Uint8Array(arrayBuffer) });
  const result = await parser.getText();

  return result.text;
}
