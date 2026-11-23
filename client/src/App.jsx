import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import "./App.css";
import Layout from "./layout/Layout";
import ListingDetails from "./Pages/ListingDetails";
import Home from "./Pages/Home";
import store from "./store/store";
import { Provider } from "react-redux";
import NotFound from "./Pages/NotFound";
import Login from "./Pages/Login";
import ForgetPassword from "./Pages/ForgetPassword";
import RegisterPage from "./Pages/RegisterPage";
import Help from "./Pages/Help";
import Host from "./Pages/Host";
import ExperiencesPage from "./Pages/ExperiencePage";
import ExperienceDetailsPage from "./Pages/ExperienceDetailsPage";
import ServicesPage from "./Pages/ServicesPage";
import ServiceDetailsPage from "./Pages/ServiceDetailsPage";
import SearchListing from "./Pages/ListingSearch";
import ResetPassword from "./Pages/ResetPassword";
import ProfilePage from "./Pages/Profile";
import AirbnbLanding from "./Pages/AirbnbLanding";
import ExperienceSearchPage from "./Pages/ExperienceSearchPage";
import ServiceSearchPage from "./Pages/ServiceSearchPage";
import HostWelcomePage from "./Pages/HostWelcomePage";
import HostDashboardPage from "./Pages/HostDashboardPage";
import CheckoutPage from "./Pages/CheckoutPage";
import PaymentSuccessPage from "./Pages/PaymentSuccessPage";
import PaymentCancelPage from "./Pages/PaymentCancelPage";
import ReservationsPage from "./Pages/ReservationsPage";
import MessagesPage from "./Pages/MessagesPage";
import EditExperiencePage from "./Pages/EditExperiencePage";
import EditServicePage from "./Pages/EditServicePage";
import EditListingPage from "./Pages/EditListingPage";
import LandingPage from "./Pages/AirbnbLanding";
import HostWalletPage from "./Pages/HostWalletPage";
import HostGuestsPage from "./Pages/HostGuestsPage";
import WishlistPage from "./Pages/Wishlists";
import CollectionDetail from "./Pages/CollectionDetail";
import AIRecommendation from "./Pages/AIRecommendation";
import RecommendedHomes from "./Pages/RecommendedHomes";
import VerifyAccount from "./Pages/VerifyAccount";
import AuthGuard from "./components/guards/AuthGuard";

function App() {
  const routes = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        { index: true, element: <LandingPage /> },
        {
          path: "homes",
          element: (
            <Home />
          ),
        },
        { path: "verify-account", element: <VerifyAccount /> },
        { path: "search", element: <SearchListing /> },
        { path: "room/:id", element: <ListingDetails /> },
        { path: "reset-password", element: <ResetPassword /> },
        {
          path: "profile",
          element: (
            <AuthGuard>
              <ProfilePage />
            </AuthGuard>
          ),
        },
        {
          path: "wishlists",
          element: (
            <AuthGuard>
              <WishlistPage />
            </AuthGuard>
          )
        },
        {
          path: "signup",
          element: (
            <AuthGuard requireAuth={false} redirectTo="/homes">
              <RegisterPage />
            </AuthGuard>
          ),
        },
        {
          path: "register",
          element: (
            <Navigate to="/signup" replace />
          ),
        },
        {
          path: "login",
          element: (
            <AuthGuard requireAuth={false} redirectTo="/homes">
              <Login />
            </AuthGuard>
          ),
        },
        {
          path: "forget-password",
          element: (
            <AuthGuard requireAuth={false} redirectTo="/homes">
              <ForgetPassword />
            </AuthGuard>
          ),
        },

        { path: "help", element: <Help /> },

        {
          path: "host",
          element: (
            <AuthGuard>
              <Host />
            </AuthGuard>
          ),
        },
        {
          path: "wishlists/:collectionId",
          element: (
            <AuthGuard>
              <CollectionDetail />
            </AuthGuard>
          )
        },
        {
          path: "host/welcome",
          element: (
            <AuthGuard>
              <HostWelcomePage />
            </AuthGuard>
          ),
        },
        {
          path: "host/dashboard",
          element: (
            <AuthGuard>
              <HostDashboardPage />
            </AuthGuard>
          ),
        },
        {
          path: "host/homes/edit/:id",
          element: (
            <AuthGuard>
              <EditListingPage />
            </AuthGuard>
          ),
        },
        {
          path: "host/experiences/edit/:id",
          element: (
            <AuthGuard>
              <EditExperiencePage />
            </AuthGuard>
          ),
        },
        {
          path: "host/services/edit/:id",
          element: (
            <AuthGuard>
              <EditServicePage />
            </AuthGuard>
          ),
        },
        {
          path: "messages",
          element: (
            <AuthGuard>
              <MessagesPage />
            </AuthGuard>
          ),
        },
        {
          path: "checkout",
          element: (
            <AuthGuard>
              <CheckoutPage />
            </AuthGuard>
          ),
        },
        {
          path: "reservations",
          element: (
            <AuthGuard>
              <ReservationsPage />
            </AuthGuard>
          ),
        },
        {
          path: "host/guests",
          element: (
            <AuthGuard>
              <HostGuestsPage />
            </AuthGuard>
          ),
        },
        {
          path: "host/wallet",
          element: (
            <AuthGuard>
              <HostWalletPage />
            </AuthGuard>
          ),
        },
        {
          path: "ai-recommendation",
          element: (
            <AIRecommendation />
          ),
        },
        {
          path: "recommended-homes",
          element: (
            <RecommendedHomes />
          ),
        },
        { path: "payment/success", element: <PaymentSuccessPage /> },
        { path: "payment/cancel", element: <PaymentCancelPage /> },
        { path: "experiences", element: <ExperiencesPage /> },
        { path: "experiences/:id", element: <ExperienceDetailsPage /> },
        { path: "services", element: <ServicesPage /> },
        { path: "services/:id", element: <ServiceDetailsPage /> },
        { path: "AirbnbLanding", element: <AirbnbLanding /> },
        { path: "experiences/search", element: <ExperienceSearchPage /> },
        { path: "services/search", element: <ServiceSearchPage /> },
      ],
    },
    { path: "*", element: <NotFound /> },
  ]);

  return (
    <>
      <Provider store={store}>
        <RouterProvider router={routes} />
      </Provider>
    </>
  );
}

export default App;
