import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

import { BriefingHtmlInput, buildBriefingHtml } from "@/pdf/buildBriefingHtml";

type BriefingPayload = BriefingHtmlInput;

async function resolveExecutablePath(): Promise<string> {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const resolved = await chromium.executablePath();
  if (!resolved) {
    throw new Error("Chromium executable path is not available");
  }
  return resolved;
}

export async function renderBriefingPdf(input: BriefingPayload): Promise<Uint8Array> {
  const html = buildBriefingHtml(input);
  const executablePath = await resolveExecutablePath();

  const browser = await puppeteer.launch({
    executablePath,
    args: chromium.args,
    headless: true
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "14mm",
        right: "12mm",
        bottom: "14mm",
        left: "12mm"
      }
    });

    return new Uint8Array(pdf);
  } finally {
    await browser.close();
  }
}
