import {
    Link,
    NavLink,
} from 'react-router-dom';
import {
    _cs,
} from '@togglecorp/fujs';

import styles from './index.module.css';

interface Props {
    className?: string;
    header?: React.ReactNode;
    onCloseLink: string;
}

function SubNavbar(props: Props) {
    const {
        className,
        header,
        onCloseLink,
    } = props;
    return (
        <nav className={_cs(styles.subNavbar, className)}>
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
                <NavLink
                    to={onCloseLink}
                >
                    Close
                </NavLink>
            </div>
        </nav>
    );
}

export default SubNavbar;
