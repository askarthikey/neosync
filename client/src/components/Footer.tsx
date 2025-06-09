function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 shadow-lg mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
          {/* Brand section */}
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-red-600 mb-4">NeoSync</h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
              The ultimate collaboration platform for YouTube content creators and editors. Streamline your workflow and create amazing content faster than ever.
            </p>
            <div className="flex justify-center space-x-4 mb-8">
              <a href="#" className="text-gray-400 hover:text-red-600 transition-colors duration-200">
                <span className="sr-only">YouTube</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M19.615 6.445c-.23-1.26-1.197-2.188-2.521-2.407C15.6 3.8 10 3.8 10 3.8s-5.6 0-7.094.238C1.582 4.257.615 5.185.385 6.445.125 7.888.125 10.9.125 10.9s0 3.012.26 4.455c.23 1.26 1.197 2.188 2.521 2.407C4.4 18 10 18 10 18s5.6 0 7.094-.238c1.324-.219 2.291-1.147 2.521-2.407.26-1.443.26-4.455.26-4.455s0-3.012-.26-4.455zM8.077 13.846V7.954l4.746 2.946-4.746 2.946z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-red-600 transition-colors duration-200">
                <span className="sr-only">Discord</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M16.942 6.478c-1.297-.6-2.686-1.044-4.142-1.297-.178.32-.377.738-.515 1.067-1.564-.234-3.124-.234-4.658 0-.138-.329-.342-.747-.52-1.067-1.456.253-2.845.697-4.142 1.297C.533 9.093-.32 11.643.099 14.135a13.077 13.077 0 003.934 1.989c.317-.427.599-.88.840-1.357-.462-.173-.905-.378-1.328-.613.111-.082.221-.167.327-.253 2.565 1.173 5.337 1.173 7.856 0 .106.086.216.171.327.253-.423.235-.866.44-1.328.613.241.477.523.93.840 1.357a13.077 13.077 0 003.934-1.989c.49-2.892-.823-5.401-3.483-7.657zm-12.02 6.142c-1.158 0-2.098-1.058-2.098-2.357s.916-2.357 2.098-2.357c1.182 0 2.122 1.082 2.098 2.357 0 1.299-.94 2.357-2.098 2.357zm7.156 0c-1.158 0-2.098-1.058-2.098-2.357s.916-2.357 2.098-2.357c1.182 0 2.122 1.082 2.098 2.357 0 1.299-.916 2.357-2.098 2.357z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-red-600 transition-colors duration-200">
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-red-600 transition-colors duration-200">
                <span className="sr-only">Instagram</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm4.7 14.7a1.5 1.5 0 01-1.5 1.5H6.8a1.5 1.5 0 01-1.5-1.5V5.3a1.5 1.5 0 011.5-1.5h6.4a1.5 1.5 0 011.5 1.5v9.4z" clipRule="evenodd"/>
                  <path d="M10 7.1a2.9 2.9 0 100 5.8 2.9 2.9 0 000-5.8zm3.2-1.8a.7.7 0 11-1.4 0 .7.7 0 011.4 0z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Creator tools section */}
        <div className="pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <h5 className="text-sm font-semibold text-red-600 mb-2">For Creators</h5>
              <p className="text-xs text-gray-500">Streamline your content creation process with powerful collaboration tools</p>
            </div>
            <div className="text-center">
              <h5 className="text-sm font-semibold text-red-600 mb-2">For Editors</h5>
              <p className="text-xs text-gray-500">Professional editing workflow with seamless project handoffs</p>
            </div>
            <div className="text-center">
              <h5 className="text-sm font-semibold text-red-600 mb-2">For Teams</h5>
              <p className="text-xs text-gray-500">Scale your content production with team collaboration features</p>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} NeoSync. Empowering creators worldwide.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer