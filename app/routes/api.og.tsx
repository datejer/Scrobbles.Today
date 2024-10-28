import { LoaderFunctionArgs } from "@remix-run/node";
import { ImageResponse } from "@vercel/og";
import fs from "fs";
import path from "path";

export const config = { runtime: "edge" };

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const url = new URL(request.url);
    const username = url.searchParams.get("username") || "Unknown";
    const scrobbles = url.searchParams.get("scrobbles") || "???";

    // Load the font file directly from the filesystem
    const fontPath = path.join(
      process.cwd(),
      "public/assets/fonts/InterVariable.ttf"
    );

    console.log(fontPath);
    let interBold: ArrayBuffer;

    try {
      // Method 1: Direct filesystem read
      interBold = await fs.promises.readFile(fontPath);
    } catch (e) {
      // Fallback Method: If direct read fails, try using import.meta.url
      try {
        console.log(
          new URL(
            "../../public/assets/fonts/InterVariable.ttf",
            import.meta.url
          )
        );
        const fontResponse = await fetch(
          new URL(
            "../../public/assets/fonts/InterVariable.ttf",
            import.meta.url
          )
        );
        if (!fontResponse.ok) {
          throw new Error(`Failed to load font: ${fontResponse.statusText}`);
        }
        interBold = await fontResponse.arrayBuffer();
      } catch (fontError) {
        console.error("Font loading error:", fontError);
        // If both methods fail, return a simplified image without custom font
        return new ImageResponse(
          (
            <div tw="flex flex-col items-center justify-center w-full h-full bg-[#f44336] text-white">
              <div tw="flex flex-col items-center gap-4">
                <h2 tw="font-bold text-5xl tracking-tight leading-3">
                  {username}'s
                </h2>
                <h1 tw="font-bold text-6xl tracking-tight leading-3">
                  Scrobbles Today:
                </h1>
                <div tw="flex bg-white rounded-lg shadow-lg px-8 py-4 mt-6">
                  <span tw="text-[#1e293b] font-bold  text-7xl">
                    {scrobbles}
                  </span>
                </div>
              </div>
            </div>
          ),
          {
            width: 800,
            height: 400,
          }
        );
      }
    }

    // Create the image response with the loaded font
    return new ImageResponse(
      (
        <div tw="flex flex-col items-center justify-center w-full h-full bg-[#f44336] text-white font-bold">
          <div tw="flex flex-col items-center gap-4">
            <h2 tw="text-5xl font-bold tracking-tight leading-3">
              {username}'s
            </h2>
            <h1 tw="text-6xl font-bold tracking-tight leading-3">
              Scrobbles Today:
            </h1>
            <div tw="flex bg-white rounded-lg shadow-lg px-8 py-4 mt-6">
              <span tw="text-[#1e293b] text-7xl font-bold">{scrobbles}</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 800,
        height: 400,
        fonts: [
          {
            name: "Inter",
            data: interBold,
            weight: 700,
            style: "normal",
          },
        ],
      }
    );
  } catch (error) {
    console.error("OG Image generation error:", error);
    throw new Response("Failed to generate image", { status: 500 });
  }
};
