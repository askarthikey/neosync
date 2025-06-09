import { useUser } from "@clerk/clerk-react"
import { Navigate } from "react-router-dom";

function StartPage() {
  const { isLoaded, isSignedIn } = useUser();
    console.log("User signed in:", isSignedIn);
    if (!isLoaded) {
        return <div>Loading...</div>;
    }
    if (isSignedIn) {
        Navigate({ to: '/home' });
        return null; // Prevent rendering the StartPage component
    }
  return (
    <div>StartPage</div>
  )
}

export default StartPage