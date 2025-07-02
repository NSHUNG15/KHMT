import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface LogoProps {
  className?: string;
  withText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, withText = true, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "h-6",
    md: "h-8",
    lg: "h-10",
  };

  return (
    <Link href="/" className={cn("flex items-center", className)}>
      {/* <svg 
        className={cn(sizeClasses[size], "text-primary")} 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M16 2H8C4.691 2 2 4.691 2 8V16C2 19.309 4.691 22 8 22H16C19.309 22 22 19.309 22 16V8C22 4.691 19.309 2 16 2Z" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <path 
          d="M12 16.5C14.4853 16.5 16.5 14.4853 16.5 12C16.5 9.51472 14.4853 7.5 12 7.5C9.51472 7.5 7.5 9.51472 7.5 12C7.5 14.4853 9.51472 16.5 12 16.5Z" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <path 
          d="M17 7C17.5523 7 18 6.55228 18 6C18 5.44772 17.5523 5 17 5C16.4477 5 16 5.44772 16 6C16 6.55228 16.4477 7 17 7Z" 
          fill="currentColor"
        />
      </svg> */}
      
      {withText && (
        <div className={cn("ml-2", size === "sm" ? "hidden md:block" : "")}>
          <h1 className={cn(
            "font-semibold font-special text-primary",
            size === "sm" ? "text-base" : size === "md" ? "text-lg" : "text-xl"
          )}>
            Đoàn trường KHMT
          </h1>
          <p className={cn(
            "text-gray-500", 
            size === "sm" ? "text-xs" : size === "md" ? "text-xs" : "text-sm"
          )}>
            Đại học Duy Tân
          </p>
        </div>
      )}
    </Link>
  );
}
