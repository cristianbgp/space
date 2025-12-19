import { Mix } from "@/components/mini-apps/music-app";
import { fetcher } from "@/lib/fetcher";
import useSWR from "swr";

export const useNumaMixes = () =>
  useSWR<Mix[]>("https://numa.channel/data.json", fetcher, {
    suspense: true,
    revalidateOnFocus: false,
  });
