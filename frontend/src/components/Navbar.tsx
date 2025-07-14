import Link from 'next/link';

const Navbar = () => {
  return (
    <header className="bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
      <nav className="container mx-auto flex items-center justify-between p-4 text-white">
        <Link href="/" className="text-xl font-bold hover:text-cyan-400 transition-colors">
          Hidden Word Duel
        </Link>
        <div className="space-x-6 flex items-center">
          <Link href="/login" className="text-gray-300 hover:text-white transition-colors">
            Login
          </Link>
          <Link href="/register" className="bg-cyan-600 hover:bg-cyan-500 transition-colors text-white font-bold py-2 px-4 rounded">
            Register
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
