import i18n from "@/utils/i18n";
import {
  CircleUserRound,
  Compass,
  Globe,
  Heart,
  LogIn,
  MessageCircleMore,
  MessageSquare,
  SearchIcon,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Link, NavLink, useLocation } from "react-router-dom";

import Logo from "../../assets/Airbnb-Logo.wine.svg";
import ExperiencesIcon from "../../assets/experience_icon.avif";
import HomesIcon from "../../assets/home_icon.avif";
import ServicesIcon from "../../assets/service_icon.avif";
import SearchBar from "../SearchBar/SearchBar";

import MenuList from "../Menu/MenuList";
import "./Navbar.css";

export default function Navbar({ toggleTranslateModal, isSticky = true }) {
  const { t } = useTranslation();
  const lang = useSelector((state) => state.lang.default_language);
  const direction = useSelector((state) => state.lang.direction);
  const isLoggedIn = useSelector((state) => state.auth.isAuthenticated);

  const location = useLocation();
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const [scrolled, setScrolled] = useState(false);
  const [scrollDirection, setScrollDirection] = useState("up");
  const [lastScrollY, setLastScrollY] = useState(0);

  const isServicePage =
    ["/homes", "/experiences", "/services"].includes(location.pathname) ||
    location.pathname.startsWith("/experiences/search") ||
    location.pathname.startsWith("/services/search");

  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 5) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setScrollDirection("down");
      } else {
        setScrollDirection("up");
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const getUnderlinePosition = () => {
    const path = location.pathname;

    const isHomes = path.startsWith("/homes");
    const isExperiences = path.startsWith("/experiences");
    const isServices = path.startsWith("/services");

    if (direction === "rtl") {
      if (isHomes) return "right-0";
      if (isExperiences) return "right-1/3";
      if (isServices) return "right-2/3";
      return "right-0";
    } else {
      if (isHomes) return "left-0";
      if (isExperiences) return "left-1/3";
      if (isServices) return "left-2/3";
      return "left-0";
    }
  };


  return (
    <>
      <nav
        className={`
            bg-white px-4 sm:px-6 md:px-8 lg:px-12 
            ${isSticky ? "sticky top-0" : "relative"} z-40
            transition-all duration-500 ease-in-out
            ${scrolled
            ? "py-1 shadow-lg backdrop-blur-sm bg-opacity-95"
            : "py-2 md:py-3"
          }
            ${scrollDirection === "down" && scrolled
            ? "transform -translate-y-2"
            : "transform translate-y-0"
          }
        `}
      >
        {/* Mobile Search Bar - Click to open full screen */}
        {isServicePage && (
          <div className="md:hidden mb-3">
            <div
              onClick={() => setShowMobileSearch(true)}
              className="bg-white shadow-md rounded-full px-4 py-3 flex items-center gap-3 border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <SearchIcon size={20} className="text-gray-600" />
              <span className="text-gray-600 font-medium">
                {t("navbar.startSearch")}
              </span>
            </div>
          </div>
        )}

        {/* header */}
        <div
          className={` flex flex-wrap lg:flex-nowrap justify-between items-center gap-4
                transition-all duration-500 ease-in-out
                ${scrolled ? "scale-95" : "scale-100"}
            `}
        >
          {/* Logo */}
          <Link
            to={"/homes"}
            className={`
                        hidden md:flex w-20 sm:w-24 md:w-28 lg:w-30 shrink-0
                        transition-all duration-500 ease-in-out
                        ${scrolled
                ? "opacity-80 scale-90"
                : "opacity-100 scale-100"
              }
                    `}
          >
            <img src={Logo} alt="airbnb_logo" className="w-full" />
          </Link>

          {/* Navbar links */}
          {isServicePage && (
            <div
              className={`flex justify-around relative flex-1 max-w-2xl xl:ms-58 lg:ms-30 md:ms-32 mx-4 mt-6
                        transition-all duration-500 ease-in-out
                        ${scrolled
                  ? "opacity-90 scale-95"
                  : "opacity-100 scale-100"
                }
                    `}
            >
              {/* Animated underline */}
              <div
                className={`
                            absolute bottom-0 h-0.5 bg-black w-1/3 
                            transition-all duration-300 ease-in-out 
                            ${getUnderlinePosition()}
                            ${scrolled ? "opacity-70" : "opacity-100"}
                        `}
              ></div>

              {/* Homes */}
              <NavLink
                to="/homes"
                className={({ isActive }) => `
                                flex items-center gap-1 
                                ${isActive
                    ? "text-black font-semibold"
                    : "text-(--color-dark-gray)"
                  } 
                                hover:scale-105 hover:text-black 
                                transition-all duration-300 ease-in-out
                                ${scrolled ? "transform -translate-y-0.5" : ""}
                            `}
                style={{ transitionDelay: scrolled ? "0ms" : "100ms" }}
              >
                <div
                  className={`w-12 md:w-16 lg:w-18 transition-all duration-300 ${scrolled ? "md:w-16 lg:w-18 w-0 opacity-0" : "opacity-100"
                    }`}
                >
                  <img src={HomesIcon} alt="homes_icon" className="w-full" />
                </div>
                <span
                  className={`relative text-sm lg:text-base transition-all duration-300 ${scrolled
                    ? "md:-start-2 lg:-start-4 -start-0"
                    : "-start-2 lg:-start-4"
                    }`}
                >
                  {t("navbar.homes")}
                </span>
              </NavLink>

              {/* Experiences */}
              <NavLink
                to="/experiences"
                className={({ isActive }) => `
                                flex items-center gap-1 
                                ${isActive
                    ? "text-black font-semibold"
                    : "text-(--color-dark-gray)"
                  } 
                                hover:scale-105 hover:text-black 
                                transition-all duration-300 ease-in-out
                                ${scrolled ? "transform -translate-y-0.5" : ""}
                            `}
                style={{ transitionDelay: scrolled ? "50ms" : "150ms" }}
              >
                <div
                  className={`relative text-[10px] font-bold start-16 md:start-20 lg:start-22 -top-5 new_tag_style text-white transition-all duration-300 ${scrolled ? "md:opacity-100 opacity-0" : "opacity-100"
                    }`}
                >
                  {t("navbar.new")}
                </div>
                <div
                  className={`w-12 md:w-16 lg:w-18 transition-all duration-300 ${scrolled ? "md:w-16 lg:w-18 w-0 opacity-0" : "opacity-100"
                    }`}
                >
                  <img
                    src={ExperiencesIcon}
                    alt="experiences_icon"
                    className="w-full"
                  />
                </div>
                <span
                  className={`relative text-sm lg:text-base transition-all duration-300 ${scrolled
                    ? "md:-start-2 lg:-start-4 start-0"
                    : "-start-2 lg:-start-4"
                    }`}
                >
                  {t("navbar.experiences")}
                </span>
              </NavLink>

              {/* Services */}
              <NavLink
                to="/services"
                className={({ isActive }) => `
                                flex items-center gap-1 
                                ${isActive
                    ? "text-black font-semibold"
                    : "text-(--color-dark-gray)"
                  } 
                                hover:scale-105 hover:text-black 
                                transition-all duration-300 ease-in-out
                                ${scrolled ? "transform -translate-y-0.5" : ""}
                            `}
                style={{ transitionDelay: scrolled ? "100ms" : "200ms" }}
              >
                <div
                  className={`relative text-[10px] font-bold start-16 md:start-20 lg:start-22 -top-5 new_tag_style text-white transition-all duration-300 ${scrolled ? "md:opacity-100 opacity-0" : "opacity-100"
                    }`}
                >
                  {t("navbar.new")}
                </div>
                <div
                  className={`w-12 md:w-16 lg:w-18 transition-all duration-300 ${scrolled ? "md:w-16 lg:w-18 w-0 opacity-0" : "opacity-100"
                    }`}
                >
                  <img
                    src={ServicesIcon}
                    alt="services_icon"
                    className="w-full"
                  />
                </div>
                <span
                  className={`relative text-sm lg:text-base transition-all duration-300 ${scrolled
                    ? "md:-start-2 lg:-start-4 -start-0"
                    : "-start-2 lg:-start-4"
                    }`}
                >
                  {t("navbar.services")}
                </span>
              </NavLink>
            </div>
          )}

          {/* Action buttons with slide animation */}
          <div
            className={`
                    hidden md:flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-5 
                    ${direction === "ltr" ? "ml-auto" : "mr-auto"}
                    transition-all duration-500 ease-in-out
                    ${scrolled
                ? "transform translate-x-1 scale-95"
                : "transform translate-x-0 scale-100"
              }
                `}
          >
            <span
              className={`
                        hidden md:inline-block cursor_pointer font-semibold 
                        hover:bg-[#d4d4d4c1] rounded-lg py-1 px-2 cursor-pointer text-sm lg:text-base
                        transition-all duration-300 ease-in-out
                        ${scrolled
                  ? "opacity-0 scale-90 w-0 px-0"
                  : "opacity-100 scale-100"
                }
                    `}
            >
              {location.pathname.startsWith("/host") ? (
                <Link to="/homes">Switch to traveling</Link>
              ) : (
                <Link to="/host">{t("navbar.host")}</Link>
              )}
            </span>

            <span
              className={`
                            cursor_pointer bg-[#d4d4d490] rounded-full p-1.5 sm:p-2 cursor-pointer 
                            hover:bg-[#d4d4d4d2] hover:scale-110
                            transition-all duration-300 ease-in-out
                            ${scrolled
                  ? "transform rotate-180"
                  : "transform rotate-0"
                }
                        `}
              onClick={toggleTranslateModal}
            >
              <Globe size={18} className="sm:w-5 sm:h-5" />
            </span>

            {/* Profile Image - Only visible when logged in */}
            {isLoggedIn && (
              <Link
                to="/profile"
                className={`
                                cursor-pointer bg-[#d4d4d490] rounded-full p-1.5 sm:p-2
                                hover:bg-[#d4d4d4d2] hover:scale-110
                                transition-all duration-300 ease-in-out
                            `}
              >
                <User size={18} className="sm:w-5 sm:h-5" />
              </Link>
            )}

            <MenuList />
          </div>
        </div>

        {/* Search bar - Hidden on mobile */}
        {isServicePage && (
          <div
            className={`
                    hidden lg:block mt-2 sm:mt-3 md:mt-4 
                    transition-all duration-500 ease-in-out
                    ${scrolled
                ? "max-h-0 opacity-0 mt-0 transform -translate-y-4"
                : "max-h-96 opacity-100 transform translate-y-0"
              }
                `}
          >
            <SearchBar />
          </div>
        )}
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex justify-around items-center py-3 px-4">
          {/* Explore */}
          <NavLink
            to="/homes"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition-colors ${isActive ? "text-[#FF385C]" : "text-gray-600 hover:text-black"
              }`
            }
          >
            <Compass strokeWidth={1} />
            <span className="text-xs font-medium">Explore</span>
          </NavLink>

          {/* Wishlist */}
          <NavLink
            to="/wishlists"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition-colors ${isActive ? "text-[#FF385C]" : "text-gray-600 hover:text-black"
              }`
            }
          >
            <Heart strokeWidth={1} />
            <span className="text-xs font-medium">Wishlist</span>
          </NavLink>

          {/* if logged in show trips and messages */}
          {isLoggedIn && (
            <>
              {/* Trips */}
              <NavLink
                to="/trips"
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 transition-colors ${isActive
                    ? "text-[#FF385C]"
                    : "text-gray-600 hover:text-black"
                  }`
                }
              >
                <Globe strokeWidth={1} />
                <span className="text-xs font-medium">Trips</span>
              </NavLink>
              {/* Messages */}
              <NavLink
                to="/messages"
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 transition-colors ${isActive
                    ? "text-[#FF385C]"
                    : "text-gray-600 hover:text-black"
                  }`
                }
              >
                <MessageCircleMore strokeWidth={1} />{" "}
                <span className="text-xs font-medium">Messages</span>
              </NavLink>
            </>
          )}

          {/* Login */}
          {isLoggedIn ? (
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 transition-colors ${isActive ? "text-[#FF385C]" : "text-gray-600 hover:text-black"
                }`
              }
            >
              <CircleUserRound strokeWidth={1} />
              <span className="text-xs font-medium">Profile</span>
            </NavLink>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 transition-colors ${isActive ? "text-[#FF385C]" : "text-gray-600 hover:text-black"
                }`
              }
            >
              <LogIn size={24} />
              <span className="text-xs font-medium">Login</span>
            </NavLink>
          )}
        </div>
      </div>

      {/* Full Screen Mobile Search Modal */}
      {showMobileSearch && (
        <div className="md:hidden fixed inset-0 bg-white z-[100] animate-slideUp">
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-200">
              <button
                onClick={() => setShowMobileSearch(false)}
                className="text-gray-600 hover:text-black transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              <h2 className="text-lg font-semibold">Search</h2>
            </div>

            {/* Search Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <SearchBar />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
