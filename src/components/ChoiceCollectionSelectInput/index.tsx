import {
    useMemo,
    useState,
    useCallback,
} from 'react';
import { gql, useQuery } from '@apollo/client';
import {
    QuickActionButton,
    SearchSelectInput,
    useModalState,
    SearchSelectInputProps,
} from '@the-deep/deep-ui';
import { IoAdd, IoPencil } from 'react-icons/io5';
import { isNotDefined, isDefined } from '@togglecorp/fujs';

import {
    ChoiceCollectionsQuery,
    ChoiceCollectionsQueryVariables,
} from '#generated/types';

import AddChoiceCollectionModal from './AddChoiceCollectionModal';

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
                        label: {iContains: $search },
                    }
                ) {
                    count
                    items {
                        id
                        label
                        name
                        questionnaireId
                        choices {
                            id
                            name
                            label
                            clientId
                        }
                    }
                }
            }
        }
    }
`;

export type ChoiceCollectionType = {
    id: string;
    label: string;
};

const choiceCollectionKeySelector = (d: ChoiceCollectionType) => d.id;
const choiceCollectionLabelSelector = (d: ChoiceCollectionType) => d.label;

type Def = { containerClassName?: string };
type ChoiceCollectionSelectInputProps<
    K extends string,
    GK extends string
> = SearchSelectInputProps<
    string,
    K,
    GK,
    ChoiceCollectionType,
    Def,
    'onSearchValueChange' | 'searchOptions' | 'optionsPending'
    | 'keySelector' | 'labelSelector' | 'totalOptionsCount' | 'onShowDropdownChange'
> & {
    projectId: string;
    questionnaireId: string;
};

const PAGE_SIZE = 20;

function ChoiceCollectionSelectInput<
    K extends string,
    GK extends string
>(props: ChoiceCollectionSelectInputProps<K, GK>) {
    const {
        projectId,
        questionnaireId,
        value,
        name,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState<string>();
    const [opened, setOpened] = useState(false);

    const [
        addOptionsModalShown,
        showAddOptionsModal,
        hideAddOptionsModal,
    ] = useModalState(false);

    const [
        editOptionsModalShown,
        showEditOptionsModal,
        hideEditOptionsModal,
    ] = useModalState(false);

    const optionsVariables = useMemo(() => {
        if (isNotDefined(projectId) || isNotDefined(questionnaireId)
        ) {
            return undefined;
        }
        return ({
            projectId,
            questionnaireId,
            search: searchText,
            limit: PAGE_SIZE,
            offset: 0,
        });
    }, [
        projectId,
        questionnaireId,
        searchText,
    ]);

    const {
        data: choiceCollectionsResponse,
        loading: choiceCollectionLoading,
    } = useQuery<
        ChoiceCollectionsQuery,
        ChoiceCollectionsQueryVariables
    >(CHOICE_COLLECTIONS, {
        skip: isNotDefined(optionsVariables) || !opened,
        variables: optionsVariables,
    });

    const handleChoiceAddSuccess = useCallback((newChoice: ChoiceCollectionType) => {
        otherProps?.onChange(newChoice.id, name);

        if (otherProps?.onOptionsChange) {
            otherProps?.onOptionsChange((oldOptions) => {
                const oldOptionsSafe = [...(oldOptions ?? [])];
                const oldIndex = oldOptionsSafe
                    .findIndex((choice) => choice.id === newChoice.id);
                if (oldIndex !== -1) {
                    return oldOptionsSafe.splice(oldIndex, 1, newChoice);
                }
                return [
                    ...(oldOptionsSafe),
                    newChoice,
                ];
            });
        }
    }, [
        name,
        otherProps,
    ]);

    const searchOptions = choiceCollectionsResponse?.private.projectScope?.choiceCollections.items;

    return (
        <>
            <SearchSelectInput
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...otherProps}
                name={name}
                value={value}
                searchOptions={searchOptions}
                keySelector={choiceCollectionKeySelector}
                labelSelector={choiceCollectionLabelSelector}
                onSearchValueChange={setSearchText}
                onShowDropdownChange={setOpened}
                optionsPending={choiceCollectionLoading}
                actions={(
                    <>
                        <QuickActionButton
                            name={undefined}
                            onClick={showAddOptionsModal}
                            title="Add choice collection"
                            disabled={undefined}
                            variant="transparent"
                        >
                            <IoAdd />
                        </QuickActionButton>
                        {value && (
                            <QuickActionButton
                                name={undefined}
                                onClick={showEditOptionsModal}
                                title="Edit selected choice collection"
                                disabled={undefined}
                                variant="transparent"
                            >
                                <IoPencil />
                            </QuickActionButton>
                        )}
                    </>
                )}
            />
            {editOptionsModalShown && isDefined(value) && (
                <AddChoiceCollectionModal
                    onClose={hideEditOptionsModal}
                    projectId={projectId}
                    questionnaire={questionnaireId}
                    choiceCollectionId={value}
                    onSuccess={handleChoiceAddSuccess}
                />
            )}
            {addOptionsModalShown && (
                <AddChoiceCollectionModal
                    onClose={hideAddOptionsModal}
                    projectId={projectId}
                    questionnaire={questionnaireId}
                    onSuccess={handleChoiceAddSuccess}
                />
            )}
        </>
    );
}

export default ChoiceCollectionSelectInput;
