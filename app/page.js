import Dashboard from "@/components/Dashboard";
import processed from "@/data/processed.json";

export default function Home() {
  return <Dashboard rows={processed.rows} asOfDate={processed.asOfDate} generatedAt={processed.generatedAt} />;
}
