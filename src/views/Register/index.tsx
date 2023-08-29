import { useRef, useCallback } from 'react';
import {
    TextInput,
    Header,
    Button,
    ButtonLikeLink,
    useAlert,
} from '@the-deep/deep-ui';
import {
    ObjectSchema,
    emailCondition,
    getErrorObject,
    requiredStringCondition,
    useForm,
    createSubmitHandler,
    PartialForm,
} from '@togglecorp/toggle-form';
import { useMutation, gql } from '@apollo/client';
import Captcha from '@hcaptcha/react-hcaptcha';

import HCaptcha from '#components/HCaptcha';
import NonFieldError from '#components/NonFieldError';
import { hCaptchaKey } from '#configs/hCaptcha';
import {
    RegisterMutation,
    RegisterMutationVariables,
    RegisterInput,
} from '#generated/types';

import styles from './index.module.css';

const REGISTER = gql`
    mutation Register($input: RegisterInput!) {
        public {
            register(data: $input) {
                ok
                errors
                result {
                    email
                    firstName
                    id
                    lastName
                    emailOptOuts
                }
            }
        }
    }
`;

type FormType = PartialForm<RegisterInput>;
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
        firstName: {
            required: false,
        },
        lastName: {
            required: false,
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
    const {
        pristine,
        validate,
        value: formValue,
        error: formError,
        setFieldValue,
        setError,
    } = useForm(schema, { value: initialValue });

    const fieldError = getErrorObject(formError);

    const [
        triggerRegister,
        { loading: registerPending },
    ] = useMutation<RegisterMutation, RegisterMutationVariables>(
        REGISTER,
        {
            onCompleted: (registerResponse) => {
                const response = registerResponse?.public?.register;
                if (!response) {
                    return;
                }

                if (response.ok) {
                    alert.show(
                        'Successfully registered!',
                        { variant: 'success' },
                    );
                } else {
                    alert.show(
                        'Failed to register user!',
                        { variant: 'error' },
                    );
                }
            },
            onError: () => {
                alert.show(
                    'Failed to register user!',
                    { variant: 'error' },
                );
            },
        },
    );

    const handleSubmit = useCallback(() => {
        const handler = createSubmitHandler(
            validate,
            setError,
            (val) => {
                elementRef.current?.resetCaptcha();
                triggerRegister({
                    variables: {
                        input: val as RegisterInput,
                    },
                });
            },
        );

        handler();
    }, [
        triggerRegister,
        validate,
        setError,
    ]);

    return (
        <div className={styles.register}>
            <div className={styles.logoContainer}>
                <img
                    src="/logo.png"
                    className={styles.logo}
                    alt="Questionnaire Builder Logo"
                />
            </div>
            <div className={styles.fields}>
                <NonFieldError error={formError} />
                <Header
                    heading="Register"
                    description="First step to creating amazing questionnaires."
                    headingSize="small"
                />
                <TextInput
                    name="firstName"
                    value={formValue?.firstName}
                    error={fieldError?.firstName}
                    onChange={setFieldValue}
                    placeholder="First name"
                />
                <TextInput
                    name="lastName"
                    value={formValue?.lastName}
                    error={fieldError?.lastName}
                    onChange={setFieldValue}
                    placeholder="Last name"
                />
                <TextInput
                    name="email"
                    value={formValue?.email}
                    error={fieldError?.email}
                    onChange={setFieldValue}
                    placeholder="Email"
                />
                <HCaptcha
                    name="captcha"
                    elementRef={elementRef}
                    siteKey={hCaptchaKey}
                    onChange={setFieldValue}
                    error={fieldError?.captcha}
                    disabled={registerPending}
                />
                <Button
                    name={undefined}
                    variant="transparent"
                    spacing="none"
                >
                    forgot password?
                </Button>
                <Button
                    name={undefined}
                    className={styles.button}
                    onClick={handleSubmit}
                    disabled={pristine || registerPending}
                >
                    Register
                </Button>
                <div className={styles.footnote}>
                    Already have an account?
                    <ButtonLikeLink
                        className={styles.footnoteButton}
                        variant="transparent"
                        to="/login"
                        spacing="none"
                    >
                        Login
                    </ButtonLikeLink>
                    now
                </div>
            </div>
        </div>
    );
}

Component.displayName = 'Register';
