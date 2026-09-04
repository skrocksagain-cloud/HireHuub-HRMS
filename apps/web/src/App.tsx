import AppRouter from "./routes/AppRouter";
import { GuestAuthProvider } from "./context/GuestAuthContext";

function App() {
  return (
    <GuestAuthProvider>
      <AppRouter />
    </GuestAuthProvider>
  );
}

export default App;