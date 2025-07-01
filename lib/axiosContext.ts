type RequestContext = {
    cookies?: string;
};

const requestContext: RequestContext = {};

export function setRequestCookies(cookies: string | undefined) {
    requestContext.cookies = cookies;
}

export function getRequestCookies(): string | undefined {
    return requestContext.cookies;
  }