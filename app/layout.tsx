import "./styles.css";
import "./overrides.css";
export const metadata = { title:"TaskFlow", description:"Shared work, clearly routed." };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en" suppressHydrationWarning><body>{children}</body></html>; }
