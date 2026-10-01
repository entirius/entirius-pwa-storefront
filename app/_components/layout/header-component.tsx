import { NavigationComponent } from "./navigation-component";
import { WishlistSheet } from "./wishlist-sheet";
import { CartSheet } from "./cart-sheet";
import { AccountNav } from "./account-nav";
import { SearchSheet } from "./search-sheet";
import { LinkDynamic } from "@/lib/link-dynamic";
import { BrandMark } from "./brand-mark";
import { SITE_NAME } from "@/_CONFIG/app.config.json";

export function HeaderComponent() {
  return (
    <header className="sticky top-0 z-10 flex justify-between items-center px-4 h-14 border-b border-border bg-background">
      <LinkDynamic href="/" className="flex items-center" aria-label={`${SITE_NAME} — home`}>
        <BrandMark />
      </LinkDynamic>
      <div className="flex items-center gap-2">
        <NavigationComponent />
        <SearchSheet />
        <WishlistSheet />
        <CartSheet />
        <AccountNav />
      </div>
    </header>
  );
}