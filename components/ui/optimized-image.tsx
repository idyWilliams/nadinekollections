"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends Omit<ImageProps, "onLoad" | "placeholder"> {
  containerClassName?: string;
  showSkeleton?: boolean;
}

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
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

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
      className={cn("relative overflow-hidden bg-muted/20 h-full w-full", containerClassName)}
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
        fetchPriority={priority ? "high" : undefined}
        decoding={priority ? "sync" : "async"}
        className={cn(
          "transition-opacity duration-300 ease-out",
          isLoaded ? "opacity-100" : showSkeleton ? "opacity-0" : "opacity-100",
          className
        )}
        onLoad={() => setIsLoaded(true)}
        {...props}
      />
    </div>
  );
}
