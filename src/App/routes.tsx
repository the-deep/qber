import {
    wrapRoute,
    unwrapRoute,
} from '#utils/routes';
import type {
    MyInputIndexRouteObject,
    MyInputNonIndexRouteObject,
    MyOutputIndexRouteObject,
    MyOutputNonIndexRouteObject,
} from '#utils/routes';

import { Component as RootLayout } from '#views/Root';
import { Component as ResetPasswordRedirect } from '#redirects/ResetPasswordRedirect';

import Auth from './Auth';

import PageError from './PageError';

// NOTE: setting default ExtendedProps
type ExtendedProps = {
    title: string,
    visibility: 'is-authenticated' | 'is-not-authenticated' | 'anything',
};
interface MyWrapRoute {
    <T>(
        myRouteOptions: MyInputIndexRouteObject<T, ExtendedProps>
    ): MyOutputIndexRouteObject<ExtendedProps>
    <T>(
        myRouteOptions: MyInputNonIndexRouteObject<T, ExtendedProps>
    ): MyOutputNonIndexRouteObject<ExtendedProps>
}
const myWrapRoute: MyWrapRoute = wrapRoute;

const root = myWrapRoute({
    path: '/',
    component: {
        eagerLoad: true,
        render: RootLayout,
        props: {},
    },
    wrapperComponent: Auth,
    context: {
        title: '',
        visibility: 'anything',
    },
    errorElement: <PageError />,
});

const home = myWrapRoute({
    index: true,
    component: {
        render: () => import('#views/Home'),
        props: {},
    },
    parent: root,
    wrapperComponent: Auth,
    context: {
        title: 'Home',
        visibility: 'is-authenticated',
    },
    errorElement: <PageError />,
});

const login = myWrapRoute({
    path: 'login',
    component: {
        render: () => import('#views/Login'),
        props: {},
    },
    parent: root,
    wrapperComponent: Auth,
    context: {
        title: 'Login',
        visibility: 'is-not-authenticated',
    },
});

const register = myWrapRoute({
    path: 'register',
    component: {
        render: () => import('#views/Register'),
        props: {},
    },
    parent: root,
    wrapperComponent: Auth,
    context: {
        title: 'Register',
        visibility: 'is-not-authenticated',
    },
});

const about = myWrapRoute({
    path: 'about',
    component: {
        render: () => import('#views/About'),
        props: {},
    },
    context: {
        title: 'About',
        visibility: 'is-authenticated',
    },
});

const resetPassword = myWrapRoute({
    path: 'reset-password',
    component: {
        render: () => import('#views/ResetPassword'),
        props: {},
    },
    context: {
        title: 'Reset Password',
        visibility: 'anything',
    },
});

const forgotPassword = myWrapRoute({
    path: 'forgot-password',
    component: {
        render: () => import('#views/Login/ForgotPassword'),
        props: {},
    },
    context: {
        title: 'Forgot Password',
        visibility: 'anything',
    },
});

// FIXME: eager load this page
const resetPasswordRedirect = myWrapRoute({
    path: '/permalink/password-reset/:uuid/:token',
    component: {
        eagerLoad: true,
        render: ResetPasswordRedirect,
        props: {},
    },
    parent: root,
    context: {
        title: 'Reset Password',
        visibility: 'anything',
    },
});

const projectEdit = myWrapRoute({
    path: 'project/:projectId/edit',
    component: {
        render: () => import('#views/ProjectEdit'),
        props: {},
    },
    context: {
        title: 'Edit project',
        visibility: 'is-authenticated',
    },
});

const questionnaireEdit = myWrapRoute({
    path: 'project/:projectId/questionnaire/:questionnaireId/edit',
    component: {
        render: () => import('#views/QuestionnaireEdit'),
        props: {},
    },
    context: {
        title: 'Edit questionnaire',
        visibility: 'is-authenticated',
    },
});

const fourHundredFour = myWrapRoute({
    path: '*',
    component: {
        render: () => import('#components/FullPageErrorMessage'),
        props: {
            errorTitle: '404',
            errorMessage: 'The page you\'re looking for doesn\'t exist',
        },
    },
    context: {
        title: '404',
        visibility: 'anything',
    },
    parent: root,
});

export const wrappedRoutes = {
    root,
    home,
    login,
    register,
    about,
    resetPassword,
    forgotPassword,
    resetPasswordRedirect,
    projectEdit,
    questionnaireEdit,
    fourHundredFour,
};

export type WrappedRoutes = typeof wrappedRoutes;
export const unwrappedRoutes = unwrapRoute(Object.values(wrappedRoutes));
