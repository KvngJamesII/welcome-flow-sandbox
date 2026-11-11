/**
 * SportyPunter mark. a football on a rounded badge, so it stays legible at
 * favicon size as well as in the header.
 */
export function BrandLogo({ className = "h-8 w-8" }: { className?: string }) {
 return (
 <svg
 viewBox="0 0 64 64"
 xmlns="http://www.w3.org/2000/svg"
 className={className}
 aria-hidden="true"
 >
 <rect width="64" height="64" rx="15" fill="currentColor" />
 <path
 d="M32 14a18 18 0 1 0 0 36 18 18 0 0 0 0-36Zm0 3.4 8.9 3.5 1.7 5.2-6.4 4.7h-8.4l-6.4-4.7 1.7-5.2L32 17.4Zm-13.8 8.9 4.3 3.2 2.6 8.1-3.5 5.2-3.9-.6a14.6 14.6 0 0 1-2.1-12.6l2.6-3.3Zm27.6 0 2.6 3.3a14.6 14.6 0 0 1-2.1 12.6l-3.9.6-3.5-5.2 2.6-8.1 4.3-3.2ZM32 32.6h6.7l2.6 8-5.4 4h-7.8l-5.4-4 2.6-8H32Z"
 fill="#fff"
 />
 </svg>
 );
}
