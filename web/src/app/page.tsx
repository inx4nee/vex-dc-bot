'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="bg-discord-dark shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">Vex Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="btn-primary">
                Login with Discord
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
              <span className="block">Vex</span>
              <span className="block text-discord-blurple">Discord Moderation</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-discord-lightgray sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Powerful moderation tools with an intuitive web dashboard. Keep your server safe and organized.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <a
                  href="https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=1099511627830&scope=bot%20applications.commands"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-discord-blurple hover:bg-blue-600 md:py-4 md:text-lg md:px-10"
                >
                  Add to Discord
                </a>
              </div>
              <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                <Link
                  href="/dashboard"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-discord-blurple bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-20">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="card">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-discord-blurple text-white text-2xl">
                  🛡️
                </div>
                <div className="mt-5">
                  <h3 className="text-lg font-medium text-white">Advanced Moderation</h3>
                  <p className="mt-2 text-base text-discord-lightgray">
                    Ban, kick, warn, timeout, and manage members with powerful moderation commands.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="card">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-discord-green text-white text-2xl">
                  🤖
                </div>
                <div className="mt-5">
                  <h3 className="text-lg font-medium text-white">Auto-Moderation</h3>
                  <p className="mt-2 text-base text-discord-lightgray">
                    Automatic spam detection, invite filtering, and content moderation.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="card">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-discord-fuchsia text-white text-2xl">
                  📊
                </div>
                <div className="mt-5">
                  <h3 className="text-lg font-medium text-white">Detailed Logging</h3>
                  <p className="mt-2 text-base text-discord-lightgray">
                    Track all moderation actions with comprehensive logging and case management.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="card">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-discord-yellow text-white text-2xl">
                  ⚙️
                </div>
                <div className="mt-5">
                  <h3 className="text-lg font-medium text-white">Web Dashboard</h3>
                  <p className="mt-2 text-base text-discord-lightgray">
                    Configure everything from a beautiful, easy-to-use web interface.
                  </p>
                </div>
              </div>

              {/* Feature 5 */}
              <div className="card">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-discord-red text-white text-2xl">
                  🎮
                </div>
                <div className="mt-5">
                  <h3 className="text-lg font-medium text-white">Leveling System</h3>
                  <p className="mt-2 text-base text-discord-lightgray">
                    Optional XP and leveling system to engage your community.
                  </p>
                </div>
              </div>

              {/* Feature 6 */}
              <div className="card">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-discord-blurple text-white text-2xl">
                  👋
                </div>
                <div className="mt-5">
                  <h3 className="text-lg font-medium text-white">Welcome Messages</h3>
                  <p className="mt-2 text-base text-discord-lightgray">
                    Customizable welcome and farewell messages for new and leaving members.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-discord-dark">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-discord-lightgray">
            © 2024 Vex - Discord Moderation Bot. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
