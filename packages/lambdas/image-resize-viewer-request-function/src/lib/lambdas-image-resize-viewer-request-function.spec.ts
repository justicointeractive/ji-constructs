import { rewriteUrl } from './lambdas-image-resize-viewer-request-function';

describe('lambdas-image-resize-viewer-request-function', () => {
  it('should rewrite url: auto format, webp support', () => {
    expect(
      rewriteUrl({
        uri: '/path/to/the/thing.png',
        querystring: 'width=100&height=200',
        headers: { accept: [{ value: 'image/webp' }] },
      })
    ).toEqual('/path/to/the/thing.png;format=webp&height=200&width=100');
  });

  it('should rewrite url: auto format, no webp support', () => {
    expect(
      rewriteUrl({
        uri: '/path/to/the/thing.png',
        querystring: 'width=100&height=200',
        headers: { accept: [{ value: 'image/png' }] },
      })
    ).toEqual('/path/to/the/thing.png;height=200&width=100');
  });

  it('should rewrite url: no commands', () => {
    expect(
      rewriteUrl({
        uri: '/path/to/the/thing.png',
        querystring: '',
        headers: { accept: [{ value: 'image/png' }] },
      })
    ).toEqual('/path/to/the/thing.png');
  });

  it('should ignore unsupported extensions', () => {
    expect(
      rewriteUrl({
        uri: '/path/to/the/thing.mp4',
        querystring: 'width=100&height=200',
        headers: { accept: [{ value: 'video/mp4' }] },
      })
    ).toEqual('/path/to/the/thing.mp4');
  });
});
