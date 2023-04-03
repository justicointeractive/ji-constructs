import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3 } from '@aws-sdk/client-s3';
import { RegionInputConfig } from '@aws-sdk/config-resolver';
import { ImageResizeInventory } from '@ji-constructs/image-resize-inventory';
import {
  CloudFrontRequest,
  CloudFrontResponseHandler,
  CloudFrontResultResponse,
} from 'aws-lambda';
import * as sharp from 'sharp';
import { Readable } from 'stream';

const regionConfig: RegionInputConfig = {
  region: 'us-east-1',
};

const s3 = new S3(regionConfig);
const dynamodb = new DynamoDBClient(regionConfig);

const resizeUrlExpression =
  /^\/(?<baseName>.*)\.(?<extension>[^.]*);(?<paramString>[^;]*);\.(?<format>[^.]*)$/i;

export const handler: CloudFrontResponseHandler = async (event) => {
  const response: CloudFrontResultResponse = event.Records[0].cf.response;

  const request = event.Records[0].cf.request;

  const responseStatusCode = Number(response.status);

  const resizeParams = extractDataFromUri(request);

  if (resizeParams == null) {
    return response;
  }

  const inventoryTableName = getCustomHeaderValue(
    request,
    'x-image-resize-inventory-table-name'
  );

  // Extracting bucket name. domainName looks like this: bucket-name.s3.region.amazonaws.com"
  const [, bucket] = request.origin?.s3?.domainName.match(/(.*).s3./) ?? [];

  // path has a leading / but key prefix has a trailing one instead
  const s3KeyPrefix = request.origin?.s3?.path
    ? request.origin.s3.path.substring(1) + '/'
    : '';

  const inventoryClient =
    (inventoryTableName &&
      new ImageResizeInventory({
        tableName: inventoryTableName,
        s3Bucket: bucket,
        s3,
        dynamodb,
      })) ||
    null;

  if (responseStatusCode === 200) {
    if (inventoryTableName) {
      await inventoryClient?.updateKeyMetadata(s3KeyPrefix, resizeParams);
    }
    return response;
  }

  if (responseStatusCode !== 404) {
    return response;
  }

  const maxAge = 31536000;

  const { resultImageBuffer, contentType } = await ensureResizedImage(
    { inventoryClient, bucket, s3KeyPrefix },
    {
      maxAge,
      ...resizeParams,
    }
  );

  response.status = String(200);
  response.body = resultImageBuffer.toString('base64');
  response.bodyEncoding = 'base64';
  response.headers = response.headers ?? {};
  response.headers['content-type'] = [
    {
      key: 'Content-Type',
      value: contentType,
    },
  ];
  response.headers['cache-control'] = [
    { key: 'Cache-Control', value: `max-age=${maxAge}` },
  ];

  return response;
};

function getCustomHeaderValue(
  request: Pick<CloudFrontRequest, 'origin'>,
  header: string
) {
  return request.origin?.s3?.customHeaders?.[header]?.[0]?.value;
}

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
  const baseKey =
    baseName.split('/').map(decodeURIComponent).join('/') + '.' + extension;

  const params = new URLSearchParams(paramString);
  const paramObj: Record<string, string> = { format };
  params.forEach((value, key) => (paramObj[key] = value));

  return {
    requestedKey,
    baseKey,
    params: paramObj,
  };
}

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
    inventoryClient,
  }: {
    inventoryClient: ImageResizeInventory | null;
    bucket: string;
    s3KeyPrefix: string;
  },
  params: {
    maxAge: number;
    requestedKey: string;
    baseKey: string;
    params: Partial<Record<'width' | 'height' | 'format', string>>;
  }
) {
  // Use the found key to get the image from the s3 bucket
  const { Body } = await s3.getObject({
    Key: s3KeyPrefix + params.baseKey,
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

  const contentType = 'image/' + params.params.format;

  // Save the new image to s3 bucket. Don't await for this to finish.
  // Even if the upload fails we return the converted image
  await s3.putObject({
    Body: resultImageBuffer,
    Bucket: bucket,
    ContentType: contentType,
    CacheControl: `max-age=${params.maxAge}`,
    Key: s3KeyPrefix + params.requestedKey,
    StorageClass: 'STANDARD',
  });

  await inventoryClient?.updateKeyMetadata(s3KeyPrefix, params);

  return { resultImageBuffer, contentType };
}
