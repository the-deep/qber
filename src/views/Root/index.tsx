import { Outlet } from 'react-router-dom';

// import styles from './index.module.css';

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    return (
        <Outlet />
    );
}

Component.displayName = 'App';
