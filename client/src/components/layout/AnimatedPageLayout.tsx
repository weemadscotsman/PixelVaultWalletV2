import { ReactNode } from "react";
import { PageLayout, PageLayoutProps } from "./PageLayout";
import { PageTransition } from "@/components/ui/PageTransition";
import { useLocation } from "wouter";

interface AnimatedPageLayoutProps extends PageLayoutProps {
  variant?: "default" | "slide" | "pop" | "fade";
}

export function AnimatedPageLayout({
  children,
  variant = "default",
  isConnected,
}: AnimatedPageLayoutProps) {
  const [location] = useLocation();

  // Different animation variants based on page type
  const getVariant = () => {
    switch (variant) {
      case "slide":
        return {
          initial: { opacity: 0, x: 60 },
          animate: {
            opacity: 1,
            x: 0,
            transition: {
              duration: 0.4,
              ease: [0.25, 0.1, 0.25, 1.0],
            },
          },
          exit: {
            opacity: 0,
            x: -60,
            transition: {
              duration: 0.2,
            },
          },
        };
      case "fade":
        return {
          initial: { opacity: 0 },
          animate: {
            opacity: 1,
            transition: {
              duration: 0.4,
            },
          },
          exit: {
            opacity: 0,
            transition: {
              duration: 0.2,
            },
          },
        };
      case "pop":
        return {
          initial: { opacity: 0, scale: 0.9 },
          animate: {
            opacity: 1,
            scale: 1, 
            transition: {
              duration: 0.3,
              type: "spring",
              stiffness: 260,
              damping: 20,
            },
          },
          exit: {
            opacity: 0,
            scale: 0.95,
            transition: {
              duration: 0.2,
            },
          },
        };
      default:
        return {
          initial: { opacity: 0, y: 20, scale: 0.98 },
          animate: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
              duration: 0.4,
              ease: [0.25, 0.1, 0.25, 1.0],
            },
          },
          exit: {
            opacity: 0,
            y: -10,
            transition: {
              duration: 0.2,
            },
          },
        };
    }
  };

  return (
    <PageLayout isConnected={isConnected}>
      <div className="relative z-10 w-full" style={{ position: 'relative', pointerEvents: 'auto' }}>
        <PageTransition variants={getVariant()}>
          {children}
        </PageTransition>
      </div>
    </PageLayout>
  );
}