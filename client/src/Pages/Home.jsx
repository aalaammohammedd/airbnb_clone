import Amenity from "@/components/Listing/Amenity";
import AmenityExtractor from "@/components/Amenities/test";
import ListingCarousel from "@/components/Listing/ListingCarousel";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { GetAllListings } from "@/store/Slices/listingSlice";
import { fetchRecentlyViewed } from "@/store/Slices/recentlyViewedSlice";
import { useTranslation } from "react-i18next";
import VerifyEmail from "@/components/User/VerifyEmail";

const Home = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { listings, status } = useSelector((state) => state.listing);
  const user = useSelector((state) => state.auth.user);
  const recentlyViewed = useSelector((state) => state.recentlyViewed.items);
  const [showVerificationModal, setShowVerificationModal] = useState(
    Boolean(location.state?.showVerifyEmail)
  );

  useEffect(() => {
    if (status === "idle") {
      dispatch(GetAllListings());
    }
  }, [dispatch, status]);

  // Fetch recently viewed for logged-in users only
  useEffect(() => {
    if (user) {
      dispatch(fetchRecentlyViewed());
    }
  }, [user, dispatch]);

  return (
    <div>
      {showVerificationModal && (
        <VerifyEmail
          isOpen
          onClose={() => {
            setShowVerificationModal(false);
            navigate(location.pathname, { replace: true, state: null });
          }}
        />
      )}
      {/* Recently Viewed Section - Only for logged-in users */}
      {user && recentlyViewed.length > 0 && (
        <section className="w-10/12 py-10 relative mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">
              {t("home.recentlyViewed")}
            </h2>
          </div>
          <ListingCarousel listings={recentlyViewed} cardSize="large" />
        </section>
      )}

      <section className="w-10/12 py-10 relative mx-auto">
        {/* Recently Viewed */}

        {/*--------------- Header for title ------------------- */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">{t("home.popularHomes")}</h2>
        </div>
        {status === "loading" && (
          <div className="flex justify-center items-center h-96">
            <div className="loader"></div>
          </div>
        )}

        {/* Server Error State */}
        {status === "failed" && (
          <div className="flex flex-col justify-center items-center py-20">
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">
              {t("home.serverError") || "Something went wrong"}
            </h3>
            <p className="text-gray-500 text-center max-w-md mb-6">
              {t("home.serverErrorMessage") ||
                "We're having trouble connecting to our servers. Please check your connection and try again."}
            </p>
            <button
              onClick={() => dispatch(GetAllListings())}
              className="px-6 py-3 bg-[#FF385C] text-white rounded-lg hover:bg-[#E31C5F] transition-colors duration-200 font-medium"
            >
              {t("home.tryAgain") || "Try Again"}
            </button>
          </div>
        )}

        {/* Empty State - No Listings Available */}
        {status === "succeeded" && listings.length === 0 && (
          <div className="flex flex-col justify-center items-center py-20">
            <svg
              className="w-24 h-24 text-gray-200 mb-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">
              {t("home.noListingsTitle") || "No homes available yet"}
            </h3>
            <p className="text-gray-500 text-center max-w-md mb-6">
              {t("home.noListingsMessage") ||
                "There are no listings available at the moment. Check back soon for amazing places to stay!"}
            </p>
            <button
              onClick={() => (window.location.href = "/experiences")}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
            >
              {t("home.exploreExperiences") || "Explore Experiences"}
            </button>
          </div>
        )}

        {/* Success State with Listings */}
        {status === "succeeded" && listings.length > 0 && (
          <ListingCarousel listings={listings} />
        )}
      </section>
    </div>
  );
};

export default Home;
