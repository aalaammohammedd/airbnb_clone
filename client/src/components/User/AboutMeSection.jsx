import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserProfile, setProfile } from '../../store/Slices/authslice';
import { FaGlobeAmericas, FaStar, FaEdit } from 'react-icons/fa';
import axios from 'axios';

const transformDataForDispatch = (data) => {
    const finalData = { ...data };
    ['interests'].forEach(key => {
        if (typeof finalData[key] === 'string') {
            finalData[key] = finalData[key].split(',').map(item => item.trim()).filter(item => item !== '');
        }
    });
    return finalData;
};

//key convert location to string
const REVERSE_GEOCODE_API_KEY = 'c6ee548b2760410bb47cf5d2730601ad';

const INTERESTS_OPTIONS = ['Photography', 'Hiking', 'Reading', 'Cooking', 'Gaming'];

const CheckboxGroup = ({ label, name, options, selectedValues, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <div className="flex flex-wrap gap-4 p-3 border border-gray-300 rounded-md bg-white">
            {options.map((option) => (
                <div key={option} className="flex items-center">
                    <input
                        type="checkbox"
                        id={`${name}-${option}`}
                        name={name}
                        value={option}
                        checked={selectedValues.includes(option)}
                        onChange={onChange}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor={`${name}-${option}`} className="ml-2 text-sm text-gray-700">
                        {option}
                    </label>
                </div>
            ))}
        </div>
    </div>
);

//main function
const AboutMeSection = () => {
    const dispatch = useDispatch();

    // Selectors
    const profile = useSelector((state) => state.auth.user);
    const loading = useSelector((state) => state.auth.loading);
    const error = useSelector((state) => state.auth.error);
    // State
    const [isEditing, setIsEditing] = useState(false);
    const [editableData, setEditableData] = useState({});
    const [locationError, setLocationError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [updateError, setUpdateError] = useState('');

    useEffect(() => {
        if (!profile && !loading && !error) {
            dispatch(fetchUserProfile());
        }
    }, [dispatch, profile, loading, error]);

    useEffect(() => {
        if (profile) {
            // Initialize state data. Checkbox values are converted to arrays for easier manipulation in handleCheckboxChange
            setEditableData({
                aboutMe: profile.aboutMe || '',
                // Checkbox fields: ensure they are arrays for CheckboxGroup component
                interests: Array.isArray(profile.interests) ? profile.interests : [],
                // Location Fields initialization
                location: profile.location && profile.location.address ? profile.location.address : '',
                latitude: profile.location && profile.location.latitude ? profile.location.latitude : null,
                longitude: profile.location && profile.location.longitude ? profile.location.longitude : null,
            });
        }
    }, [profile, isEditing]);

    // handle 
    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditableData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e) => {
        const { name, value, checked } = e.target;
        setEditableData(prev => {
            const currentArray = prev[name] || [];

            if (checked) {
                return { ...prev, [name]: [...currentArray, value] };
            } else {
                return { ...prev, [name]: currentArray.filter(item => item !== value) };
            }
        });
    };


    const handleGetLocation = () => {
        setLocationError('');

        if (navigator.geolocation) {
            //  Get current position from the browser
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;

                    // handle error
                    let cityAddress = `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

                    try {
                        // 2. Perform Reverse Geocoding via API  التحويل
                        const apiUrl = `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${REVERSE_GEOCODE_API_KEY}&language=en`;

                        const response = await axios.get(apiUrl);

                        if (response.data.results && response.data.results.length > 0) {
                            const result = response.data.results[0].components;

                            // 3. Extract the most relevant readable address component
                            cityAddress = result.city || result.town || result.village || result.state || result.country;

                            // Fallback to the full formatted address if major components are missing
                            if (!cityAddress) {
                                cityAddress = response.data.results[0].formatted;
                            }
                        } else {
                            // API returned results but couldn't find a match (e.g., location is in the ocean)
                            setLocationError('API found coordinates but no recognizable address.');
                        }

                    } catch (apiError) {
                        console.error('Reverse Geocoding Failed:', apiError);
                        setLocationError('Could not retrieve city name via API. Coordinates saved instead.');
                    }

                    // 4. Update the state
                    setEditableData(prev => ({
                        ...prev,
                        latitude: latitude,
                        longitude: longitude,
                        location: cityAddress //  هنا يتم استخدام اسم المدينة/
                    }));
                },
                (error) => {
                    // Handle Geolocation API errors (e.g., user denied access)
                    setLocationError('Unable to retrieve location. Please check browser permissions.');
                    console.error('Geolocation Error:', error);
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            setLocationError('Geolocation is not supported by your browser.');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        // Prepare location data object to match backend schema
        const locationData = {
            address: editableData.location || '',
            latitude: editableData.latitude,
            longitude: editableData.longitude,
        };

        // Collect all data from editableData
        let dataToSave = {
            ...editableData,
            location: locationData,
        };

        // Remove temporary fields (latitude, longitude, photo) from the root object before dispatch
        delete dataToSave.latitude;
        delete dataToSave.longitude;
        delete dataToSave.profilePhoto;

        // Transform the checkbox array fields into comma-separated strings for dispatch
        dataToSave = transformDataForDispatch(dataToSave);

        setIsSaving(true);
        setUpdateError('');
        try {
            const response = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(dataToSave),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Failed to update profile.');
            }
            dispatch(setProfile(result));
            setIsEditing(false);
        } catch (requestError) {
            setUpdateError(requestError.message || 'Failed to update profile.');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="text-center p-8 text-blue-600 font-semibold">Loading profile data...</div>;
    if (error) return <div className="text-center p-8 text-red-600 font-semibold">Error fetching profile: {error}.</div>;
    if (!profile) return <div className="text-center p-8 text-gray-500">No profile data available.</div>;



    if (isEditing) {
        return (
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Edit Profile</h1>
                </div>
                {updateError && <p className="text-red-500 mb-4 font-medium" role="alert">{updateError}</p>}

                <form onSubmit={handleSave} className="space-y-6">

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Location / City Name</label>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                name="location"
                                value={editableData.location}
                                onChange={handleChange}
                                placeholder="Enter city or use GPS..."
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm grow"
                            />
                            <button
                                type="button"
                                onClick={handleGetLocation}
                                className="mt-1 px-4 py-2 bg-green-500 text-white font-semibold rounded-md shadow-md hover:bg-green-600 transition duration-150 flex items-center"
                            >
                                <FaGlobeAmericas className="w-4 h-4 mr-2" />
                                Use GPS
                            </button>
                        </div>
                        {editableData.latitude && (
                            <p className="text-xs text-green-600 mt-1">
                                GPS Coordinates saved: Lat {editableData.latitude.toFixed(4)}, Lon {editableData.longitude.toFixed(4)}
                            </p>
                        )}
                        {locationError && <p className="text-xs text-red-500 mt-1">{locationError}</p>}
                    </div>

                    {/* Interests (Checkbox Group) */}
                    <CheckboxGroup
                        label="Interests"
                        name="interests"
                        options={INTERESTS_OPTIONS}
                        selectedValues={editableData.interests}
                        onChange={handleCheckboxChange}
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700">About Me</label>
                        <textarea
                            name="aboutMe"
                            value={editableData.aboutMe}
                            onChange={handleChange}
                            rows="4"
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                        />
                    </div>

                    <div className="flex space-x-4">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50 transition duration-150"
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-6 py-2 bg-gray-300 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-400 transition duration-150"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        );
    }


    return (
        <div>

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">About me</h1>
                <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center text-sm text-gray-600 hover:text-blue-600 font-medium transition duration-150"
                >
                    <FaEdit className="w-3 h-3 mr-1" />
                    Edit
                </button>
            </div>

            {/* Profile Card */}
            <div className="w-72 p-6 bg-white rounded-xl shadow-lg border border-gray-100 mb-8 text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-900 rounded-full flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                    {profile.profilePhoto ? (
                        <img src={profile.profilePhoto} alt="Profile" className="object-cover w-full h-full" />
                    ) : (
                        profile.firstName ? profile.firstName.charAt(0).toUpperCase() : 'A'
                    )}
                </div>

                <h3 className="text-xl font-semibold text-gray-900">{profile.firstName || 'User'}</h3>
                <p className="text-sm text-gray-500">{profile.role}</p>
            </div>

            <div className="space-y-6">

                {/* Location */}
                <div className="flex items-start">
                    <FaGlobeAmericas className="w-5 h-5 text-gray-500 mr-4 mt-1" />
                    <div>
                        <p className="text-sm text-gray-700">Location:</p>
                        <p className="font-semibold">
                            {profile.location && profile.location.address ? profile.location.address : 'Not specified'}
                        </p>
                    </div>
                </div>

                {/* Interests */}
                <div className="flex items-start">
                    <FaStar className="w-5 h-5 text-gray-500 mr-4 mt-1" />
                    <div>
                        <p className="text-sm text-gray-700">My Interests:</p>
                        <p className="font-semibold">
                            {profile.interests && profile.interests.length > 0
                                ? profile.interests.join(', ')
                                : 'None specified'}
                        </p>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-lg font-semibold mb-2">About Me</h4>
                    <p className="text-gray-600 whitespace-pre-line">{profile.aboutMe || 'The user has not added information about themselves yet.'}</p>
                </div>
            </div>
        </div>
    );
};

export default AboutMeSection;