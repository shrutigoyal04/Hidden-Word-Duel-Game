"use client";

const LoginForm = () => {
    return (
      <div className="container mx-auto max-w-sm mt-20 p-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-white">Login</h1>
        <form className="bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white border-gray-600 leading-tight focus:outline-none focus:shadow-outline"
              id="email"
              type="email"
              placeholder="your-email@example.com"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white border-gray-600 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              id="password"
              type="password"
              placeholder="******************"
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              type="button"
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    );
  };
  
  export default LoginForm;