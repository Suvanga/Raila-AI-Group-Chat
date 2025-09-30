import React from 'react';

// This is the main component for our chat application, now serving as the landing page.
// We have translated the static HTML design into a functional React component.

export function App() {
  return (
    <div className="bg-gray-900 text-white font-sans">
      {/* Header */}
      <header className="container mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-indigo-400">Project Raila Chat</h1>
        <nav>
          <a href="#features" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Features</a>
          <a href="#how-it-works" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">How It Works</a>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
            Request Early Access
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4">The Invite-Only Group Chat <br /> with Your Personal AI Sidekick.</h2>
          <p className="text-lg md:text-xl text-gray-400 mb-8">
            Tired of boring group chats? Raila brings the fun with a customizable AI bot that's part of your crew—ready for roasts, trip planning, and unleashing its divine knowledge.
          </p>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full text-lg transition duration-300">
            Get Your Invite
          </button>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="bg-gray-800 py-20">
        <div className="container mx-auto px-6">
          <h3 className="text-3xl font-bold text-center mb-12">Not Just a Chat. It's an Experience.</h3>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {/* Feature 1: AI Bot */}
            <div className="bg-gray-700 p-8 rounded-xl shadow-lg">
              <div className="text-4xl mb-4 text-indigo-400">🤖</div>
              <h4 className="text-xl font-semibold mb-2">Your AI Group Member</h4>
              <p className="text-gray-400">Meet your new group member, an AI bot you can name and customize. It's there to help with everything from witty comebacks to settling debates.</p>
            </div>
            {/* Feature 2: Customization */}
            <div className="bg-gray-700 p-8 rounded-xl shadow-lg">
              <div className="text-4xl mb-4 text-indigo-400">🎨</div>
              <h4 className="text-xl font-semibold mb-2">Make It Yours</h4>
              <p className="text-gray-400">Give your AI a unique name, personality, and even set its vulgarity level. From wholesome to hilariously savage, you're in control.</p>
            </div>
            {/* Feature 3: Group Tools */}
            <div className="bg-gray-700 p-8 rounded-xl shadow-lg">
              <div className="text-4xl mb-4 text-indigo-400">✈️</div>
              <h4 className="text-xl font-semibold mb-2">Plan Anything, Instantly</h4>
              <p className="text-gray-400">Planning a party, a trip, or a simple movie night? Just ask your AI. It helps organize plans, create polls, and keep everyone on the same page.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-6">
          <h3 className="text-3xl font-bold text-center mb-12">Get Started in Seconds</h3>
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16">
            <div className="flex items-center">
              <div className="bg-indigo-500 text-white rounded-full h-12 w-12 flex items-center justify-center text-xl font-bold">1</div>
              <p className="ml-4 text-lg">Create your private group.</p>
            </div>
            <div className="text-gray-500 text-2xl hidden md:block">→</div>
            <div className="flex items-center">
              <div className="bg-indigo-500 text-white rounded-full h-12 w-12 flex items-center justify-center text-xl font-bold">2</div>
              <p className="ml-4 text-lg">Invite your friends.</p>
            </div>
            <div className="text-gray-500 text-2xl hidden md:block">→</div>
            <div className="flex items-center">
              <div className="bg-indigo-500 text-white rounded-full h-12 w-12 flex items-center justify-center text-xl font-bold">3</div>
              <p className="ml-4 text-lg">Customize your AI bot & chat!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 py-8">
        <div className="container mx-auto px-6 text-center text-gray-400">
          <p>&copy; 2025 Project Raila Chat. All rights reserved.</p>
          <div className="flex justify-center space-x-4 mt-4">
            <a href="#" className="hover:text-white">Twitter</a>
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
