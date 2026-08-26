import { noIndexMetadata } from "@/components/NoIndexRobots";
import OrderComponent from "@/components/order/order";

export const metadata = noIndexMetadata;

export default function OrdersPage() {
  return <OrderComponent />;
}
