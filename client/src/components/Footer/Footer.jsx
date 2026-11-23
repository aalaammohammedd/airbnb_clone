import React from "react";
import { RiTwitterXFill } from "react-icons/ri";
import { MdOutlineFacebook } from "react-icons/md";
import { IoLogoInstagram } from "react-icons/io";
export default function Footer() {

  const GET_FULL_YEAR = new Date().getFullYear();

  return (
    <footer className="bg-[#f7f7f7] text-gray-700 py-6 px-4 sm:px-6 md:px-12">

      {/* ===== Bottom Section with Icons ===== */}
      <div className="text-[#222222]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm">
            <span>© {GET_FULL_YEAR} Airbnb, Inc.</span>
          </div>

          {/* Social Icons */}
          <div className="flex gap-2 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-full hover:bg-gray-200 cursor-pointer transition">
              <MdOutlineFacebook className="text-base sm:text-lg" />
            </div>
            <div className="p-2 sm:p-3 rounded-full hover:bg-gray-200 cursor-pointer transition">
              <RiTwitterXFill className="text-base sm:text-lg" />
            </div>
            <div className="p-2 sm:p-3 rounded-full hover:bg-gray-200 cursor-pointer transition">
              <IoLogoInstagram className="text-base sm:text-lg" />
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
