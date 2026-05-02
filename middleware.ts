import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
  const SBI_EPAY_URL = process.env.NEXT_PUBLIC_SBI_EPAY_URL;

  if (!API_BASE_URL || !SBI_EPAY_URL) {
    console.error(
      "Environment variables are not defined. Check your .env files."
    );
    throw new Error("Missing environment variables");
  }
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const cspHeader = `
              default-src 'self';
              script-src 'self' 'unsafe-inline';
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: https:;
              font-src 'self' https://fonts.gstatic.com;
              connect-src 'self' ${API_BASE_URL};
              frame-ancestors 'none';
              base-uri 'self';
              form-action 'self' ${SBI_EPAY_URL} https://test.sbiepay.sbi;
            `.replace(/\s{2,}/g, " ");
  // Replace newline characters and spaces
  const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  requestHeaders.set(
    "Content-Security-Policy",
    contentSecurityPolicyHeaderValue
  );

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set(
    "Content-Security-Policy",
    contentSecurityPolicyHeaderValue
  );
  response.headers.set("X-Frame-Options", "DENY");

  return response;
}
