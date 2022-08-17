import { extractDataFromUri } from './image-resize-origin-response-function';

describe('image-resize-origin-response-function', () => {
  it('should parse uri', () => {
    expect(
      extractDataFromUri({ uri: '/path/to/file.png;width=100' })
    ).toMatchObject({
      requestedKey: 'path/to/file.png;width=100',
      baseName: 'path/to/file',
      extension: 'png',
      params: { width: '100' },
    });
  });
  it('should parse uri with format', () => {
    expect(
      extractDataFromUri({ uri: '/path/to/file.png;format=webp&width=100' })
    ).toMatchObject({
      baseName: 'path/to/file',
      extension: 'png',
      params: { format: 'webp', width: '100' },
    });
  });
  it('should ignore uri with no commands', () => {
    expect(extractDataFromUri({ uri: '/path/to/file.png' })).toBeNull();
  });
});
