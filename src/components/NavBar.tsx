import Image from "next/image";
import Link from "next/link";
import Login from "@/components/Login";

export default function NavBar() {
  return (
    <nav className="bg-white text-black p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        
        {/* Empty div to help center logo */}
        <div className="w-1/3"></div>

        {/* Centered Logo */}
        <Link href="/" className="flex justify-center">
          <Image
            src="/logo.png"
            alt="Logo"
            width={300} // Increased size for better visibility
            height={120}
            className="rounded cursor-pointer"
          />
        </Link>

        {/* Google Login Button */}
        <div className="w-1/3 flex justify-end">
          <Login /> {/* ✅ Styled Google Login */}
        </div>

      </div>
    </nav>
  );
}
