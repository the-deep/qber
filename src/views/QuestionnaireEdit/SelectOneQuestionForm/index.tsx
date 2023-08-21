import {
    useCallback,
    useMemo,
    useState,
} from 'react';
import {
    isNotDefined,
    randomString,
} from '@togglecorp/fujs';
import {
    gql,
    useMutation,
    useQuery,
} from '@apollo/client';
import {
    Button,
    SearchSelectInput,
    SelectInput,
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
    CreateTextQuestionMutation,
    CreateTextQuestionMutationVariables,
    QuestionCreateInput,
    QuestionTypeEnum,
    PillarsQuery,
    PillarsQueryVariables,
    ChoiceCollectionsQuery,
    ChoiceCollectionsQueryVariables,
    CreateSingleSelectionQuestionMutation,
} from '#generated/types';
import SelectOneQuestionPreview from '#components/questionPreviews/SelectOneQuestionPreview';

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
                }
            }
        }
    }
`;

const CHOICE_COLLECTIONS = gql`
    query ChoiceCollections(
        $projectId: ID!,
        $questionnaireId: ID!,
        $search:String
        ) {
    private {
        projectScope(pk: $projectId) {
            id
            choiceCollections(
                filters: {
                    questionnaire: {pk: $questionnaireId},
                     name: {iContains: $search }
                    }
            ) {
                count
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

type Pillars = NonNullable<PillarsQuery['private']['projectScope']>['groups']['items'][number];
type ChoiceCollection = NonNullable<ChoiceCollectionsQuery['private']['projectScope']>['choiceCollections']['items'][number];

const choiceCollectionKeySelector = (d: ChoiceCollection) => d.id;
const choiceCollectionLabelSelector = (d: ChoiceCollection) => d.label;

const pillarKeySelector = (d: Pillars) => d.id;
const pillarLabelSelector = (d: Pillars) => d.label;

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

    const pillarsVariables = useMemo(() => {
        if (isNotDefined(projectId)) {
            return undefined;
        }
        return ({
            projectId,
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

    const [
        triggerQuestionCreate,
        { loading: createQuestionPending },
    ] = useMutation<CreateSingleSelectionQuestionMutation, CreateTextQuestionMutationVariables>(
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


    const [opened, setOpened] = useState(false);
    const [search, setSearch] = useState<string>();
    const [choiceCollectionOptions, setChoiceCollectionOptions] = useState<ChoiceCollection[] | undefined | null>();

    const optionsVariables = useMemo(() => {
        if (isNotDefined(projectId) || isNotDefined(questionnaireId)) {
            return undefined;
        }
        return ({
            projectId,
            questionnaireId,
            search,
        });
    }, [
        projectId,
        questionnaireId,
        search,
    ]);

    const {
        data: choiceCollectionsResponse,
    } = useQuery<ChoiceCollectionsQuery, ChoiceCollectionsQueryVariables>(
        CHOICE_COLLECTIONS, {
        skip: isNotDefined(optionsVariables) || !opened,
        variables: optionsVariables,
    });

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
                <SearchSelectInput
                    name="choiceCollection"
                    keySelector={choiceCollectionKeySelector}
                    label="Options"
                    labelSelector={choiceCollectionLabelSelector}
                    onChange={setFieldValue}
                    onSearchValueChange={setSearch}
                    onOptionsChange={setChoiceCollectionOptions}
                    searchOptions={choiceCollectionsResponse?.private.projectScope?.choiceCollections.items}
                    options={choiceCollectionOptions}
                    onShowDropdownChange={setOpened}
                    value={formValue.choiceCollection}
                />
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

export default SelectOneQuestionForm;
