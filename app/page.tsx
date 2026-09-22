import { PortfolioCanvas } from "./components/PortfolioCanvas";
import { getPageById } from "./site-data";

export default function Home() {
  const page = getPageById(1);
  return <PortfolioCanvas {...page} />;
}
