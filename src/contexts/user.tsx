import { createContext } from 'react';

export interface UserDetails {
    id: string;
    firstName: string | undefined;
    lastName: string | undefined;
    email: string | undefined;
}

export interface UserContextProps {
    userDetails?: UserDetails,
    setUser: (userDetails: UserDetails) => void,
    removeUser: () => void;
}

const UserContext = createContext<UserContextProps>({
    setUser: () => {
        // eslint-disable-next-line no-console
        console.warn('UserContext::setUser called without provider');
    },
    removeUser: () => {
        // eslint-disable-next-line no-console
        console.warn('UserContext::removeUser called without provider');
    },
});

export default UserContext;
