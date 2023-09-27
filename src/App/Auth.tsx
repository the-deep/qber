import type { ReactElement } from 'react';
import { useContext } from 'react';
import { PendingMessage } from '@the-deep/deep-ui';
import { Navigate } from 'react-router-dom';
import { isDefined } from '@togglecorp/fujs';
import { gql, useQuery } from '@apollo/client';

import UserContext from '#contexts/user';

import {
    MeQuery,
    MeQueryVariables,
} from '#generated/types';

const ME = gql`
query Me {
    public {
        id
        me {
            id
            firstName
            lastName
            email
        }
    }
}
`;

interface Props {
    children: ReactElement,
    context: {
        title: string,
        visibility: 'is-authenticated' | 'is-not-authenticated' | 'anything',
    },
}
function Auth(props: Props) {
    const {
        context,
        children,
    } = props;

    const { userDetails, setUser } = useContext(UserContext);

    const {
        loading,
    } = useQuery<MeQuery, MeQueryVariables>(
        ME,
        {
            onCompleted: (response) => {
                const meResponse = response?.public?.me;
                if (isDefined(meResponse)) {
                    setUser(meResponse);
                }
            },
        },
    );

    if (loading) {
        return (
            <PendingMessage />
        );
    }

    if (context.visibility === 'is-authenticated' && !userDetails) {
        return (
            <Navigate to="/login/" />
        );
    }
    if (context.visibility === 'is-not-authenticated' && !!userDetails) {
        return (
            <Navigate to="/" />
        );
    }

    return children;
}

export default Auth;
