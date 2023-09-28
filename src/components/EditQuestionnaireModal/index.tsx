import { useCallback, useMemo } from 'react';
import { isDefined, isNotDefined } from '@togglecorp/fujs';
import { gql, useMutation, useQuery } from '@apollo/client';
import {
    Button,
    Modal,
    MultiSelectInput,
    NumberInput,
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
    EditQuestionnaireMutation,
    EditQuestionnaireMutationVariables,
    QuestionnaireDetailQuery,
    QuestionnaireDetailQueryVariables,
    QuestionnaireCreateInput,
    QuestionnaireMetadataQuery,
    QuestionnaireMetadataQueryVariables,
} from '#generated/types';
import {
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';

import styles from './index.module.css';

const CREATE_QUESTIONNAIRE = gql`
    mutation CreateQuestionnaire(
        $projectId: ID!,
        $input: QuestionnaireCreateInput!,
    ) {
        private {
            id
            projectScope(pk: $projectId) {
                id
                createQuestionnaire(data: $input) {
                    errors
                    ok
                }
            }
        }
    }
`;

const EDIT_QUESTIONNAIRE = gql`
    mutation EditQuestionnaire(
        $projectId: ID!,
        $questionnaireId: ID!,
        $input: QuestionnaireUpdateInput!,
    ) {
        private {
            id
            projectScope(pk: $projectId) {
                id
                updateQuestionnaire(data: $input, id: $questionnaireId) {
                    errors
                    ok
                    result {
                        id
                        title
                    }
                }
            }
        }
    }
`;

const QUESTIONNAIRE_DETAIL = gql`
    query QuestionnaireDetail(
        $projectId: ID!,
        $questionnaireId: ID!,
    ) {
        private {
            id
            projectScope(pk: $projectId) {
                id
                questionnaire(pk: $questionnaireId) {
                    id
                    title
                    projectId
                    createdAt
                    dataCollectionMethods
                    dataCollectionMethodsDisplay
                    enumeratorSkills
                    enumeratorSkillsDisplay
                    priorityLevels
                    priorityLevelsDisplay
                    requiredDuration
                }
            }
        }
    }
`;

const QUESTIONNAIRE_METADATA = gql`
    query QuestionnaireMetadata {
        enums {
            QuestionnaireEnumeratorSkills {
                key
                label
            }
            QuestionnairePriorityLevels {
                key
                label
            }
            QuestionnaireDataCollectionMethods {
                key
                label
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
        dataCollectionMethods: {},
        enumeratorSkills: {},
        priorityLevels: {},
        requiredDuration: {},
    }),
};

interface Props {
    onClose: () => void;
    projectId: string;
    onSuccess: () => void;
    questionnaireId?: string,
}

function EditQuestionnaireModal(props: Props) {
    const {
        onClose,
        projectId,
        onSuccess,
        questionnaireId,
    } = props;

    const alert = useAlert();

    const editMode = isDefined(questionnaireId);

    const questionnaireVariables = useMemo(() => {
        if (isNotDefined(projectId) || isNotDefined(questionnaireId)) {
            return undefined;
        }
        return ({
            projectId,
            questionnaireId,
        });
    }, [
        projectId,
        questionnaireId,
    ]);

    const initialValue: FormType = {};

    const {
        pristine,
        validate,
        value: formValue,
        error: formError,
        setFieldValue,
        setError,
        setValue,
    } = useForm(schema, { value: initialValue });

    const error = getErrorObject(formError);

    const {
        data: metadataOptions,
        loading: metadataOptionsPending,
    } = useQuery<QuestionnaireMetadataQuery, QuestionnaireMetadataQueryVariables>(
        QUESTIONNAIRE_METADATA,
    );

    useQuery<QuestionnaireDetailQuery, QuestionnaireDetailQueryVariables>(
        QUESTIONNAIRE_DETAIL,
        {
            skip: !editMode,
            variables: questionnaireVariables,
            onCompleted: (response) => {
                const questionnaireDetails = response?.private?.projectScope?.questionnaire;
                setValue({
                    title: questionnaireDetails?.title,
                    priorityLevels: questionnaireDetails?.priorityLevels,
                    enumeratorSkills: questionnaireDetails?.enumeratorSkills,
                    dataCollectionMethods: questionnaireDetails?.dataCollectionMethods,
                    requiredDuration: questionnaireDetails?.requiredDuration,
                });
            },
        },
    );

    const [
        triggerQuestionnaireCreate,
        { loading: questionnaireCreatePending },
    ] = useMutation<CreateQuestionnaireMutation, CreateQuestionnaireMutationVariables>(
        CREATE_QUESTIONNAIRE,
        {
            onCompleted: (res) => {
                const response = res?.private?.projectScope?.createQuestionnaire;
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

    const [
        triggerQuestionnaireUpdate,
        { loading: questionnaireUpdatePending },
    ] = useMutation<EditQuestionnaireMutation, EditQuestionnaireMutationVariables>(
        EDIT_QUESTIONNAIRE,
        {
            onCompleted: (questionnaireResponse) => {
                const response = questionnaireResponse?.private?.projectScope?.updateQuestionnaire;
                if (!response) {
                    return;
                }
                if (response.ok) {
                    setValue({
                        title: response.result?.title,
                    });
                    onSuccess();
                    onClose();
                    alert.show(
                        'Questionnaire updated successfully.',
                        { variant: 'success' },
                    );
                } else {
                    alert.show(
                        'Failed to update questionnaire',
                        { variant: 'error' },
                    );
                }
            },
            onError: () => {
                alert.show(
                    'Failed to update questionnaire',
                    { variant: 'error' },
                );
            },
        },
    );

    const priorityLevelOptions = metadataOptions?.enums.QuestionnairePriorityLevels;
    const skillOptions = metadataOptions?.enums.QuestionnaireEnumeratorSkills;
    const collectionMethodOptions = metadataOptions?.enums.QuestionnaireDataCollectionMethods;

    const handleSubmit = useCallback(() => {
        const handler = createSubmitHandler(
            validate,
            setError,
            (val) => {
                if (editMode) {
                    triggerQuestionnaireUpdate({
                        variables: {
                            projectId,
                            questionnaireId,
                            input: val,
                        },
                    });
                } else {
                    triggerQuestionnaireCreate({
                        variables: {
                            projectId,
                            input: val as QuestionnaireCreateInput,
                        },
                    });
                }
            },
        );

        handler();
    }, [
        editMode,
        setError,
        questionnaireId,
        projectId,
        triggerQuestionnaireCreate,
        triggerQuestionnaireUpdate,
        validate,
    ]);

    return (
        <Modal
            onCloseButtonClick={onClose}
            heading="Create Questionnaire"
            bodyClassName={styles.modalBody}
            freeHeight
            size="small"
            footerActions={(
                <Button
                    name={undefined}
                    onClick={handleSubmit}
                    disabled={
                        pristine
                        || (editMode ? questionnaireUpdatePending : questionnaireCreatePending)
                    }
                >
                    Save
                </Button>
            )}
        >
            <TextInput
                name="title"
                label="Title"
                placeholder="Questionnaire Title"
                value={formValue?.title}
                error={error?.title}
                onChange={setFieldValue}
                autoFocus
            />
            <MultiSelectInput
                name="priorityLevels"
                value={formValue?.priorityLevels}
                onChange={setFieldValue}
                error={error?.priorityLevels}
                label="Priority Levels"
                options={priorityLevelOptions}
                keySelector={enumKeySelector}
                labelSelector={enumLabelSelector}
                optionsPending={metadataOptionsPending}
            />
            <MultiSelectInput
                name="dataCollectionMethods"
                value={formValue?.dataCollectionMethods}
                onChange={setFieldValue}
                error={error?.dataCollectionMethods}
                label="Data Collection Method"
                options={collectionMethodOptions}
                keySelector={enumKeySelector}
                labelSelector={enumLabelSelector}
                optionsPending={metadataOptionsPending}
            />
            <MultiSelectInput
                name="enumeratorSkills"
                value={formValue?.enumeratorSkills}
                onChange={setFieldValue}
                error={error?.enumeratorSkills}
                label="Enumerator Skills"
                options={skillOptions}
                keySelector={enumKeySelector}
                labelSelector={enumLabelSelector}
                optionsPending={metadataOptionsPending}
            />
            <NumberInput
                label="Maximum duration (in minutes)"
                name="requiredDuration"
                value={formValue?.requiredDuration}
                error={error?.requiredDuration}
                onChange={setFieldValue}
            />
        </Modal>
    );
}

export default EditQuestionnaireModal;
