import { HamburgerMenuSheet } from "./hamburger-menu-sheet";
import { Megamenu } from "./megamenu";
import {
  CONFIG_QUERY,
  DESKTOP_MENU_TYPE,
  MENU_TYPE,
  MOBILE_MENU_TYPE,
} from "./menu-config";

function renderType(type: MENU_TYPE) {
  switch (type) {
    case MENU_TYPE.MEGAMENU:
      return <Megamenu query={CONFIG_QUERY} />;
    case MENU_TYPE.HAMBURGER:
      return <HamburgerMenuSheet query={CONFIG_QUERY} />;
    default:
      return <HamburgerMenuSheet query={CONFIG_QUERY} />;
  }
}

export function MenuTypeRenderer() {
  return (
    <>
      <div className="md:hidden">{renderType(MOBILE_MENU_TYPE)}</div>
      <div className="hidden md:flex items-center">
        {renderType(DESKTOP_MENU_TYPE)}
      </div>
    </>
  );
}
