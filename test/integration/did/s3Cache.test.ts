import { example as did } from '../../fixtures/did';
import dotenv from 'dotenv';
import { makeDummyDocument } from '../../../src/service/did/generator/generate';
import { S3Cache } from '../../../src/service/did/resolver/S3Cache';

dotenv.config();

const document = makeDummyDocument(did);

describe('S3Cache', () => {
  it('should add a document', async () => {
    const s3Cache = new S3Cache();
    await s3Cache.put(document);

    const retrievedDocument = await s3Cache.get(did);

    expect(retrievedDocument).toEqual(document);
  });
});
