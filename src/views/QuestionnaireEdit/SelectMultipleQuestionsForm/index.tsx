import { useCallback, useMemo } from 'react';
import {
    isNotDefined,
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
    PillarsQuery,
    PillarsQueryVariables,
    QuestionCreateInput,
    QuestionTypeEnum,
} from '#generated/types';

import styles from './index.module.css';
import SelectMultipleQuestionPreview from '#components/SelectMultipleQuestionsPreview';

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

const PILLARS = gql`
    query Pillars (
        $projectId: ID!
    ) {
        private {
            projectScope(pk: $projectId) {
                groups {
                        items {
                            id
                            name
                            label
                            parentId
                            questionnaireId
                        }
                    limit
                    offset
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

const PAGE_SIZE = 20;

interface Props {
    projectId: string;
    questionnaireId: string;
}

function SelectMultipleQuestionsForm(props: Props) {
    const {
        projectId,
        questionnaireId,
    } = props;

    const alert = useAlert();

    const pillarsVariables = useMemo(() => {
        if (isNotDefined(projectId)) {
            return undefined;
        }
        return ({
            projectId,
            limit: PAGE_SIZE,
            offset: 0,
        });
    }, [
        projectId,
    ]);

    const {
        data: pillarsResponse,
    } = useQuery<PillarsQuery, PillarsQueryVariables>(
        PILLARS,
        {
            variables: pillarsVariables,
        }
    );

    const pillarsOptions = pillarsResponse?.private?.projectScope?.groups.items || [];

    const pillarKeySelector = (data: { id: string }) => data.id;
    const pillarLabelSelector = (data: { label: string }) => data.label;
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
            <SelectMultipleQuestionPreview
                className={styles.preview}
                label={formValue.label}
                hint={formValue.hint}
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
                <>Options</>
                <SelectInput
                    name="label"
                    label="Pillar and Sub pillar"
                    value={formValue.label}
                    error={fieldError?.label}
                    onChange={setFieldValue}
                    keySelector={pillarKeySelector}
                    labelSelector={pillarLabelSelector}
                    options={pillarsOptions}
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

export default SelectMultipleQuestionsForm;
