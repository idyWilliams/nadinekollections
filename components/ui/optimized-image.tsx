"use client";

import { useMemo } from "react";
import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends Omit<ImageProps, "onLoad" | "placeholder"> {
  containerClassName?: string;
  showSkeleton?: boolean;
  blurDataURL?: string;
}

const DEFAULT_BLUR =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f5f5f5'/%3E%3Cstop offset='50%25' stop-color='%23e8e8e8'/%3E%3Cstop offset='100%25' stop-color='%23f0f0f0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3C/svg%3E";

export function OptimizedImage({
  className,
  containerClassName,
  alt,
  src,
  priority,
  loading,
  quality,
  sizes,
  fill,
  style,
  showSkeleton = true,
  blurDataURL,
  ...props
}: OptimizedImageProps) {
  const hasCustomBlur = typeof blurDataURL === "string" && blurDataURL.length > 0;

  const placeholder = useMemo<"blur" | "empty">(() => {
    if (hasCustomBlur) return "blur";
    if (showSkeleton) return "blur";
    return "empty";
  }, [hasCustomBlur, showSkeleton]);

  if (!src) {
    return (
      <div
        className={cn(
          "relative overflow-hidden bg-muted/20 h-full w-full",
          showSkeleton && "animate-pulse",
          containerClassName
        )}
      />
    );
  }

  const effectiveLoading = priority ? "eager" : loading ?? "lazy";
  const effectiveQuality = quality ?? 75;

  return (
    <div
      className={cn("relative overflow-hidden bg-muted/10 h-full w-full", containerClassName)}
      style={style}
    >
      <Image
        src={src}
        alt={alt || ""}
        priority={priority}
        loading={effectiveLoading}
        quality={effectiveQuality}
        sizes={sizes}
        fill={fill}
        fetchPriority={priority ? "high" : "auto"}
        decoding={priority ? "sync" : "async"}
        placeholder={placeholder}
        blurDataURL={hasCustomBlur ? blurDataURL! : DEFAULT_BLUR}
        className={cn(className)}
        {...props}
      />
    </div>
  );
}
