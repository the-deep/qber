import { useCallback, useMemo } from 'react';
import { IoAdd } from 'react-icons/io5';
import {
    gql,
    useMutation,
    useQuery,
} from '@apollo/client';
import {
    isDefined,
    isNotDefined,
    randomString,
} from '@togglecorp/fujs';
import {
    Modal,
    Button,
    useAlert,
    Container,
    TextInput,
    useConfirmation,
} from '@the-deep/deep-ui';
import {
    ObjectSchema,
    undefinedValue,
    createSubmitHandler,
    getErrorObject,
    useForm,
    PurgeNull,
    PartialForm,
    useFormArray,
    requiredStringCondition,
    ArraySchema,
    requiredListCondition,
} from '@togglecorp/toggle-form';

import { type ChoiceCollectionType } from '#components/ChoiceCollectionSelectInput';
import {
    AddOptionsMutation,
    AddOptionsMutationVariables,
    EditOptionsMutation,
    EditOptionsMutationVariables,
    CollectionQuery,
    CollectionQueryVariables,
    QuestionChoiceCollectionCreateInput,
    QuestionChoiceCollectionUpdateInput,
} from '#generated/types';
import { DeepReplace } from '#utils/common';

import AddChoicesInput from './AddChoices';

import styles from './index.module.css';

const ADD_OPTIONS = gql`
    mutation AddOptions (
        $projectId: ID!,
        $input: QuestionChoiceCollectionCreateInput!,
    ) {
        private {
            projectScope(pk: $projectId) {
                createQuestionChoiceCollection(
                    data: $input,
                ) {
                    ok
                    result {
                        choices {
                            collectionId
                            label
                            id
                            name
                        }
                        id
                        name
                        questionnaireId
                        label
                    }
                    errors
                }
            }
        }
    }
`;

const EDIT_OPTIONS = gql`
    mutation EditOptions (
        $projectId: ID!,
        $input: QuestionChoiceCollectionUpdateInput!,
        $choiceCollectionId: ID!,
    ) {
        private {
            projectScope(pk: $projectId) {
                updateQuestionChoiceCollection(
                    data: $input,
                    id: $choiceCollectionId,
                    ) {
                        ok
                        result {
                            id
                            name
                            questionnaireId
                            label
                            choices {
                                clientId
                                id
                                label
                                name
                            }
                        }
                    errors
                }
            }
        }
    }
`;

const COLLECTION = gql`
    query Collection (
        $projectId: ID!,
        $choiceCollectionId: ID!,
    ) {
        private {
            projectScope(pk: $projectId) {
                id
                choiceCollection(pk: $choiceCollectionId) {
                    id
                    name
                    label
                    questionnaireId
                    choices {
                        label
                        id
                        name
                        clientId
                    }
                }
            }
        }
    }
`;

type ChoiceItemType = NonNullable<NonNullable<NonNullable<CollectionQuery['private']>['projectScope']>['choiceCollection']>['choices'][number];
type InitialFormType = PartialForm<PurgeNull<QuestionChoiceCollectionUpdateInput>>;
type RawChoiceType = NonNullable<InitialFormType['choices']>[number];
export type ChoiceType = Omit<RawChoiceType, 'clientId'> & { clientId: string };

type FormType = DeepReplace<
    InitialFormType,
    RawChoiceType,
    ChoiceType
>;

type FormSchema = ObjectSchema<FormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

type PartialOptionTaken = NonNullable<FormType['choices']>[number];

type ChoicesSchemaObjectSchema = ObjectSchema<PartialOptionTaken, FormType>;
type ChoicesSchemaObjectFields = ReturnType<ChoicesSchemaObjectSchema['fields']>;

type ChoicesSchema = ArraySchema<PartialOptionTaken, FormType>;
type ChoicesSchemaMember = ReturnType<ChoicesSchema['member']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        questionnaire: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        name: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        label: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        choices: {
            keySelector: (choice) => choice.clientId,
            member: (): ChoicesSchemaMember => ({
                fields: (): ChoicesSchemaObjectFields => ({
                    clientId: {
                        required: true,
                        requiredValidation: requiredStringCondition,
                    },
                    label: {
                        required: true,
                        requiredValidation: requiredStringCondition,
                    },
                    name: {
                        required: true,
                        requiredValidation: requiredStringCondition,
                    },
                    id: {
                        defaultValue: undefinedValue,
                    },
                }),
            }),
            required: true,
            requiredValidation: requiredListCondition,
        },
    }),
};

interface Props {
    choiceCollectionId?: string;
    onClose: () => void;
    onSuccess: () => void;
    option?: ChoiceCollectionType;
    projectId: string;
    questionnaire: string;
}

