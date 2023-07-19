import { useMemo, useState, useCallback } from 'react';
import { AiOutlineSearch } from 'react-icons/ai';
import { gql, useQuery } from '@apollo/client';
import {
    TextInput,
    ListView,
} from '@the-deep/deep-ui';

import Navbar from '#components/Navbar';
import useDebouncedValue from '#hooks/useDebouncedValue';
import {
    ProjectsQuery,
    ProjectsQueryVariables,
} from '#generated/types';

import ProjectItem from './ProjectItem';
import styles from './index.module.css';

const PROJECTS = gql`
query Projects (
    $search: String,
    $limit: Int,
    $offset: Int,
) {
    private {
        projects (
            filters: {
                search: $search,
            },
            pagination: {
                limit: $limit,
                offset: $offset,
            },
        ) {
            items {
                createdAt
                currentUserRole
                id
                title
            }
            count
        }
    }
}
`;

type ProjectType = NonNullable<NonNullable<NonNullable<ProjectsQuery['private']>['projects']>['items']>[number];
const projectKeySelector = (d: ProjectType) => d.id;

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const [searchText, setSearchText] = useState<string | undefined>();
    const debouncedSearchText = useDebouncedValue(searchText);

    const [activeProject, setActiveProject] = useState<string | undefined>();

    const variables = useMemo(() => ({
        search: debouncedSearchText,
        limit: 10,
        offset: 0,
    }), [
        debouncedSearchText,
    ]);

    const {
        data: projectsResponse,
        loading: projectsLoading,
    } = useQuery<ProjectsQuery, ProjectsQueryVariables>(
        PROJECTS,
        {
            variables,
        },
    );

    const projects = projectsResponse?.private.projects.items;

    const projectListRendererParams = useCallback((_: string, datum: ProjectType) => ({
        projectItem: datum,
        onProjectItemClick: setActiveProject,
        activeProject,
    }), [
        activeProject,
    ]);

    return (
        <div className={styles.page}>
            <Navbar />
            <div className={styles.pageContent}>
                <div className={styles.leftPane}>
                    <TextInput
                        name={undefined}
                        icons={<AiOutlineSearch />}
                        placeholder="Search projects"
                        onChange={setSearchText}
                        value={searchText}
                    />
                    <ListView
                        className={styles.projects}
                        data={projects}
                        keySelector={projectKeySelector}
                        renderer={ProjectItem}
                        rendererParams={projectListRendererParams}
                        borderBetweenItem
                        filtered={(searchText?.length ?? 0) > 0}
                        filteredEmptyMessage="No projects matched your keyword."
                        errored={false}
                        pending={projectsLoading}
                        messageShown
                    />
                </div>
                <div className={styles.content}>
                    Content
                </div>
            </div>
        </div>
    );
}

Component.displayName = 'Home';
