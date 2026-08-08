import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/site";

/** Однострочная команда для PowerShell — скачивает и запускает скрипт Guideshin. */
export async function GET() {
  const scriptUrl = `${SITE_URL}/scripts/get-wish-url.ps1`;
  const oneLiner =
    `Set-ExecutionPolicy Bypass -Scope Process -Force; [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; irm '${scriptUrl}' | iex`;

  return new NextResponse(oneLiner, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
