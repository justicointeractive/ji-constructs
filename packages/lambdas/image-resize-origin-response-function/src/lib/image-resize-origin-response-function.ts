import { S3 } from '@aws-sdk/client-s3';
import {
  CloudFrontRequest,
  CloudFrontResponseHandler,
  CloudFrontResultResponse,
} from 'aws-lambda';
import * as sharp from 'sharp';
import { Readable } from 'stream';

const s3 = new S3({});

function extractDataFromUri(request: CloudFrontRequest) {
  const uri = request.uri;
  // AWS key is the URI without the initial '/'
  const key = uri.substring(1);

  // Try to match dimensions first
  // e.g.: /path/to/file-100wx100h.webp
  const dimensionMatch = uri.match(/\/(.*)-([0-9]+)wx([0-9]+)h\.([^.]*)$/);
  if (dimensionMatch)
    return {
      key,
      prefix: dimensionMatch[1],
      width: parseInt(dimensionMatch[2]),
      height: parseInt(dimensionMatch[3]),
      extension: dimensionMatch[4],
    };

  // If no dimensions included, we just care about the prefix and the extension
  const simpleMatch = uri.match(/\/(.*)\.([^.]*)$/);

  if (simpleMatch) {
    return { key, prefix: simpleMatch[1], extension: simpleMatch[2] };
  }
}

export const handler: CloudFrontResponseHandler = async (event) => {
  const response: CloudFrontResultResponse = event.Records[0].cf.response;

  const request = event.Records[0].cf.request;

  // Extracting bucket name. domainName looks like this: bucket-name.s3.region.amazonaws.com"
  const [, Bucket] = request.origin?.s3?.domainName.match(/(.*).s3./) ?? [];

  if (Number(response.status) !== 404) {
    if (Number(response.status) !== 200) response.status = String(400);
    return response;
  }

  // Image not found in bucket
  const params = extractDataFromUri(request);
  if (!params) {
    return response;
  }

  const { Contents } = await s3.listObjects({
    Bucket,
    // List all keys starting with path/to/file.
    Prefix: params.prefix + '.',
  });

  if (!Contents?.length) {
    return response;
  }

  const baseImageKey = (() => {
    /**
     * Try to find an existent image for the requested extension.
     * If there isn't one, the use as base image the first from the Contents array
     */
    const found = Contents.find(
      ({ Key }) => Key?.split(`${params.prefix}.`)[1] === params.extension
    );
    if (found) return found.Key;
    return Contents[0].Key;
  })();

  // Use the found key to get the image from the s3 bucket
  const { Body, ContentType } = await s3.getObject({
    Key: baseImageKey,
    Bucket,
  });

  const bodyBuffers: Buffer[] = [];
  for await (const buffer of Body as Readable) {
    bodyBuffers.push(buffer);
  }

  const sharpPromise = sharp(Buffer.concat(bodyBuffers));

  // If dimensions passed, resize base image
  if (params.width || params.height) {
    // Allow to pass only one of width or height
    sharpPromise.resize({
      fit: 'inside',
      height: params.height || undefined,
      width: params.width || undefined,
      withoutEnlargement: true,
    });
  }
  // If the requested extension is different than the base image extension, then
  // format it to the new extension
  if (ContentType !== `image/${params.extension}`)
    sharpPromise.toFormat(params.extension as keyof sharp.FormatEnum);

  const buffer = await sharpPromise.toBuffer();

  // Save the new image to s3 bucket. Don't await for this to finish.
  // Even if the upload fails we return the converted image
  s3.putObject({
    Body: buffer,
    Bucket,
    ContentType: 'image/' + params.extension,
    CacheControl: 'max-age=31536000',
    Key: params.key,
    StorageClass: 'STANDARD',
  });

  response.status = String(200);
  response.body = buffer.toString('base64');
  response.bodyEncoding = 'base64';
  response.headers = response.headers ?? {};
  response.headers['content-type'] = [
    { key: 'Content-Type', value: 'image/' + params.extension },
  ];
  response.headers['cache-control'] = [
    { key: 'Cache-Control', value: 'max-age=31536000' },
  ];

  return response;
};
