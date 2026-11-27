import Navbar from "@/components/Navbar/Navbar";
import React, { useState, useEffect } from "react";
import Footer from "@/components/Footer/Footer";
import { Outlet, useLocation } from "react-router";
import GlobalModal from "@/components/GlobalModal/GlobalModal";
import { useSelector, useDispatch } from "react-redux";
import { fetchUserProfile } from "@/store/Slices/authslice";

export default function Layout() {
  const location = useLocation();
  const dispatch = useDispatch();
  const { direction } = useSelector((state) => state.lang);

  const [showGlobalModal, setShowGlobalModal] = useState(false);

  const toggleTranslateModal = () => setShowGlobalModal((prev) => !prev);
  const closeModal = () => setShowGlobalModal(false);

  const isStandaloneAuthPage = [
    "/login",
    "/signup",
    "/register",
    "/verify-account",
    "/forget-password",
  ].includes(location.pathname);
  const hideHeaderFooter =
    location.pathname === "/not-found" ||
    location.pathname === "/" ||
    isStandaloneAuthPage;

  // Fetch current user on app load
  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  // update HTML direction whenever language changes
  useEffect(() => {
    document.documentElement.dir = direction;
  }, [direction]);

  return (
    <>
      {!hideHeaderFooter && (
        <Navbar
          toggleTranslateModal={toggleTranslateModal}
        />
      )}

      <Outlet />

      {!hideHeaderFooter && <Footer />}

      {/* GlobalModal with Tailwind transitions */}
      <GlobalModal isOpen={showGlobalModal} closeModal={closeModal} />
    </>
  );
}
