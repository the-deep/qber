import { useRef, useCallback, useMemo } from 'react';
import {
    useLocation,
    useNavigate,
} from 'react-router-dom';

import { useMutation, gql } from '@apollo/client';
import {
    isTruthyString,
    isDefined,
} from '@togglecorp/fujs';
import {
    PasswordInput,
    Header,
    Button,
    useAlert,
} from '@the-deep/deep-ui';
import {
    ObjectSchema,
    requiredStringCondition,
    lengthGreaterThanCondition,
    lengthSmallerThanCondition,
    useForm,
    PartialForm,
    createSubmitHandler,
    getErrorObject,
    undefinedValue,
} from '@togglecorp/toggle-form';
import Captcha from '@hcaptcha/react-hcaptcha';

import HCaptcha from '#components/HCaptcha';
import NonFieldError from '#components/NonFieldError';
import { hCaptchaKey } from '#configs/hCaptcha';

import {
    ResetPasswordConfirmMutation,
    ResetPasswordConfirmMutationVariables,
    PasswordResetConfirmInput,
} from '#generated/types';

import styles from './index.module.css';

const RESET_PASSWORD_CONFIRM = gql`
mutation ResetPasswordConfirm($input: PasswordResetConfirmInput!) {
    public {
        passwordResetConfirm(data: $input) {
            ok
            errors
        }
    }
}
`;

type FormType = {
    captcha: string;
    uuid: string;
    token: string;
    newPassword: string;
    confirmPassword: string;
};

type PartialFormType = PartialForm<FormType, never>;

type FormSchema = ObjectSchema<PartialFormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

function samePasswordCondition(
    password: string | undefined,
    value: PartialFormType,
) {
    if (
        value
        && isTruthyString(value.newPassword)
        && isTruthyString(password)
        && value.newPassword !== password
    ) {
        return 'Passwords do not match.';
    }

    return undefined;
}

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        captcha: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        uuid: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        token: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        newPassword: {
            required: true,
            validations: [
                lengthGreaterThanCondition(7),
                lengthSmallerThanCondition(129),
            ],
            requiredValidation: requiredStringCondition,
        },
        confirmPassword: {
            required: true,
            validations: [
                lengthGreaterThanCondition(7),
                lengthSmallerThanCondition(129),
                samePasswordCondition,
            ],
            requiredValidation: requiredStringCondition,
            forceValue: undefinedValue,
        },
    }),
};

interface LocationState {
    uuid?: string;
    token?: string;
}

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const elementRef = useRef<Captcha>(null);

    const location = useLocation();
    const locationState = location?.state as LocationState | undefined;

    const initialValue = useMemo((): PartialFormType => {
        if (isDefined(locationState?.uuid) && isDefined(locationState?.token)) {
            return ({
                uuid: locationState?.uuid,
                token: locationState?.token,
            });
        }
        return ({
            uuid: undefined,
            token: undefined,
        });
    }, [
        locationState?.token,
        locationState?.uuid,
    ]);

    const alert = useAlert();
    const navigate = useNavigate();

    const [
        resetPasswordTrigger,
        { loading: resetPasswordPending },
    ] = useMutation<ResetPasswordConfirmMutation, ResetPasswordConfirmMutationVariables>(
        RESET_PASSWORD_CONFIRM,
        {
            onCompleted: (resetResponse) => {
                const response = resetResponse?.public?.passwordResetConfirm;
                if (!response) {
                    return;
                }
                if (response.ok) {
                    alert.show(
                        'Password changed successfully!',
                        { variant: 'success' },
                    );
                    navigate('/login');
                } else {
                    alert.show(
                        'Failed to change password!',
                        { variant: 'error' },
                    );
                }
            },
            onError: () => {
                alert.show(
                    'Failed to change password!',
                    { variant: 'error' },
                );
            },
        },
    );

    const {
        // FIXME: use pristine on submit value
        pristine,
        validate,
        value,
        error,
        setFieldValue,
        setError,
    } = useForm(schema, { value: initialValue });

    const handleSubmit = useCallback(() => {
        const handler = createSubmitHandler(
            validate,
            setError,
            (val) => {
                elementRef.current?.resetCaptcha();
                // eslint-disable-next-line no-console
                console.log('submit value', val);
                resetPasswordTrigger({
                    variables: {
                        input: val as PasswordResetConfirmInput,
                    },
                });
            },
        );

        handler();
    }, [
        resetPasswordTrigger,
        validate,
        setError,
    ]);

    const safeError = getErrorObject(error);

    return (
        <div className={styles.resetPassword}>
            <div className={styles.logoContainer}>
                <img
                    src="/logo.png"
                    className={styles.logo}
                    alt="Questionnaire Builder Logo"
                />
            </div>
            <form className={styles.fields}>
                <NonFieldError error={error} />
                <Header
                    heading="Reset password"
                    headingSize="small"
                />
                <PasswordInput
                    name="newPassword"
                    type="password"
                    value={value.newPassword}
                    error={safeError?.newPassword}
                    onChange={setFieldValue}
                    placeholder="Enter new password"
                />
                <PasswordInput
                    name="confirmPassword"
                    value={value.confirmPassword}
                    error={safeError?.confirmPassword}
                    onChange={setFieldValue}
                    placeholder="Confirm password"
                />
                <HCaptcha
                    name="captcha"
                    elementRef={elementRef}
                    siteKey={hCaptchaKey}
                    // value={value.captcha}
                    onChange={setFieldValue}
                />
                <Button
                    name={undefined}
                    type="submit"
                    disabled={pristine || resetPasswordPending}
                    onClick={handleSubmit}
                >
                    Reset password
                </Button>
            </form>
        </div>
    );
}

Component.displayName = 'ResetPassword';
