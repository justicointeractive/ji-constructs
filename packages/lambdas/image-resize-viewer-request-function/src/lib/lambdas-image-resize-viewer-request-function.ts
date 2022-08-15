import { CloudFrontRequest, CloudFrontRequestHandler } from 'aws-lambda';

const SKIPPED_EXTENSIONS = ['svg'];

const WEBP = 'webp';
const regex = /(.*)\.([^.]*)$/;

function getDataFromRequest(request: CloudFrontRequest) {
  const headers = request.headers;
  // URI of original image
  const uri = request.uri;

  // parse the prefix, image name and extension from the uri.
  // In our case /path-to-image/image.[original-extension]
  const match = uri.match(/(.*)\.([^.]*)$/);

  if (!match) {
    return { extension: '', prefix: uri };
  }

  const prefix = match[1];
  let extension = match[2];

  // read the accept header to determine if webp is supported.
  const accept = headers['accept'] ? headers['accept'][0].value : '';

  // Don't modify the extension if it is skipped
  if (SKIPPED_EXTENSIONS.includes(extension)) {
    return { extension, prefix };
  }

  // check support for webp
  if (accept.includes(WEBP)) {
    extension = WEBP;
  }

  return { extension, prefix };
}

export const handler: CloudFrontRequestHandler = async (event) => {
  const request = event.Records[0].cf.request;

  if (request.uri === '/') {
    throw new Error(String(403));
  }

  if (!request.uri.match(regex)) {
    return request;
  }

  const { extension, prefix } = getDataFromRequest(request);

  // Don't do any formatting for skipped extensions
  if (SKIPPED_EXTENSIONS.includes(extension)) {
    return request;
  }

  // parse the querystrings key-value pairs. In our case it would be d=100x100
  const parsed = new URLSearchParams(request.querystring);
  const width = parsed.get('width');
  const height = parsed.get('height');

  // if no dimensions, just pass the request but modifying the extension
  if (!width && !height) {
    request.uri = `${prefix}.${extension}`;
    return request;
  }

  const forwardUri = `${prefix}-${width || 0}wx${height || 0}h.${extension}`;

  request.uri = forwardUri;
  return request;
};
