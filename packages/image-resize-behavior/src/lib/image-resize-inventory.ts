import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class ImageResizeInventory extends Construct {
  derrivedImagesTable: Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.derrivedImagesTable = new Table(this, 'BaseKeyKeyInventoryTable', {
      partitionKey: { name: 'BaseKey', type: AttributeType.STRING },
      sortKey: { name: 'Key', type: AttributeType.STRING },
    });

    // TODO: lambda that runs periodically that cleans up not recently accessed images
  }
}
