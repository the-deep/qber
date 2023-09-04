import { useMemo, useState, useCallback } from 'react';
import {
    SearchSelectInput,
    SearchSelectInputProps,
} from '@the-deep/deep-ui';
import { gql, useQuery } from '@apollo/client';

import useDebouncedValue from '#hooks/useDebouncedValue';
import {
    UsersQuery,
    UsersQueryVariables,
} from '#generated/types';

import OptionLabelSelector from './OptionLabelSelector';

const USERS = gql`
    query Users (
        $limit: Int!,
        $offset: Int!,
        $excludeProjectId: ID,
        $search: String,
    ) {
        private {
            users(
                pagination: {
                    limit: $limit,
                    offset: $offset,

                },
                filters: {
                    search: $search,
                    membersExcludeProject: $excludeProjectId,
                },
            ) {
                limit
                offset
                count
                items {
                    displayName
                    id
                }
            }
        }
    }
`;

export type User = Omit<NonNullable<NonNullable<NonNullable<NonNullable<UsersQuery['private']>['users']>['items']>[number]>, '__typename'>;

const keySelector = (u: User) => u.id;
const labelSelector = (u: User) => u.displayName;

const PAGE_SIZE = 20;

type Def = { containerClassName?: string };
type UserSelectInputProps<
    K extends string,
    GK extends string
> = SearchSelectInputProps<
    string,
    K,
    GK,
    User,
    Def,
    'onSearchValueChange' | 'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'totalOptionsCount' | 'onShowDropdownChange'
> & {
    excludeMembersFromProjectId?: string;
};

function UserSelectInput<K extends string, GK extends string>(props: UserSelectInputProps<K, GK>) {
    const {
        className,
        excludeMembersFromProjectId,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState<string | undefined>();
    const debouncedSearchText = useDebouncedValue(searchText);
    const [opened, setOpened] = useState(false);

    const variables = useMemo(() => ({
        search: debouncedSearchText,
        limit: PAGE_SIZE,
        offset: 0,
        excludeProjectId: excludeMembersFromProjectId,
    }), [
        excludeMembersFromProjectId,
        debouncedSearchText,
    ]);

    const {
        data: usersResponse,
        loading: usersResponseLoading,
        fetchMore,
    } = useQuery<UsersQuery, UsersQueryVariables>(
        USERS,
        {
            skip: !opened,
            variables,
        },
    );

    const users = usersResponse?.private.users;

    const handleShowMoreClick = useCallback(() => {
        fetchMore({
            variables: {
                ...variables,
                offset: (users?.offset ?? 0) + (users?.limit ?? 0),
            },
            updateQuery: (previousResult, { fetchMoreResult }) => {
                if (!previousResult?.private.users) {
                    return previousResult;
                }
                const oldUsers = previousResult.private.users.items;
                const newUsers = fetchMoreResult.private.users.items;

                if (!newUsers) {
                    return previousResult;
                }
                return ({
                    ...previousResult,
                    private: {
                        ...previousResult.private,
                        users: {
                            ...fetchMoreResult.private.users,
                            results: [
                                ...(oldUsers ?? []),
                                ...(newUsers ?? []),
                            ],
                        },
                    },
                });
            },
        });
    }, [
        fetchMore,
        variables,
        users?.offset,
        users?.limit,
    ]);

    return (
        <SearchSelectInput
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...otherProps}
            className={className}
            searchOptions={users?.items}
            keySelector={keySelector}
            labelSelector={labelSelector}
            optionLabelSelector={OptionLabelSelector}
            onSearchValueChange={setSearchText}
            onShowDropdownChange={setOpened}
            optionsPending={usersResponseLoading}
            handleShowMoreClick={handleShowMoreClick}
        />
    );
}

export default UserSelectInput;
