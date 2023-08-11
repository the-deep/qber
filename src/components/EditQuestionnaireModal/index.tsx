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
    CreateQuestionnaireMutation,
    CreateQuestionnaireMutationVariables,
    QuestionnaireCreateInput,
} from '#generated/types';

const CREATE_QUESTIONNAIRE = gql`
    mutation CreateQuestionnaire(
        $projectId: ID!,
        $input: QuestionnaireCreateInput!,
    ) {
        private {
            projectScope(pk: $projectId) {
                createQuestionnaire(data: $input) {
                    errors
                    ok
                }
            }
        }
    }
`;

type FormType = PartialForm<QuestionnaireCreateInput>;
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

const initialValue: FormType = {};

interface Props {
    onClose: () => void;
    projectId: string;
    onSuccess: () => void;
    // editMode: boolean,
}

function EditQuestionnaireModal(props: Props) {
    const {
        onClose,
        projectId,
        onSuccess,
        // editMode,
    } = props;

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
        triggerQuestionnaireCreate,
        { loading: questionnaireCreatePending },
    ] = useMutation<CreateQuestionnaireMutation, CreateQuestionnaireMutationVariables>(
        CREATE_QUESTIONNAIRE,
        {
            onCompleted: (questionnaireResponse) => {
                const response = questionnaireResponse?.private?.projectScope?.createQuestionnaire;
                if (!response) {
                    return;
                }
                if (response.ok) {
                    onSuccess();
                    onClose();
                    alert.show(
                        'Questionnaire created successfully.',
                        { variant: 'success' },
                    );
                } else {
                    alert.show(
                        'Failed to create questionnaire',
                        { variant: 'error' },
                    );
                }
            },
            onError: () => {
                alert.show(
                    'Failed to create questionnaire',
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
                triggerQuestionnaireCreate({
                    variables: {
                        projectId,
                        input: {
                            title: val.title ?? '',
                        },
                    },
                });
            },
        );

        handler();
    }, [
        setError,
        projectId,
        triggerQuestionnaireCreate,
        validate,
    ]);

    return (
        <Modal
            onCloseButtonClick={onClose}
            heading="Create Questionnaire"
            freeHeight
            size="small"
            footerActions={(
                <Button
                    name={undefined}
                    onClick={handleSubmit}
                    disabled={pristine || questionnaireCreatePending}
                >
                    Save
                </Button>
            )}
        >
            <TextInput
                name="title"
                placeholder="Questionnaire Title"
                value={formValue?.title}
                error={fieldError?.title}
                onChange={setFieldValue}
            />
        </Modal>
    );
}

export default EditQuestionnaireModal;
