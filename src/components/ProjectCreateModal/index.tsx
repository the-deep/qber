import { useCallback } from 'react';
import { gql, useMutation } from '@apollo/client';
import {
    Modal,
    Button,
    TextInput,
    useAlert,
} from '@the-deep/deep-ui';
import {
    ObjectSchema,
    createSubmitHandler,
    requiredStringCondition,
    getErrorObject,
    useForm,
    PartialForm,
} from '@togglecorp/toggle-form';

import {
    CreateProjectMutation,
    CreateProjectMutationVariables,
    ProjectCreateInput,
} from '#generated/types';

const CREATE_PROJECT = gql`
    mutation CreateProject(
        $input: ProjectCreateInput!,
    ) {
        private {
            id
            createProject(data: $input) {
                errors
                ok
            }
        }
    }
`;

type FormType = PartialForm<ProjectCreateInput>;
type FormSchema = ObjectSchema<FormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: () : FormSchemaFields => ({
        title: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
    }),
};

interface Props {
    onClose: () => void;
    onSuccess: () => void;
}

const initialFormValue: FormType = {};

function ProjectEditModal(props: Props) {
    const {
        onClose,
        onSuccess,
    } = props;

    const alert = useAlert();

    const {
        pristine,
        validate,
        value: formValue,
        error: formError,
        setFieldValue,
        setError,
    } = useForm(schema, { value: initialFormValue });

    const fieldError = getErrorObject(formError);

    const [
        triggerProjectCreate,
        { loading: projectCreatePending },
    ] = useMutation<CreateProjectMutation, CreateProjectMutationVariables>(
        CREATE_PROJECT,
        {
            onCompleted: (projectResponse) => {
                const response = projectResponse?.private?.createProject;
                if (!response) {
                    return;
                }
                if (response.ok) {
                    onSuccess();
                    onClose();
                    alert.show(
                        'Project created successfully.',
                        { variant: 'success' },
                    );
                } else {
                    alert.show(
                        'Failed to create project.',
                        { variant: 'error' },
                    );
                }
            },
            onError: () => {
                alert.show(
                    'Failed to create project.',
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
                triggerProjectCreate({
                    variables: {
                        input: val as ProjectCreateInput,
                    },
                });
            },
        );

        handler();
    }, [
        setError,
        triggerProjectCreate,
        validate,
    ]);

    return (
        <Modal
            onCloseButtonClick={onClose}
            heading="Create Project"
            freeHeight
            size="small"
            footerActions={(
                <Button
                    name={undefined}
                    onClick={handleSubmit}
                    disabled={
                        pristine
                        || projectCreatePending
                    }
                >
                    Save
                </Button>
            )}
        >
            <TextInput
                name="title"
                placeholder="Project Title"
                value={formValue?.title}
                error={fieldError?.title}
                onChange={setFieldValue}
            />
        </Modal>
    );
}

export default ProjectEditModal;
