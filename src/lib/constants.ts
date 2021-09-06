export const DEFAULT_HUB = process.env.DEFAULT_HUB || 'https://hub.dummy.dummy';
export const DEFAULT_RESOLVER =
  process.env.DEFAULT_RESOLVER || 'https://did.civic.com/1.0/identifiers';
export const DEFAULT_REGISTRAR =
  process.env.DEFAULT_REGISTRAR || 'https://did.civic.com/sol/1.0/register';

// DIDs using this method are stored in a civic private S3 bucket
export const S3_DID_METHOD = 'civic';
