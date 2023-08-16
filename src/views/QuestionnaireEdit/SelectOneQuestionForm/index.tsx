import { useCallback } from 'react';
import {
    randomString,
} from '@togglecorp/fujs';
import {
    Button,
    SelectInput,
    TextInput,
    useAlert,
} from '@the-deep/deep-ui';
import { gql, useMutation, useQuery } from '@apollo/client';
import {
    ObjectSchema,
    createSubmitHandler,
    requiredStringCondition,
    getErrorObject,
    useForm,
    PartialForm,
} from '@togglecorp/toggle-form';

import {
    CreateTextQuestionMutation,
    CreateTextQuestionMutationVariables,
    QuestionCreateInput,
    QuestionTypeEnum,
    OptionsQuery,
    OptionsQueryVariables,
} from '#generated/types';
import SelectOneQuestionPreview from '#components/questionPreviews/SelectOneQuestionPreview';

import styles from './index.module.css';

const CREATE_TEXT_QUESTION = gql`
    mutation CreateTextQuestion(
        $projectId: ID!,
        $input: QuestionCreateInput!,
    ){
        private {
            projectScope(pk: $projectId) {
                createQuestion(
                    data: $input,
                ) {
                    ok
                    errors
                }
            }
        }
    }
`;

const OPTIONS = gql`
    query Options (
        $projectId: ID!,
        $questionnaireId: ID!,
    ){
        private {
            projectScope(pk: $projectId) {
                choiceCollections(filters: {questionnaire: {pk: $questionnaireId}}) {
                    items {
                        id
                        label
                        name
                        questionnaireId
                    }
                }
            }
        }
    }
`;

type FormType = PartialForm<QuestionCreateInput>;
type FormSchema = ObjectSchema<FormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        name: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        type: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        questionnaire: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        label: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        hint: {},
    }),
};

interface Props {
    projectId: string;
    questionnaireId: string;
}

function SelectOneQuestionForm(props: Props) {
    const {
        projectId,
        questionnaireId,
    } = props;

    const alert = useAlert();

    const {
        data: optionsResponse,
        loading: optionsLoading,
    } = useQuery<OptionsQuery, OptionsQueryVariables>(
        OPTIONS,
    );

    console.warn('optionssss', optionsResponse?.private?.projectScope?.choiceCollections?.items);

    const [
        triggerQuestionCreate,
        { loading: createQuestionPending },
    ] = useMutation<CreateTextQuestionMutation, CreateTextQuestionMutationVariables>(
        CREATE_TEXT_QUESTION,
        {
            onCompleted: (questionResponse) => {
                const response = questionResponse?.private?.projectScope?.createQuestion;
                if (!response) {
                    return;
                }
                if (response.ok) {
                    alert.show(
                        'Question created successfully.',
                        { variant: 'success' },
                    );
                } else {
                    alert.show(
                        'Failed to create question.',
                        { variant: 'error' },
                    );
                }
            },
            onError: () => {
                alert.show(
                    'Failed to create question.',
                    { variant: 'error' },
                );
            },
        },
    );
    const initialFormValue: FormType = {
        type: 'SELECT_ONE' as QuestionTypeEnum,
        questionnaire: questionnaireId,
        name: randomString(),
    };

    const {
        pristine,
        validate,
        value: formValue,
        error: formError,
        setFieldValue,
        setError,
    } = useForm(schema, { value: initialFormValue });

    const fieldError = getErrorObject(formError);

    const handleQuestionSubmit = useCallback(() => {
        const handler = createSubmitHandler(
            validate,
            setError,
            (valueFromForm) => {
                triggerQuestionCreate({
                    variables: {
                        projectId,
                        input: valueFromForm as QuestionCreateInput,
                    },
                });
            },
        );
        handler();
    }, [
        triggerQuestionCreate,
        projectId,
        setError,
        validate,
    ]);

    return (
        <form className={styles.question}>
            <SelectOneQuestionPreview
                className={styles.preview}
                label={formValue.label}
                hint={formValue.hint}
            />
            <div className={styles.editSection}>
                <SelectInput
                    name="label"
                    label="Change Question type"
                    value={formValue.label}
                    error={fieldError?.label}
                    onChange={setFieldValue}
                />
                <TextInput
                    name="label"
                    label="Question label"
                    value={formValue.label}
                    error={fieldError?.label}
                    onChange={setFieldValue}
                />
                <TextInput
                    name="hint"
                    label="Hint"
                    value={formValue.hint}
                    error={fieldError?.hint}
                    onChange={setFieldValue}
                />
                <>Options</>
                <SelectInput
                    name="label"
                    label="Change Question type"
                    value={formValue.label}
                    error={fieldError?.label}
                    onChange={setFieldValue}
                />
            </div>
            <Button
                name={undefined}
                className={styles.button}
                onClick={handleQuestionSubmit}
                disabled={pristine || createQuestionPending}
            >
                Apply
            </Button>
        </form>
    );
}

export default SelectOneQuestionForm;
