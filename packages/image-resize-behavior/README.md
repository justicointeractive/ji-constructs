# AWS Image Resizer Construct Library

This construct library is adapted from [https://github.com/nlopezm/aws-cdk-image-resize](https://github.com/nlopezm/aws-cdk-image-resize) which was inspired by [this blog](https://aws.amazon.com/blogs/networking-and-content-delivery/resizing-images-with-amazon-cloudfront-lambdaedge-aws-cdn-blog/) from the AWS official website and [this one](https://web.dev/serve-responsive-images/) from [web.dev](https://web.dev/), and provides a way to easily setup the required arquitecture to start serving performant images.

## Optimization

If the client is requesting an image and if the client supports _avif_ or _webp_, this construct will take care of returning an optimized image (which is usually 80% lighter than the conventional jpg/png images).

## Resizing

You might want to serve multiple image versions. Why would your mobile users pay the cost of loading the same big files desktop users need?
Just pass `width` and/or `height` (in px) as query params and you will get original image cropped to the requested sizes.

This is how the client's code would look like:

```
<img
  srcset="https://cloudfront-url/path-to-your-image/image.ext?width=150 150w,
          https://cloudfront-url/path-to-your-image/image.ext?width=500 500w,
          https://cloudfront-url/path-to-your-image/image.ext?width=800 800w"
  src="https://cloudfront-url/path-to-your-image/image.ext"
>
```

Refer [here](https://web.dev/serve-responsive-images/#serve-multiple-image-versions) for more information on this!

## Image generation workflow

![image generation workflow](https://user-images.githubusercontent.com/32108036/108003950-44abb200-6fec-11eb-930b-9116b01f357b.png)
_Source: [AWS blog](https://aws.amazon.com/blogs/networking-and-content-delivery/resizing-images-with-amazon-cloudfront-lambdaedge-aws-cdn-blog/)_

1. Two Lambda@Edge triggers namely Viewer-Request and Origin-Response which are associated to a CloudFront distribution.
2. Amazon Simple Storage Service (Amazon S3) as origin.

Let’s understand what happens in these various steps 1 to 5

**Step 1:** The requested image URI is manipulated in the viewer-facing Lambda@Edge function to serve appropriate dimension and format. This happens before the request hits the cache. The URI should be the path to the original resource (e.g. /image.jpg).
The manipulated URI will look something like this:

1. `/image.png`, if no optimization or resize is possible
2. `/image.png;;.webp`, if webp supported by the client
3. `/image.png;width=${width}&height=${height};.webp`, in case width and/or height are supplied as query params

**Step 2**: CloudFront fetches the object from S3.

**Step 3:** If the required image is already present in the bucket, S3 returns the object to CloudFront. Otherwise it returns a 404 Not Found response.

**Step 4:** CloudFront returns the resulting image to the viewer.

**Step 5:** If the image is not present in the bucket, the original image is fetched, the resize and optimizations are applied and the resulting file is put into the bucket so subsequent requests return this image that is now already present in the bucket. If the original image could not be fetched, the 404 is passed onto the viewer.

**Note:** Step 2, 3 and 5 are executed only when the object is stale or does not exist in CloudFront cache. Static resources like images should have a long Time to Live (TTL) as possible to improve cache-hit ratios.

_This step by step is also taken from [AWS blog](https://aws.amazon.com/blogs/networking-and-content-delivery/resizing-images-with-amazon-cloudfront-lambdaedge-aws-cdn-blog/) with some minor tweaks._

## How to use

### Default

```ts
import * as cdk from 'aws-cdk-lib/core';
import { ImageResize } from 'aws-cdk-image-resize';

export class MyStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const imageResize = new ImageResizeBehavior(this, 'ImageResize');
  }
}
```

### BYOB (bring your own bucket... and cloudfront distribution)

```ts
import * as cdk from 'aws-cdk-lib/core';
import { ImageResize } from 'aws-cdk-image-resize';

export class MyStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, 'Bucket');

    const imageResize = new ImageResizeBehavior(this, 'ImageResize', {
      createDistribution: false,
      s3BucketOrProps: bucket,
    });

    const cloudfront = new Distribution(this, 'Distribution', {
      defaultBehavior: imageResize.behaviorOptions,
    });
  }
}
```

The construct is 100% customizable:

- s3BucketProps: https://docs.aws.amazon.com/cdk/api/latest/docs/aws-s3-readme.html
- originResponseLambdaProps: https://docs.aws.amazon.com/cdk/api/latest/docs/aws-lambda-readme.html
- viewerRequestLambdaProps: https://docs.aws.amazon.com/cdk/api/latest/docs/aws-lambda-readme.html
- cloudfrontDistributionProps: https://docs.aws.amazon.com/cdk/api/latest/docs/aws-cloudfront-readme.html

## Resources created

This Construct will create

- 1 Lambda@Edge function for the Viewer Request
- 1 Lambda@Edge function for the Origin Response with permissions to write and read the S3 bucket. This lambda uses [sharp library](https://www.npmjs.com/package/sharp) under the hood.
- 1 Cloudfront Distribution (optional)
- 1 S3 bucket (optional)
