import { useContext, useMemo } from 'react';
import UserContext from '#contexts/user';
import { NavLink, Link } from 'react-router-dom';
import {
    DropdownMenu,
    DropdownMenuItem,
} from '@the-deep/deep-ui';

import Avatar from '#components/Avatar';

import styles from './index.module.css';

function Navbar() {
    const { userDetails } = useContext(UserContext);

    const fullName = useMemo(() => (
        `${userDetails?.firstName} ${userDetails?.lastName}`
    ), [
        userDetails?.firstName,
        userDetails?.lastName,
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
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}

export default Navbar;
