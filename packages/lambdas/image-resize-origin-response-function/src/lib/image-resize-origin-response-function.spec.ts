import { extractDataFromUri } from './image-resize-origin-response-function';

describe('image-resize-origin-response-function', () => {
  it('should parse uri', () => {
    expect(
      extractDataFromUri({ uri: '/path/to/file.png;width=100;.png' })
    ).toMatchObject({
      requestedKey: 'path/to/file.png;width=100;.png',
      baseKey: 'path/to/file.png',
      params: { width: '100' },
    });
  });
  it('should parse uri with format', () => {
    expect(
      extractDataFromUri({ uri: '/path/to/file.png;width=100;.webp' })
    ).toMatchObject({
      baseKey: 'path/to/file.png',
      params: { format: 'webp', width: '100' },
    });
  });
  it('should parse uri with format', () => {
    expect(
      extractDataFromUri({ uri: '/path/to/file.png;;.webp' })
    ).toMatchObject({
      baseKey: 'path/to/file.png',
      params: { format: 'webp' },
    });
  });
  it('should parse uri with spaces in file name', () => {
    expect(
      extractDataFromUri({ uri: '/path/to/file%20%2C%20name.png;;.webp' })
    ).toMatchObject({
      baseKey: 'path/to/file , name.png',
      params: { format: 'webp' },
    });
  });
  it('should ignore uri with no commands', () => {
    expect(extractDataFromUri({ uri: '/path/to/file.png' })).toBeNull();
  });
});
