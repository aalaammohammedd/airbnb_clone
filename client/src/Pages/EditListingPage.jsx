import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Home, MapPin, DollarSign, Users, Bed, Bath, Sparkles, Loader2, Check, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadImagesToCloudinary } from "@/utils/cloudinaryUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import axios from "axios";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

const propertyTypes = [
    "apartment", "house", "villa", "shared_room", "private_room"
];

export default function EditListingPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [, setError] = useState(null);
    const [allAmenities, setAllAmenities] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const [removedImages, setRemovedImages] = useState([]);

    const [formData, setFormData] = useState({
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
        amenities: [],
        images: [],
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchAmenities = async () => {
            const { data } = await axios.get("http://localhost:3000/api/amenity");
            // console.log("data", data.data);
            setAllAmenities(data.data);
        };

        fetchAmenities();
    }, []);

    useEffect(() => {
        const fetchListing = async () => {
            try {
                setLoading(true);

                const { data } = await axios.get(`/api/listings/${id}`);

                setFormData({
                    title: data.title ?? "",
                    description: data.description ?? "",
                    propertyType: data.propertyType ?? "",
                    street: data.address?.street ?? "",
                    city: data.address?.city ?? "",
                    country: data.address?.country ?? "",
                    coordinates: data.address?.coordinates ?? { lat: 0, lng: 0 },
                    pricePerNight: data.pricePerNight ?? 0,
                    cleaningFee: data.cleaningFee ?? 0,
                    maxGuests: data.maxGuests ?? 1,
                    bedrooms: data.bedrooms ?? 1,
                    bathrooms: data.bathrooms ?? 1,
                    amenities: data.amenities.map((amenity) => amenity._id) ?? [],
                    images: data.images ?? [],
                });
            } catch {
                setError("Failed to load listing");
            } finally {
                setLoading(false);
            }
        };

        fetchListing();
    }, [id]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleCoordinateChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            coordinates: {
                ...prev.coordinates,
                [field]: value === "" ? "" : parseFloat(value),
            },
        }));
    };

    const handleAmenityToggle = (amenityId) => {
        setFormData((prev) => {
            const currentAmenities = prev.amenities || [];
            const isSelected = currentAmenities.includes(amenityId);
            return {
                ...prev,
                amenities: isSelected
                    ? currentAmenities.filter((id) => id !== amenityId)
                    : [...currentAmenities, amenityId],
            };
        });
    };

    const handleRemoveImage = (index) => {
        const image = formData.images[index];
        if (image?._id) {
            setRemovedImages((prev) => [...prev, image._id]);
        }
        setFormData((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const images = await uploadImagesToCloudinary(newImages);
            await axios.put(`/api/listings/${id}`, {
                title: formData.title,
                description: formData.description,
                propertyType: formData.propertyType,
                pricePerNight: formData.pricePerNight,
                cleaningFee: formData.cleaningFee,
                maxGuests: formData.maxGuests,
                bedrooms: formData.bedrooms,
                bathrooms: formData.bathrooms,
                street: formData.street,
                city: formData.city,
                country: formData.country,
                coordinates: formData.coordinates,
                amenities: formData.amenities,
                removedImages,
                images,
            }, {
                withCredentials: true,
            });

            toast.success("Listing updated successfully!");
            navigate("/host/dashboard");
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || "Update failed");
        } finally {
            setIsSubmitting(false);
        }
    };


    const LocationPicker = ({ coordinates, onPick }) => {
        useMapEvents({
            click(e) {
                onPick({
                    lat: e.latlng.lat,
                    lng: e.latlng.lng,
                });
            },
        });
        if (!coordinates?.lat || !coordinates?.lng) return null;

        return <Marker position={[coordinates.lat, coordinates.lng]} />;
    }


    function RecenterMap({ coordinates }) {
        const map = useMap();
        useEffect(() => {
            if (coordinates && typeof coordinates.lat === "number" && typeof coordinates.lng === "number") {
                map.setView([coordinates.lat, coordinates.lng], map.getZoom());
            }
        }, [coordinates, map]);
        return null;
    }


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background border-b border-border">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(-1)}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <h1 className="text-lg font-semibold">Edit Listing</h1>
                    <div className="w-20" />
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 py-8 space-y-8">
                {/* Basic Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Home className="h-5 w-5" />
                            Basic Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => handleChange("title", e.target.value)}
                                placeholder="Give your place a catchy title"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="propertyType">Property Type</Label>
                            <Select
                                value={formData.propertyType}
                                onValueChange={(value) => handleChange("propertyType", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select property type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {propertyTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleChange("description", e.target.value)}
                                placeholder="Describe your place to guests"
                                rows={4}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Location */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Location
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="street">Street Address</Label>
                            <Input
                                id="street"
                                value={formData.street}
                                onChange={(e) => handleChange("street", e.target.value)}
                                placeholder="Enter street address"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    value={formData.city}
                                    onChange={(e) => handleChange("city", e.target.value)}
                                    placeholder="City"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="country">Country</Label>
                                <Input
                                    id="country"
                                    value={formData.country}
                                    onChange={(e) => handleChange("country", e.target.value)}
                                    placeholder="Country"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="lat">Latitude</Label>
                                <Input
                                    id="lat"
                                    type="number"
                                    step="any"
                                    value={formData.coordinates.lat || ""}
                                    onChange={(e) => handleCoordinateChange("lat", e.target.value)}
                                    placeholder="Latitude"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lng">Longitude</Label>
                                <Input
                                    id="lng"
                                    type="number"
                                    step="any"
                                    value={formData.coordinates.lng || ""}
                                    onChange={(e) => handleCoordinateChange("lng", e.target.value)}
                                    placeholder="Longitude"
                                />
                            </div>
                        </div>
                        <div className="relative z-0">
                            <MapContainer
                                center={formData.coordinates}
                                zoom={17}
                                scrollWheelZoom={true}
                                style={{ height: "300px", width: "100%" }}
                            >
                                <TileLayer
                                    attribution='&copy; OpenStreetMap contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <LocationPicker
                                    coordinates={formData.coordinates}
                                    onPick={(coords) => handleChange("coordinates", coords)}
                                />
                                <RecenterMap coordinates={formData.coordinates} />
                            </MapContainer>

                        </div>
                    </CardContent>
                </Card>

                {/* Property Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Property Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="maxGuests" className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Max Guests
                                </Label>
                                <Input
                                    id="maxGuests"
                                    type="number"
                                    min="1"
                                    value={formData.maxGuests}
                                    onChange={(e) => handleChange("maxGuests", parseInt(e.target.value) || 1)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bedrooms" className="flex items-center gap-2">
                                    <Bed className="h-4 w-4" />
                                    Bedrooms
                                </Label>
                                <Input
                                    id="bedrooms"
                                    type="number"
                                    min="1"
                                    value={formData.bedrooms}
                                    onChange={(e) => handleChange("bedrooms", parseInt(e.target.value) || 1)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bathrooms" className="flex items-center gap-2">
                                    <Bath className="h-4 w-4" />
                                    Bathrooms
                                </Label>
                                <Input
                                    id="bathrooms"
                                    type="number"
                                    min="1"
                                    value={formData.bathrooms}
                                    onChange={(e) => handleChange("bathrooms", parseInt(e.target.value) || 1)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Images */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Image className="h-5 w-5" />
                            Images
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="">
                            <div className="space-y-2">
                                <Label htmlFor="images">Images</Label>
                                <Input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) =>
                                        setNewImages((prev) => [...prev, ...Array.from(e.target.files)])
                                    }
                                />

                            </div>
                            <div className="">

                                <div className="grid grid-cols-4 gap-4">
                                    {formData.images.map((image, index) => (
                                        <div key={index} className="flex flex-col items-center">
                                            <img
                                                src={image.url}
                                                alt={`Image ${index + 1}`}
                                                className="w-full h-40 object-cover"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                onClick={() => handleRemoveImage(index)}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    ))}
                                </div>


                            </div>
                        </div>
                    </CardContent>
                </Card>


                {/* Pricing */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Pricing
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="pricePerNight">Price per Night ($)</Label>
                                <Input
                                    id="pricePerNight"
                                    type="number"
                                    min="0"
                                    value={formData.pricePerNight}
                                    onChange={(e) => handleChange("pricePerNight", parseFloat(e.target.value) || 0)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cleaningFee">Cleaning Fee ($)</Label>
                                <Input
                                    id="cleaningFee"
                                    type="number"
                                    min="0"
                                    value={formData.cleaningFee}
                                    onChange={(e) => handleChange("cleaningFee", parseFloat(e.target.value) || 0)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Amenities */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5" />
                            Amenities
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {allAmenities?.map((amenity) => {
                                    const isSelected = formData.amenities?.includes(amenity._id);
                                    return (
                                        <div
                                            key={amenity._id}
                                            className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${isSelected
                                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                                : "border-border hover:border-muted-foreground/50"
                                                }`}
                                        >
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => handleAmenityToggle(amenity._id)}
                                            />

                                            <div className="flex items-center gap-2 flex-1">
                                                <span className="text-sm font-medium">{amenity.name}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Separator />

                {/* Submit Button */}
                <div className="flex justify-end gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate(-1)}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
