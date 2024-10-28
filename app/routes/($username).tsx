import {
  HeadersFunction,
  json,
  MetaFunction,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "Scrobbles.Today" },
    { name: "description", content: "How much did you scrobble today?" },
  ];
};

export const headers: HeadersFunction = () => ({
  "Cache-Control": "s-maxage=59, stale-while-revalidate=120",
});

async function fetchScrobblesForToday(
  username: string
): Promise<number | undefined> {
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
    });
  }

  return json({
    message: `${username}'s Last.fm stats for today`,
    scrobbles,
  });
}

export default function Index() {
  const { scrobbles } = useLoaderData<typeof loader>();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 to-blue-500">
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
