import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react"

function Header() {
  return (
    <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand section */}
          <div className="flex items-center">
            <h1 className="text-2xl font-semibold text-red-600 hover:text-red-500 transition-all duration-200 cursor-pointer hover:drop-shadow-sm">
              NeoSync
            </h1>
          </div>

          {/* Authentication section */}
          <div className="flex items-center space-x-4">
            <SignedOut>
              <div className="flex items-center space-x-3">
                <SignInButton>
                  <button className="bg-white hover:bg-red-600 text-red-600 hover:text-white font-medium py-2.5 px-6 rounded-md border border-red-600 hover:border-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton>
                  <button className="bg-white hover:bg-red-600 text-red-600 hover:text-white font-medium py-2.5 px-6 rounded-md border border-red-600 hover:border-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0">
                    Sign Up
                  </button>
                </SignUpButton>
              </div>
            </SignedOut>
            <SignedIn>
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9 rounded-full border-2 border-gray-200 hover:border-red-400 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105",
                    userButtonPopover: "bg-white border border-gray-200 shadow-xl rounded-lg mt-2"
                  }
                }}
              />
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header