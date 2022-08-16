import { extractDataFromUri } from './image-resize-origin-response-function';

describe('image-resize-origin-response-function', () => {
  it('should parse uri', () => {
    expect(
      extractDataFromUri({ uri: '/path/to/file-100wx100h.webp' })
    ).toMatchObject({
      key: 'path/to/file-100wx100h.webp',
      baseName: 'path/to/file',
      extension: 'webp',
    });
  });
});
