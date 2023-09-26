import {
    useCallback,
    useMemo,
    useState,
} from 'react';
import {
    isDefined,
    isNotDefined,
    _cs,
} from '@togglecorp/fujs';
import {
    Button,
    Checkbox,
    Footer,
    Tabs,
    TabPanel,
    TabList,
    Tab,
    TextArea,
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
    removeNull,
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
    QberQuestionTypeEnum,
} from '#generated/types';
import PillarSelectInput from '#components/PillarSelectInput';
import MetaDataInputs from '#components/MetaDataInputs';

import {
    QUESTION_FRAGMENT,
    QUESTION_INFO,
} from '../queries.ts';
import { type QuestionTabType } from '..';
import checkTabErrors from '../utils';

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
        leafGroup: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        hint: {
            defaultValue: '',
        },
        required: {
            defaultValue: false,
        },
        enumeratorSkill: {},
        dataCollectionMethod: {},
        priorityLevel: {},
        requiredDuration: {},
        constraint: {
            defaultValue: '',
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

function DateQuestionForm(props: Props) {
    const {
        projectId,
        questionnaireId,
        questionId,
        onSuccess,
        selectedLeafGroupId,
    } = props;

    const alert = useAlert();

    const [
        activeQuestionTab,
        setActiveQuestionTab,
    ] = useState<QuestionTabType | undefined>('general');

    const initialFormValue: FormType = {
        type: 'DATE' as QberQuestionTypeEnum,
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
                    required: questionResponse?.required,
                    requiredDuration: questionResponse?.requiredDuration,
                    priorityLevel: questionResponse?.priorityLevel,
                    dataCollectionMethod: questionResponse?.dataCollectionMethod,
                    enumeratorSkill: questionResponse?.enumeratorSkill,
                    constraint: questionResponse?.constraint,
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
    ] = useMutation<UpdateDateQuestionMutation, UpdateDateQuestionMutationVariables>(
        UPDATE_DATE_QUESTION,
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
                <Tabs
                    value={activeQuestionTab}
                    onChange={setActiveQuestionTab}
                    variant="secondary"
                >
                    <TabList className={styles.tabs}>
                        <Tab
                            activeClassName={styles.active}
                            className={_cs(
                                styles.tabItem,
                                checkTabErrors(formError, 'general') && styles.errored,
                            )}
                            name="general"
                        >
                            {checkTabErrors(formError, 'general')
                                ? 'Question Settings*'
                                : 'Question Settings'}
                        </Tab>
                        <Tab
                            activeClassName={styles.active}
                            className={_cs(
                                styles.tabItem,
                                checkTabErrors(formError, 'metadata') && styles.errored,
                            )}
                            name="metadata"
                        >
                            {checkTabErrors(formError, 'metadata')
                                ? 'Metadata*'
                                : 'Metadata'}
                        </Tab>
                    </TabList>
                    <TabPanel
                        className={styles.fields}
                        name="general"
                    >
                        <TextInput
                            name="label"
                            label="Question Label"
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
                        <TextInput
                            name="name"
                            label="Name"
                            value={formValue.name}
                            error={fieldError?.name}
                            onChange={setFieldValue}
                        />
                        <TextArea
                            name="constraint"
                            label="Conditionality"
                            value={formValue?.constraint}
                            error={fieldError?.constraint}
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
                        <Checkbox
                            name="required"
                            label="Make question mandatory"
                            onChange={setFieldValue}
                            value={formValue.required}
                        />
                    </TabPanel>
                    <TabPanel
                        className={styles.fields}
                        name="metadata"
                    >
                        <MetaDataInputs
                            onChange={setFieldValue}
                            value={formValue}
                            error={fieldError}
                        />
                    </TabPanel>
                </Tabs>
            </div>
            <Footer
                actions={(
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
                        {isDefined(questionId) ? 'Save' : 'Create'}
                    </Button>
                )}
            />
        </form>
    );
}

export default DateQuestionForm;
