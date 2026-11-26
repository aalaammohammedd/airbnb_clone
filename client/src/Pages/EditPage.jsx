import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { GetListingById, updateListing } from "../store/Slices/listingSlice";
import { getExperienceById, updateExperience } from "../store/Slices/experienceSlice";
import { getServiceById, updateService } from "../store/Slices/serviceSlice";
import { Loader2, Save, X, ImageIcon, Plus, Trash } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { uploadImagesToCloudinary } from "@/utils/cloudinaryUpload";

const FallbackInput = (props) => <input {...props} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />;
const FallbackButton = ({ children, className, ...props }) => <button {...props} className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 ${className}`}>{children}</button>;
const FallbackLabel = ({ children, ...props }) => <label {...props} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{children}</label>;
const FallbackTextarea = (props) => <textarea {...props} className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />;

const EditPage = () => {
    const { type, id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [formData, setFormData] = useState({});
    const [images, setImages] = useState([]); // Store existing image URLs
    const [newImages, setNewImages] = useState([]); // Store new file objects
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Redux states
    const { listing } = useSelector((state) => state.listing || {});
    const { experience } = useSelector((state) => state.experience || {});
    const { service } = useSelector((state) => state.service || {});

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                if (type === "listing") {
                    await dispatch(GetListingById(id)).unwrap();
                } else if (type === "experience") {
                    await dispatch(getExperienceById(id)).unwrap();
                } else if (type === "service") {
                    await dispatch(getServiceById(id)).unwrap();
                }
            } catch (error) {
                toast.error("Failed to fetch data");
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [dispatch, type, id]);

    useEffect(() => {
        if (type === "listing" && listing) {
            setFormData(listing);
            setImages(listing.images || []);
        } else if (type === "experience" && experience) {
            setFormData(experience);
            setImages(experience.images?.map(img => img.url || img) || []);
        } else if (type === "service" && service) {
            setFormData(service);
            setImages(service.images?.map(img => img.url || img) || []);
        }
    }, [listing, experience, service, type]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setNewImages((prev) => [...prev, ...filesArray]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const uploadedImages = await uploadImagesToCloudinary(newImages);

            if (type === "listing") {
                const payload = { ...formData, id, images: uploadedImages };
                delete payload._id;
                delete payload.hostId;
                delete payload.reviews;
                delete payload.amenities;
                await dispatch(updateListing(payload)).unwrap();
            } else if (type === "experience") {
                const updatePayload = { ...formData, images: uploadedImages };
                await dispatch(updateExperience({ id, data: updatePayload })).unwrap();

            } else if (type === "service") {
                const data = { ...formData, images: uploadedImages };
                delete data._id;
                delete data.host;
                delete data.createdAt;
                delete data.updatedAt;
                delete data.__v;
                await dispatch(updateService({ id, data })).unwrap();
            }

            toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully!`);
            // navigate(-1) or stay?
        } catch (error) {
            toast.error(`Failed to update ${type}: ${error.message || error}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-4xl py-10 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit {type.charAt(0).toUpperCase() + type.slice(1)}</h1>
                    <p className="text-muted-foreground">Update your details and information.</p>
                </div>
                <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
                    <X className="h-4 w-4" /> Cancel
                </Button>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>General Information</CardTitle>
                        <CardDescription>Basic details about your {type}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    value={formData.title || ""}
                                    onChange={handleChange}
                                    placeholder="e.g., Cozy Cottage in the Woods"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={formData.description || ""}
                                    onChange={handleChange}
                                    placeholder="Describe your offering..."
                                    className="min-h-[150px]"
                                />
                            </div>

                            {/* Dynamic fields based on Type */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="price">
                                        {type === 'experience' ? 'Price per Person' : type === 'service' ? 'Hourly Rate/Price' : 'Price per Night'}
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                        <Input
                                            id="price"
                                            name={type === 'experience' ? 'pricePerPerson' : type === 'service' ? 'hourlyRate' : 'pricePerNight'}
                                            type="number"
                                            value={
                                                (type === 'experience' ? formData.pricePerPerson :
                                                    type === 'service' ? formData.hourlyRate :
                                                        formData.pricePerNight) || ""
                                            }
                                            onChange={handleChange}
                                            className="pl-7"
                                        />
                                    </div>
                                </div>

                                {type === 'listing' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="propertyType">Property Type</Label>
                                            <Input id="propertyType" name="propertyType" value={formData.propertyType || ""} onChange={handleChange} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="maxGuests">Max Guests</Label>
                                            <Input id="maxGuests" name="maxGuests" type="number" value={formData.maxGuests || ""} onChange={handleChange} />
                                        </div>
                                    </>
                                )}

                                {type === 'service' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="serviceCategory">Category</Label>
                                        <Input id="serviceCategory" name="serviceCategory" value={formData.serviceCategory || ""} onChange={handleChange} />
                                    </div>
                                )}

                                {type === 'experience' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="experienceType">Type</Label>
                                        <Input id="experienceType" name="experienceType" value={formData.experienceType || ""} onChange={handleChange} />
                                    </div>
                                )}

                            </div>

                            {/* Image Management */}
                            <div className="space-y-4">
                                <Label>Images</Label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {images.map((img, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border">
                                            <img
                                                src={typeof img === 'string' ? img : img.url}
                                                alt={`Existing ${idx}`}
                                                className="object-cover w-full h-full"
                                            />
                                        </div>
                                    ))}
                                    {newImages.map((file, idx) => (
                                        <div key={`new-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={`New ${idx}`}
                                                className="object-cover w-full h-full opacity-80"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full">New</span>
                                            </div>
                                        </div>
                                    ))}
                                    <label className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 cursor-pointer bg-muted/50 hover:bg-muted transition-colors">
                                        <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                                            <Plus className="h-8 w-8" />
                                            <span>Add Image</span>
                                        </div>
                                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end pt-6">
                                <Button type="submit" size="lg" disabled={saving} className="min-w-[150px]">
                                    {saving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" /> Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>

                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default EditPage;
