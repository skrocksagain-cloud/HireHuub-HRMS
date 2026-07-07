export default function Login() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-700">
            HireHuub
          </h1>

          <p className="text-gray-500 mt-2">
            HR Management System
          </p>
        </div>

        <form className="space-y-5">

          <div>
            <label className="block text-sm font-medium mb-2">
              Employee ID
            </label>

            <input
              type="text"
              placeholder="HH001"
              className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Password
            </label>

            <input
              type="password"
              placeholder="********"
              className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          <div className="flex items-center justify-between">

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" />
              Remember Me
            </label>

            <button
              type="button"
              className="text-green-700 text-sm"
            >
              Forgot Password?
            </button>

          </div>

          <button
            className="w-full bg-green-700 hover:bg-green-800 text-white py-3 rounded-lg font-semibold"
          >
            Sign In
          </button>

        </form>

        <div className="text-center mt-8 text-sm text-gray-500">
          Version 1.0
        </div>

      </div>
    </div>
  );
}