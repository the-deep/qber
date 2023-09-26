import { useCallback, useMemo } from 'react';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';
import {
    TextInput,
    Button,
    useAlert,
} from '@the-deep/deep-ui';
import {
    gql,
    useMutation,
    useQuery,
} from '@apollo/client';
import {
    ObjectSchema,
    createSubmitHandler,
    removeNull,
    requiredStringCondition,
    getErrorObject,
    useForm,
    PartialForm,
} from '@togglecorp/toggle-form';

import {
    CreateNoteQuestionMutation,
    CreateNoteQuestionMutationVariables,
    UpdateNoteQuestionMutation,
    UpdateNoteQuestionMutationVariables,
    QuestionInfoQuery,
    QuestionInfoQueryVariables,
    QuestionCreateInput,
    QuestionUpdateInput,
    QberQuestionTypeEnum,
} from '#generated/types';
import PillarSelectInput from '#components/PillarSelectInput';

import {
    QUESTION_FRAGMENT,
    QUESTION_INFO,
} from '../queries.ts';
import styles from './index.module.css';

const CREATE_NOTE_QUESTION = gql`
    ${QUESTION_FRAGMENT}
    mutation CreateNoteQuestion(
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
                    result {
                        ...QuestionResponse
                    }
                }
            }
        }
    }
`;

const UPDATE_NOTE_QUESTION = gql`
    ${QUESTION_FRAGMENT}
    mutation UpdateNoteQuestion(
        $projectId: ID!,
        $questionId: ID!,
        $input: QuestionUpdateInput!,
    ) {
        private {
            projectScope(pk: $projectId) {
                updateQuestion (
                    data: $input
                    id: $questionId,
                ) {
                    ok
                    errors
                    result {
                        ...QuestionResponse
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
    fields: () : FormSchemaFields => ({
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
        leafGroup: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
    }),
};

interface Props {
    projectId: string;
    questionnaireId: string;
    questionId?: string;
    onSuccess: (questionId: string | undefined) => void;
    selectedLeafGroupId: string;
}

function NoteQuestionForm(props: Props) {
    const {
        projectId,
        questionnaireId,
        questionId,
        onSuccess,
        selectedLeafGroupId,
    } = props;

    const alert = useAlert();

    const initialFormValue: FormType = {
        type: 'NOTE' as QberQuestionTypeEnum,
        questionnaire: questionnaireId,
        leafGroup: selectedLeafGroupId,
    };

    const {
        pristine,
        validate,
        value: formValue,
        error: formError,
        setFieldValue,
        setValue,
        setError,
    } = useForm(schema, { value: initialFormValue });

    const fieldError = getErrorObject(formError);

    const questionInfoVariables = useMemo(() => {
        if (isNotDefined(projectId) || isNotDefined(questionId)) {
            return undefined;
        }
        return ({
            projectId,
            questionId,
        });
    }, [
        projectId,
        questionId,
    ]);

    useQuery<QuestionInfoQuery, QuestionInfoQueryVariables>(
        QUESTION_INFO,
        {
            skip: isNotDefined(questionInfoVariables),
            variables: questionInfoVariables,
            onCompleted: (response) => {
                const questionResponse = removeNull(response.private.projectScope?.question);
                setValue({
                    name: questionResponse?.name,
                    type: questionResponse?.type,
                    questionnaire: questionResponse?.questionnaireId,
                    label: questionResponse?.label,
                    leafGroup: questionResponse?.leafGroupId,
                    hint: questionResponse?.hint,
                });
            },
        },
    );

    const [
        triggerQuestionCreate,
        { loading: createQuestionPending },
    ] = useMutation<CreateNoteQuestionMutation, CreateNoteQuestionMutationVariables>(
        CREATE_NOTE_QUESTION,
        {
            onCompleted: (questionResponse) => {
                const response = questionResponse?.private?.projectScope?.createQuestion;
                if (!response) {
                    return;
                }
                if (response.ok) {
                    onSuccess(response.result?.id);
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

    const [
        triggerQuestionUpdate,
        { loading: updateQuestionPending },
    ] = useMutation<UpdateNoteQuestionMutation, UpdateNoteQuestionMutationVariables>(
        UPDATE_NOTE_QUESTION,
        {
            onCompleted: (questionResponse) => {
                const response = questionResponse?.private?.projectScope?.updateQuestion;
                if (!response) {
                    return;
                }
                if (response.ok) {
                    onSuccess(response.result?.id);
                    alert.show(
                        'Question updated successfully.',
                        { variant: 'success' },
                    );
                } else {
                    alert.show(
                        'Failed to update question.',
                        { variant: 'error' },
                    );
                }
            },
            onError: () => {
                alert.show(
                    'Failed to update question.',
                    { variant: 'error' },
                );
            },
        },
    );

    const handleQuestionSubmit = useCallback(() => {
        const handler = createSubmitHandler(
            validate,
            setError,
            (valueFromForm) => {
                if (isDefined(questionId)) {
                    triggerQuestionUpdate({
                        variables: {
                            projectId,
                            questionId,
                            input: valueFromForm as QuestionUpdateInput,
                        },
                    });
                } else {
                    triggerQuestionCreate({
                        variables: {
                            projectId,
                            input: valueFromForm as QuestionCreateInput,
                        },
                    });
                }
            },
        );
        handler();
    }, [
        triggerQuestionCreate,
        triggerQuestionUpdate,
        questionId,
        projectId,
        setError,
        validate,
    ]);

    return (
        <form className={styles.question}>
            <div className={styles.editSection}>
                <TextInput
                    name="label"
                    label="Question label"
                    value={formValue.label}
                    error={fieldError?.label}
                    onChange={setFieldValue}
                />
                <TextInput
                    name="name"
                    label="Question name"
                    value={formValue.name}
                    error={fieldError?.name}
                    onChange={setFieldValue}
                />
                <PillarSelectInput
                    name="leafGroup"
                    projectId={projectId}
                    questionnaireId={questionnaireId}
                    value={selectedLeafGroupId}
                    error={fieldError?.leafGroup}
                    onChange={setFieldValue}
                    disabled
                />
            </div>
            <Button
                name={undefined}
                className={styles.button}
                onClick={handleQuestionSubmit}
                disabled={
                    pristine
                    || (isDefined(questionId)
                        ? updateQuestionPending
                        : createQuestionPending)
                }
            >
                Apply
            </Button>
        </form>
    );
}

export default NoteQuestionForm;