function AddChoiceCollectionModal(props: Props) {
    const {
        choiceCollectionId,
        onClose,
        onSuccess,
        option,
        projectId,
        questionnaire,
    } = props;

    const alert = useAlert();

    const editMode = isDefined(choiceCollectionId);

    const initialFormValue: FormType = useMemo(() => (
        option ?? { questionnaire }
    ), [
        questionnaire,
        option,
    ]);

    const {
        pristine,
        validate,
        value: formValue,
        error,
        setFieldValue,
        setError,
        setValue,
    } = useForm(schema, { value: initialFormValue });

    const fieldError = getErrorObject(error);

    const [
        modal,
        onDeleteChoiceClick,
    ] = useConfirmation<undefined>({
        showConfirmationInitially: false,
        onConfirm: onClose,
        message: 'Are you sure you want to cancel? Progress will be lost.',
    });

    const optionsVariables = useMemo(() => {
        if (isNotDefined(projectId) || isNotDefined(choiceCollectionId)
        ) {
            return undefined;
        }
        return ({
            projectId,
            choiceCollectionId,
        });
    }, [
        projectId,
        choiceCollectionId,
    ]);

    useQuery<CollectionQuery, CollectionQueryVariables>(
        COLLECTION,
        {
            skip: isNotDefined(choiceCollectionId),
            variables: optionsVariables,
            onCompleted: (collectionResponse) => {
                const response = collectionResponse?.private?.projectScope?.choiceCollection;
                if (!response) {
                    return;
                }
                if (response) {
                    setValue({
                        name: response.name,
                        label: response.label,
                        questionnaire: response.questionnaireId,
                        choices: response.choices?.map((choice: ChoiceItemType) => ({
                            label: choice.label,
                            name: choice.name,
                            clientId: choice.clientId,
                            id: choice.id,
                        })),
                    });
                }
            },
        },
    );
    const [
        triggerOptionCreate,
        { loading: optionCreatePending },
    ] = useMutation<AddOptionsMutation, AddOptionsMutationVariables>(
        ADD_OPTIONS,
        {
            onCompleted: (optionResponse) => {
                const response = optionResponse?.private?.projectScope
                    ?.createQuestionChoiceCollection;
                if (!response) {
                    return;
                }
                if (response.ok) {
                    onSuccess();
                    onClose();
                    alert.show(
                        'Options Added successfully.',
                        { variant: 'success' },
                    );
                } else {
                    alert.show(
                        'Options Failed to Add.',
                        { variant: 'error' },
                    );
                }
            },
            onError: () => {
                alert.show(
                    'Failed to Add Options',
                    { variant: 'error' },
                );
            },
        },
    );

    const [
        triggerOptionsUpdate,
        { loading: optionsUpdatePending },
    ] = useMutation<EditOptionsMutation, EditOptionsMutationVariables>(
        EDIT_OPTIONS,
        {
            onCompleted: (OptionsResponse) => {
                const response = OptionsResponse?.private?.projectScope
                    ?.updateQuestionChoiceCollection;
                if (!response) {
                    return;
                }
                if (response.ok) {
                    setValue({
                        name: response.result?.name,
                        label: response.result?.label,
                    });
                    onSuccess();
                    onClose();
                    alert.show(
                        'Options updated successfully.',
                        { variant: 'success' },
                    );
                } else {
                    alert.show(
                        'Failed to update Options',
                        { variant: 'error' },
                    );
                }
            },
            onError: () => {
                alert.show(
                    'Failed to update Options',
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
                    triggerOptionsUpdate({
                        variables: {
                            projectId,
                            choiceCollectionId,
                            input: val,
                        },
                    });
                } else {
                    triggerOptionCreate({
                        variables: {
                            projectId,
                            input: val as QuestionChoiceCollectionCreateInput,
                        },
                    });
                }
            },
        );
        handler();
    }, [
        editMode,
        triggerOptionsUpdate,
        choiceCollectionId,
        setError,
        triggerOptionCreate,
        validate,
        projectId,
    ]);

    const handleAddCustomActivity = useCallback(() => {
        const clientId = randomString();
        const newCustomActivity: ChoiceType = {
            clientId,
        };

        setFieldValue(
            (oldValue: ChoiceType[] | undefined) => (
                [...(oldValue ?? []), newCustomActivity]
            ),
            'choices',
        );
    }, [setFieldValue]);

    const {
        setValue: setCustomComponentValue,
        removeValue: removeCustomComponentValue,
    } = useFormArray<'choices', ChoiceType>(
        'choices',
        setFieldValue,
    );
    const customComponentError = getErrorObject(error)?.choices;

    return (
        <Modal
            onCloseButtonClick={onDeleteChoiceClick}
            heading="Add/Edit Choice Collection"
            headingSize="extraSmall"
            headingDescription={formValue?.label}
            freeHeight
            size="small"
            footerActions={(
                <Button
                    name={undefined}
                    onClick={handleSubmit}
                    disabled={
                        pristine
                        || (editMode ? optionCreatePending : optionsUpdatePending)
                    }
                >
                    {editMode ? 'Save' : 'Create'}
                </Button>
            )}
        >
            <div className={styles.options}>
                <div className={styles.optionDetail}>
                    <TextInput
                        name="label"
                        label="Label"
                        placeholder="Enter Title"
                        value={formValue?.label}
                        error={fieldError?.label}
                        onChange={setFieldValue}
                    />
                    <TextInput
                        name="name"
                        label="Name"
                        placeholder="Enter Name"
                        value={formValue?.name}
                        error={fieldError?.name}
                        onChange={setFieldValue}
                    />
                </div>
                <Container
                    heading="Options"
                    headingSize="extraSmall"
                    withoutExternalPadding
                    className={styles.modalContent}
                    headerActions={(
                        <Button
                            name={undefined}
                            onClick={handleAddCustomActivity}
                            icons={<IoAdd />}
                            disabled={undefined}
                            variant="tertiary"
                            spacing="compact"
                        >
                            Add Option
                        </Button>
                    )}
                    contentClassName={styles.optionsList}
                >
                    {modal}
                    {formValue?.choices?.map((customOption, index) => (
                        <AddChoicesInput
                            key={customOption.clientId}
                            index={index}
                            value={customOption}
                            error={getErrorObject(customComponentError)?.[customOption.clientId]}
                            onChange={setCustomComponentValue}
                            onRemove={removeCustomComponentValue}
                        />
                    ))}
                </Container>
            </div>
        </Modal>
    );
}

export default AddChoiceCollectionModal;
