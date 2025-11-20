"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends Omit<ImageProps, "onLoad"> {
  containerClassName?: string;
}

export function OptimizedImage({
  className,
  containerClassName,
  alt,
  src,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={cn("relative overflow-hidden bg-muted/20 h-full w-full", containerClassName)}>
      <Image
        src={src}
        alt={alt}
        className={cn(
          "duration-700 ease-in-out",
          isLoading ? "scale-110 blur-xl grayscale" : "scale-100 blur-0 grayscale-0",
          className
        )}
        onLoad={() => setIsLoading(false)}
        {...props}
      />
    </div>
  );
}
