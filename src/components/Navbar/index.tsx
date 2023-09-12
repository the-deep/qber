import { useContext, useMemo, useCallback } from 'react';
import {
    NavLink,
    Link,
    useLocation,
} from 'react-router-dom';
import { IoLogOutOutline } from 'react-icons/io5';
import {
    _cs,
} from '@togglecorp/fujs';
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

interface Props {
    header?: React.ReactNode;
}

function Navbar(props: Props) {
    const {
        header,
    } = props;

    const location = useLocation();

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
            <div className={styles.midSection}>
                {header}
            </div>
            <div className={styles.right}>
                <div className={styles.navLinks}>
                    <NavLink
                        className={_cs(
                            styles.navItem,
                            location.pathname === '/' && styles.active,
                        )}
                        to="/"
                    >
                        My Projects
                    </NavLink>
                    <NavLink
                        // FIXME: Fix the routing
                        className={_cs(
                            styles.navItem,
                            location.pathname === '/about' && styles.active,
                        )}
                        to="/about"
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
                        variant="action"
                    >
                        <DropdownMenuItem
                            // FIXME: Fix routes
                            className={styles.dropDownMenuItem}
                            href="#"
                        >
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className={styles.dropDownMenuItem}
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
