import { S3 } from '@aws-sdk/client-s3';
import {
  CloudFrontResponseHandler,
  CloudFrontResultResponse,
} from 'aws-lambda';
import * as sharp from 'sharp';
import { Readable } from 'stream';

const s3 = new S3({
  region: 'us-east-1',
});

export function extractDataFromUri(request: { uri: string }) {
  const uri = request.uri;
  // AWS key is the URI without the initial '/'
  const key = uri.substring(1);

  // Try to match dimensions first
  // e.g.: /path/to/file-100wx100h.webp
  const dimensionMatch = uri.match(/\/(.*)-([0-9]+)wx([0-9]+)h\.([^.]*)$/);
  if (dimensionMatch)
    return {
      key,
      baseName: dimensionMatch[1],
      width: parseInt(dimensionMatch[2]),
      height: parseInt(dimensionMatch[3]),
      extension: dimensionMatch[4],
    };

  // If no dimensions included, we just care about the prefix and the extension
  const simpleMatch = uri.match(/\/(.*)\.([^.]*)$/);

  if (simpleMatch) {
    return { key, baseName: simpleMatch[1], extension: simpleMatch[2] };
  }
}

export const handler: CloudFrontResponseHandler = async (event) => {
  const response: CloudFrontResultResponse = event.Records[0].cf.response;

  const request = event.Records[0].cf.request;

  if (Number(response.status) !== 404) {
    if (Number(response.status) !== 200) {
      response.status = String(400);
    }
    return response;
  }

  // Image not found in bucket
  const params = extractDataFromUri(request);

  if (!params) {
    return response;
  }

  // Extracting bucket name. domainName looks like this: bucket-name.s3.region.amazonaws.com"
  const [, Bucket] = request.origin?.s3?.domainName.match(/(.*).s3./) ?? [];

  // path has a leading / but key prefix has a trailing one instead
  const s3KeyPrefix = request.origin?.s3?.path
    ? request.origin.s3.path.substring(1) + '/'
    : '';

  const baseImageKey = await (async () => {
    const { Contents } = await s3.listObjects({
      Bucket,
      // List all keys starting with path/to/file.
      Prefix: s3KeyPrefix + params.baseName + '.',
    });

    if (!Contents?.length) {
      return null;
    }

    // strip key prefixes, prefix will be added back in later
    const unprefixedKeys = Contents.map(({ Key }) =>
      Key?.substring(s3KeyPrefix.length)
    );

    /**
     * Try to find an existent image for the requested extension.
     * If there isn't one, the use as base image the first from the Contents array
     */
    const found = unprefixedKeys.find(
      (Key) => Key?.split(`${params.baseName}.`)[1] === params.extension
    );

    return found ?? unprefixedKeys[0];
  })();

  if (!baseImageKey) {
    return response;
  }

  // Use the found key to get the image from the s3 bucket
  const { Body, ContentType } = await s3.getObject({
    Key: s3KeyPrefix + baseImageKey,
    Bucket,
  });

  const sourceImageBuffer = await readableToBuffer(Body);

  const sharpPromise = sharp(sourceImageBuffer);

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
  if (ContentType !== `image/${params.extension}`) {
    sharpPromise.toFormat(params.extension as keyof sharp.FormatEnum);
  }

  const resultImageBuffer = await sharpPromise.toBuffer();

  // Save the new image to s3 bucket. Don't await for this to finish.
  // Even if the upload fails we return the converted image
  s3.putObject({
    Body: resultImageBuffer,
    Bucket,
    ContentType: 'image/' + params.extension,
    CacheControl: 'max-age=31536000',
    Key: s3KeyPrefix + params.key,
    StorageClass: 'STANDARD',
  });

  response.status = String(200);
  response.body = resultImageBuffer.toString('base64');
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

async function readableToBuffer(
  Body: Readable | ReadableStream<any> | Blob | undefined
) {
  const bodyBuffers: Buffer[] = [];
  for await (const buffer of Body as Readable) {
    bodyBuffers.push(buffer);
  }
  const bodyBuffer = Buffer.concat(bodyBuffers);
  return bodyBuffer;
}
