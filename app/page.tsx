import { Desktop } from "@/components/desktop";
import { NUMA_MIXES_URL } from "@/lib/config";

export default async function Home() {
  const data = await fetch(NUMA_MIXES_URL);
  const mixes = await data.json();
  return <Desktop mixes={mixes} />;
}
