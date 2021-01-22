import * as S3Cache from '@/service/did/resolver/S3Cache';
import { example as did } from '../../fixtures/did';
import dotenv from 'dotenv';
import { makeDummyDocument } from '../../../src/service/did/generator/generate';

dotenv.config();

const document = makeDummyDocument(did);

describe('S3Cache', () => {
  it('should add a document', async () => {
    await S3Cache.put(document);

    const retrievedDocument = await S3Cache.get(did);

    expect(retrievedDocument).toEqual(document);
  });
});
