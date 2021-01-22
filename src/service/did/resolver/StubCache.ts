import { DIDDocument } from 'did-resolver';
import { DID } from '@/api/DID';

const cache: Record<string, DIDDocument> = {};

export const register = async (document: DIDDocument): Promise<DID> => {
  cache[document.id] = document;
  return document.id as DID;
};

export const get = (did: DID) => cache[did];
