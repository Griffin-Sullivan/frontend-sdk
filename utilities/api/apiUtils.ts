import { APIOptions } from './types';
import { EitherOrNone } from '../typeHelpers';

export const mergeRequestInit = (
  opts: APIOptions = {},
  specificOpts: RequestInit = {},
): RequestInit => ({
  ...specificOpts,
  ...(opts.signal && { signal: opts.signal }),
});

type CallRestJSONOptions = {
  queryParams?: Record<string, unknown>;
  parseJSON?: boolean;
} & EitherOrNone<
  {
    fileContents: string;
  },
  {
    data: Record<string, unknown>;
  }
>;

const callRestJSON = <T>(
  host: string,
  path: string,
  requestInit: RequestInit,
  { data, fileContents, queryParams, parseJSON = true }: CallRestJSONOptions,
): Promise<T> => {
  const { method, ...otherOptions } = requestInit;

  const sanitizedQueryParams = queryParams
    ? Object.entries(queryParams).reduce((acc, [key, value]) => {
        if (value) {
          return { ...acc, [key]: value };
        }

        return acc;
      }, {})
    : null;

  const searchParams = sanitizedQueryParams
    ? new URLSearchParams(sanitizedQueryParams).toString()
    : null;

  let requestData: string | undefined;
  let contentType: string | undefined;
  let formData: FormData | undefined;
  if (fileContents) {
    formData = new FormData();
    formData.append(
      'uploadfile',
      new Blob([fileContents], { type: 'application/x-yaml' }),
      'uploadedFile.yml',
    );
  } else if (data) {
    // It's OK for contentType and requestData to BOTH be undefined for e.g. a GET request or POST with no body.
    contentType = 'application/json;charset=UTF-8';
    requestData = JSON.stringify(data);
  }

  return fetch(`${host}${path}${searchParams ? `?${searchParams}` : ''}`, {
    ...otherOptions,
    ...(contentType && { headers: { 'Content-Type': contentType } }),
    method,
    body: formData ?? requestData,
  }).then((response) =>
    response.text().then((fetchedData) => {
      if (parseJSON) {
        return JSON.parse(fetchedData);
      }
      return fetchedData;
    }),
  );
};

export const restGET = <T>(
  host: string,
  path: string,
  queryParams: Record<string, unknown> = {},
  options?: APIOptions,
): Promise<T> =>
  callRestJSON<T>(host, path, mergeRequestInit(options, { method: 'GET' }), {
    queryParams,
    parseJSON: options?.parseJSON,
  });

/** Standard POST */
export const restCREATE = <T>(
  host: string,
  path: string,
  data: Record<string, unknown>,
  queryParams: Record<string, unknown> = {},
  options?: APIOptions,
): Promise<T> =>
  callRestJSON<T>(host, path, mergeRequestInit(options, { method: 'POST' }), {
    data,
    queryParams,
    parseJSON: options?.parseJSON,
  });

/** POST -- but with file content instead of body data */
export const restFILE = <T>(
  host: string,
  path: string,
  fileContents: string,
  queryParams: Record<string, unknown> = {},
  options?: APIOptions,
): Promise<T> =>
  callRestJSON<T>(host, path, mergeRequestInit(options, { method: 'POST' }), {
    fileContents,
    queryParams,
    parseJSON: options?.parseJSON,
  });

/** POST -- but no body data -- targets simple endpoints */
export const restENDPOINT = <T>(
  host: string,
  path: string,
  queryParams: Record<string, unknown> = {},
  options?: APIOptions,
): Promise<T> =>
  callRestJSON<T>(host, path, mergeRequestInit(options, { method: 'POST' }), {
    queryParams,
    parseJSON: options?.parseJSON,
  });

export const restUPDATE = <T>(
  host: string,
  path: string,
  data: Record<string, unknown>,
  queryParams: Record<string, unknown> = {},
  options?: APIOptions,
): Promise<T> =>
  callRestJSON<T>(host, path, mergeRequestInit(options, { method: 'PUT' }), {
    data,
    queryParams,
    parseJSON: options?.parseJSON,
  });

export const restPATCH = <T>(
  host: string,
  path: string,
  data: Record<string, unknown>,
  options?: APIOptions,
): Promise<T> =>
  callRestJSON<T>(host, path, mergeRequestInit(options, { method: 'PATCH' }), {
    data,
    parseJSON: options?.parseJSON,
  });

export const restDELETE = <T>(
  host: string,
  path: string,
  data: Record<string, unknown>,
  queryParams: Record<string, unknown> = {},
  options?: APIOptions,
): Promise<T> =>
  callRestJSON<T>(host, path, mergeRequestInit(options, { method: 'DELETE' }), {
    data,
    queryParams,
    parseJSON: options?.parseJSON,
  });
