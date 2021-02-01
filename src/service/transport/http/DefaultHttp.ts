import { Http, HttpPayload, HttpResponse } from '@/service/transport/http/Http';
import fetch from 'node-fetch';
import { filterOutMissingProps, safeParseJSON } from '@/lib/util';

const http = async (
  url: string,
  method: string,
  body: string | undefined,
  options: Record<string, any>
): Promise<HttpResponse> => {
  const response = await fetch(
    url,
    filterOutMissingProps({
      method,
      body,
      ...options,
    })
  );

  const responseText = await response.text();
  const responseJson = await safeParseJSON(responseText);

  return {
    status: response.status,
    body: responseText,
    bodyJson: responseJson,
    headers: response.headers.raw(),
  };
};

export class DefaultHttp implements Http {
  delete(url: string, options: Record<string, any>): Promise<HttpResponse> {
    return http(url, 'delete', undefined, options);
  }

  get(url: string, options: Record<string, any>): Promise<HttpResponse> {
    return http(url, 'get', undefined, options);
  }

  head(url: string, options: Record<string, any>): Promise<HttpResponse> {
    return http(url, 'head', undefined, options);
  }

  options(url: string, options: Record<string, any>): Promise<HttpResponse> {
    return http(url, 'options', undefined, options);
  }

  patch(
    url: string,
    body: HttpPayload,
    options: Record<string, any>
  ): Promise<HttpResponse> {
    return http(url, 'patch', body, options);
  }

  post(
    url: string,
    body: HttpPayload,
    options: Record<string, any>
  ): Promise<HttpResponse> {
    return http(url, 'post', body, options);
  }

  put(
    url: string,
    body: HttpPayload,
    options: Record<string, any>
  ): Promise<HttpResponse> {
    return http(url, 'put', body, options);
  }
}
