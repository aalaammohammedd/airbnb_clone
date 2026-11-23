import { MenuIcon } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from "@/components/ui/button";
import { logout } from '@/store/Slices/authslice';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MenuList() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [logoutError, setLogoutError] = useState('');

    const isLoggedIn = useSelector(
        (state) => state.auth.isAuthenticated
    );

    const handleLogout = async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        setLogoutError('');
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include',
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Logout failed');
            }
            dispatch(logout());
            navigate('/');
        } catch (error) {
            setLogoutError(error.message || 'Logout failed');
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    <MenuIcon />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuGroup>
                    {isLoggedIn ? (
                        <>
                            <Link to="/profile">
                                <DropdownMenuItem>
                                    Profile
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                            </Link>
                            <DropdownMenuGroup>
                                <Link to="/messages">
                                    <DropdownMenuItem>Messages</DropdownMenuItem>
                                </Link>
                                <DropdownMenuSeparator />
                                <Link to="/wishlists">
                                    <DropdownMenuItem>Wishlist</DropdownMenuItem>
                                </Link>
                            </DropdownMenuGroup>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem onSelect={(event) => {
                                event.preventDefault();
                                handleLogout();
                            }} disabled={isLoggingOut}>
                                {isLoggingOut ? 'Logging out...' : 'Log out'}
                            </DropdownMenuItem>
                            {logoutError && (
                                <p className="px-2 py-1 text-sm text-red-600" role="alert">
                                    {logoutError}
                                </p>
                            )}
                        </>

                    ) : (
                        <>
                            <Link to="/login">
                                <DropdownMenuItem>
                                    Login
                                </DropdownMenuItem>
                            </Link>
                            <DropdownMenuSeparator />

                            <Link to="/signup">
                                <DropdownMenuItem>Signup</DropdownMenuItem>
                            </Link>
                        </>
                    )}
                </DropdownMenuGroup>



                <DropdownMenuSeparator />

                <Link to="/help">
                    <DropdownMenuItem>Support</DropdownMenuItem>
                </Link>

                <DropdownMenuSeparator />

                <Link to="/ai-recommendation">
                    <DropdownMenuItem>AI Recommendation</DropdownMenuItem>
                </Link>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
