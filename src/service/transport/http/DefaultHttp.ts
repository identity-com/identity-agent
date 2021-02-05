import {
  Http,
  HttpHeaders,
  HttpPayload,
  HttpResponse,
} from '@/service/transport/http/Http';
import fetch, { Headers as NodeFetchHeaders } from 'node-fetch';
import { filterOutMissingProps, safeParseJSON } from '@/lib/util';

/**
 * A browser-friendly iterator over headers
 * @param headers
 */
const getHeaders = (headers: Headers | NodeFetchHeaders): HttpHeaders => {
  const headerObj: HttpHeaders = {};
  headers.forEach((value, key) => {
    headerObj[key] = value;
  });
  return headerObj;
};

const http = async (
  url: string,
  method: string,
  body: string | undefined,
  headers: HttpHeaders,
  options: Record<string, any>
): Promise<HttpResponse> => {
  const response = await fetch(
    url,
    filterOutMissingProps({
      method,
      body,
      headers,
      ...options,
    })
  );

  const responseText = await response.text();
  const responseJson = await safeParseJSON(responseText);

  return {
    status: response.status,
    body: responseText,
    bodyJson: responseJson,
    headers: getHeaders(response.headers),
  };
};

export class DefaultHttp implements Http {
  delete(
    url: string,
    headers: HttpHeaders,
    options: Record<string, any>
  ): Promise<HttpResponse> {
    return http(url, 'delete', undefined, headers, options);
  }

  get(
    url: string,
    headers: HttpHeaders,
    options: Record<string, any>
  ): Promise<HttpResponse> {
    return http(url, 'get', undefined, headers, options);
  }

  head(
    url: string,
    headers: HttpHeaders,
    options: Record<string, any>
  ): Promise<HttpResponse> {
    return http(url, 'head', undefined, headers, options);
  }

  options(
    url: string,
    headers: HttpHeaders,
    options: Record<string, any>
  ): Promise<HttpResponse> {
    return http(url, 'options', undefined, headers, options);
  }

  patch(
    url: string,
    body: HttpPayload,
    headers: HttpHeaders,
    options: Record<string, any>
  ): Promise<HttpResponse> {
    return http(url, 'patch', body, headers, options);
  }

  post(
    url: string,
    body: HttpPayload,
    headers: HttpHeaders,
    options: Record<string, any>
  ): Promise<HttpResponse> {
    return http(url, 'post', body, headers, options);
  }

  put(
    url: string,
    body: HttpPayload,
    headers: HttpHeaders,
    options: Record<string, any>
  ): Promise<HttpResponse> {
    return http(url, 'put', body, headers, options);
  }
}
