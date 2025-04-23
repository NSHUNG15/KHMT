import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Layout
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

// Pages
import HomePage from "@/pages/HomePage";
import AnnouncementsPage from "@/pages/AnnouncementsPage";
import EventsPage from "@/pages/EventsPage";
import EventDetailPage from "@/pages/EventDetailPage";
import TournamentsPage from "@/pages/TournamentsPage";
import TournamentDetailPage from "@/pages/TournamentDetailPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ProfilePage from "@/pages/ProfilePage";
import AdminDashboard from "@/pages/admin/Dashboard";

// Auth context
import { useAuth } from "@/context/AuthContext";

// Protected Route component
function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType, adminOnly?: boolean }) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  
  console.log("ProtectedRoute - User:", user, "Loading:", loading, "AdminOnly:", adminOnly);
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    console.log("User not authenticated, redirecting to login");
    // Use hook instead of direct location change
    navigate("/login");
    return <div className="min-h-screen flex items-center justify-center">Redirecting to login...</div>;
  }
  
  if (adminOnly && user.role !== "admin") {
    console.log("User not admin, access denied");
    return <NotFound />;
  }
  
  console.log("Rendering protected component");
  return <Component />;
}

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/announcements" component={AnnouncementsPage} />
          <Route path="/events" component={EventsPage} />
          <Route path="/events/:id">
            {params => <EventDetailPage id={params.id} />}
          </Route>
          <Route path="/tournaments" component={TournamentsPage} />
          <Route path="/tournaments/:id">
            {params => <TournamentDetailPage id={params.id} />}
          </Route>
          <Route path="/login" component={LoginPage} />
          <Route path="/register" component={RegisterPage} />
          <Route path="/profile">
            {() => <ProtectedRoute component={ProfilePage} />}
          </Route>
          
          {/* Admin Routes */}
          <Route path="/admin">
            {() => <ProtectedRoute component={AdminDashboard} adminOnly={true} />}
          </Route>
          
          {/* Fallback to 404 */}
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
