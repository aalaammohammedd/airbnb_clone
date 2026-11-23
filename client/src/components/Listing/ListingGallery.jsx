import { Button } from "@/components/ui/button";
import { Grip, Heart, Share } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import {
  fetchWishlistCollections,
  toggleListing,
  openCreateDialog,
} from "@/store/Slices/wishlistSlice";
import WishlistDialog from "@/components/Wishlist/WishlistDialog";
import ShareModal from "./ShareModal";
import PhotoGalleryModal from "./PhotoGalleryModal";

const ListingGallery = ({ title, images = [], description }) => {
  // Get listing ID from URL params
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Get wishlist data from Redux store
  const savedListings = useSelector((state) => state.wishlist.savedListings);
  const collections = useSelector((state) => state.wishlist.collections);
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const showCreateDialog = useSelector(
    (state) => state.wishlist.showCreateDialog
  );

  // State for share modal
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  // State for photo gallery modal
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Check if listing is saved
  const isFav = savedListings[id]?.isSaved || false;

  useEffect(() => {
    if (user) {
      dispatch(fetchWishlistCollections());
    }
  }, [dispatch, user]);

  const urls = images
    .map((img) => (typeof img === "string" ? img : img?.url))
    .filter(Boolean);
  const [img1, img2, img3, img4, img5] = [
    urls[0] || "https://placehold.co/1200x800?text=Photo+1",
    urls[1] || "https://placehold.co/600x400?text=Photo+2",
    urls[2] || "https://placehold.co/600x400?text=Photo+3",
    urls[3] || "https://placehold.co/600x400?text=Photo+4",
    urls[4] || "https://placehold.co/600x400?text=Photo+5",
  ];
  const handleHeartClick = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    const isSaved = savedListings[id]?.isSaved;

    if (isSaved) {
      dispatch(toggleListing(id));
    } else {
      dispatch(
        openCreateDialog({
          listingId: id,
          collections: collections,
        })
      );
    }
  };
  return (
    <>
      <div className="max-w-6xl mx-auto mt-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-semibold text-gray-900">
            {title || "Listing"}
          </h1>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
              onClick={() => setIsShareModalOpen(true)}
            >
              <Share size={18} />
              <div className="underline">Share</div>
            </Button>
            <Button
              variant="ghost"
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 cursor-pointer"
              onClick={handleHeartClick}
            >
              <Heart
                size={18}
                fill={isFav ? "red" : "none"}
                stroke={isFav ? "red" : "currentColor"}
              />
              <div className="underline">Save</div>
            </Button>
          </div>
        </div>

        {/* Gallery */}
        <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-xl overflow-hidden h-[420px]">
          {/* Large main image */}
          <div className="col-span-2 row-span-2">
            <img
              src={img1}
              alt="Main photo"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Top right images */}
          <img
            src={img2}
            alt="Photo 2"
            className="w-full h-full object-cover"
          />
          <img
            src={img3}
            alt="Photo 3"
            className="w-full h-full object-cover"
          />

          {/* Bottom right images */}
          <img
            src={img4}
            alt="Photo 4"
            className="w-full h-full object-cover"
          />
          <div className="relative">
            <img
              src={img5}
              alt="Photo 5"
              className="w-full h-full object-cover"
            />
            <button 
              onClick={() => setIsGalleryOpen(true)}
              className="absolute bottom-3 right-3 w-39 bg-white/90 text-gray-900 text-sm font-medium rounded-md px-3 py-1 shadow-sm hover:bg-white transition flex items-center gap-2"
            >
              <Grip size={16} />
              Show all photos
            </button>
          </div>
        </div>
      </div>
      {/* Wishlist Dialog */}
      {showCreateDialog && <WishlistDialog />}
      
      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        listingTitle={title || "Listing"}
        listingUrl={window.location.href}
        listingImage={urls[0]}
        listingDescription={description}
      />

      {/* Photo Gallery Modal */}
      <PhotoGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        images={images}
        title={title}
        id={id}
      />
    </>
  );
};

export default ListingGallery;
