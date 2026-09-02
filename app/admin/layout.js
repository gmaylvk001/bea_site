import AdminLayoutClient from "@/app/admin/AdminLayoutClient";

export const metadata = {
  robots: "noindex, nocache, noarchive, nofollow",
};

export default function AdminLayout({ children }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
