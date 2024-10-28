import {
  HeadersFunction,
  json,
  MetaFunction,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const ogImageUrl = `https://scrobbles.today/api/og?username=${data?.username}&scrobbles=${data?.scrobbles}`;

  return [
    { title: `${data?.username} has ${data?.scrobbles} Scrobbles.Today` },
    { name: "description", content: "How much did you scrobble today?" },
    { name: "theme-color", content: "#EC4C3B" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:creator", content: "@datejer" },
    {
      name: "twitter:title",
      content: `${data?.username} has ${data?.scrobbles} Scrobbles.Today`,
    },
    {
      name: "twitter:description",
      content: "How much did you scrobble today?",
    },
    {
      name: "og:title",
      content: `${data?.username} has ${data?.scrobbles} Scrobbles.Today`,
    },
    { name: "og:description", content: "How much did you scrobble today?" },
    { name: "og:url", content: "https://scrobbles.today" },
    { name: "og:site_name", content: "Scrobbles.Today" },
    { name: "og:type", content: "website" },
    { name: "og:locale", content: "en_US" },
    { name: "apple-mobile-web-app-title", content: "Scrobbles.Today" },
    { name: "apple-mobile-web-app-capable", content: "yes" },
    { name: "apple-mobile-web-app-status-bar-style", content: "default" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },

    { name: "twitter:image", content: ogImageUrl },
    { name: "og:image", content: ogImageUrl },
  ];
};

export const headers: HeadersFunction = () => ({
  "Cache-Control": "s-maxage=59, stale-while-revalidate=120",
});

async function fetchScrobblesForToday(
  username: string
): Promise<number | undefined> {
  if (!process.env.LASTFM_API_KEY) {
    console.error("Missing LASTFM_API_KEY environment variable");
    return undefined;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfDay = Math.floor(today.getTime() / 1000); // Convert to UNIX timestamp

  const endOfDay = startOfDay + 86400 - 1; // End of day UNIX timestamp

  let totalScrobbles = 0;
  let page = 1;
  let totalPages = 1;

  try {
    // Loop through each page until we reach the last page
    do {
      const url = new URL("http://ws.audioscrobbler.com/2.0/");
      url.searchParams.append("method", "user.getrecenttracks");
      url.searchParams.append("user", username);
      url.searchParams.append("api_key", process.env.LASTFM_API_KEY || "");
      url.searchParams.append("format", "json");
      url.searchParams.append("from", startOfDay.toString());
      url.searchParams.append("to", endOfDay.toString());
      url.searchParams.append("limit", "200");
      url.searchParams.append("page", page.toString());

      const response = await fetch(url.toString());

      const data = await response.json();

      console.log(`Fetched page ${page} of scrobbles for ${username}`);
      console.log(data);
      console.log(response.headers);

      if (data && data.recenttracks && data.recenttracks.track) {
        const tracks = data.recenttracks.track;

        // Count scrobbles on the current page
        totalScrobbles += tracks.length;

        // Set total pages from response
        totalPages = parseInt(data.recenttracks["@attr"].totalPages);
        page += 1;
      } else {
        console.log("No tracks found for today.");
        break;
      }
    } while (page <= totalPages);

    console.log(`Total scrobbles for ${username} today: ${totalScrobbles}`);
    return totalScrobbles;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error fetching data:", error.message);
    } else {
      console.error("Error fetching data:", error);
    }
    return undefined;
  }
}

export async function loader({ params }: LoaderFunctionArgs) {
  const username = params.username || "datejer";

  // Fetch the scrobbles for today using the helper function
  const scrobbles = await fetchScrobblesForToday(username);

  if (scrobbles === undefined) {
    return json({
      message: `Failed to fetch scrobbles for ${username} today.`,
      scrobbles: 0,
      username,
    });
  }

  return json({
    message: `${username}'s Last.fm stats for today`,
    scrobbles,
    username,
  });
}

export default function Index() {
  const { scrobbles } = useLoaderData<typeof loader>();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#F44336] to-[#EC4C3B]">
      <div className="text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          Scrobbles Today:
        </h1>
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <span className="text-6xl md:text-8xl font-bold text-gray-800 tabular-nums">
            {scrobbles}
          </span>
        </div>
      </div>
    </div>
  );
}
