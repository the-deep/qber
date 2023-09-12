import { useCallback, useMemo } from 'react';
import { isDefined, isNotDefined } from '@togglecorp/fujs';
import { gql, useMutation, useQuery } from '@apollo/client';
import {
    Modal,
    Button,
    TextInput,
    SelectInput,
    NumberInput,
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
    QuestionnarePriorityLevelTypeEnum,
    QuestionnareEnumeratorSkillTypeEnum,
    QuestionnareDataCollectionMethodTypeEnum,
} from '#generated/types';

import {
    EnumOptions,
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
            projectScope(pk: $projectId) {
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
            projectScope(pk: $projectId) {
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
            projectScope(pk: $projectId) {
                questionnaire(pk: $questionnaireId) {
                    id
                    title
                    projectId
                    createdAt
                    dataCollectionMethod
                    dataCollectionMethodDisplay
                    enumeratorSkill
                    enumeratorSkillDisplay
                    priorityLevelDisplay
                    priorityLevel
                    requiredDuration
                }
            }
        }
    }
`;

const QUESTIONNAIRE_METADATA = gql`
    query QuestionnaireMetadata {
        questionnarePriorityLevelTypeOptions: __type(name: "QuestionnarePriorityLevelTypeEnum") {
            enumValues {
                name
                description
            }
        }
        questionnareEnumeratorSkillTypeOptions: __type(name: "QuestionnareEnumeratorSkillTypeEnum") {
            enumValues {
                name
                description
            }
        }
        questionnareDataCollectionMethodTypeOptions: __type(name: "QuestionnareDataCollectionMethodTypeEnum") {
            enumValues {
                name
                description
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
        dataCollectionMethod: {},
        enumeratorSkill: {},
        priorityLevel: {},
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

    const fieldError = getErrorObject(formError);

    useQuery<QuestionnaireDetailQuery, QuestionnaireDetailQueryVariables>(
        QUESTIONNAIRE_DETAIL,
        {
            skip: !editMode,
            variables: questionnaireVariables,
            onCompleted: (response) => {
                const questionnaireDetails = response?.private?.projectScope?.questionnaire;
                setValue({
                    title: questionnaireDetails?.title,
                    priorityLevel: questionnaireDetails?.priorityLevel,
                    enumeratorSkill: questionnaireDetails?.enumeratorSkill,
                    dataCollectionMethod: questionnaireDetails?.dataCollectionMethod,
                    requiredDuration: questionnaireDetails?.requiredDuration,
                });
            },
        },
    );

    const {
        data: metadataResponse,
    } = useQuery<QuestionnaireMetadataQuery, QuestionnaireMetadataQueryVariables>(
        QUESTIONNAIRE_METADATA,
    );

    const priorityLevelOptions = metadataResponse?.questionnarePriorityLevelTypeOptions?.enumValues;
    const enumeratorSkillOptions = metadataResponse
        ?.questionnareEnumeratorSkillTypeOptions?.enumValues;
    const dataCollectionMethods = metadataResponse
        ?.questionnareDataCollectionMethodTypeOptions?.enumValues;

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
                error={fieldError?.title}
                onChange={setFieldValue}
                autoFocus
            />
            <SelectInput
                name="priorityLevel"
                label="Priority Level"
                onChange={setFieldValue}
                value={formValue?.priorityLevel}
                error={fieldError?.priorityLevel}
                options={priorityLevelOptions as EnumOptions<QuestionnarePriorityLevelTypeEnum>}
                keySelector={enumKeySelector}
                labelSelector={enumLabelSelector}
            />
            <SelectInput
                name="enumeratorSkill"
                label="Enumerator Skill"
                onChange={setFieldValue}
                value={formValue?.enumeratorSkill}
                error={fieldError?.enumeratorSkill}
                options={enumeratorSkillOptions as EnumOptions<QuestionnareEnumeratorSkillTypeEnum>}
                keySelector={enumKeySelector}
                labelSelector={enumLabelSelector}
            />
            <SelectInput
                name="dataCollectionMethod"
                label="Data Collection Method"
                onChange={setFieldValue}
                value={formValue?.dataCollectionMethod}
                error={fieldError?.dataCollectionMethod}
                options={
                    dataCollectionMethods as EnumOptions<QuestionnareDataCollectionMethodTypeEnum>
                }
                keySelector={enumKeySelector}
                labelSelector={enumLabelSelector}
            />
            <NumberInput
                name="requiredDuration"
                label="Maximum Duration (in minutes)"
                onChange={setFieldValue}
                value={formValue?.requiredDuration}
                error={fieldError?.requiredDuration}
            />
        </Modal>
    );
}

export default EditQuestionnaireModal;
