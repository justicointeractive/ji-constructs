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

const resizeUrlExpression =
  /^\/(?<baseName>.*)\.(?<extension>[^.]*);(?<paramString>[^;]*);\.(?<format>[^.]*)$/i;

export function extractDataFromUri(request: { uri: string }) {
  const uri = request.uri;
  // AWS key is the URI without the initial '/'
  const requestedKey = uri.substring(1);

  // Try to match dimensions first
  // e.g.: /path/to/file.png;width=100&height=100;.webp
  const dimensionMatch = uri.match(resizeUrlExpression);

  if (!dimensionMatch?.groups) {
    return null;
  }

  const { baseName, extension, paramString, format } = dimensionMatch.groups;

  const params = new URLSearchParams(paramString);
  const paramObj: Record<string, string> = { format };
  params.forEach((value, key) => (paramObj[key] = value));

  return {
    requestedKey,
    baseName,
    params: paramObj,
    extension,
  };
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

  // resized image not found
  const params = extractDataFromUri(request);

  if (!params) {
    return response;
  }

  // Extracting bucket name. domainName looks like this: bucket-name.s3.region.amazonaws.com"
  const [, bucket] = request.origin?.s3?.domainName.match(/(.*).s3./) ?? [];

  // path has a leading / but key prefix has a trailing one instead
  const s3KeyPrefix = request.origin?.s3?.path
    ? request.origin.s3.path.substring(1) + '/'
    : '';

  const maxAge = 31536000;

  const resultImageBuffer = await ensureResizedImage(
    { bucket, s3KeyPrefix },
    {
      maxAge,
      ...params,
    }
  );

  if (resultImageBuffer == null) {
    return response;
  }

  response.status = String(200);
  response.body = resultImageBuffer.toString('base64');
  response.bodyEncoding = 'base64';
  response.headers = response.headers ?? {};
  response.headers['content-type'] = [
    { key: 'Content-Type', value: 'image/' + params.extension },
  ];
  response.headers['cache-control'] = [
    { key: 'Cache-Control', value: `max-age=${maxAge}` },
  ];

  return response;
};

async function readableToBuffer(readable: Readable) {
  const bodyBuffers: Buffer[] = [];
  for await (const buffer of readable) {
    bodyBuffers.push(buffer);
  }
  const bodyBuffer = Buffer.concat(bodyBuffers);
  return bodyBuffer;
}

async function ensureResizedImage(
  {
    bucket,
    s3KeyPrefix,
  }: {
    bucket: string;
    s3KeyPrefix: string;
  },
  params: {
    maxAge: number;
    requestedKey: string;
    baseName: string;
    extension: string;
    params: Partial<Record<'width' | 'height' | 'format', string>>;
  }
) {
  const baseImageKey = params.baseName + '.' + params.extension;

  // Use the found key to get the image from the s3 bucket
  const { Body } = await s3.getObject({
    Key: s3KeyPrefix + baseImageKey,
    Bucket: bucket,
  });

  const sourceImageBuffer = await readableToBuffer(Body as Readable);

  const sharpPromise = sharp(sourceImageBuffer);

  // If dimensions passed, resize base image
  if (params.params.width || params.params.height) {
    // Allow to pass only one of width or height
    sharpPromise.resize({
      fit: 'inside',
      height: Number(params.params.height) || undefined,
      width: Number(params.params.width) || undefined,
      withoutEnlargement: true,
    });
  }
  // If the requested extension is different than the base image extension, then
  // format it to the new extension
  if (params.params.format) {
    sharpPromise.toFormat(params.params.format as keyof sharp.FormatEnum);
  }

  const resultImageBuffer = await sharpPromise.toBuffer();

  // Save the new image to s3 bucket. Don't await for this to finish.
  // Even if the upload fails we return the converted image
  await s3.putObject({
    Body: resultImageBuffer,
    Bucket: bucket,
    ContentType: 'image/' + params.params.format ?? params.extension,
    CacheControl: `max-age=${params.maxAge}`,
    Key: s3KeyPrefix + params.requestedKey,
    StorageClass: 'STANDARD',
  });

  return resultImageBuffer;
}
