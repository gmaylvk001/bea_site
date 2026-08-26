import { noIndexMetadata } from "@/components/NoIndexRobots";
import ProfileComponent from "@/components/profile/profile";

export const metadata = noIndexMetadata;

export default function ProfilePage() {
  return <ProfileComponent />;
}
