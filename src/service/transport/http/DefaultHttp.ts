import {
  Http,
  HttpHeaders,
  HttpPayload,
  HttpResponse,
} from '@/service/transport/http/Http';
import fetch, { Headers as NodeFetchHeaders } from 'node-fetch';
import { filterOutMissingProps, safeParseJSON } from '@/lib/util';
import { injectable } from 'inversify';

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

const http = async <R extends HttpResponse>(
  url: string,
  method: string,
  body: string | undefined,
  headers: HttpHeaders,
  options: Record<string, any>
): Promise<R> => {
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

  const parsedResponse = {
    status: response.status,
    body: responseText,
    bodyJson: responseJson,
    headers: getHeaders(response.headers),
  } as R;

  if (parsedResponse.status >= 400)
    throw new Error(`HTTPError: ${responseText}`);

  return parsedResponse;
};

@injectable()
export class DefaultHttp implements Http {
  delete<R extends HttpResponse>(
    url: string,
    headers: HttpHeaders,
    options: Record<string, any>
  ): Promise<R> {
    return http<R>(url, 'delete', undefined, headers, options);
  }

  get<R extends HttpResponse>(
    url: string,
    headers: HttpHeaders,
    options: Record<string, any>
  ): Promise<R> {
    return http<R>(url, 'get', undefined, headers, options);
  }

  head<R extends HttpResponse>(
    url: string,
    headers: HttpHeaders,
    options: Record<string, any>
  ): Promise<R> {
    return http<R>(url, 'head', undefined, headers, options);
  }

  options<R extends HttpResponse>(
    url: string,
    headers: HttpHeaders,
    options: Record<string, any>
  ): Promise<R> {
    return http<R>(url, 'options', undefined, headers, options);
  }

  patch<R extends HttpResponse>(
    url: string,
    body: HttpPayload,
    headers: HttpHeaders,
    options: Record<string, any>
  ): Promise<R> {
    return http<R>(url, 'patch', body, headers, options);
  }

  post<R extends HttpResponse>(
    url: string,
    body: HttpPayload,
    headers: HttpHeaders,
    options: Record<string, any>
  ): Promise<R> {
    return http<R>(url, 'post', body, headers, options);
  }

  put<R extends HttpResponse>(
    url: string,
    body: HttpPayload,
    headers: HttpHeaders,
    options: Record<string, any>
  ): Promise<R> {
    return http<R>(url, 'put', body, headers, options);
  }
}
