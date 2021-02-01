// TODO support streams
export type HttpPayload = string; // | Readable;

export type HttpResponse = {
  status: number;
  body: HttpPayload;
  bodyJson: Record<string, any> | undefined;
  headers: Record<string, string | string[]>;
};

export interface Http {
  get(url: string, options: Record<string, any>): Promise<HttpResponse>;
  head(url: string, options: Record<string, any>): Promise<HttpResponse>;
  options(url: string, options: Record<string, any>): Promise<HttpResponse>;
  delete(url: string, options: Record<string, any>): Promise<HttpResponse>;

  put(
    url: string,
    body: HttpPayload,
    options: Record<string, any>
  ): Promise<HttpResponse>;
  patch(
    url: string,
    body: HttpPayload,
    options: Record<string, any>
  ): Promise<HttpResponse>;
  post(
    url: string,
    body: HttpPayload,
    options: Record<string, any>
  ): Promise<HttpResponse>;
}
