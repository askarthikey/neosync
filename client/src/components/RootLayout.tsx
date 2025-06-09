import {Outlet} from "react-router-dom"
import Footer from "./Footer"
import Header from "./Header"

function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-red-50">
      {/* Header with backdrop blur effect */}
      <div className="sticky top-0 z-50 backdrop-blur-sm">
        <Header/>
      </div>
      
      {/* Main content area */}
      <main className="flex-1 relative">
        {/* Background pattern overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-50/30 to-transparent opacity-40"></div>
        
        {/* Content wrapper with proper spacing */}
        <div className="relative z-10 min-h-full">
          <Outlet/>
        </div>
      </main>
      
      {/* Footer always at bottom */}
      <div className="mt-auto">
        <Footer/>
      </div>
    </div>
  )
}

export default RootLayout