import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { Heart, Star, ChevronLeft, ChevronRight } from "lucide-react";
import {
  fetchSingleCollection,
  removeFromCollection,
  addToExistingCollection,
} from "@/store/Slices/wishlistSlice";
import { Button } from "@/components/ui/button";

const CollectionDetail = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { collectionId } = useParams();

  const { currentCollection, collectionStatus } = useSelector(
    (state) => state.wishlist
  );

  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [removedListings, setRemovedListings] = useState(new Set()); // ⭐ رجعناه بس للـ UI بس

  useEffect(() => {
    if (isAuthenticated && collectionId) {
      dispatch(fetchSingleCollection(collectionId));
    }
  }, [dispatch, collectionId, isAuthenticated]);

  const handleToggleWishlist = async (listingId) => {
    const isRemoved = removedListings.has(listingId);

    if (isRemoved) {
      setRemovedListings((prev) => {
        const newSet = new Set(prev);
        newSet.delete(listingId);
        return newSet;
      });

      await dispatch(
        addToExistingCollection({
          collectionId,
          listingId,
        })
      );
    } else {
      setRemovedListings((prev) => new Set(prev).add(listingId));

      await dispatch(
        removeFromCollection({
          collectionId,
          listingId,
        })
      );
    }
  };

  const handlePrevImage = (e, listingId, imagesLength) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => ({
      ...prev,
      [listingId]: prev[listingId] > 0 ? prev[listingId] - 1 : imagesLength - 1,
    }));
  };

  const handleNextImage = (e, listingId, imagesLength) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => ({
      ...prev,
      [listingId]: prev[listingId] < imagesLength - 1 ? prev[listingId] + 1 : 0,
    }));
  };

  if (collectionStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading collection...</div>
      </div>
    );
  }

  if (!currentCollection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Collection not found</div>
      </div>
    );
  }

  const listings = currentCollection.listings || [];

  console.log(currentCollection);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/wishlists")}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
          >
            ← Back to Wishlists
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {currentCollection.name}
          </h1>
        </div>

        {/* if no listings */}
        {listings.length === 0 && (
          <div className="flex flex-col items-center justify-center px-4">
            <div className="text-center max-w-md">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                No Saves yet
              </h2>
              <p className="text-gray-600 mb-8">
                As you search, click the heart icon to save your favorite places
                and Experiences to a wishlist.
              </p>
              <Button onClick={() => navigate("/homes")}>Start Exploring</Button>
            </div>
          </div>
        )}

        {/* Listings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.map((listing) => {
            const listingId = listing._id;
            const images = listing.images || [];
            const currentIndex = currentImageIndex[listingId] || 0;
            const isRemoved = removedListings.has(listingId); // ⭐ لو true = فاضي، لو false = أحمر

            return (
              <div
                key={listingId}
                className="group relative cursor-pointer"
                onClick={() => navigate(`/room/${listingId}`)}
              >
                {/* Image Carousel */}
                <div
                  className="relative aspect-square overflow-hidden rounded-2xl mb-3 cursor-pointer"
                  onMouseEnter={() => setHoveredCard(listingId)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div
                    className="flex h-full transition-transform duration-500 ease-in-out"
                    style={{
                      transform: `translateX(-${currentIndex * 100}%)`,
                    }}
                  >
                    {images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img.url || img}
                        alt={listing.title}
                        className="w-full min-w-full h-full object-cover"
                      />
                    ))}
                  </div>

                  {/* Heart Icon - toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleWishlist(listingId);
                    }}
                    className="absolute top-3 right-3 p-2 hover:scale-110 transition-transform z-10 cursor-pointer"
                  >
                    <Heart
                      size={24}
                      className={
                        isRemoved
                          ? "fill-none stroke-white stroke-2"
                          : "fill-red-500 stroke-white stroke-2"
                      }
                    />
                  </button>

                  {/* Navigation Arrows */}
                  {hoveredCard === listingId && images.length > 1 && (
                    <>
                      <button
                        onClick={(e) =>
                          handlePrevImage(e, listingId, images.length)
                        }
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all z-10 cursor-pointer"
                      >
                        <ChevronLeft size={16} className="text-gray-900" />
                      </button>
                      <button
                        onClick={(e) =>
                          handleNextImage(e, listingId, images.length)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all z-10 cursor-pointer"
                      >
                        <ChevronRight size={16} className="text-gray-900" />
                      </button>
                    </>
                  )}

                  {/* Image Dots */}
                  {images.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                      {images.map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentIndex ? "bg-white" : "bg-white/50"
                            }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Listing Info */}
                <div className="space-y-1">
                  {/* Title and Rating */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-gray-900 truncate flex-1">
                      {listing.title}
                    </h3>
                    {listing.ratingAvg && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Star size={14} className="fill-black stroke-black" />
                        <span className="text-sm font-medium">
                          {listing.ratingAvg.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {listing.description || "No description available"}
                  </p>

                  {/* Bedrooms */}
                  <p className="text-sm text-gray-700">
                    {listing.bedrooms || 0}{" "}
                    {listing.bedrooms === 1 ? "bedroom" : "bedrooms"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CollectionDetail;
