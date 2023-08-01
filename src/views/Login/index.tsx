import { useCallback } from 'react';
import { useMutation, gql } from '@apollo/client';
import {
    TextInput,
    PasswordInput,
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
    lengthGreaterThanCondition,
    lengthSmallerThanCondition,
    createSubmitHandler,
    useForm,
    PartialForm,
} from '@togglecorp/toggle-form';

import {
    LoginMutation,
    LoginMutationVariables,
    LoginInput,
} from '#generated/types';

import styles from './index.module.css';

const LOGIN = gql`
mutation Login($input: LoginInput!) {
    public {
        login(data: $input) {
            ok
            errors
        }
    }
}
`;

type FormType = PartialForm<LoginInput>;
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
        password: {
            required: true,
            validations: [
                lengthGreaterThanCondition(4),
                lengthSmallerThanCondition(129),
            ],
            requiredValidation: requiredStringCondition,
        },
    }),
};

const initialValue: FormType = {};

// eslint-disable-next-line import/prefer-default-export
export function Component() {
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
        triggerLogin,
        { loading: loginPending },
    ] = useMutation<LoginMutation, LoginMutationVariables>(
        LOGIN,
        {
            onCompleted: (loginResponse) => {
                const response = loginResponse?.public?.login;
                if (!response) {
                    return;
                }
                if (response.ok) {
                    alert.show(
                        'Logged in successfully!',
                        { variant: 'success' },
                    );
                    window.location.reload();
                } else {
                    alert.show(
                        'Failed to log in!',
                        { variant: 'error' },
                    );
                }
            },
            onError: () => {
                alert.show(
                    'Failed to log in!',
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
                triggerLogin({
                    variables: {
                        input: {
                            email: val.email ?? '',
                            password: val.password ?? '',
                        },
                    },
                });
            },
        );

        handler();
    }, [
        setError,
        triggerLogin,
        validate,
    ]);

    return (
        <div className={styles.login}>
            <div className={styles.logoContainer}>
                <img
                    src="/logo.png"
                    className={styles.logo}
                    alt="Questionnaire Builder Logo"
                />
                <div className={styles.tagline}>
                    Lorem ipsum dolor sit amet consectetur.
                    jahsdhjakasdbkjabd jkhdakjhasdkjbnajksd
                    b
                </div>
            </div>
            <div className={styles.loginForm}>
                <Header
                    heading="Login"
                    description="Ready to create some questions? Get Started!"
                    headingSize="small"
                />
                <TextInput
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={formValue?.email}
                    error={fieldError?.email}
                    onChange={setFieldValue}
                />
                <PasswordInput
                    name="password"
                    type="password"
                    placeholder="Password"
                    value={formValue?.password}
                    error={fieldError?.password}
                    onChange={setFieldValue}
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
                    disabled={pristine || loginPending}
                >
                    Login
                </Button>
                <div className={styles.footnote}>
                    Don&apos;t have an account?
                    <ButtonLikeLink
                        className={styles.footnoteButton}
                        variant="transparent"
                        to="/register"
                        spacing="none"
                    >
                        Register
                    </ButtonLikeLink>
                    now
                </div>
            </div>
        </div>
    );
}

Component.displayName = 'Login';
