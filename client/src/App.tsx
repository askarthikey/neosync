import { createBrowserRouter,Navigate, RouterProvider } from "react-router-dom";
import {useUser } from "@clerk/clerk-react";
import RootLayout from "./components/RootLayout";
import StartPage from "./components/StartPage";
import Home from "./components/Home";

function AppRoutes(){
  const {isLoaded,isSignedIn}=useUser();
  console.log("User signed in:", isSignedIn);
  if(!isLoaded){
    return <div>Loading...</div>;
  }
  const router=createBrowserRouter([
    {
      path: "/",
      element:<RootLayout/>,
      children: [
        {
          path: "/",
          element: isSignedIn ? <Navigate to='/home'/> : <Navigate to='/startpage'/>,
        },
        {
          path: "/startpage",
          element: <StartPage/>
        },
        {
          path: "/home",
          element: <Home/>
        }
      ]
    }
  ])
  return <RouterProvider router={router}/>
}

function App(){
  return(
    <div>
      <AppRoutes/>
    </div>
  )
}

export default App