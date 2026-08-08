import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/site";

/** Однострочная команда для PowerShell — скачивает и запускает скрипт Guideshin. */
export async function GET(req: Request) {
  const incoming = new URL(req.url);
  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = forwardedHost || req.headers.get("host");
  const proto =
    req.headers.get("x-forwarded-proto") ||
    (incoming.protocol.replace(":", "") || "https");

  const origin =
    host && !host.includes("localhost")
      ? `${proto}://${host}`
      : SITE_URL;

  const scriptUrl = `${origin}/scripts/get-wish-url.ps1`;
  const oneLiner =
    `Set-ExecutionPolicy Bypass -Scope Process -Force; [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; irm '${scriptUrl}' | iex`;

  return new NextResponse(oneLiner, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
