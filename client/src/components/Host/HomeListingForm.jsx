import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createListing } from "@/store/Slices/listingSlice";
import BasicDetailsStep from "./Steps/HomeSteps/BasicDetailsStep";
import LocationStep from "./Steps/HomeSteps/LocationStep";
import PricingStep from "./Steps/HomeSteps/PricingStep";
import PropertyDetailsStep from "./Steps/HomeSteps/PropertyDetailsStep";
import ImagesStep from "./Steps/HomeSteps/ImagesStep";
import AmenitiesStep from "./Steps/HomeSteps/AmenitiesStep";
import AvailabilityStep from "./Steps/HomeSteps/AvailabilityStep";
import StepIndicator from "./StepIndicator";
import { Loader2 } from "lucide-react";

const steps = [
  "Basic Details",
  "Location",
  "Pricing",
  "Property Details",
  "Images",
  "Amenities",
  "Availability",
];

const HomeListingForm = ({ onBack }) => {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.listing);
  const [currentStep, setCurrentStep] = useState(0);
  const [listingData, setListingData] = useState({
    title: "",
    description: "",
    propertyType: "",
    street: "",
    city: "",
    country: "",
    coordinates: { lat: 0, lng: 0 },
    pricePerNight: 0,
    cleaningFee: 0,
    maxGuests: 1,
    bedrooms: 1,
    bathrooms: 1,
    images: [],
    amenities: [],
    availability: [],
  });

  console.log(listingData);

  const updateListingData = (data) => {
    setListingData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      await dispatch(createListing(listingData)).unwrap();
      toast.success("Listing created successfully!");
      onBack();
    } catch (err) {
      toast.error(`Failed to create listing: ${err?.message || err || error}`);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <BasicDetailsStep data={listingData} onUpdate={updateListingData} />
        );
      case 1:
        return <LocationStep data={listingData} onUpdate={updateListingData} />;
      case 2:
        return <PricingStep data={listingData} onUpdate={updateListingData} />;
      case 3:
        return (
          <PropertyDetailsStep
            data={listingData}
            onUpdate={updateListingData}
          />
        );
      case 4:
        return <ImagesStep data={listingData} onUpdate={updateListingData} />;
      case 5:
        return (
          <AmenitiesStep data={listingData} onUpdate={updateListingData} />
        );
      case 6:
        return (
          <AvailabilityStep data={listingData} onUpdate={updateListingData} />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card shadow-sm">
        <div className="container max-w-5xl mx-auto px-6 py-5">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-[var(--transition-smooth)] group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="font-medium">Back</span>
          </button>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-6 py-12">
        <div className="mb-12">
          <StepIndicator steps={steps} currentStep={currentStep} />
        </div>

        <div className="bg-card rounded-xl shadow-[var(--shadow-card)] border border-border p-8 md:p-10 mb-8">
          {renderStep()}
        </div>

        <div className="flex justify-between items-center gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            size="lg"
            className="min-w-[120px]"
          >
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={status === "loading"}
            size="lg"
            className="min-w-[120px]"
          >
            {status === "loading"
              ? <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...
              </>
              : currentStep === steps.length - 1
                ? "Submit Listing"
                : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HomeListingForm;
