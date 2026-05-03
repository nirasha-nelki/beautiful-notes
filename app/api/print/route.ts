import { NextRequest, NextResponse } from "next/server"
import puppeteer from "puppeteer-core"
import { supabase } from "@/lib/supabase-server"
import chromium from "@sparticuz/chromium"


export const dynamic = "force-dynamic"

function getBaseUrl(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host")
  const proto = req.headers.get("x-forwarded-proto") ?? "http"
  return `${proto}://${host}`
}

function getOrientation(req: NextRequest, requestedOrientation?: string | null) {
  if (requestedOrientation) return requestedOrientation

  const userAgent = req.headers.get("user-agent") ?? ""
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    userAgent
  )
  return isMobile ? "portrait" : "landscape"
}

const CACHE_TTL_MS = 2 * 60 * 1000

function generateToken() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

async function cacheCustomTemplate(template: unknown) {
  if (!template) return null

  const token = generateToken()
  const expiresAt = new Date(Date.now() + CACHE_TTL_MS).toISOString()

  const { error } = await supabase.from("print_template_cache").insert({
    token,
    data: template,
    expires_at: expiresAt,
  })

  if (error) {
    console.error("[print] failed to cache custom template", error)
    return null
  }

  return token
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const noteId = searchParams.get("noteId")
  const requestedOrientation = searchParams.get("orientation")

  if (!noteId) {
    return NextResponse.json({ error: "Missing noteId" }, { status: 400 })
  }

  const orientation = getOrientation(req, requestedOrientation)

  const urlParams = new URLSearchParams()
  if (orientation) urlParams.set("orientation", orientation)
  const query = urlParams.toString()
  const url = `${getBaseUrl(req)}/print/${encodeURIComponent(noteId)}${query ? `?${query}` : ""}`

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null

  try {
    browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  })

    const page = await browser.newPage()
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 })
    await page.goto(url, { waitUntil: "networkidle0" })
    await page.emulateMediaType("screen")

    const pdf = await page.pdf({
      format: "A4",
      landscape: orientation === "landscape",
      printBackground: true,
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
    })

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=note-${noteId}.pdf`,
      },
    })
  } catch (error) {
    console.error("Failed to generate PDF:", error)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// export async function POST(req: NextRequest) {
//   const body = await req.json()
//   const noteId = body?.noteId as string | undefined
//   const requestedOrientation = body?.orientation as string | undefined
//   const customTemplate = body?.customTemplate ?? null

//   console.info("[print] POST received", {
//     hasNoteId: Boolean(noteId),
//     hasCustomTemplate: Boolean(customTemplate),
//     customTemplateKeys: customTemplate ? Object.keys(customTemplate) : [],
//     hasCustomImageUrl: Boolean(customTemplate?.customImageUrl),
//   })

// //   console.log({ customTemplate })

//   if (!noteId) {
//     return NextResponse.json({ error: "Missing noteId" }, { status: 400 })
//   }

//   const orientation = getOrientation(req, requestedOrientation)
//   const templateToken = await cacheCustomTemplate(customTemplate)


//   const urlParams = new URLSearchParams()
//   if (orientation) urlParams.set("orientation", orientation)
//   if (templateToken) urlParams.set("customTemplateToken", templateToken)
//   const query = urlParams.toString()
//   const url = `${getBaseUrl(req)}/print/${encodeURIComponent(noteId)}${query ? `?${query}` : ""}`



//   let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null

//   try {
//     browser = await puppeteer.launch({
//     args: chromium.args,
//     executablePath: await chromium.executablePath(),
//     headless: true,
//   })

//     const page = await browser.newPage()
//     await page.setViewport({
//   width: orientation === "landscape" ? 1123 : 794,
//   height: orientation === "landscape" ? 794 : 1123,
//   deviceScaleFactor: 2
// })
//     await page.goto(url, { waitUntil: "networkidle0" })
//     await page.emulateMediaType("screen")

//     const pdf = await page.pdf({
//       format: "A4",
//       landscape: orientation === "landscape",
//       printBackground: true,
//       margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
//     })

//     return new NextResponse(Buffer.from(pdf), {
//       headers: {
//         "Content-Type": "application/pdf",
//         "Content-Disposition": `attachment; filename=note-${noteId}.pdf`,
//       },
//     })
//   } catch (error) {
//     console.error("Failed to generate PDF:", error)
//     return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
//   } finally {
//     if (browser) {
//       await browser.close()
//     }
//   }
// }

// type PrintRequestBody = {
//   noteId: string;
//   customTemplate?: unknown;
// };

// export async function POST(req: Request): Promise<Response> {
//   try {
//     const body: PrintRequestBody = await req.json();
//     const { noteId } = body;

//     console.log("[print] generating for note:", noteId);

//     const browser = await puppeteer.launch({
//       args: chromium.args,
//       executablePath: await chromium.executablePath(),
//       headless: true,
//     });

//     const page = await browser.newPage();

//     const html = `<h1>PDF for note ${noteId}</h1>`;

//     await page.setContent(html, {
//       waitUntil: "networkidle0",
//     });

//     const pdf = await page.pdf({
//       format: "A4",
//       printBackground: true,
//     });

//     await browser.close();

//      return new NextResponse(Buffer.from(pdf), {
//   status: 200,
//   headers: {
//     "Content-Type": "application/pdf",
//     "Content-Disposition": `inline; filename=note-${noteId}.pdf`,
//   },
// });

//   } catch (err: unknown) {
//     console.error("Failed to generate PDF:", err);

//     const message =
//       err instanceof Error ? err.message : "Unknown error";

//     return new NextResponse(
//       JSON.stringify({ error: message }),
//       {
//         status: 500,
//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     );
//   }
// }

type PrintRequestBody = {
  noteId: string
  customTemplate?: unknown
}

// -------------------- BROWSER LAUNCHER --------------------
async function launchBrowser() {
  const isProd = process.env.NODE_ENV === "production"

  if (isProd) {
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    })
  }

  // Local Chrome paths by OS
  const localChromePaths: Record<string, string[]> = {
    darwin: [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
    ],
    win32: [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    ],
    linux: [
      "/usr/bin/google-chrome",
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
    ],
  }

  const { platform } = process
  const candidates = localChromePaths[platform] ?? []
  
  const { existsSync } = await import("fs")
  const executablePath = candidates.find((p) => existsSync(p))

  if (!executablePath) {
    throw new Error(
      `No Chrome executable found on ${platform}. Install Chrome or set CHROME_EXECUTABLE_PATH env var.`
    )
  }

  return puppeteer.launch({
    args: [],
    executablePath,
    headless: true,
  })
}

// -------------------- API --------------------
export async function POST(req: NextRequest): Promise<Response> {
  const body = await req.json()
  const noteId = body?.noteId as string | undefined
  const requestedOrientation = body?.orientation as string | undefined
  const customTemplate = body?.customTemplate ?? null

  console.info("[print] POST received", {
    hasNoteId: Boolean(noteId),
    hasCustomTemplate: Boolean(customTemplate),
    customTemplateKeys: customTemplate ? Object.keys(customTemplate) : [],
    hasCustomImageUrl: Boolean(customTemplate?.customImageUrl),
  })

  if (!noteId) {
    return NextResponse.json({ error: "Missing noteId" }, { status: 400 })
  }

  const orientation = getOrientation(req, requestedOrientation)
  const templateToken = await cacheCustomTemplate(customTemplate)

  const urlParams = new URLSearchParams()
  if (orientation) urlParams.set("orientation", orientation)
  if (templateToken) urlParams.set("customTemplateToken", templateToken)
  const query = urlParams.toString()
  const url = `${getBaseUrl(req)}/print/${encodeURIComponent(noteId)}${query ? `?${query}` : ""}`

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null

  try {
    browser = await launchBrowser()

    const page = await browser.newPage()
    await page.setViewport({
      width: orientation === "landscape" ? 1123 : 794,
      height: orientation === "landscape" ? 794 : 1123,
      deviceScaleFactor: 2,
    })
    await page.goto(url, { waitUntil: "networkidle0" })
    await page.emulateMediaType("screen")

    const pdf = await page.pdf({
      format: "A4",
      landscape: orientation === "landscape",
      printBackground: true,
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
    })

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=note-${noteId}.pdf`,
      },
    })
  } catch (error) {
    console.error("Failed to generate PDF:", error)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}