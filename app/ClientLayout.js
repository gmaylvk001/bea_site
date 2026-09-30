"use client";

import { usePathname } from "next/navigation";
import CustomHeader from "@/components/Headernew";
import CustomFooter from "@/components/Footer";
import GlobalModals from "@/components/GlobalModals";
import { AuthProvider } from "@/context/AuthContext";
import { ModalProvider } from "@/context/ModalContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { CartProvider } from "@/context/CartContext";
import { HeaderProvider } from "@/context/HeaderContext";
import { SmartLeadConfigProvider } from "@/context/SmartLeadConfigContext";
import { VisitorIntentProvider } from "@/context/VisitorIntentContext";
import SmartLeadPopupHost from "@/components/smartLead/SmartLeadPopupHost";
import WhatsAppFloat from "@/app/WhatsappFloat";

export default function ClientLayout({ children, initialCategories = [] }) {
  const pathname = usePathname();

  return (
    <HeaderProvider>
      <ModalProvider>
        <WishlistProvider>
          <CartProvider>
            <AuthProvider>
              <SmartLeadConfigProvider>
                <VisitorIntentProvider>
                  {!pathname?.startsWith("/admin") && <CustomHeader initialCategories={initialCategories} />}
                  <main className="relative">{children}</main>
                  {!pathname?.startsWith("/admin") && <CustomFooter initialCategories={initialCategories} />}
                  <GlobalModals />
                  <SmartLeadPopupHost />
                  <WhatsAppFloat />
                </VisitorIntentProvider>
              </SmartLeadConfigProvider>
            </AuthProvider>
          </CartProvider>
        </WishlistProvider>
      </ModalProvider>
    </HeaderProvider>
  );
}
