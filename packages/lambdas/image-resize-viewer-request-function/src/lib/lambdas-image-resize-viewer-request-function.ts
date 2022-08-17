import { CloudFrontRequestHandler } from 'aws-lambda';

const WEBP = 'webp';
const PERMITTED_EXTENSIONS = ['png', 'jpg', 'jpeg', WEBP];

export const handler: CloudFrontRequestHandler = async (event) => {
  const request = event.Records[0].cf.request;

  request.uri = rewriteUrl(request);

  return request;
};

export function rewriteUrl(request: {
  uri: string;
  querystring: string;
  headers: Partial<Record<string, { value: string }[]>>;
}) {
  const { extension, prefix } = extractExtension(request.uri);
  const extensionLower = extension.toLowerCase();

  // parse the querystrings key-value pairs. In our case it would be d=100x100
  /* eslint-disable prefer-const */
  let params = pickUrlParams(new URLSearchParams(request.querystring), [
    'width',
    'height',
    'format',
  ]);
  /* eslint-enable prefer-const */

  // Do nothing for unsupported extensions
  // TODO: allow forcing resize if extension doesn't match
  if (!PERMITTED_EXTENSIONS.includes(extensionLower)) {
    return request.uri;
  }

  if (params.format ?? 'auto' === 'auto') {
    params.format = request.headers['accept']?.[0]?.value?.includes(WEBP)
      ? WEBP
      : extensionLower;
  }

  const { format: resultFormat, ...resultParams } = params;

  const uriParams = new URLSearchParams(resultParams as Record<string, string>);
  uriParams.sort();
  const uriParamString = uriParams.toString();

  const forwardUri =
    Object.values(resultParams).length === 0 && resultFormat === extension
      ? `${prefix}.${extension}`
      : `${prefix}.${extension};${uriParamString};.${resultFormat}`;

  return forwardUri;
}

function pickUrlParams<TKeys extends string[]>(
  params: URLSearchParams,
  keys: TKeys
) {
  const pickedParams: Partial<Record<TKeys[number], string>> = {};
  keys.forEach((k) => {
    const value = params.get(k);
    if (value != null) {
      pickedParams[k as TKeys[number]] = value;
    }
  });
  return pickedParams;
}

function extractExtension(uri: string) {
  // parse the prefix, image name and extension from the uri.
  // In our case /path-to-image/image.[original-extension]
  const match = uri.match(/(.*)\.([^.]*)$/);

  if (!match) {
    return { prefix: uri, extension: '' };
  }

  const [, prefix, extension] = match;

  return { prefix, extension };
}
