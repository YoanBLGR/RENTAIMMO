import { ensurePdfJsGlobals } from '../pdf-server';

describe('ensurePdfJsGlobals', () => {
  test('installs PDF.js globals in Node when missing', () => {
    const globals = globalThis as typeof globalThis & {
      DOMMatrix?: typeof DOMMatrix;
      ImageData?: typeof ImageData;
      Path2D?: typeof Path2D;
    };
    const originalDOMMatrix = globalThis.DOMMatrix;
    const originalImageData = globalThis.ImageData;
    const originalPath2D = globalThis.Path2D;

    try {
      delete globals.DOMMatrix;
      delete globals.ImageData;
      delete globals.Path2D;

      ensurePdfJsGlobals();

      expect(typeof globalThis.DOMMatrix).toBe('function');
      expect(typeof globalThis.ImageData).toBe('function');
      expect(typeof globalThis.Path2D).toBe('function');
    } finally {
      if (originalDOMMatrix) {
        globalThis.DOMMatrix = originalDOMMatrix;
      } else {
        delete globals.DOMMatrix;
      }

      if (originalImageData) {
        globalThis.ImageData = originalImageData;
      } else {
        delete globals.ImageData;
      }

      if (originalPath2D) {
        globalThis.Path2D = originalPath2D;
      } else {
        delete globals.Path2D;
      }
    }
  });
});
