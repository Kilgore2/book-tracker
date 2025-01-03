export default function Footer() {
    return (
      <footer className="bg-gray-100 text-center py-4 mt-8">
        <p className="text-sm text-gray-600">
          © {new Date().getFullYear()} BookStore. All rights reserved.
        </p>
      </footer>
    );
  }
  