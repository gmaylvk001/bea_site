import { noIndexMetadata } from "@/components/NoIndexRobots";
import NoProductClient from "./NoProductClient";

export const metadata = noIndexMetadata;

export default function NoProductPage() {
  return <NoProductClient />;
}
