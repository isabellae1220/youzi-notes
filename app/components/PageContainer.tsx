import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type PageContainerProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function PageContainer<T extends ElementType = "div">({
  as,
  children,
  className = "",
  ...props
}: PageContainerProps<T>) {
  const Component = as ?? "div";

  return (
    <Component className={["shell", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </Component>
  );
}
