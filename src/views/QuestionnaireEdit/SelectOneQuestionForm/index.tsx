import { useCallback } from 'react';
import {
    randomString,
} from '@togglecorp/fujs';
import {
    gql,
    useMutation,
} from '@apollo/client';
import {
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
    QuestionCreateInput,
    QuestionTypeEnum,
    CreateSingleSelectionQuestionMutation,
    CreateSingleSelectionQuestionMutationVariables,
} from '#generated/types';
import SelectOneQuestionPreview from '#components/questionPreviews/SelectOneQuestionPreview';
import PillarSelectInput from '#components/PillarSelectInput';
import ChoiceCollectionSelectInput from '#components/ChoiceCollectionSelectInput';

import styles from './index.module.css';

const CREATE_SINGLE_SELECTION_QUESTION = gql`
    mutation CreateSingleSelectionQuestion(
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
        choiceCollection: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        group: {
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
    const [
        triggerQuestionCreate,
        { loading: createQuestionPending },
    ] = useMutation<
        CreateSingleSelectionQuestionMutation,
        CreateSingleSelectionQuestionMutationVariables
    >(
        CREATE_SINGLE_SELECTION_QUESTION,
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
                choiceCollectionId={formValue?.choiceCollection}
                projectId={projectId}
            />
            <div className={styles.editSection}>
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
                <ChoiceCollectionSelectInput
                    name="choiceCollection"
                    value={formValue.choiceCollection}
                    label="Options"
                    onChange={setFieldValue}
                    projectId={projectId}
                    questionnaireId={questionnaireId}
                    error={fieldError?.choiceCollection}
                />
                <PillarSelectInput
                    name="group"
                    projectId={projectId}
                    questionnaireId={questionnaireId}
                    value={formValue.group}
                    error={fieldError?.group}
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