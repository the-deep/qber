import { useRef, useCallback } from 'react';
import { useMutation, gql } from '@apollo/client';
import {
    useAlert,
    TextInput,
    Header,
    Button,
} from '@the-deep/deep-ui';
import {
    ObjectSchema,
    emailCondition,
    getErrorObject,
    requiredStringCondition,
    createSubmitHandler,
    useForm,
    PartialForm,
} from '@togglecorp/toggle-form';
import Captcha from '@hcaptcha/react-hcaptcha';

import HCaptcha from '#components/HCaptcha';
import { hCaptchaKey } from '#configs/hCaptcha';
import {
    PasswordResetTriggerInput,
    ForgotPasswordMutation,
    ForgotPasswordMutationVariables,
} from '#generated/types';

import styles from './index.module.css';

const FORGOT_PASSWORD = gql`
    mutation ForgotPassword(
        $input: PasswordResetTriggerInput!,
    ) {
        public {
            passwordResetTrigger(data: $input) {
                ok
                errors
            }
        }
    }
`;

type FormType = PartialForm<PasswordResetTriggerInput>;
type FormSchema = ObjectSchema<FormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        email: {
            required: true,
            validations: [
                emailCondition,
            ],
            requiredValidation: requiredStringCondition,
        },
        captcha: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
    }),
};

const initialValue: FormType = {};

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const elementRef = useRef<Captcha>(null);
    const alert = useAlert();

    const [
        forgotPasswordTrigger,
        { loading: forgotPasswordPending },
    ] = useMutation<ForgotPasswordMutation, ForgotPasswordMutationVariables>(
        FORGOT_PASSWORD,
        {
            onCompleted: (resetResponse) => {
                const response = resetResponse?.public?.passwordResetTrigger;
                if (!response) {
                    return;
                }
                if (response.ok) {
                    alert.show(
                        'Password changed successfully!',
                        { variant: 'success' },
                    );
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
        value: formValue,
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
                forgotPasswordTrigger({
                    variables: {
                        input: val as PasswordResetTriggerInput,
                    },
                });
            },
        );

        handler();
    }, [
        forgotPasswordTrigger,
        validate,
        setError,
    ]);

    const safeError = getErrorObject(error);

    return (
        <div className={styles.login}>
            <div className={styles.logoContainer}>
                <img
                    src="/logo.png"
                    className={styles.logo}
                    alt="Questionnaire Builder Logo"
                />
            </div>
            <div className={styles.loginForm}>
                <Header
                    heading="Request for password reset"
                    description="A reset password link will be sent to your mail."
                    headingSize="small"
                />
                <TextInput
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={formValue?.email}
                    error={safeError?.email}
                    onChange={setFieldValue}
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
                    className={styles.button}
                    onClick={handleSubmit}
                    disabled={pristine || forgotPasswordPending}
                >
                    Submit
                </Button>
            </div>
        </div>
    );
}

Component.displayName = 'ForgotPassword';
