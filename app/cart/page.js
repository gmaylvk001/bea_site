import { noIndexMetadata } from "@/components/NoIndexRobots";
import CartComponent from "@/components/cart";

export const metadata = noIndexMetadata;

export default function CartPage() {
  return <CartComponent />;
}
