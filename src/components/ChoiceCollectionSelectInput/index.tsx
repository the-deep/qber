import { useMemo, useState } from 'react';
import {
    isNotDefined,
} from '@togglecorp/fujs';
import { gql, useQuery } from '@apollo/client';
import {
    SearchSelectInput,
    SearchSelectInputProps,
} from '@the-deep/deep-ui';

import {
    ChoiceCollectionsQuery,
    ChoiceCollectionsQueryVariables,
} from '#generated/types';

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
                    label: {iContains: $search }
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

type ChoiceCollection = Omit<NonNullable<ChoiceCollectionsQuery['private']['projectScope']>['choiceCollections']['items'][number], '__typename'>;

const choiceCollectionKeySelector = (d: ChoiceCollection) => d.id;
const choiceCollectionLabelSelector = (d: ChoiceCollection) => d.label;

type Def = { containerClassName?: string };
type ChoiceCollectionSelectInputProps<
    K extends string,
    GK extends string
> = SearchSelectInputProps<
    string,
    K,
    GK,
    ChoiceCollection,
    Def,
    'onSearchValueChange' | 'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'totalOptionsCount' | 'onShowDropdownChange'
> & {
    projectId: string;
    questionnaireId: string | null;
};

const PAGE_SIZE = 20;

function ChoiceCollectionSelectInput<
    K extends string,
    GK extends string
>(props: ChoiceCollectionSelectInputProps<K, GK>) {
    const {
        projectId,
        questionnaireId,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState<string>();
    const [opened, setOpened] = useState(false);

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

    const options = choiceCollectionsResponse?.private.projectScope?.choiceCollections.items;

    return (
        <SearchSelectInput
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...otherProps}
            searchOptions={options}
            keySelector={choiceCollectionKeySelector}
            labelSelector={choiceCollectionLabelSelector}
            onSearchValueChange={setSearchText}
            onShowDropdownChange={setOpened}
            optionsPending={choiceCollectionLoading}
        />
    );
}

export default ChoiceCollectionSelectInput;
