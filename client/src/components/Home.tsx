import { useUser } from "@clerk/clerk-react"
import { Navigate } from "react-router-dom"

function Home() {
    const { isLoaded, isSignedIn } = useUser();
    console.log("User signed in:", isSignedIn);
    if (!isLoaded) {
        return <div>Loading...</div>;
    }
    if (!isSignedIn) {
        Navigate({ to: '/startpage' });
    }
  return (
    <div>Home</div>
  )
}

export default Home