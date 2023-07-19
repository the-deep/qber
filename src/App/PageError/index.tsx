import { useEffect } from 'react';
import { useRouteError } from 'react-router-dom';

function PageError() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorResponse = useRouteError() as unknown as any;

    useEffect(
        () => {
            // eslint-disable-next-line no-console
            console.error(errorResponse);
        },
        [errorResponse],
    );
    return (
        <div>
            <div>
                <h1>
                    Oops! Looks like we ran into some issue!
                </h1>
                <div>
                    {errorResponse?.error?.message
                        ?? errorResponse?.message
                        ?? 'Something unexpected happened!'}
                </div>
                <div>
                    {errorResponse?.error?.stack
                        ?? errorResponse?.stack
                        ?? 'Stack trace not available'}
                </div>
                <div>
                    See the developer console for more details
                </div>
            </div>
        </div>
    );
}

export default PageError;
