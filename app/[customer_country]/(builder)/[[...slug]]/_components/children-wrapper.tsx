import React from "react";

export type ChildrenLayout =
  | "horizontal"
  | "grid-2"
  | "grid-3"
  | "grid-4"
  | "vertical";

interface ChildrenWrapperProps {
  children?: React.ReactNode;
  layout?: ChildrenLayout;
}

const grid_cols_map: Record<string, string> = {
  "grid-2": "grid-cols-2",
  "grid-3": "grid-cols-3",
  "grid-4": "grid-cols-4",
};

export default function ChildrenWrapper({
  children,
  layout = "vertical",
}: ChildrenWrapperProps) {
  if (!children) return null;

  if (layout === "horizontal") {
    return (
      <div className="flex overflow-x-auto gap-3 py-2 -mx-5 px-5 scrollbar-hide">
        {React.Children.toArray(children).map((child, index) => (
          <div key={index} className="w-[70vw] max-w-[280px] shrink-0">
            {child}
          </div>
        ))}
      </div>
    );
  }

  if (layout.startsWith("grid-")) {
    const cols_class = grid_cols_map[layout] ?? "grid-cols-2";
    return (
      <div className={`grid ${cols_class} gap-3 mt-2`}>{children}</div>
    );
  }

  return <div className="flex flex-col gap-3 mt-2">{children}</div>;
}
