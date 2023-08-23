import { useCallback, useMemo } from 'react';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';
import {
    Button,
    TextInput,
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
    requiredStringCondition,
    getErrorObject,
    useForm,
    PartialForm,
} from '@togglecorp/toggle-form';

import {
    CreateDateQuestionMutation,
    CreateDateQuestionMutationVariables,
    UpdateDateQuestionMutation,
    UpdateDateQuestionMutationVariables,
    QuestionInfoQuery,
    QuestionInfoQueryVariables,
    QuestionCreateInput,
    QuestionUpdateInput,
    QuestionTypeEnum,
} from '#generated/types';
import DateQuestionPreview from '#components/questionPreviews/DateQuestionPreview';
import PillarSelectInput from '#components/PillarSelectInput';

import {
    QUESTION_FRAGMENT,
    QUESTION_INFO,
} from '../queries.ts';
import styles from './index.module.css';

const CREATE_DATE_QUESTION = gql`
    ${QUESTION_FRAGMENT}
    mutation CreateDateQuestion(
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

const UPDATE_DATE_QUESTION = gql`
    ${QUESTION_FRAGMENT}
    mutation UpdateDateQuestion(
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
    questionId?: string;
}

function DateQuestionForm(props: Props) {
    const {
        projectId,
        questionnaireId,
        questionId,
    } = props;

    const alert = useAlert();

    const initialFormValue: FormType = {
        type: 'DATE' as QuestionTypeEnum,
        questionnaire: questionnaireId,
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
                const questionResponse = response.private.projectScope?.question;
                setValue({
                    name: questionResponse?.name,
                    type: questionResponse?.type,
                    questionnaire: questionResponse?.questionnaireId,
                    label: questionResponse?.label,
                    group: questionResponse?.groupId,
                    hint: questionResponse?.hint,
                });
            },
        },
    );

    const [
        triggerQuestionCreate,
        { loading: createQuestionPending },
    ] = useMutation<CreateDateQuestionMutation, CreateDateQuestionMutationVariables>(
        CREATE_DATE_QUESTION,
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

    const [
        triggerQuestionUpdate,
        { loading: updateQuestionPending },
    ] = useMutation<UpdateDateQuestionMutation, UpdateDateQuestionMutationVariables>(
        UPDATE_DATE_QUESTION,
        {
            onCompleted: (questionResponse) => {
                const response = questionResponse?.private?.projectScope?.updateQuestion;
                if (!response) {
                    return;
                }
                if (response.ok) {
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
            <DateQuestionPreview
                className={styles.preview}
                label={formValue.label}
                hint={formValue.hint}
            />
            <div className={styles.separator} />
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
                    label="Question hint"
                    value={formValue.hint}
                    error={fieldError?.hint}
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

export default DateQuestionForm;
