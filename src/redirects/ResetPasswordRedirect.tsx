import { isNotDefined } from '@togglecorp/fujs';
import {
    Navigate,
    generatePath,
    useParams,
} from 'react-router-dom';

interface ResetPasswordParams extends Record<string, string | undefined> {
    uuid: string | undefined;
    token: string | undefined;
}

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const { uuid, token } = useParams<ResetPasswordParams>();

    const resetPasswordLink = (uuid && token) ? ({
        pathName: (generatePath('/reset-password')),
        state: {
            uuid,
            token,
        },
    }) : ({
        pathName: (generatePath('/404')),
        state: {},
    });

    if (isNotDefined(resetPasswordLink)) {
        return null;
    }

    return (
        <Navigate
            to={resetPasswordLink.pathName}
            state={resetPasswordLink.state}
            replace
        />
    );
}

Component.displayName = 'ResetPasswordRedirect';
