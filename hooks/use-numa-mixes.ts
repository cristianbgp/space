import { Mix } from "@/components/mini-apps/music-app";
import { fetcher } from "@/lib/fetcher";
import useSWR from "swr";
import { NUMA_MIXES_URL } from "@/lib/config";

export const useNumaMixes = () =>
  useSWR<Mix[]>(NUMA_MIXES_URL, fetcher, {
    suspense: true,
    revalidateOnFocus: false,
  });
