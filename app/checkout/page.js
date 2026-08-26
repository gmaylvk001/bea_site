import { noIndexMetadata } from "@/components/NoIndexRobots";
import CheckoutComponent from "@/components/checkout/checkout";

export const metadata = noIndexMetadata;

export default function CheckoutPage() {
  return <CheckoutComponent />;
}
