import { LoaderFunctionArgs } from "@remix-run/node";
import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const username = url.searchParams.get("username") || "Unknown";
  const scrobbles = url.searchParams.get("scrobbles") || "???";

  const baseUrl = new URL(request.url);

  const boldFontData = await fetch(
    `${baseUrl.origin}/assets/subset-Inter-Bold.ttf`
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{ fontWeight: 700 }}
        tw="flex flex-col items-center justify-center w-full h-full bg-[#f44336] text-white"
      >
        <div tw="flex flex-col items-center gap-4">
          <h2 tw="text-5xl font-bold tracking-tight leading-3">{username}'s</h2>
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
          data: boldFontData,
          weight: 700,
        },
      ],
    }
  );
};
