import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createService } from "@/store/Slices/serviceSlice";
import { toast } from "sonner";
import ServiceBasicDetailsStep from "./Steps/ServiceSteps/ServiceBasicDetailsStep";
import ServiceLocationStep from "./Steps/ServiceSteps/ServiceLocationStep";
import ServicePricingStep from "./Steps/ServiceSteps/ServicePricingStep";
import ServiceAvailabilityStep from "./Steps/ServiceSteps/ServiceAvailabilityStep";
import ServiceRequirementsStep from "./Steps/ServiceSteps/ServiceRequirementsStep";
import ServiceImagesStep from "./Steps/ServiceSteps/ServiceImagesStep";
import ServiceDetailsStep from "./Steps/ServiceSteps/ServiceDetailsStep";
import StepIndicator from "./StepIndicator";

const steps = [
  "Basic Details",
  "Service Area",
  "Pricing",
  "Availability",
  "Requirements",
  "Images",
  "Service Details",
];

const ServiceListingForm = ({ onBack }) => {
  const dispatch = useDispatch();
  const { status } = useSelector((state) => state.service);
  const [currentStep, setCurrentStep] = useState(0);
  const [listingData, setListingData] = useState({
    title: "",
    description: "",
    serviceCategory: "",
    serviceArea: "",
    city: "",
    country: "",
    coordinates: { lat: 0, lng: 0 },
    hourlyRate: 0,
    packages: [],
    availability: [],
    requirements: [],
    skills: [],
    images: [],
    serviceDetails: {
      responseTime: "",
      cancellationPolicy: "",
      additionalInfo: "",
    },
  });

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
      const locationData = {
        serviceArea: listingData.serviceArea,
        city: listingData.city,
        country: listingData.country,
        coordinates: listingData.coordinates,
      };

      const parsedAvailability = listingData.availability.map(item => {
        const [startStr, endStr] = item.hours.split('-').map(s => s.trim());
        return {
          day: item.day,
          startTime: startStr || "09:00",
          endTime: endStr || "17:00",
          isAvailable: true
        };
      });

      await dispatch(
        createService({
          ...listingData,
          location: locationData,
          availability: parsedAvailability,
        })
      ).unwrap();
      toast.success("Service listing created successfully!");
      onBack();
    } catch (error) {
      toast.error(error?.message || error || "Failed to create service listing");
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <ServiceBasicDetailsStep
            data={listingData}
            onUpdate={updateListingData}
          />
        );
      case 1:
        return (
          <ServiceLocationStep
            data={listingData}
            onUpdate={updateListingData}
          />
        );
      case 2:
        return (
          <ServicePricingStep data={listingData} onUpdate={updateListingData} />
        );
      case 3:
        return (
          <ServiceAvailabilityStep
            data={listingData}
            onUpdate={updateListingData}
          />
        );
      case 4:
        return (
          <ServiceRequirementsStep data={listingData} onUpdate={updateListingData} />
        );
      case 5:
        return (
          <ServiceImagesStep data={listingData} onUpdate={updateListingData} />
        );
      case 6:
        return (
          <ServiceDetailsStep data={listingData} onUpdate={updateListingData} />
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
            size="lg"
            className="min-w-[120px]"
            disabled={status === "loading"}
          >
            {status === "loading"
              ? "Submitting..."
              : currentStep === steps.length - 1
                ? "Submit Listing"
                : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServiceListingForm;
