import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function StartPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsVisible(true);
    
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      {/* Custom animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }
        
        @keyframes floatSlow {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          25% {
            transform: translateY(-15px) translateX(10px);
          }
          50% {
            transform: translateY(-30px) translateX(-10px);
          }
          75% {
            transform: translateY(-15px) translateX(15px);
          }
        }
        
        @keyframes drift {
          0% {
            transform: translateX(-100px) translateY(0px);
          }
          100% {
            transform: translateX(calc(100vw + 100px)) translateY(-50px);
          }
        }
        
        @keyframes twinkle {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
        
        @keyframes orbit {
          from {
            transform: rotate(0deg) translateX(100px) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(100px) rotate(-360deg);
          }
        }
        
        @keyframes spiral {
          from {
            transform: rotate(0deg) translateX(50px) scale(0.5);
          }
          to {
            transform: rotate(720deg) translateX(150px) scale(1);
          }
        }
        
        @keyframes wave {
          0%, 100% {
            transform: translateX(0px) translateY(0px);
          }
          25% {
            transform: translateX(20px) translateY(-15px);
          }
          50% {
            transform: translateX(-10px) translateY(-30px);
          }
          75% {
            transform: translateX(-25px) translateY(-10px);
          }
        }
        
        @keyframes zigzag {
          0% {
            transform: translateX(0px) translateY(0px);
          }
          25% {
            transform: translateX(30px) translateY(-20px);
          }
          50% {
            transform: translateX(-20px) translateY(-40px);
          }
          75% {
            transform: translateX(40px) translateY(-60px);
          }
          100% {
            transform: translateX(0px) translateY(-80px);
          }
        }
        
        @keyframes morphing {
          0%, 100% {
            border-radius: 50%;
            transform: rotate(0deg) scale(1);
          }
          25% {
            border-radius: 0%;
            transform: rotate(90deg) scale(1.2);
          }
          50% {
            border-radius: 30%;
            transform: rotate(180deg) scale(0.8);
          }
          75% {
            border-radius: 10%;
            transform: rotate(270deg) scale(1.1);
          }
        }
        
        @keyframes fadeInOut {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-slideInLeft {
          animation: slideInLeft 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animate-slideInRight {
          animation: slideInRight 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animate-slideInUp {
          animation: slideInUp 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-floatSlow {
          animation: floatSlow 8s ease-in-out infinite;
        }
        
        .animate-drift {
          animation: drift 20s linear infinite;
        }
        
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }
        
        .animate-orbit {
          animation: orbit 30s linear infinite;
        }
        
        .animate-spiral {
          animation: spiral 15s ease-in-out infinite;
        }
        
        .animate-wave {
          animation: wave 4s ease-in-out infinite;
        }
        
        .animate-zigzag {
          animation: zigzag 8s linear infinite;
        }
        
        .animate-morphing {
          animation: morphing 6s ease-in-out infinite;
        }
        
        .animate-fadeInOut {
          animation: fadeInOut 3s ease-in-out infinite;
        }
        
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-gray-900 via-black to-gray-800 relative overflow-hidden">
      
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(rgba(168, 85, 247, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(168, 85, 247, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
          animation: 'drift 60s linear infinite'
        }}></div>
      </div>
      
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large floating orbs */}
        <div className="absolute w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse animate-floatSlow" 
             style={{ 
               left: `${mousePosition.x * 0.02}px`, 
               top: `${mousePosition.y * 0.02}px`,
               animationDelay: '0s'
             }}></div>
        <div className="absolute w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse animate-floatSlow" 
             style={{ 
               right: `${mousePosition.x * 0.015}px`, 
               bottom: `${mousePosition.y * 0.015}px`,
               animationDelay: '1s'
             }}></div>
        <div className="absolute w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl animate-pulse animate-float" 
             style={{ 
               left: `50%`, 
               top: `${mousePosition.y * 0.01}px`,
               animationDelay: '2s'
             }}></div>
        
        {/* Drifting particles */}
        <div className="absolute top-20 w-2 h-2 bg-blue-400/30 rounded-full animate-drift" style={{animationDelay: '0s'}}></div>
        <div className="absolute top-40 w-1 h-1 bg-purple-400/40 rounded-full animate-drift" style={{animationDelay: '3s'}}></div>
        <div className="absolute top-60 w-3 h-3 bg-cyan-400/20 rounded-full animate-drift" style={{animationDelay: '6s'}}></div>
        <div className="absolute top-80 w-1.5 h-1.5 bg-pink-400/35 rounded-full animate-drift" style={{animationDelay: '9s'}}></div>
        <div className="absolute top-32 w-2.5 h-2.5 bg-yellow-400/25 rounded-full animate-drift" style={{animationDelay: '12s'}}></div>
        <div className="absolute top-96 w-1 h-1 bg-green-400/30 rounded-full animate-drift" style={{animationDelay: '15s'}}></div>
        <div className="absolute top-16 w-1.5 h-1.5 bg-indigo-400/35 rounded-full animate-drift" style={{animationDelay: '18s'}}></div>
        <div className="absolute top-72 w-2 h-2 bg-orange-400/30 rounded-full animate-drift" style={{animationDelay: '21s'}}></div>
        <div className="absolute top-88 w-1 h-1 bg-rose-400/40 rounded-full animate-drift" style={{animationDelay: '24s'}}></div>
        <div className="absolute top-24 w-3 h-3 bg-emerald-400/25 rounded-full animate-drift" style={{animationDelay: '27s'}}></div>
        
        {/* Zigzag moving particles */}
        <div className="absolute top-10 left-10 w-1.5 h-1.5 bg-blue-500/40 rounded-full animate-zigzag" style={{animationDelay: '0s'}}></div>
        <div className="absolute top-30 right-20 w-1 h-1 bg-purple-500/50 rounded-full animate-zigzag" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-50 left-1/3 w-2 h-2 bg-cyan-500/30 rounded-full animate-zigzag" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-70 right-1/4 w-1.5 h-1.5 bg-pink-500/35 rounded-full animate-zigzag" style={{animationDelay: '6s'}}></div>
        <div className="absolute top-14 left-2/3 w-1 h-1 bg-yellow-500/45 rounded-full animate-zigzag" style={{animationDelay: '8s'}}></div>
        
        {/* Wave motion particles */}
        <div className="absolute top-1/4 left-0 w-2 h-2 bg-blue-400/25 rounded-full animate-wave" style={{animationDelay: '0s'}}></div>
        <div className="absolute top-1/3 left-10 w-1.5 h-1.5 bg-purple-400/30 rounded-full animate-wave" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-20 w-1 h-1 bg-cyan-400/35 rounded-full animate-wave" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-2/3 left-30 w-2.5 h-2.5 bg-pink-400/20 rounded-full animate-wave" style={{animationDelay: '3s'}}></div>
        <div className="absolute bottom-1/4 left-40 w-1.5 h-1.5 bg-yellow-400/25 rounded-full animate-wave" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-1/3 left-50 w-1 h-1 bg-green-400/30 rounded-full animate-wave" style={{animationDelay: '1.5s'}}></div>
        
        {/* Spiral particles */}
        <div className="absolute top-1/5 left-1/5">
          <div className="w-1.5 h-1.5 bg-blue-500/30 rounded-full animate-spiral" style={{animationDelay: '0s'}}></div>
        </div>
        <div className="absolute top-2/5 right-1/5">
          <div className="w-1 h-1 bg-purple-500/35 rounded-full animate-spiral" style={{animationDelay: '5s'}}></div>
        </div>
        <div className="absolute bottom-1/5 left-2/5">
          <div className="w-2 h-2 bg-cyan-500/25 rounded-full animate-spiral" style={{animationDelay: '10s'}}></div>
        </div>
        
        {/* Morphing particles */}
        <div className="absolute top-1/6 right-1/6 w-3 h-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-morphing" style={{animationDelay: '0s'}}></div>
        <div className="absolute top-1/2 left-1/6 w-2.5 h-2.5 bg-gradient-to-r from-cyan-500/25 to-pink-500/25 animate-morphing" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/6 right-2/6 w-2 h-2 bg-gradient-to-r from-yellow-500/30 to-orange-500/30 animate-morphing" style={{animationDelay: '4s'}}></div>
        
        {/* Twinkling stars */}
        <div className="absolute top-10 left-10 w-1 h-1 bg-white/60 rounded-full animate-twinkle" style={{animationDelay: '0s'}}></div>
        <div className="absolute top-20 right-20 w-0.5 h-0.5 bg-blue-300/80 rounded-full animate-twinkle" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-32 left-1/3 w-1.5 h-1.5 bg-purple-300/60 rounded-full animate-twinkle" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-48 right-1/4 w-1 h-1 bg-cyan-300/70 rounded-full animate-twinkle" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-20 left-1/4 w-0.5 h-0.5 bg-pink-300/80 rounded-full animate-twinkle" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute bottom-40 right-1/3 w-1 h-1 bg-yellow-300/60 rounded-full animate-twinkle" style={{animationDelay: '2.5s'}}></div>
        <div className="absolute bottom-60 left-2/3 w-1.5 h-1.5 bg-green-300/50 rounded-full animate-twinkle" style={{animationDelay: '3s'}}></div>
        <div className="absolute top-64 left-1/5 w-0.5 h-0.5 bg-indigo-300/70 rounded-full animate-twinkle" style={{animationDelay: '0.8s'}}></div>
        <div className="absolute top-76 right-1/5 w-1 h-1 bg-orange-300/65 rounded-full animate-twinkle" style={{animationDelay: '1.8s'}}></div>
        <div className="absolute bottom-32 left-1/2 w-1.5 h-1.5 bg-rose-300/55 rounded-full animate-twinkle" style={{animationDelay: '2.8s'}}></div>
        <div className="absolute top-28 left-3/4 w-0.5 h-0.5 bg-emerald-300/75 rounded-full animate-twinkle" style={{animationDelay: '3.5s'}}></div>
        <div className="absolute bottom-48 right-2/3 w-1 h-1 bg-violet-300/60 rounded-full animate-twinkle" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-44 left-1/6 w-1.5 h-1.5 bg-sky-300/50 rounded-full animate-twinkle" style={{animationDelay: '4.5s'}}></div>
        <div className="absolute bottom-28 right-1/6 w-0.5 h-0.5 bg-lime-300/70 rounded-full animate-twinkle" style={{animationDelay: '5s'}}></div>
        <div className="absolute top-56 left-4/5 w-1 h-1 bg-amber-300/65 rounded-full animate-twinkle" style={{animationDelay: '5.5s'}}></div>
        
        {/* Fading particles */}
        <div className="absolute top-1/8 left-1/8 w-2 h-2 bg-blue-400/40 rounded-full animate-fadeInOut" style={{animationDelay: '0s'}}></div>
        <div className="absolute top-1/4 right-1/8 w-1.5 h-1.5 bg-purple-400/45 rounded-full animate-fadeInOut" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-3/8 left-1/4 w-1 h-1 bg-cyan-400/50 rounded-full animate-fadeInOut" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/8 right-1/4 w-2.5 h-2.5 bg-pink-400/35 rounded-full animate-fadeInOut" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-1/4 left-3/4 w-1.5 h-1.5 bg-yellow-400/40 rounded-full animate-fadeInOut" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute bottom-3/8 right-3/4 w-1 h-1 bg-green-400/45 rounded-full animate-fadeInOut" style={{animationDelay: '2.5s'}}></div>
        
        {/* Orbiting elements */}
        <div className="absolute top-1/4 left-1/4">
          <div className="w-2 h-2 bg-blue-400/20 rounded-full animate-orbit" style={{animationDelay: '0s'}}></div>
        </div>
        <div className="absolute top-1/3 right-1/3">
          <div className="w-1.5 h-1.5 bg-purple-400/25 rounded-full animate-orbit" style={{animationDelay: '10s', animationDirection: 'reverse'}}></div>
        </div>
        <div className="absolute bottom-1/3 left-1/2">
          <div className="w-3 h-3 bg-cyan-400/15 rounded-full animate-orbit" style={{animationDelay: '20s'}}></div>
        </div>
        <div className="absolute top-1/5 right-1/5">
          <div className="w-1 h-1 bg-pink-400/30 rounded-full animate-orbit" style={{animationDelay: '5s'}}></div>
        </div>
        <div className="absolute bottom-1/5 left-1/5">
          <div className="w-2.5 h-2.5 bg-yellow-400/20 rounded-full animate-orbit" style={{animationDelay: '15s', animationDirection: 'reverse'}}></div>
        </div>
        <div className="absolute top-2/5 left-3/4">
          <div className="w-1.5 h-1.5 bg-green-400/25 rounded-full animate-orbit" style={{animationDelay: '25s'}}></div>
        </div>
        <div className="absolute bottom-2/5 right-1/4">
          <div className="w-2 h-2 bg-indigo-400/20 rounded-full animate-orbit" style={{animationDelay: '7s', animationDirection: 'reverse'}}></div>
        </div>
      </div>

      {/* Floating geometric shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-4 h-4 bg-blue-400/20 rotate-45 animate-bounce animate-float" style={{animationDelay: '0s'}}></div>
        <div className="absolute top-40 right-20 w-6 h-6 bg-purple-400/20 rounded-full animate-ping animate-floatSlow" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 left-1/4 w-3 h-3 bg-cyan-400/20 rotate-12 animate-pulse animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/3 right-1/3 w-5 h-5 bg-pink-400/20 rounded-full animate-bounce animate-floatSlow" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-20 right-10 w-4 h-4 bg-yellow-400/20 rotate-45 animate-ping animate-float" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute top-2/3 left-1/5 w-2 h-2 bg-green-400/25 rounded-full animate-pulse animate-floatSlow" style={{animationDelay: '3s'}}></div>
        <div className="absolute bottom-1/4 right-1/4 w-3 h-3 bg-indigo-400/20 rotate-12 animate-bounce animate-float" style={{animationDelay: '2.5s'}}></div>
        
        {/* Additional geometric shapes with new animations */}
        <div className="absolute top-16 left-1/3 w-5 h-5 bg-orange-400/25 rounded-full animate-wave animate-morphing" style={{animationDelay: '0s'}}></div>
        <div className="absolute top-52 right-1/5 w-3 h-3 bg-rose-400/30 rotate-45 animate-zigzag animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-44 left-1/6 w-4 h-4 bg-emerald-400/20 rounded-full animate-wave animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-3/4 right-2/3 w-2 h-2 bg-violet-400/35 rotate-12 animate-zigzag animate-bounce" style={{animationDelay: '3s'}}></div>
        <div className="absolute bottom-16 left-2/3 w-6 h-6 bg-sky-400/15 rounded-full animate-morphing animate-floatSlow" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-84 right-1/6 w-3 h-3 bg-lime-400/25 rotate-45 animate-wave animate-float" style={{animationDelay: '5s'}}></div>
        <div className="absolute bottom-52 left-3/4 w-2 h-2 bg-amber-400/30 rounded-full animate-zigzag animate-pulse" style={{animationDelay: '6s'}}></div>
        <div className="absolute top-36 left-1/12 w-4 h-4 bg-teal-400/20 rotate-12 animate-morphing animate-bounce" style={{animationDelay: '7s'}}></div>
        <div className="absolute bottom-36 right-1/12 w-5 h-5 bg-fuchsia-400/25 rounded-full animate-wave animate-floatSlow" style={{animationDelay: '8s'}}></div>
        
        {/* Larger floating shapes */}
        <div className="absolute top-1/2 left-0 w-8 h-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-sm animate-float animate-morphing" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-1/4 right-0 w-12 h-12 bg-gradient-to-r from-cyan-500/8 to-pink-500/8 rounded-full blur-md animate-floatSlow animate-wave" style={{animationDelay: '6s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-6 h-6 bg-gradient-to-r from-yellow-500/12 to-orange-500/12 rounded-full blur-sm animate-float animate-zigzag" style={{animationDelay: '8s'}}></div>
        <div className="absolute top-1/6 left-1/2 w-10 h-10 bg-gradient-to-r from-green-500/9 to-emerald-500/9 rounded-full blur-lg animate-floatSlow animate-morphing" style={{animationDelay: '10s'}}></div>
        <div className="absolute bottom-1/6 right-1/2 w-7 h-7 bg-gradient-to-r from-indigo-500/11 to-violet-500/11 rounded-full blur-md animate-float animate-wave" style={{animationDelay: '12s'}}></div>
      </div>
      
      {/* Moving light beams */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent animate-pulse" style={{animationDelay: '0s'}}></div>
        <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-purple-500/15 to-transparent animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-0 left-2/3 w-px h-full bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent animate-pulse" style={{animationDelay: '4s'}}></div>
        
        {/* Horizontal light beams */}
        <div className="absolute left-0 top-1/4 w-full h-px bg-gradient-to-r from-transparent via-blue-500/15 to-transparent animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute left-0 bottom-1/3 w-full h-px bg-gradient-to-r from-transparent via-purple-500/10 to-transparent animate-pulse" style={{animationDelay: '3s'}}></div>
      </div>
      
      {/* Floating energy orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/5 left-1/5 w-20 h-20 bg-blue-500/5 rounded-full blur-xl animate-floatSlow animate-morphing" style={{animationDelay: '0s'}}></div>
        <div className="absolute top-2/5 right-1/5 w-16 h-16 bg-purple-500/7 rounded-full blur-lg animate-float animate-wave" style={{animationDelay: '3s'}}></div>
        <div className="absolute bottom-1/5 left-2/5 w-24 h-24 bg-cyan-500/4 rounded-full blur-2xl animate-floatSlow animate-zigzag" style={{animationDelay: '6s'}}></div>
        <div className="absolute bottom-2/5 right-2/5 w-12 h-12 bg-pink-500/8 rounded-full blur-md animate-float animate-morphing" style={{animationDelay: '9s'}}></div>
        <div className="absolute top-3/5 left-1/10 w-18 h-18 bg-yellow-500/6 rounded-full blur-lg animate-floatSlow animate-wave" style={{animationDelay: '12s'}}></div>
        <div className="absolute bottom-3/5 right-1/10 w-14 h-14 bg-green-500/7 rounded-full blur-md animate-float animate-zigzag" style={{animationDelay: '15s'}}></div>
        <div className="absolute top-1/10 left-3/5 w-22 h-22 bg-indigo-500/5 rounded-full blur-xl animate-floatSlow animate-morphing" style={{animationDelay: '18s'}}></div>
        <div className="absolute bottom-1/10 right-3/5 w-16 h-16 bg-orange-500/6 rounded-full blur-lg animate-float animate-wave" style={{animationDelay: '21s'}}></div>
        <div className="absolute top-4/5 left-4/5 w-10 h-10 bg-rose-500/9 rounded-full blur-sm animate-floatSlow animate-zigzag" style={{animationDelay: '24s'}}></div>
        <div className="absolute bottom-4/5 right-4/5 w-26 h-26 bg-emerald-500/4 rounded-full blur-2xl animate-float animate-morphing" style={{animationDelay: '27s'}}></div>
        <div className="absolute top-1/2 left-1/10 w-15 h-15 bg-violet-500/7 rounded-full blur-md animate-floatSlow animate-wave" style={{animationDelay: '30s'}}></div>
        <div className="absolute bottom-1/2 right-1/10 w-19 h-19 bg-sky-500/5 rounded-full blur-lg animate-float animate-zigzag" style={{animationDelay: '33s'}}></div>
      </div>
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='50' cy='50' r='4'/%3E%3Ccircle cx='10' cy='10' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <div className={`text-center lg:text-left transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
                <span className="inline-block animate-fadeInUp">Create,</span>{" "}
                <span className="inline-block animate-fadeInUp" style={{animationDelay: '0.2s'}}>Edit</span>{" "}
                <span className="inline-block animate-fadeInUp" style={{animationDelay: '0.4s'}}>&</span>{" "}
                <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent inline-block animate-fadeInUp hover:scale-105 transition-transform duration-300" style={{animationDelay: '0.6s'}}>
                  Upload
                </span>
              </h1>
              <p className={`mt-6 text-xl text-gray-300 max-w-2xl transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                The complete platform for video creators and editors. Collaborate seamlessly, 
                manage projects, and publish directly to YouTube - all in one place.
              </p>
              <div className={`mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <Link
                  to="/signup"
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
                >
                  <span className="relative z-10">Start Creating Free</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl blur-xl opacity-0 group-hover:opacity-30 transition-all duration-300"></div>
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-700"></div>
                </Link>
                <Link
                  to="/signin"
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:border-white/40 hover:shadow-lg"
                >
                  Sign In
                </Link>
              </div>
            </div>
            <div className={`mt-12 lg:mt-0 transition-all duration-1000 delay-700 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
              <div className="relative">
                {/* Glassmorphic card with enhanced animations */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-500 hover:scale-105 hover:rotate-1 group">
                  <div className="space-y-6">
                    {/* Video upload mockup with staggered animation */}
                    <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-4 border border-white/10 hover:border-blue-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 transform hover:scale-102 animate-slideInLeft">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center animate-pulse">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                          </svg>
                        </div>
                        <span className="text-white font-medium">Project: Gaming Tutorial</span>
                        <div className="ml-auto">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-300">Editor: Sarah Johnson</div>
                      <div className="text-sm text-gray-400">Deadline: Tomorrow</div>
                      {/* Progress bar animation */}
                      <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" style={{width: '75%'}}></div>
                      </div>
                    </div>
                    {/* YouTube integration mockup with enhanced animation */}
                    <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-lg p-4 border border-white/10 hover:border-red-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20 transform hover:scale-102 animate-slideInRight" style={{animationDelay: '0.3s'}}>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center animate-bounce">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                        </div>
                        <span className="text-white font-medium">Ready to Upload</span>
                        <div className="ml-auto flex space-x-1">
                          <div className="w-1 h-1 bg-red-400 rounded-full animate-ping" style={{animationDelay: '0s'}}></div>
                          <div className="w-1 h-1 bg-red-400 rounded-full animate-ping" style={{animationDelay: '0.2s'}}></div>
                          <div className="w-1 h-1 bg-red-400 rounded-full animate-ping" style={{animationDelay: '0.4s'}}></div>
                        </div>
                      </div>
                    </div>
                    {/* Stats display with counting animation */}
                    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-4 border border-white/10 hover:border-green-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 transform hover:scale-102 animate-slideInUp" style={{animationDelay: '0.6s'}}>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-white">1.2K+</div>
                          <div className="text-xs text-gray-400">Projects</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-white">24/7</div>
                          <div className="text-xs text-gray-400">Active</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Enhanced floating elements */}
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-purple-500/20 rounded-full blur-xl animate-pulse group-hover:animate-ping"></div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-blue-500/20 rounded-full blur-xl animate-pulse group-hover:animate-ping" style={{animationDelay: '1s'}}></div>
                <div className="absolute top-1/2 -right-8 w-12 h-12 bg-cyan-500/15 rounded-full blur-lg animate-bounce" style={{animationDelay: '0.5s'}}></div>
                <div className="absolute -top-8 left-1/3 w-8 h-8 bg-pink-500/15 rounded-full blur-lg animate-ping" style={{animationDelay: '2s'}}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h2 className="text-4xl font-bold text-white mb-6">
              Everything You Need to{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent hover:scale-105 transition-transform duration-300 inline-block">
                Succeed
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              From project creation to YouTube publishing, NeoSync provides seamless workflows where
              content creators and editors need to collaborate effectively.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Video Project Management */}
            <div className={`group bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/20 ${isVisible ? 'animate-slideInUp' : 'opacity-0'}`} style={{animationDelay: '0.1s'}}>
              <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative overflow-hidden">
                <svg className="w-7 h-7 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-700"></div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-blue-300 transition-colors duration-300">Video Project Management</h3>
              <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                Upload videos, set deadlines, assign editors, and track project status with 
                our intuitive project management system.
              </p>
              {/* Floating icon indicator */}
              <div className="absolute top-4 right-4 w-3 h-3 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping transition-opacity duration-300"></div>
            </div>

            {/* Editor Collaboration */}
            <div className={`group bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20 ${isVisible ? 'animate-slideInUp' : 'opacity-0'}`} style={{animationDelay: '0.2s'}}>
              <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative overflow-hidden">
                <svg className="w-7 h-7 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-700"></div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-purple-300 transition-colors duration-300">Editor Collaboration</h3>
              <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                Seamlessly connect creators with skilled editors. Review, approve, 
                and provide feedback throughout the editing process.
              </p>
              <div className="absolute top-4 right-4 w-3 h-3 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping transition-opacity duration-300"></div>
            </div>

            {/* YouTube Integration */}
            <div className={`group bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl hover:shadow-red-500/20 ${isVisible ? 'animate-slideInUp' : 'opacity-0'}`} style={{animationDelay: '0.3s'}}>
              <div className="w-14 h-14 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative overflow-hidden">
                <svg className="w-7 h-7 text-white relative z-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-700"></div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-red-300 transition-colors duration-300">Direct YouTube Upload</h3>
              <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                Connect your YouTube channel and let editors upload finished videos 
                directly to your channel with OAuth authentication.
              </p>
              <div className="absolute top-4 right-4 w-3 h-3 bg-red-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping transition-opacity duration-300"></div>
            </div>

            {/* Real-time Notifications */}
            <div className={`group bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl hover:shadow-green-500/20 ${isVisible ? 'animate-slideInUp' : 'opacity-0'}`} style={{animationDelay: '0.4s'}}>
              <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative overflow-hidden">
                <svg className="w-7 h-7 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-7a2 2 0 012-2h1m-9 9V9a2 2 0 012-2h1m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-700"></div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-green-300 transition-colors duration-300">Real-time Notifications</h3>
              <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                Stay updated with instant notifications for project updates, 
                deadline reminders, and collaboration requests.
              </p>
              <div className="absolute top-4 right-4 w-3 h-3 bg-green-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping transition-opacity duration-300"></div>
            </div>

            {/* Secure Cloud Storage */}
            <div className={`group bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/20 ${isVisible ? 'animate-slideInUp' : 'opacity-0'}`} style={{animationDelay: '0.5s'}}>
              <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative overflow-hidden">
                <svg className="w-7 h-7 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-700"></div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-indigo-300 transition-colors duration-300">Secure Cloud Storage</h3>
              <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                All your videos and assets are securely stored in the cloud with 
                reliable access and backup protection.
              </p>
              <div className="absolute top-4 right-4 w-3 h-3 bg-indigo-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping transition-opacity duration-300"></div>
            </div>

            {/* Project Analytics */}
            <div className={`group bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl hover:shadow-yellow-500/20 ${isVisible ? 'animate-slideInUp' : 'opacity-0'}`} style={{animationDelay: '0.6s'}}>
              <div className="w-14 h-14 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative overflow-hidden">
                <svg className="w-7 h-7 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-700"></div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-yellow-300 transition-colors duration-300">Project Insights</h3>
              <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                Track project progress, monitor deadlines, and get insights into 
                your content creation workflow and productivity.
              </p>
              <div className="absolute top-4 right-4 w-3 h-3 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping transition-opacity duration-300"></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/50 to-black/50"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className={`bg-white/5 backdrop-blur-lg rounded-3xl p-12 border border-white/10 hover:bg-white/10 transition-all duration-700 hover:scale-105 group ${isVisible ? 'animate-slideInUp' : 'opacity-0'}`} style={{animationDelay: '0.8s'}}>
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent hover:scale-105 transition-transform duration-300 inline-block">
                Content Creation?
              </span>
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto group-hover:text-gray-200 transition-colors duration-300">
              Join thousands of creators and editors who use NeoSync to streamline 
              their workflow and create amazing content together.
            </p>
            
            {/* Animated stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
              <div className="group/stat">
                <div className="text-2xl font-bold text-blue-400 group-hover/stat:scale-110 transition-transform duration-300">1000+</div>
                <div className="text-sm text-gray-400">Active Users</div>
              </div>
              <div className="group/stat">
                <div className="text-2xl font-bold text-purple-400 group-hover/stat:scale-110 transition-transform duration-300">24/7</div>
                <div className="text-sm text-gray-400">Support</div>
              </div>
              <div className="group/stat">
                <div className="text-2xl font-bold text-green-400 group-hover/stat:scale-110 transition-transform duration-300">100%</div>
                <div className="text-sm text-gray-400">Free</div>
              </div>
              <div className="group/stat">
                <div className="text-2xl font-bold text-yellow-400 group-hover/stat:scale-110 transition-transform duration-300">∞</div>
                <div className="text-sm text-gray-400">Projects</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="group/btn relative px-10 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 overflow-hidden"
              >
                <span className="relative z-10">Start Today</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl blur-xl opacity-0 group-hover/btn:opacity-50 transition-all duration-300"></div>
                {/* Shimmer effect */}
                <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-full transition-all duration-700"></div>
                {/* Ripple effect */}
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover/btn:opacity-100 group-hover/btn:animate-ping bg-white/20"></div>
              </Link>
              <Link
                to="/signin"
                className="px-10 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:border-white/40 hover:shadow-lg"
              >
                Sign In
              </Link>
            </div>
            <div className="flex items-center justify-center mt-6 space-x-6 text-gray-400 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>🚀 Completely free</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                <span>💳 No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                <span>⚡ Instant setup</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/50 backdrop-blur-lg border-t border-white/10">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-6">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                NeoSync
              </h3>
              <p className="text-gray-400 mt-2">
                The future of content creation collaboration
              </p>
            </div>
            <p className="text-gray-500">
              &copy; 2025 NeoSync. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}

export default StartPage;
