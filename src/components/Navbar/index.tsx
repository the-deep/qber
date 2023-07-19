import { useContext, useMemo, useCallback } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { IoLogOutOutline } from 'react-icons/io5';
import { gql, useMutation } from '@apollo/client';
import {
    DropdownMenu,
    DropdownMenuItem,
    useAlert,
} from '@the-deep/deep-ui';

import Avatar from '#components/Avatar';
import UserContext from '#contexts/user';
import {
    LogoutMutation,
} from '#generated/types';

import styles from './index.module.css';

const LOGOUT = gql`
mutation Logout {
    public {
        logout {
            ok
            errors
        }
    }
}
`;

function Navbar() {
    const { userDetails } = useContext(UserContext);
    const alert = useAlert();

    const fullName = useMemo(() => (
        `${userDetails?.firstName} ${userDetails?.lastName}`
    ), [
        userDetails?.firstName,
        userDetails?.lastName,
    ]);

    const [
        logoutTrigger,
        { loading: logoutPending },
    ] = useMutation<LogoutMutation>(
        LOGOUT,
        {
            onCompleted: (response) => {
                const logoutResponse = response.public.logout;
                if (!logoutResponse) {
                    return;
                }
                if (logoutResponse.ok) {
                    alert.show(
                        'Logged out successfully!',
                        { variant: 'success' },
                    );
                    window.location.reload();
                } else {
                    alert.show(
                        'Failed to log out!',
                        { variant: 'error' },
                    );
                }
            },
            onError: () => {
                alert.show(
                    'Failed to log out!',
                    { variant: 'error' },
                );
            },
        },
    );

    const handleLogoutClick = useCallback(() => {
        logoutTrigger();
    }, [
        logoutTrigger,
    ]);

    return (
        <div className={styles.navbar}>
            <div className={styles.logoContainer}>
                <Link
                    to="/"
                >
                    <img
                        src="/logo.png"
                        className={styles.logo}
                        alt="Questionnaire Builder Logo"
                    />
                </Link>
            </div>
            <div className={styles.right}>
                <div className={styles.navLinks}>
                    <NavLink
                        className={styles.navItem}
                        to="/"
                    >
                        My Projects
                    </NavLink>
                    <NavLink
                        // FIXME: Fix the routing
                        className={styles.navItem}
                        to="/"
                    >
                        About
                    </NavLink>

                </div>
                <div className={styles.actions}>
                    <DropdownMenu
                        actions={(
                            <Avatar
                                name={fullName}
                            />
                        )}
                        variant="transparent"
                    >
                        <DropdownMenuItem
                            // FIXME: Fix routes
                            href="#"
                        >
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            // FIXME: Fix routes
                            name={undefined}
                            actions={<IoLogOutOutline />}
                            onClick={handleLogoutClick}
                            disabled={logoutPending}
                        >
                            Logout
                        </DropdownMenuItem>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}

export default Navbar;
