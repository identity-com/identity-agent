/**
 * Type definitions for DIDs
 */

import { DIDDocument } from 'did-resolver';

/**
 * The scheme of a DID, which is always 'did'
 */
type Scheme = 'did';

/**
 * The DID method
 */
type Method = string;

/**
 * The method-specific identifier of the DID
 */
type Identifier = string;

/**
 * A DID (Decentralized Identifier) as defined by
 * https://www.w3.org/TR/did-core/#did-url-syntax
 */
export type DID = `${Scheme}:${Method}:${Identifier}`;

/**
 * An optional absolute URL path as defined by
 * https://www.w3.org/TR/did-core/#did-url-syntax
 */
type DIDUrlPathAbempty = '' | `/${string}`;

/**
 * A URL fragment as defined by
 * https://www.w3.org/TR/did-core/#did-url-syntax
 */
export type DIDUrlFragment = `#${string}`;

/**
 * A URL query as defined by
 * https://www.w3.org/TR/did-core/#did-url-syntax
 */
type DIDUrlQuery = `#${string}`;

/**
 * A URL parameter string as defined by
 * https://www.w3.org/TR/did-core/#did-url-syntax
 */
type DIDUrlParameterString = `;${string}`;

/**
 * A DID URL as defined by
 * https://www.w3.org/TR/did-core/#did-url-syntax
 */
export type DIDUrl = `${DID}${DIDUrlPathAbempty}${
  | DIDUrlFragment
  | DIDUrlQuery
  | DIDUrlParameterString
  | ''}`;

export type DIDResolver = (did: DID) => Promise<DIDDocument>;
