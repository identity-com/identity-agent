// TODO support streams
export type HttpPayload = string; // | Readable;

export type HttpResponse = {
  status: number;
  body: HttpPayload;
  bodyJson: Record<string, any> | undefined;
  headers: Record<string, string | string[]>;
};

export type HttpHeaders = Record<string, string | string[]>;

export interface Http {
  get<R extends HttpResponse>(
    url: string,
    headers?: HttpHeaders,
    options?: Record<string, any>
  ): Promise<R>;
  head<R extends HttpResponse>(
    url: string,
    headers?: HttpHeaders,
    options?: Record<string, any>
  ): Promise<R>;
  options<R extends HttpResponse>(
    url: string,
    headers?: HttpHeaders,
    options?: Record<string, any>
  ): Promise<R>;
  delete<R extends HttpResponse>(
    url: string,
    headers?: HttpHeaders,
    options?: Record<string, any>
  ): Promise<R>;

  put<R extends HttpResponse>(
    url: string,
    body: HttpPayload,
    headers?: HttpHeaders,
    options?: Record<string, any>
  ): Promise<R>;
  patch<R extends HttpResponse>(
    url: string,
    body: HttpPayload,
    headers?: HttpHeaders,
    options?: Record<string, any>
  ): Promise<R>;
  post<R extends HttpResponse>(
    url: string,
    body: HttpPayload,
    headers?: HttpHeaders,
    options?: Record<string, any>
  ): Promise<R>;
}
